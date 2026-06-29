import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { OrderModel } from "@/lib/models";
import { buildOrderMessage, buildWhatsAppRedirect, sendWhatsAppCloudMessage } from "@/lib/whatsapp";
import { requireAdminAuth } from "@/lib/auth";
import { emitNewOrder } from "@/lib/sse-emitter";

// POST is public — customers place orders (only after verified Razorpay payment)
export async function POST(req: NextRequest) {
  const body = await req.json();

  let orderId: string | null = null;
  let savedOrder: any = null;

  try {
    await connectDB();
    savedOrder = await OrderModel.create({
      ...body,
      status: "Pending",
      paymentStatus: "Paid",
      amountPaid: body.totalAmount,
      paymentTime: new Date(),
    });
    orderId = String(savedOrder._id);

    // ── Fire SSE event to all connected admin tabs ───────────────────────
    emitNewOrder({
      _id: orderId,
      customerName: savedOrder.customerName,
      customerPhone: savedOrder.customerPhone,
      pickupTime: savedOrder.pickupTime,
      items: savedOrder.items,
      totalAmount: savedOrder.totalAmount,
      status: savedOrder.status,
      paymentStatus: savedOrder.paymentStatus,
      createdAt: savedOrder.createdAt?.toISOString(),
    });

    // ── Non-blocking WhatsApp notification to owner ──────────────────────
    try {
      const waMessage = buildOrderMessage({
        items: body.items,
        pickupTime: body.pickupTime,
        totalAmount: body.totalAmount,
      });
      sendWhatsAppCloudMessage(
        `🔔 *New Order — Woodlands*\n\n*Customer:* ${body.customerName}\n*Phone:* ${body.customerPhone}\n*Pickup:* ${body.pickupTime}\n\n${waMessage}\n\n*Order ID:* ${orderId}`
      ).catch(() => {}); // fire-and-forget
    } catch {
      // Non-critical — do not fail the request
    }
  } catch (err) {
    console.error("[POST /api/orders] DB error", err);
    return NextResponse.json({ error: "Failed to save order" }, { status: 500 });
  }

  // Build WhatsApp redirect URL for customer (order confirmation)
  const waMessage = buildOrderMessage({
    items: body.items,
    pickupTime: body.pickupTime,
    totalAmount: body.totalAmount,
  });

  return NextResponse.json({
    orderId,
    redirectUrl: buildWhatsAppRedirect(waMessage),
  });
}

// GET — admin only — return all orders sorted newest first
export async function GET(req: NextRequest) {
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  await connectDB();
  const orders = await OrderModel.find().sort({ createdAt: -1 }).limit(500);
  return NextResponse.json(orders);
}

// PATCH — admin only — update order status
export async function PATCH(req: NextRequest) {
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  try {
    await connectDB();
    const { id, status } = await req.json();

    const validStatuses = [
      "Pending",
      "Accepted",
      "Preparing",
      "Ready for Pickup",
      "Completed",
      "Cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updated = await OrderModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // ── Fire SSE status-change event to all connected admin tabs ─────────
    const { emitStatusChange } = await import("@/lib/sse-emitter");
    emitStatusChange({
      _id: String(updated._id),
      status: updated.status,
      updatedAt: updated.updatedAt?.toISOString(),
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/orders]", err);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

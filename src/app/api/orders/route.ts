import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { OrderModel } from "@/lib/models";
import { buildOrderMessage, buildWhatsAppRedirect } from "@/lib/whatsapp";
import { requireAdminAuth } from "@/lib/auth";

// POST is public — customers place orders
export async function POST(req: NextRequest) {
  const body = await req.json();
  const message = buildOrderMessage({
    items: body.items,
    pickupTime: body.pickupTime,
    totalAmount: body.totalAmount,
  });
  let orderId: string | null = null;
  try {
    await connectDB();
    const order = await OrderModel.create({ ...body, status: "Pending" });
    orderId = String(order._id);
  } catch (err) {
    console.error("[POST /api/orders] DB skipped", err);
  }
  return NextResponse.json({
    orderId,
    redirectUrl: buildWhatsAppRedirect(message),
  });
}

// GET and PATCH — admin only
export async function GET(req: NextRequest) {
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  await connectDB();
  const orders = await OrderModel.find().sort({ createdAt: -1 }).limit(200);
  return NextResponse.json(orders);
}

export async function PATCH(req: NextRequest) {
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  try {
    await connectDB();
    const { id, status } = await req.json();
    const updated = await OrderModel.findByIdAndUpdate(id, { status }, { new: true });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/orders]", err);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

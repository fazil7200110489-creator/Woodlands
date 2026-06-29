import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { OrderModel } from "@/lib/models";

// GET /api/orders/[id] — public endpoint for customer order tracking
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || id.length < 12) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    await connectDB();
    
    let order = null;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);

    if (isObjectId) {
      order = await OrderModel.findById(id).select(
        "_id customerName pickupTime items totalAmount status paymentStatus amountPaid createdAt updatedAt"
      );
    } else {
      order = await OrderModel.findOne({ razorpayPaymentId: id }).select(
        "_id customerName pickupTime items totalAmount status paymentStatus amountPaid createdAt updatedAt"
      );
    }

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (err) {
    console.error("[GET /api/orders/[id]]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

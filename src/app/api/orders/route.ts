import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { OrderModel } from "@/lib/models";
import { buildOrderMessage, buildWhatsAppRedirect } from "@/lib/whatsapp";

export async function POST(req: Request) {
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

export async function GET() {
  await connectDB();
  const orders = await OrderModel.find().sort({ createdAt: -1 }).limit(200);
  return NextResponse.json(orders);
}

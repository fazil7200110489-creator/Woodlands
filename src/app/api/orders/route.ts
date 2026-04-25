import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { OrderModel } from "@/lib/models";
import { buildOrderMessage, buildWhatsAppRedirect } from "@/lib/whatsapp";

export async function POST(req: Request) {
  await connectDB();
  const body = await req.json();
  const order = await OrderModel.create({ ...body, status: "Pending" });
  const message = buildOrderMessage({
    items: body.items,
    pickupTime: body.pickupTime,
    totalAmount: body.totalAmount,
  });
  return NextResponse.json({
    orderId: order._id,
    redirectUrl: buildWhatsAppRedirect(message),
  });
}

export async function GET() {
  await connectDB();
  const orders = await OrderModel.find().sort({ createdAt: -1 }).limit(200);
  return NextResponse.json(orders);
}

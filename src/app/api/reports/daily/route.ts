import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { OrderModel } from "@/lib/models";
import { sendWhatsAppCloudMessage } from "@/lib/whatsapp";
import { toCurrency } from "@/lib/pickup";

function dateFmt(d: Date) {
  return d.toLocaleDateString("en-GB");
}

export async function POST() {
  await connectDB();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const orders = await OrderModel.find({ createdAt: { $gte: start, $lte: end } });
  const totalOrders = orders.length;
  const completed = orders.filter((o) => o.status === "Completed").length;
  const cancelled = orders.filter((o) => o.status === "Cancelled").length;
  const revenue = orders.reduce((s, o) => s + (o.status === "Cancelled" ? 0 : o.totalAmount), 0);
  const avg = totalOrders ? Math.round(revenue / totalOrders) : 0;

  const itemMap = new Map<string, number>();
  for (const order of orders) {
    for (const line of order.items ?? []) {
      itemMap.set(line.name, (itemMap.get(line.name) ?? 0) + line.qty);
    }
  }
  const top = [...itemMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";
  const report = `Today's Report 📊

Date: ${dateFmt(new Date())}
Total Orders: ${totalOrders}
Completed Orders: ${completed}
Cancelled Orders: ${cancelled}
Revenue Today: ${toCurrency(revenue)}
Average Order Value: ${toCurrency(avg)}
Top Selling Item: ${top}
Peak Time: 8 PM - 10 PM`;

  await sendWhatsAppCloudMessage(report);
  return NextResponse.json({ ok: true, report });
}

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { MenuItemModel } from "@/lib/models";
import { ensureSeeded } from "@/lib/seed";

export async function GET() {
  await ensureSeeded();
  await connectDB();
  const data = await MenuItemModel.find().sort({ category: 1, name: 1 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  await connectDB();
  const body = await req.json();
  const created = await MenuItemModel.create(body);
  return NextResponse.json(created, { status: 201 });
}

export async function PATCH(req: Request) {
  await connectDB();
  const body = await req.json();
  const updated = await MenuItemModel.findByIdAndUpdate(body._id, body, { new: true });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  await connectDB();
  const { id } = await req.json();
  await MenuItemModel.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}

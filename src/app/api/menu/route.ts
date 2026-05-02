import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { initialMenu } from "@/lib/menuData";
import { MenuItemModel } from "@/lib/models";
import { ensureSeeded } from "@/lib/seed";

export async function GET() {
  try {
    await ensureSeeded();
    const data = await MenuItemModel.find().sort({ category: 1, name: 1 }).lean();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[GET /api/menu]", err);
    return NextResponse.json(initialMenu);
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const created = await MenuItemModel.create(body);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("[POST /api/menu]", err);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const updated = await MenuItemModel.findByIdAndUpdate(body._id, body, { new: true });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/menu]", err);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { id } = await req.json();
    await MenuItemModel.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/menu]", err);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}

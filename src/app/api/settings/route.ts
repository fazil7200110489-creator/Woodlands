import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { SettingsModel } from "@/lib/models";
import { ensureSeeded } from "@/lib/seed";

export async function GET() {
  try {
    await ensureSeeded();
    const settings = await SettingsModel.findOne().lean();
    return NextResponse.json(settings);
  } catch (err) {
    console.error("[GET /api/settings]", err);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const settings = await SettingsModel.findOneAndUpdate({}, body, { upsert: true, new: true });
    return NextResponse.json(settings);
  } catch (err) {
    console.error("[PATCH /api/settings]", err);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}

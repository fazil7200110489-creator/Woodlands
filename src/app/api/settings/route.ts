import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { SettingsModel } from "@/lib/models";
import { ensureSeeded } from "@/lib/seed";
import { requireAdminAuth } from "@/lib/auth";

// GET is public — used by the booking form to check open/close state
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

// PATCH — admin only
export async function PATCH(req: NextRequest) {
  const authError = requireAdminAuth(req);
  if (authError) return authError;

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

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { SettingsModel } from "@/lib/models";
import { ensureSeeded } from "@/lib/seed";

export async function GET() {
  await ensureSeeded();
  await connectDB();
  const settings = await SettingsModel.findOne();
  return NextResponse.json(settings);
}

export async function PATCH(req: Request) {
  await connectDB();
  const body = await req.json();
  const settings = await SettingsModel.findOneAndUpdate({}, body, { upsert: true, new: true });
  return NextResponse.json(settings);
}

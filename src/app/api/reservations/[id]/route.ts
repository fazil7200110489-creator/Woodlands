import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ReservationModel } from "@/lib/models";
import { requireAdminAuth } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  try {
    await connectDB();
    const body = await req.json();
    const { id } = await params;
    
    const updated = await ReservationModel.findByIdAndUpdate(
      id, 
      { status: body.status }, 
      { new: true }
    );
    
    if (!updated) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }
    
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/reservations/[id]]", err);
    return NextResponse.json({ error: "Failed to update reservation" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  try {
    await connectDB();
    const { id } = await params;
    
    await ReservationModel.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/reservations/[id]]", err);
    return NextResponse.json({ error: "Failed to delete reservation" }, { status: 500 });
  }
}

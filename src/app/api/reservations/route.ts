import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ReservationModel } from "@/lib/models";

export const dynamic = 'force-dynamic';

const MAX_GUESTS_PER_SLOT = 40;

export async function GET() {
  try {
    await connectDB();
    const data = await ReservationModel.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[GET /api/reservations]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    
    // Check capacity for the requested date and time slot
    const existingReservations = await ReservationModel.find({ 
      date: body.date, 
      timeSlot: body.timeSlot,
      status: { $in: ["Pending", "Confirmed"] }
    });
    
    const currentGuests = existingReservations.reduce((sum, res) => sum + (res.guests || 0), 0);
    
    if (currentGuests + body.guests > MAX_GUESTS_PER_SLOT) {
      return NextResponse.json(
        { error: `Sorry, we only have capacity for ${Math.max(0, MAX_GUESTS_PER_SLOT - currentGuests)} more guests at this time.` }, 
        { status: 400 }
      );
    }

    // Generate unique reference ID
    const referenceId = 'RES-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    
    const created = await ReservationModel.create({
      ...body,
      referenceId
    });
    
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/reservations]", err);
    return NextResponse.json({ error: "Failed to create reservation: " + err.message }, { status: 500 });
  }
}

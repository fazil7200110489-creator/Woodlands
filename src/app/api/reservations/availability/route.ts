import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ReservationModel } from "@/lib/models";

export const dynamic = "force-dynamic";

/**
 * GET /api/reservations/availability?date=YYYY-MM-DD&time=HH:MM
 *
 * Returns the list of table numbers that are already booked
 * for the given date + time slot.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const date = searchParams.get("date");
    const time = searchParams.get("time");

    if (!date || !time) {
      return NextResponse.json(
        { error: "Both 'date' and 'time' query params are required." },
        { status: 400 }
      );
    }

    await connectDB();

    // Find all active (non-cancelled/completed) reservations for this slot
    const reservations = await ReservationModel.find({
      date,
      timeSlot: time,
      tableNumber: { $exists: true, $ne: null },
      status: { $in: ["Pending", "Confirmed"] },
    })
      .select("tableNumber")
      .lean();

    const bookedTables = reservations.map((r: any) => r.tableNumber);

    return NextResponse.json({ bookedTables });
  } catch (err: any) {
    console.error("[GET /api/reservations/availability]", err);
    return NextResponse.json(
      { error: "Failed to check availability: " + err.message },
      { status: 500 }
    );
  }
}

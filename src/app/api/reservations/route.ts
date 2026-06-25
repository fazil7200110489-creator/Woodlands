import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ReservationModel } from "@/lib/models";
import { generateBookingReference } from "@/lib/referenceId";
import { sendBookingConfirmation } from "@/lib/notifications";
import { RESTAURANT_TABLES } from "@/lib/tableConfig";

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

    // Prevent duplicate table booking for the same date+time
    if (body.tableNumber) {
      const conflict = await ReservationModel.findOne({
        tableNumber: body.tableNumber,
        date: body.date,
        timeSlot: body.timeSlot,
        status: { $in: ["Pending", "Confirmed"] },
      });
      if (conflict) {
        return NextResponse.json(
          { error: "This table is already booked for the selected time. Please choose another table." },
          { status: 409 }
        );
      }
    }

    // Generate unique reference ID
    const referenceId = await generateBookingReference();
    
    // Set status to Confirmed if paid, otherwise default to Pending
    const status = body.paymentStatus === "Paid" ? "Confirmed" : "Pending";
    
    const created = await ReservationModel.create({
      ...body,
      referenceId,
      status
    });

    // Send notifications if reservation is confirmed and paid
    if (created.status === "Confirmed") {
      const tableObj = RESTAURANT_TABLES.find(t => t.id === created.tableNumber);
      const tableLabel = tableObj ? tableObj.label : `Table ${created.tableNumber}`;
      
      try {
        await sendBookingConfirmation({
          referenceId: created.referenceId,
          customerName: created.customerName,
          customerPhone: created.customerPhone,
          customerEmail: created.customerEmail,
          tableLabel,
          date: created.date,
          timeSlot: created.timeSlot,
          guests: created.guests,
          paymentAmount: created.paymentAmount || 0,
          paymentId: created.razorpayPaymentId,
        });
      } catch (notifyErr) {
        console.error("[POST /api/reservations] Notification failed:", notifyErr);
      }
    }
    
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/reservations]", err);
    return NextResponse.json({ error: "Failed to create reservation: " + err.message }, { status: 500 });
  }
}


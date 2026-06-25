import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ReservationModel } from "@/lib/models";
import { calculateRefund } from "@/lib/refundPolicy";
import { sendCancellationNotification } from "@/lib/notifications";
import { RESTAURANT_TABLES } from "@/lib/tableConfig";
import Razorpay from "razorpay";

export const dynamic = 'force-dynamic';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { reservationId, refundAmount: customRefundAmount } = body;

    if (!reservationId) {
      return NextResponse.json(
        { error: "Reservation ID is required." },
        { status: 400 }
      );
    }

    // Find reservation by ID
    const reservation = await ReservationModel.findById(reservationId);

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found." },
        { status: 404 }
      );
    }

    if (reservation.status === "Cancelled") {
      return NextResponse.json(
        { error: "This reservation has already been cancelled." },
        { status: 400 }
      );
    }

    if (reservation.refundId) {
      return NextResponse.json(
        { error: "A refund has already been processed for this reservation." },
        { status: 400 }
      );
    }

    // Determine refund amount: custom override or policy calculation
    let refundAmount = 0;
    if (customRefundAmount !== undefined && customRefundAmount !== null) {
      refundAmount = Number(customRefundAmount);
      if (isNaN(refundAmount) || refundAmount < 0) {
        return NextResponse.json(
          { error: "Invalid refund amount provided." },
          { status: 400 }
        );
      }
      if (refundAmount > (reservation.paymentAmount || 0)) {
        return NextResponse.json(
          { error: `Refund amount cannot exceed paid amount of ₹${reservation.paymentAmount || 0}.` },
          { status: 400 }
        );
      }
    } else {
      const policyResult = calculateRefund(
        reservation.date,
        reservation.timeSlot,
        reservation.paymentAmount || 0
      );
      refundAmount = policyResult.refundAmount;
    }

    let refundId = "";
    let refundStatus = "None";

    if (refundAmount > 0) {
      if (!reservation.razorpayPaymentId) {
        return NextResponse.json(
          { error: "Payment details missing. Unable to process automatic refund." },
          { status: 400 }
        );
      }

      try {
        // Trigger Razorpay refund
        const refundObj = await razorpay.payments.refund(reservation.razorpayPaymentId, {
          amount: Math.round(refundAmount * 100), // paise
        });

        refundId = refundObj.id;
        refundStatus = "Processed";
      } catch (refundErr: any) {
        console.error(`[admin-cancel] Razorpay refund failed for reservationId ${reservationId}:`, refundErr);
        return NextResponse.json(
          { error: `Refund failed: ${refundErr.message || "Please contact support."}` },
          { status: 500 }
        );
      }
    }

    // Log the admin-initiated refund/cancellation
    console.log(`[ADMIN REFUND LOG] [${new Date().toISOString()}] Reservation ID: ${reservationId}, Reference: ${reservation.referenceId}, Amount: ₹${refundAmount}, Refund ID: ${refundId || "None"}`);

    // Update reservation status in MongoDB
    reservation.status = "Cancelled";
    reservation.refundId = refundId || undefined;
    reservation.refundAmount = refundAmount;
    reservation.refundStatus = refundStatus;
    reservation.refundDate = refundAmount > 0 ? new Date() : undefined;
    reservation.cancelledAt = new Date();

    if (reservation.paymentAmount && reservation.paymentAmount > 0) {
      if (refundAmount >= reservation.paymentAmount) {
        reservation.paymentStatus = "Refunded";
      } else if (refundAmount > 0) {
        reservation.paymentStatus = "Partially Refunded";
      }
    }

    await reservation.save();

    // Send cancellation email notification
    const tableObj = RESTAURANT_TABLES.find(t => t.id === reservation.tableNumber);
    const tableLabel = tableObj ? tableObj.label : `Table ${reservation.tableNumber}`;

    try {
      await sendCancellationNotification({
        referenceId: reservation.referenceId,
        customerName: reservation.customerName,
        customerPhone: reservation.customerPhone,
        customerEmail: reservation.customerEmail,
        tableLabel,
        date: reservation.date,
        timeSlot: reservation.timeSlot,
        guests: reservation.guests,
        paymentAmount: reservation.paymentAmount || 0,
        paymentId: reservation.razorpayPaymentId,
        refundAmount,
        refundId: refundId || undefined,
      });
    } catch (notifyErr) {
      console.error("[admin-cancel] Cancellation notification failed:", notifyErr);
    }

    return NextResponse.json({
      success: true,
      refundAmount,
      refundId,
      refundStatus,
      message: refundAmount > 0
        ? `Reservation cancelled. Refund of ₹${refundAmount} has been initiated.`
        : "Reservation cancelled successfully. No refund was processed.",
    });
  } catch (err: any) {
    console.error("[POST /api/reservations/admin-cancel]", err);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}

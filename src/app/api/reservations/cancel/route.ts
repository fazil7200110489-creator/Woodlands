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

// Shared rate limiting logic
const attemptsMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const attempts = attemptsMap.get(ip) || [];
  const recentAttempts = attempts.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
  
  if (recentAttempts.length >= MAX_ATTEMPTS) {
    attemptsMap.set(ip, recentAttempts);
    return true;
  }
  
  recentAttempts.push(now);
  attemptsMap.set(ip, recentAttempts);
  return false;
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown-ip";
    
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again in 15 minutes." },
        { status: 429 }
      );
    }

    await connectDB();
    const body = await req.json();
    const { referenceId, customerPhone } = body;

    if (!referenceId || !customerPhone) {
      return NextResponse.json(
        { error: "Booking reference and mobile number are required." },
        { status: 400 }
      );
    }

    const cleanRef = referenceId.trim().toUpperCase();
    const cleanPhone = customerPhone.trim();

    // Query for reservation
    const reservation = await ReservationModel.findOne({
      referenceId: cleanRef,
      customerPhone: cleanPhone,
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Booking not found or verification failed." },
        { status: 404 }
      );
    }

    // Double cancellation check
    if (reservation.status === "Cancelled") {
      return NextResponse.json(
        { error: "This booking has already been cancelled." },
        { status: 400 }
      );
    }

    if (reservation.status === "Completed") {
      return NextResponse.json(
        { error: "Completed bookings cannot be cancelled." },
        { status: 400 }
      );
    }

    // Duplicate refund check
    if (reservation.refundId) {
      return NextResponse.json(
        { error: "A refund has already been processed for this booking." },
        { status: 400 }
      );
    }

    // Calculate refund using policy
    const policyResult = calculateRefund(
      reservation.date,
      reservation.timeSlot,
      reservation.paymentAmount || 0
    );

    const refundAmount = policyResult.refundAmount;
    let refundId = "";
    let refundStatus = "None";

    if (refundAmount > 0) {
      if (!reservation.razorpayPaymentId) {
        return NextResponse.json(
          { error: "Payment details missing. Unable to process automatic refund. Please contact restaurant support." },
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
        console.error(`[cancel] Razorpay refund failed for ${cleanRef}:`, refundErr);
        return NextResponse.json(
          { error: `Refund failed: ${refundErr.message || "Please contact support."}` },
          { status: 500 }
        );
      }
    }

    // Log the refund request to the server console
    console.log(`[REFUND LOG] [${new Date().toISOString()}] Reference: ${cleanRef}, Amount: ₹${refundAmount}, Refund ID: ${refundId || "None"}`);

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
      console.error("[cancel] Cancellation notification failed:", notifyErr);
    }

    return NextResponse.json({
      success: true,
      refundAmount,
      refundId,
      refundStatus,
      message: refundAmount > 0
        ? `Booking cancelled. Refund of ₹${refundAmount} has been initiated.`
        : "Booking cancelled successfully. No refund was applicable under the cancellation policy.",
    });
  } catch (err: any) {
    console.error("[POST /api/reservations/cancel]", err);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}

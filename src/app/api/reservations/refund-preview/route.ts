import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ReservationModel } from "@/lib/models";
import { calculateRefund } from "@/lib/refundPolicy";

export const dynamic = 'force-dynamic';

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
    }).lean();

    if (!reservation) {
      return NextResponse.json(
        { error: "Booking not found or verification failed." },
        { status: 404 }
      );
    }

    if (reservation.status === "Cancelled") {
      return NextResponse.json(
        { error: "This booking has already been cancelled." },
        { status: 400 }
      );
    }

    if (reservation.status === "Completed") {
      return NextResponse.json(
        { error: "Completed bookings cannot be cancelled or refunded." },
        { status: 400 }
      );
    }

    // Calculate refund using policy utility
    const calculation = calculateRefund(
      reservation.date,
      reservation.timeSlot,
      reservation.paymentAmount || 0
    );

    return NextResponse.json(calculation);
  } catch (err: any) {
    console.error("[POST /api/reservations/refund-preview]", err);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}

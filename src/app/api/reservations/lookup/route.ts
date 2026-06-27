import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ReservationModel } from "@/lib/models";

export const dynamic = 'force-dynamic';

// In-memory rate limiting Map: IP -> array of timestamps
const attemptsMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const attempts = attemptsMap.get(ip) || [];
  
  // Filter to keep only attempts within the time window
  const recentAttempts = attempts.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
  
  if (recentAttempts.length >= MAX_ATTEMPTS) {
    attemptsMap.set(ip, recentAttempts); // Update map with cleaned up array
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
    const { customerPhone, date, bookingDate } = body;

    const cleanPhone = customerPhone?.trim();
    const cleanDate = (date || bookingDate)?.trim();

    if (!cleanPhone || typeof cleanPhone !== "string" || cleanPhone.length < 8) {
      return NextResponse.json(
        { error: "A valid mobile number is required." },
        { status: 400 }
      );
    }

    if (!cleanDate || typeof cleanDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
      return NextResponse.json(
        { error: "A valid booking date (YYYY-MM-DD) is required." },
        { status: 400 }
      );
    }

    // Log the lookup attempt
    console.log(`[BOOKING LOOKUP ATTEMPT] [${new Date().toISOString()}] IP: ${ip} | Phone: ${cleanPhone} | Date: ${cleanDate}`);

    // Query for matching active reservations sorted by creation time
    const reservations = await ReservationModel.find({
      customerPhone: cleanPhone,
      date: cleanDate,
    }).sort({ createdAt: -1 }).lean();

    // Return sanitized fields
    const responseData = reservations.map((reservation: any) => ({
      referenceId: reservation.referenceId,
      customerName: reservation.customerName,
      customerPhone: reservation.customerPhone,
      customerEmail: reservation.customerEmail,
      tableNumber: reservation.tableNumber,
      date: reservation.date,
      timeSlot: reservation.timeSlot,
      guests: reservation.guests,
      status: reservation.status,
      paymentStatus: reservation.paymentStatus,
      paymentAmount: reservation.paymentAmount,
      specialOccasion: reservation.specialOccasion,
      specialInstructions: reservation.specialInstructions,
      razorpayPaymentId: reservation.razorpayPaymentId,
      refundId: reservation.refundId,
      refundAmount: reservation.refundAmount,
      refundStatus: reservation.refundStatus,
      createdAt: reservation.createdAt,
    }));

    return NextResponse.json(responseData);
  } catch (err: any) {
    console.error("[POST /api/reservations/lookup]", err);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}

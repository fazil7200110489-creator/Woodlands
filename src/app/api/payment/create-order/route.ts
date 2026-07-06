import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(req: Request) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error("[POST /api/payment/create-order] Missing Razorpay credentials");
      return NextResponse.json(
        { error: "Razorpay credentials are not configured" },
        { status: 401 }
      );
    }

    const { amount, currency = "INR", notes } = await req.json();

    if (amount === undefined || amount === null) {
      return NextResponse.json({ error: "Amount is required" }, { status: 400 });
    }

    // Razorpay expects amount in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(amount * 100);

    if (amountInPaise < 100) {
      return NextResponse.json(
        { error: "Amount must be at least 100 paise" },
        { status: 400 }
      );
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency,
      receipt: `rcpt_${Date.now()}`,
      notes: notes ?? {},
    });

    return NextResponse.json({
      orderId: order.id,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: keyId,
    });
  } catch (err: any) {
    console.error("[POST /api/payment/create-order] Error details:", err);

    // Detect authentication/credential failure
    const isAuthFailure = 
      err?.statusCode === 401 || 
      err?.status === 401 ||
      err?.error?.code === "AUTHENTICATION_ERROR" ||
      (err?.error?.description && /key|secret|auth|credential/i.test(err.error.description)) ||
      (err?.message && /auth|401/i.test(err.message));

    if (isAuthFailure) {
      return NextResponse.json(
        { error: "Authentication failed with payment gateway" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: err?.error?.description ?? err?.message ?? "Failed to create payment order" },
      { status: 500 }
    );
  }
}


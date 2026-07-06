import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(req: Request) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    console.log(`Razorpay Key Loaded: ${!!keyId}`);
    console.log(`Razorpay Secret Loaded: ${!!keySecret}`);

    if (!keyId || !keySecret) {
      console.error("[POST /api/payment/create-order] Missing Razorpay credentials");
      console.log("Exact Error Message: Razorpay credentials are not configured on the server");
      return NextResponse.json(
        { error: "Razorpay credentials are not configured" },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
    const clientCreated = !!razorpay;
    console.log(`Razorpay Client Created: ${clientCreated}`);

    if (!clientCreated) {
      return NextResponse.json(
        { error: "Failed to initialize Razorpay client" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { amount, currency = "INR", notes } = body;

    if (amount === undefined || amount === null) {
      console.log("Exact Error Message: Amount is required");
      return NextResponse.json({ error: "Amount is required" }, { status: 400 });
    }

    const amountInPaise = Math.round(amount * 100);

    if (amountInPaise < 100) {
      console.log(`Exact Error Message: Amount must be at least 100 paise (received ${amountInPaise} paise)`);
      return NextResponse.json(
        { error: "Amount must be at least 100 paise" },
        { status: 400 }
      );
    }

    const receipt = `rcpt_${Date.now()}`;
    const customerName = notes?.customerName || "N/A";

    console.log("Order Creation Started");
    console.log("Amount:", amountInPaise);
    console.log("Currency:", currency);
    console.log("Receipt:", receipt);
    console.log("Customer Name:", customerName);

    let order;
    try {
      order = await razorpay.orders.create({
        amount: amountInPaise,
        currency,
        receipt,
        notes: notes ?? {},
      });
      console.log("Razorpay API Response:", JSON.stringify(order));
    } catch (apiErr: any) {
      console.error("Razorpay orders.create API threw an exception:");
      console.log("Status Code:", apiErr?.statusCode || apiErr?.status || "N/A");
      console.log("Error Code:", apiErr?.error?.code || "N/A");
      console.log("Error Description:", apiErr?.error?.description || "N/A");
      console.log("Exact Exception:", apiErr?.message || apiErr || "N/A");
      throw apiErr;
    }

    return NextResponse.json({
      orderId: order.id,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: keyId,
    });
  } catch (err: any) {
    console.error("[POST /api/payment/create-order] Exception caught:", err);

    // Detect authentication/credential failure from Razorpay API
    const isAuthFailure = 
      err?.statusCode === 401 || 
      err?.status === 401 ||
      err?.error?.code === "AUTHENTICATION_ERROR" ||
      (err?.error?.description && /key|secret|auth|credential/i.test(err.error.description)) ||
      (err?.message && /auth|401/i.test(err.message));

    if (isAuthFailure) {
      return NextResponse.json(
        { error: "Authentication failed with Razorpay" },
        { status: 502 } // Upstream authentication error (502 Bad Gateway)
      );
    }

    return NextResponse.json(
      { error: err?.error?.description ?? err?.message ?? "Failed to create payment order" },
      { status: 500 }
    );
  }
}


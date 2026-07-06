import { NextResponse } from "next/server";

async function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(`${orderId}|${paymentId}`);
    const keyData = encoder.encode(secret);

    const cryptoKey = await globalThis.crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const hexMatch = signature.match(/.{1,2}/g);
    if (!hexMatch) {
      console.warn("[verify] Signature is not a valid hex string");
      return false;
    }

    const signatureBytes = new Uint8Array(
      hexMatch.map((byte) => parseInt(byte, 16))
    );

    return await globalThis.crypto.subtle.verify(
      "HMAC",
      cryptoKey,
      signatureBytes,
      data
    );
  } catch (err) {
    console.error("[verify] Error during cryptographic signature verification:", err);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const orderId = body.razorpayOrderId || body.razorpay_order_id;
    const paymentId = body.razorpayPaymentId || body.razorpay_payment_id;
    const signature = body.razorpaySignature || body.razorpay_signature;

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        { success: false, error: "Missing payment parameters" },
        { status: 400 }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      console.error("[POST /api/payment/verify] RAZORPAY_KEY_SECRET is not configured");
      return NextResponse.json(
        { success: false, error: "Razorpay credentials are not configured" },
        { status: 500 }
      );
    }

    const isValid = await verifyRazorpaySignature(
      orderId,
      paymentId,
      signature,
      keySecret
    );

    if (!isValid) {
      console.warn("[verify] Signature mismatch", {
        orderId,
        paymentId,
      });
      return NextResponse.json(
        { success: false, error: "Payment signature verification failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[POST /api/payment/verify]", err);
    return NextResponse.json(
      { success: false, error: "Verification error" },
      { status: 500 }
    );
  }
}


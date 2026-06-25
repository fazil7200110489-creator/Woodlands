"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";

const ease = [0.16, 1, 0.3, 1] as const;

export default function PaymentSuccessPage() {
  const params = useSearchParams();
  const [visible, setVisible] = useState(false);

  const paymentId = params.get("payment_id") ?? "";
  const orderId = params.get("order_id") ?? "";
  const type = params.get("type") ?? "order"; // "order" | "booking"
  const refId = params.get("ref") ?? "";
  const whatsappUrl = params.get("wa") ?? "";
  const amount = params.get("amount") ?? "";

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const isBooking = type === "booking";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#FBF8F3] text-[#1D0F07] flex flex-col items-center justify-center px-6 py-16">
      {/* Background radial glow */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,rgba(74,197,94,0.08)_0%,transparent_65%)]" />

      <AnimatePresence>
        {visible && (
          <m.div
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease }}
            className="relative z-10 w-full max-w-md"
          >
            {/* Success card */}
            <div className="rounded-[32px] border border-[#BF976A]/20 bg-white/80 p-10 shadow-[0_24px_80px_rgba(0,0,0,0.08)] backdrop-blur-md text-center">

              {/* Animated checkmark */}
              <m.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 18, stiffness: 200, delay: 0.2 }}
                className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200"
              >
                <m.svg
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="h-12 w-12 text-emerald-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <m.path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  />
                </m.svg>
              </m.div>

              <m.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="font-mono-num text-[10px] uppercase tracking-[0.28em] text-emerald-600 mb-3"
              >
                Payment Successful
              </m.p>

              <m.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="font-display text-[2.6rem] leading-[0.95] text-[#1D0F07] mb-3"
              >
                {isBooking ? "Table Reserved!" : "Order Placed!"}
              </m.h1>

              <m.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65 }}
                className="font-serif text-[#5C4A38] leading-[1.7] mb-8"
              >
                {isBooking
                  ? "Your advance has been received. We look forward to hosting you."
                  : "Your payment is confirmed. Your order is being prepared."}
              </m.p>

              {/* Details card */}
              <m.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="rounded-2xl border border-[#BF976A]/18 bg-[#FBF8F3] p-6 text-left mb-8 space-y-4"
              >
                {amount && (
                  <div className="flex justify-between items-center border-b border-[#BF976A]/10 pb-3">
                    <p className="font-mono-num text-[10px] uppercase tracking-[0.2em] text-[#9B7340]">Amount Paid</p>
                    <p className="font-display text-xl text-[#BF976A]">₹{amount}</p>
                  </div>
                )}
                {(refId || orderId) && (
                  <div>
                    <p className="font-mono-num text-[10px] uppercase tracking-[0.2em] text-[#9B7340] mb-1">
                      {isBooking ? "Booking Reference" : "Order Reference"}
                    </p>
                    <p className="font-mono-num text-sm text-[#1D0F07] break-all">{refId || orderId}</p>
                  </div>
                )}
                {paymentId && (
                  <div>
                    <p className="font-mono-num text-[10px] uppercase tracking-[0.2em] text-[#9B7340] mb-1">Payment ID</p>
                    <p className="font-mono-num text-xs text-[#5C4A38] break-all">{paymentId}</p>
                  </div>
                )}
              </m.div>

              {/* Actions */}
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex flex-col gap-3"
              >
                {whatsappUrl && !isBooking && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    id="whatsapp-track-btn"
                    className="flex items-center justify-center gap-2 w-full rounded-full bg-[#25D366] py-4 font-mono-num text-[10px] uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-90"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Track via WhatsApp
                  </a>
                )}
                <Link href="/" id="back-home-btn">
                  <button className="w-full rounded-full border border-[#BF976A]/40 py-4 font-mono-num text-[10px] uppercase tracking-[0.2em] text-[#1D0F07] transition-colors hover:bg-[#BF976A]/10">
                    {isBooking ? "Back to Home" : "Continue Shopping"}
                  </button>
                </Link>
              </m.div>
            </div>

            {/* Test mode badge */}
            <m.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-6 text-center font-mono-num text-[10px] uppercase tracking-[0.22em] text-[#9B7340]/60"
            >
              🔒 Razorpay Test Mode · No real charges
            </m.p>
          </m.div>
        )}
      </AnimatePresence>
    </main>
  );
}

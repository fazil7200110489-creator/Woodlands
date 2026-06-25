"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";

const ease = [0.16, 1, 0.3, 1] as const;

export default function PaymentFailurePage() {
  const params = useSearchParams();
  const [visible, setVisible] = useState(false);

  const reason = params.get("reason") ?? "Payment was not completed.";
  const type = params.get("type") ?? "order";

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const isBooking = type === "booking";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#FBF8F3] text-[#1D0F07] flex flex-col items-center justify-center px-6 py-16">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,rgba(239,68,68,0.06)_0%,transparent_65%)]" />

      <AnimatePresence>
        {visible && (
          <m.div
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease }}
            className="relative z-10 w-full max-w-md"
          >
            <div className="rounded-[32px] border border-[#BF976A]/20 bg-white/80 p-10 shadow-[0_24px_80px_rgba(0,0,0,0.08)] backdrop-blur-md text-center">

              {/* Animated X */}
              <m.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 18, stiffness: 200, delay: 0.2 }}
                className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-50 border border-red-200"
              >
                <svg
                  className="h-12 w-12 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </m.div>

              <m.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="font-mono-num text-[10px] uppercase tracking-[0.28em] text-red-500 mb-3"
              >
                Payment Failed
              </m.p>

              <m.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="font-display text-[2.6rem] leading-[0.95] text-[#1D0F07] mb-3"
              >
                Oops!
              </m.h1>

              <m.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="font-serif text-[#5C4A38] leading-[1.7] mb-8"
              >
                {reason}
              </m.p>

              {/* Info box */}
              <m.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 }}
                className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-left mb-8"
              >
                <p className="font-mono-num text-[10px] uppercase tracking-widest text-amber-700 mb-2">Good to know</p>
                <p className="font-serif text-sm text-amber-900 leading-[1.6]">
                  No money has been deducted. You can safely try again. If an amount was debited, it will be automatically refunded within 5–7 business days.
                </p>
              </m.div>

              {/* Actions */}
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.75 }}
                className="flex flex-col gap-3"
              >
                <Link href={isBooking ? "/book-a-table" : "/"} id="try-again-btn">
                  <button className="w-full rounded-full bg-[#1D0F07] py-4 font-mono-num text-[10px] uppercase tracking-[0.2em] text-[#FBF8F3] transition-colors hover:bg-[#BF976A] hover:text-[#1D0F07]">
                    Try Again
                  </button>
                </Link>
                <a
                  href={`https://wa.me/${process.env.NEXT_PUBLIC_OWNER_PHONE ?? "917200110489"}?text=Hi%2C+I+had+a+payment+issue+while+trying+to+${isBooking ? "book+a+table" : "place+an+order"}.+Can+you+help%3F`}
                  target="_blank"
                  rel="noopener noreferrer"
                  id="contact-us-btn"
                  className="flex items-center justify-center gap-2 w-full rounded-full border border-[#BF976A]/40 py-4 font-mono-num text-[10px] uppercase tracking-[0.2em] text-[#1D0F07] transition-colors hover:bg-[#BF976A]/10"
                >
                  Contact Us on WhatsApp
                </a>
              </m.div>
            </div>

            <m.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.95 }}
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

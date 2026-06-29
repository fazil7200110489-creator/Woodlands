"use client";

import { useEffect, useState, useRef } from "react";
import { use } from "react";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import { toCurrency } from "@/lib/pickup";
import { CheckCircle2, Clock, ChefHat, Package, XCircle, ShoppingBag } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

type OrderStatus =
  | "Pending"
  | "Accepted"
  | "Preparing"
  | "Ready for Pickup"
  | "Completed"
  | "Cancelled";

type Order = {
  _id: string;
  customerName: string;
  pickupTime: string;
  items: { name: string; qty: number; price: number }[];
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: string;
  amountPaid?: number;
  createdAt: string;
};

const STEPS: { status: OrderStatus; label: string; icon: React.ReactNode; desc: string }[] = [
  {
    status: "Pending",
    label: "Order Received",
    icon: <ShoppingBag size={18} />,
    desc: "Your order has been received and is awaiting confirmation.",
  },
  {
    status: "Accepted",
    label: "Accepted",
    icon: <CheckCircle2 size={18} />,
    desc: "The restaurant has accepted your order.",
  },
  {
    status: "Preparing",
    label: "Preparing",
    icon: <ChefHat size={18} />,
    desc: "Your food is being freshly prepared.",
  },
  {
    status: "Ready for Pickup",
    label: "Ready for Pickup",
    icon: <Package size={18} />,
    desc: "Your order is ready! Please collect it at the counter.",
  },
  {
    status: "Completed",
    label: "Completed",
    icon: <CheckCircle2 size={18} />,
    desc: "Order completed. Enjoy your meal!",
  },
];

function getStepIndex(status: OrderStatus): number {
  if (status === "Cancelled") return -1;
  return STEPS.findIndex((s) => s.status === status);
}

export default function OrderStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const prevStatus = useRef<OrderStatus | null>(null);
  const [visible, setVisible] = useState(false);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (!res.ok) {
        setError("Order not found. Please check your order link.");
        return;
      }
      const data: Order = await res.json();
      setOrder(data);
      setLastUpdated(new Date());
      prevStatus.current = data.status;
    } catch {
      setError("Failed to load order. Please try again.");
    }
  };

  useEffect(() => {
    fetchOrder();
    const t = setTimeout(() => setVisible(true), 100);
    // Poll every 15 seconds for status updates
    const interval = setInterval(fetchOrder, 15_000);
    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, [id]);

  const stepIdx = order ? getStepIndex(order.status) : -1;
  const isCancelled = order?.status === "Cancelled";

  return (
    <main className="min-h-screen bg-[#FBF8F3] text-[#1D0F07] px-6 py-16 flex flex-col items-center">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_20%,rgba(191,151,106,0.07)_0%,transparent_65%)]" />

      {/* Logo */}
      <m.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="mb-10 flex items-center gap-2 font-display text-2xl text-[#1D0F07]"
      >
        <span className="text-[#BF976A]">◆</span> Woodlands
      </m.div>

      <AnimatePresence mode="wait">
        {error ? (
          <m.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full rounded-[28px] border border-red-200 bg-white/80 p-10 shadow-lg text-center"
          >
            <XCircle className="mx-auto mb-4 text-red-400" size={40} />
            <p className="text-gray-700">{error}</p>
            <Link href="/" className="mt-6 inline-block text-sm text-[#BF976A] hover:underline">
              ← Back to Home
            </Link>
          </m.div>
        ) : !order ? (
          <m.div key="loading" className="flex flex-col items-center gap-4">
            <div className="h-14 w-14 rounded-full border-4 border-[#BF976A]/30 border-t-[#BF976A] animate-spin" />
            <p className="text-sm text-[#9B7340]">Loading your order…</p>
          </m.div>
        ) : (
          <m.div
            key="content"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 24 }}
            transition={{ duration: 0.6, ease }}
            className="w-full max-w-lg space-y-6"
          >
            {/* Status card */}
            <div className="rounded-[28px] border border-[#BF976A]/20 bg-white/85 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.07)] backdrop-blur-md">
              {/* Order header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="font-mono-num text-[10px] uppercase tracking-[0.28em] text-[#9B7340]">
                    Order #{order._id.slice(-6).toUpperCase()}
                  </p>
                  <h1 className="font-display text-2xl text-[#1D0F07] mt-1">
                    {order.customerName}
                  </h1>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#9B7340]">
                  <Clock size={12} /> {order.pickupTime}
                </div>
              </div>

              {/* Cancelled state */}
              {isCancelled ? (
                <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-center">
                  <XCircle className="mx-auto mb-2 text-red-400" size={36} />
                  <p className="font-semibold text-red-700 text-lg">Order Cancelled</p>
                  <p className="text-sm text-red-500 mt-1">
                    This order has been cancelled. Please contact us if you have questions.
                  </p>
                </div>
              ) : (
                /* Progress stepper */
                <div className="space-y-0">
                  {STEPS.map((step, idx) => {
                    const isCompleted = idx < stepIdx;
                    const isCurrent = idx === stepIdx;
                    const isFuture = idx > stepIdx;
                    return (
                      <div key={step.status} className="flex gap-4">
                        {/* Icon column */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                              isCompleted
                                ? "border-[#BF976A] bg-[#BF976A] text-white"
                                : isCurrent
                                ? "border-[#BF976A] bg-white text-[#BF976A] shadow-[0_0_0_4px_rgba(191,151,106,0.15)]"
                                : "border-gray-200 bg-white text-gray-300"
                            }`}
                          >
                            {isCompleted ? <CheckCircle2 size={18} /> : step.icon}
                          </div>
                          {/* Connector line */}
                          {idx < STEPS.length - 1 && (
                            <div
                              className={`mt-1 mb-1 w-0.5 flex-1 min-h-[28px] transition-colors duration-700 ${
                                idx < stepIdx ? "bg-[#BF976A]" : "bg-gray-100"
                              }`}
                            />
                          )}
                        </div>

                        {/* Label column */}
                        <div className={`pb-6 ${idx === STEPS.length - 1 ? "pb-0" : ""}`}>
                          <p
                            className={`text-sm font-semibold mt-2 ${
                              isCompleted
                                ? "text-[#BF976A]"
                                : isCurrent
                                ? "text-[#1D0F07]"
                                : "text-gray-300"
                            }`}
                          >
                            {step.label}
                            {isCurrent && (
                              <span className="ml-2 inline-block h-2 w-2 rounded-full bg-[#BF976A] animate-pulse" />
                            )}
                          </p>
                          {isCurrent && (
                            <p className="text-xs text-[#5C4A38] mt-0.5">{step.desc}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Order details card */}
            <div className="rounded-[24px] border border-[#BF976A]/15 bg-white/80 p-6 shadow-sm">
              <h2 className="font-display text-lg text-[#1D0F07] mb-4">Your Order</h2>
              <ul className="space-y-2 mb-4">
                {order.items.map((item, idx) => (
                  <li key={idx} className="flex justify-between text-sm">
                    <span className="text-[#5C4A38]">
                      {item.qty}× {item.name}
                    </span>
                    <span className="text-[#9B7340]">{toCurrency(item.price * item.qty)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between items-center border-t border-[#BF976A]/12 pt-3">
                <span className="font-mono-num text-[10px] uppercase tracking-[0.2em] text-[#9B7340]">
                  Total Paid
                </span>
                <span className="font-display text-xl text-[#BF976A]">
                  {toCurrency(order.totalAmount)}
                </span>
              </div>
            </div>

            {/* Auto-refresh notice */}
            <p className="text-center font-mono-num text-[10px] uppercase tracking-[0.22em] text-[#9B7340]/60">
              Auto-refreshing every 15s ·{" "}
              Last updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>

            <div className="text-center">
              <Link href="/" className="text-sm text-[#9B7340] hover:text-[#BF976A] transition-colors">
                ← Back to Menu
              </Link>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </main>
  );
}

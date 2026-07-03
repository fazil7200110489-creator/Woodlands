"use client";

import { useState } from "react";
import { toCurrency } from "@/lib/pickup";
import {
  Clock,
  CheckCircle2,
  XCircle,
  ChefHat,
  Package,
  AlertTriangle,
  Search,
  Phone,
  Banknote,
  ShoppingBag,
} from "lucide-react";
import { Order, OrderStatus } from "@/lib/types";
import { usePOS } from "@/components/admin/OrderNotificationContext";
import { AnimatePresence, m, LazyMotion, domAnimation } from "framer-motion";

// ── Constants ──────────────────────────────────────────────────────────────

const STATUS_ORDER: OrderStatus[] = [
  "Pending",
  "Accepted",
  "Preparing",
  "Ready for Pickup",
  "Completed",
  "Cancelled",
];

const STATUS_NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  Pending: "Accepted",
  Accepted: "Preparing",
  Preparing: "Ready for Pickup",
  "Ready for Pickup": "Completed",
};

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string; ring: string; icon: React.ReactNode }
> = {
  Pending: {
    label: "Pending",
    color: "text-amber-700",
    bg: "bg-amber-50",
    ring: "ring-amber-600/20",
    icon: <Clock size={12} />,
  },
  Accepted: {
    label: "Accepted",
    color: "text-blue-700",
    bg: "bg-blue-50",
    ring: "ring-blue-600/20",
    icon: <CheckCircle2 size={12} />,
  },
  Preparing: {
    label: "Preparing",
    color: "text-orange-700",
    bg: "bg-orange-50",
    ring: "ring-orange-600/20",
    icon: <ChefHat size={12} />,
  },
  "Ready for Pickup": {
    label: "Ready",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    ring: "ring-emerald-600/20",
    icon: <Package size={12} />,
  },
  Completed: {
    label: "Completed",
    color: "text-gray-600",
    bg: "bg-gray-100",
    ring: "ring-gray-400/20",
    icon: <CheckCircle2 size={12} />,
  },
  Cancelled: {
    label: "Cancelled",
    color: "text-red-700",
    bg: "bg-red-50",
    ring: "ring-red-600/20",
    icon: <XCircle size={12} />,
  },
};

// ── Overdue Helpers ────────────────────────────────────────────────────────

function parsePickupTime(pickupTime: string): Date | null {
  try {
    const now = new Date();
    const [timePart, meridiem] = pickupTime.trim().split(" ");
    const [hStr, mStr] = timePart.split(":");
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (meridiem?.toUpperCase() === "PM" && h !== 12) h += 12;
    if (meridiem?.toUpperCase() === "AM" && h === 12) h = 0;
    const d = new Date(now);
    d.setHours(h, m, 0, 0);
    return d;
  } catch {
    return null;
  }
}

function minutesUntilPickup(pickupTime: string): number {
  const pt = parsePickupTime(pickupTime);
  if (!pt) return Infinity;
  return Math.round((pt.getTime() - Date.now()) / 60000);
}

function minutesPastPickup(pickupTime: string): number {
  return -minutesUntilPickup(pickupTime);
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function OrdersPage() {
  const { orders, updateOrderStatus, isLoading } = usePOS();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Active");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusUpdate = async (id: string, newStatus: OrderStatus) => {
    setUpdatingId(id);
    await updateOrderStatus(id, newStatus);
    setUpdatingId(null);
  };

  // ── Filters ────────────────────────────────────────────────────────────

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o._id.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      o.customerPhone?.includes(search);

    const matchesStatus =
      statusFilter === "All"
        ? true
        : statusFilter === "Active"
        ? !["Completed", "Cancelled"].includes(o.status)
        : o.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 font-display">
            Live Orders
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {orders.filter((o) => !["Completed", "Cancelled"].includes(o.status)).length} active ·{" "}
            {orders.filter((o) => o.status === "Pending").length} pending
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by name, phone, or order ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-4 text-sm bg-white focus:border-[#BF976A] focus:outline-none focus:ring-2 focus:ring-[#BF976A]/20"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {["Active", "All", "Pending", "Accepted", "Preparing", "Ready for Pickup", "Completed", "Cancelled"].map(
            (s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  statusFilter === s
                    ? "bg-[#1D0F07] text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {s}
              </button>
            )
          )}
        </div>
      </div>

      {/* Orders Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white border border-gray-100 p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-2xl bg-white border border-gray-100 p-16 text-center">
          <ShoppingBag className="mx-auto mb-3 text-gray-300" size={40} />
          <p className="text-gray-500">No orders found.</p>
        </div>
      ) : (
        <LazyMotion features={domAnimation}>
          <m.div layout className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filteredOrders.map((order) => (
                <m.div
                  key={order._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                >
                  <OrderCard
                    order={order}
                    isUpdating={updatingId === order._id}
                    onStatusUpdate={handleStatusUpdate}
                  />
                </m.div>
              ))}
            </AnimatePresence>
          </m.div>
        </LazyMotion>
      )}

      {/* Styles for new order highlight & swing chimes */}
      <style jsx global>{`
        @keyframes new-order-pulse {
          0%, 100% { 
            border-color: #BF976A; 
            box-shadow: 0 0 0 0px rgba(191, 151, 106, 0.4); 
          }
          50% { 
            border-color: #dcb38a; 
            box-shadow: 0 0 0 6px rgba(191, 151, 106, 0.15); 
          }
        }
        .animate-new-order-pulse {
          animation: new-order-pulse 2s infinite;
        }
      `}</style>
    </div>
  );
}

// ── Order Card ──────────────────────────────────────────────────────────────

function OrderCard({
  order,
  isUpdating,
  onStatusUpdate,
}: {
  order: Order;
  isUpdating: boolean;
  onStatusUpdate: (id: string, status: OrderStatus) => void;
}) {
  const cfg = STATUS_CONFIG[order.status];
  const nextStatus = STATUS_NEXT[order.status];
  const pastMins = minutesPastPickup(order.pickupTime);
  const minsUntil = minutesUntilPickup(order.pickupTime);
  
  const isOverdue =
    pastMins > 2 &&
    order.status !== "Completed" &&
    order.status !== "Cancelled";
  
  const isPickupSoon =
    minsUntil <= 15 &&
    minsUntil > -2 &&
    order.status !== "Completed" &&
    order.status !== "Cancelled";

  // Check if order was placed very recently (last 15 seconds) to highlight
  const isNew = Date.now() - new Date(order.createdAt).getTime() < 15000;

  const orderNum = order._id.slice(-6).toUpperCase();

  return (
    <div
      className={`relative rounded-2xl border bg-white p-5 shadow-sm transition-all h-full flex flex-col justify-between ${
        isNew 
          ? "animate-new-order-pulse border-2"
          : isOverdue
          ? "border-red-300 ring-1 ring-red-200 bg-red-50/30"
          : isPickupSoon
          ? "border-amber-300 ring-1 ring-amber-200 bg-amber-50/20"
          : "border-gray-100 hover:shadow-md"
      }`}
    >
      <div>
        {/* Overdue / Pickup Soon banner */}
        {isOverdue && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700">
            <AlertTriangle size={12} />⚠️ Late Pickup · {pastMins} min elapsed
          </div>
        )}
        {isPickupSoon && !isOverdue && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700">
            <Clock size={12} />🔔 Pickup in {minsUntil} min — prepare now!
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-mono text-gray-400 mb-0.5">#{orderNum}</p>
            <p className="font-semibold text-gray-900 text-base">{order.customerName}</p>
            <a
              href={`tel:${order.customerPhone}`}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#BF976A] transition-colors mt-0.5"
            >
              <Phone size={11} /> {order.customerPhone}
            </a>
          </div>

          {/* Status badge */}
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${cfg.bg} ${cfg.color} ${cfg.ring}`}
          >
            {cfg.icon} {cfg.label}
          </span>
        </div>

        {/* Items */}
        <ul className="mb-4 space-y-1.5">
          {order.items?.map((item, idx) => (
            <li key={idx} className="flex justify-between text-sm">
              <span className="text-gray-700">
                {item.qty}× {item.name}
              </span>
              <span className="text-gray-500">{toCurrency(item.price * item.qty)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        {/* Footer info */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-3 mb-4">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock size={12} /> Pickup: <strong className="text-gray-700 font-semibold">{order.pickupTime}</strong>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-gray-800">
            <Banknote size={12} className="text-emerald-500" />
            {toCurrency(order.totalAmount)}
            <span className="ml-1 rounded-full bg-emerald-50 text-emerald-700 px-1.5 py-0.5 text-[10px] ring-1 ring-inset ring-emerald-600/20 font-semibold">
              {order.paymentStatus}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {/* Primary next-status action */}
          {nextStatus && (
            <button
              disabled={isUpdating}
              onClick={() => onStatusUpdate(order._id, nextStatus)}
              className="flex-1 rounded-xl bg-[#1D0F07] py-2.5 text-xs font-semibold text-white transition-all hover:bg-[#BF976A] disabled:opacity-50"
            >
              {isUpdating ? "…" : `→ ${nextStatus}`}
            </button>
          )}

          {/* Cancel button — only for non-terminal orders */}
          {order.status !== "Completed" && order.status !== "Cancelled" && (
            <button
              disabled={isUpdating}
              onClick={() => onStatusUpdate(order._id, "Cancelled")}
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
            >
              Cancel
            </button>
          )}

          {/* Completed badge — no action needed */}
          {order.status === "Completed" && (
            <div className="flex-1 rounded-xl bg-gray-50 py-2.5 text-center text-xs font-semibold text-gray-400">
              ✓ Order Complete
            </div>
          )}

          {order.status === "Cancelled" && (
            <div className="flex-1 rounded-xl bg-red-50 py-2.5 text-center text-xs font-semibold text-red-400">
              ✕ Cancelled
            </div>
          )}
        </div>

        {/* Time placed */}
        <p className="mt-2 text-[10px] text-gray-400 text-right">
          Placed {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

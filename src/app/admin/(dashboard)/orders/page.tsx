"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toCurrency } from "@/lib/pickup";
import {
  Bell,
  Clock,
  CheckCircle2,
  XCircle,
  ChefHat,
  Package,
  AlertTriangle,
  Search,
  RefreshCw,
  Phone,
  Banknote,
  ShoppingBag,
} from "lucide-react";
import { Order, OrderStatus } from "@/lib/types";

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

// ── Notification types ─────────────────────────────────────────────────────

type Notification = {
  id: string;
  type: "new_order" | "pickup_reminder" | "overdue";
  title: string;
  body: string;
  orderId: string;
  timestamp: Date;
  read: boolean;
};

// ── Sound helper ───────────────────────────────────────────────────────────

function playNotificationSound(type: "order" | "reminder" | "overdue" = "order") {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const notes =
      type === "order"
        ? [523, 659, 784, 1047] // C5 E5 G5 C6 — cheerful ascending
        : type === "reminder"
        ? [784, 659, 784] // G5 E5 G5 — gentle reminder
        : [200, 150]; // low descending — overdue alert

    let t = ctx.currentTime;
    notes.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.start(t);
      osc.stop(t + 0.25);
      t += 0.16;
    });
  } catch {
    // AudioContext not available (headless/test env) — silently ignore
  }
}

// ── Overdue helpers ────────────────────────────────────────────────────────

function parsePickupTime(pickupTime: string): Date | null {
  // pickupTime is like "7:30 PM" — assume today
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

// ── Main component ─────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Active");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Track which orders we've already reminded/alerted so we don't spam
  const remindedRef = useRef<Set<string>>(new Set());
  const overdueRef = useRef<Set<string>>(new Set());

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ── Load orders ────────────────────────────────────────────────────────

  const loadOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // ── SSE connection ─────────────────────────────────────────────────────

  useEffect(() => {
    let es: EventSource;
    let retryTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      es = new EventSource("/api/orders/events");

      es.addEventListener("new_order", (e) => {
        const order = JSON.parse(e.data) as Order;
        setOrders((prev) => {
          // Avoid duplicate if we already have this order (e.g. from initial load)
          if (prev.some((o) => o._id === order._id)) return prev;
          return [order, ...prev];
        });

        const notif: Notification = {
          id: `new_${order._id}_${Date.now()}`,
          type: "new_order",
          title: "🔔 New Order Received",
          body: `${order.customerName} · ${order.pickupTime} · ${toCurrency(order.totalAmount)}`,
          orderId: order._id,
          timestamp: new Date(),
          read: false,
        };
        setNotifications((prev) => [notif, ...prev].slice(0, 30));
        playNotificationSound("order");
      });

      es.addEventListener("status_change", (e) => {
        const { _id, status } = JSON.parse(e.data);
        setOrders((prev) =>
          prev.map((o) => (o._id === _id ? { ...o, status } : o))
        );
      });

      es.onerror = () => {
        es.close();
        // Reconnect after 5s
        retryTimeout = setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      es?.close();
      clearTimeout(retryTimeout);
    };
  }, []);

  // ── Pickup reminder & overdue monitor (runs every 30s) ────────────────

  useEffect(() => {
    const check = () => {
      const active = orders.filter(
        (o) => o.status !== "Completed" && o.status !== "Cancelled"
      );

      active.forEach((o) => {
        const mins = minutesUntilPickup(o.pickupTime);

        // 15-minute pickup reminder
        if (mins <= 15 && mins > -5 && !remindedRef.current.has(o._id)) {
          remindedRef.current.add(o._id);
          const notif: Notification = {
            id: `reminder_${o._id}_${Date.now()}`,
            type: "pickup_reminder",
            title: "🔔 Pickup Reminder",
            body: `${o.customerName} · Pickup: ${o.pickupTime} · Order ready now!`,
            orderId: o._id,
            timestamp: new Date(),
            read: false,
          };
          setNotifications((prev) => [notif, ...prev].slice(0, 30));
          playNotificationSound("reminder");
        }

        // Overdue — pickup time has passed
        const pastMins = minutesPastPickup(o.pickupTime);
        if (pastMins > 2 && !overdueRef.current.has(o._id)) {
          overdueRef.current.add(o._id);
          const notif: Notification = {
            id: `overdue_${o._id}_${Date.now()}`,
            type: "overdue",
            title: "⚠ Late Pickup",
            body: `${o.customerName} · Pickup: ${o.pickupTime} · ${pastMins} min elapsed`,
            orderId: o._id,
            timestamp: new Date(),
            read: false,
          };
          setNotifications((prev) => [notif, ...prev].slice(0, 30));
          playNotificationSound("overdue");
        }
      });
    };

    check(); // run immediately when orders change
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, [orders]);

  // ── Status update ──────────────────────────────────────────────────────

  const handleStatusUpdate = async (id: string, newStatus: OrderStatus) => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders((prev) => prev.map((o) => (o._id === id ? updated : o)));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
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

  // ── Render ─────────────────────────────────────────────────────────────

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

        <div className="flex items-center gap-3">
          {/* Refresh */}
          <button
            onClick={() => { setIsLoading(true); loadOrders(); }}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-2 transition-colors"
          >
            <RefreshCw size={14} /> Refresh
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setNotifPanelOpen((v) => !v);
                if (!notifPanelOpen) {
                  setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                }
              }}
              className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <Bell
                size={18}
                className={unreadCount > 0 ? "text-[#BF976A] animate-[bell-shake_0.5s_ease-in-out]" : "text-gray-500"}
              />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Panel */}
            {notifPanelOpen && (
              <div className="absolute right-0 top-12 z-50 w-96 rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <span className="text-sm font-semibold text-gray-800">Notifications</span>
                  <button
                    onClick={() => setNotifications([])}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    Clear all
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">No notifications yet.</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 ${
                          n.type === "overdue"
                            ? "bg-red-50"
                            : n.type === "pickup_reminder"
                            ? "bg-amber-50"
                            : "bg-white"
                        }`}
                      >
                        <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{n.body}</p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {n.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              isUpdating={updatingId === order._id}
              onStatusUpdate={handleStatusUpdate}
            />
          ))}
        </div>
      )}

      {/* Bell shake keyframe injected as a style tag */}
      <style jsx global>{`
        @keyframes bell-shake {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-15deg); }
          40% { transform: rotate(15deg); }
          60% { transform: rotate(-10deg); }
          80% { transform: rotate(10deg); }
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

  const orderNum = order._id.slice(-6).toUpperCase();

  return (
    <div
      className={`relative rounded-2xl border bg-white p-5 shadow-sm transition-all ${
        isOverdue
          ? "border-red-300 ring-1 ring-red-200 bg-red-50/30"
          : isPickupSoon
          ? "border-amber-300 ring-1 ring-amber-200 bg-amber-50/20"
          : "border-gray-100 hover:shadow-md"
      }`}
    >
      {/* Overdue / Pickup Soon banner */}
      {isOverdue && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700">
          <AlertTriangle size={12} />⚠ Late Pickup · {pastMins} min elapsed
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
      <ul className="mb-4 space-y-1">
        {order.items?.map((item, idx) => (
          <li key={idx} className="flex justify-between text-sm">
            <span className="text-gray-700">
              {item.qty}× {item.name}
            </span>
            <span className="text-gray-500">{toCurrency(item.price * item.qty)}</span>
          </li>
        ))}
      </ul>

      {/* Footer info */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-3 mb-4">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock size={12} /> {order.pickupTime}
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold text-gray-800">
          <Banknote size={12} className="text-emerald-500" />
          {toCurrency(order.totalAmount)}
          <span className="ml-1 rounded-full bg-emerald-50 text-emerald-700 px-1.5 py-0.5 text-[10px] ring-1 ring-inset ring-emerald-600/20">
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
  );
}

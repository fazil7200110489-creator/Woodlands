"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { toCurrency } from "@/lib/pickup";
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  CheckCircle2,
  ChefHat,
  Package,
  Bell,
} from "lucide-react";
import { Order, OrderStatus } from "@/lib/types";

// ── Types ───────────────────────────────────────────────────────────────────

type Notification = {
  id: string;
  title: string;
  body: string;
  timestamp: Date;
  read: boolean;
};

// ── Sound helper ─────────────────────────────────────────────────────────────

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const notes = [523, 659, 784, 1047];
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
  } catch {}
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) setOrders(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── SSE for live metric updates ─────────────────────────────────────────
  useEffect(() => {
    let es: EventSource;
    let retryTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      es = new EventSource("/api/orders/events");

      es.addEventListener("new_order", (e) => {
        const order = JSON.parse(e.data) as Order;
        setOrders((prev) => {
          if (prev.some((o) => o._id === order._id)) return prev;
          return [order, ...prev];
        });
        const notif: Notification = {
          id: `${order._id}_${Date.now()}`,
          title: "🔔 New Order",
          body: `${order.customerName} · ${order.pickupTime} · ${toCurrency(order.totalAmount)}`,
          timestamp: new Date(),
          read: false,
        };
        setNotifications((prev) => [notif, ...prev].slice(0, 20));
        playNotificationSound();
      });

      es.addEventListener("status_change", (e) => {
        const { _id, status } = JSON.parse(e.data);
        setOrders((prev) =>
          prev.map((o) => (o._id === _id ? { ...o, status } : o))
        );
      });

      es.onerror = () => {
        es.close();
        retryTimeout = setTimeout(connect, 5000);
      };
    };

    connect();
    return () => {
      es?.close();
      clearTimeout(retryTimeout);
    };
  }, []);

  // ── Metrics ─────────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const todayKey = new Date().toDateString();
    const today = orders.filter(
      (o) => new Date(o.createdAt).toDateString() === todayKey
    );
    const revenue = today
      .filter((o) => o.status !== "Cancelled")
      .reduce((s, o) => s + o.totalAmount, 0);

    return {
      ordersToday: today.length,
      revenueToday: revenue,
      pending: today.filter((o) => o.status === "Pending").length,
      accepted: today.filter((o) => o.status === "Accepted").length,
      preparing: today.filter((o) => o.status === "Preparing").length,
      readyForPickup: today.filter((o) => o.status === "Ready for Pickup").length,
      completed: today.filter((o) => o.status === "Completed").length,
    };
  }, [orders]);

  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach((o) => {
      const d = new Date(o.createdAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      });
      map.set(d, (map.get(d) ?? 0) + o.totalAmount);
    });
    return [...map.entries()]
      .map(([date, value]) => ({ date, value }))
      .slice(-7);
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 font-display">
            Dashboard Overview
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen((v) => !v);
              setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            }}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          >
            <Bell
              size={18}
              className={unreadCount > 0 ? "text-[#BF976A]" : "text-gray-500"}
            />
            {unreadCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-800">
                Recent Notifications
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                {notifications.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-400">
                    No notifications yet.
                  </p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-900">
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">{n.body}</p>
                      <p className="mt-1 text-[10px] text-gray-400">
                        {n.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Revenue Today"
          value={toCurrency(metrics.revenueToday)}
          icon={<TrendingUp size={20} className="text-emerald-500" />}
          accent="emerald"
        />
        <MetricCard
          title="Orders Today"
          value={String(metrics.ordersToday)}
          icon={<ShoppingBag size={20} className="text-blue-500" />}
          accent="blue"
        />
        <MetricCard
          title="Pending"
          value={String(metrics.pending)}
          icon={<Clock size={20} className="text-amber-500" />}
          accent="amber"
        />
        <MetricCard
          title="Completed"
          value={String(metrics.completed)}
          icon={<CheckCircle2 size={20} className="text-emerald-500" />}
          accent="emerald"
        />
      </div>

      {/* POS status summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatusCard label="Accepted" count={metrics.accepted} icon={<CheckCircle2 size={16} className="text-blue-500" />} color="blue" />
        <StatusCard label="Preparing" count={metrics.preparing} icon={<ChefHat size={16} className="text-orange-500" />} color="orange" />
        <StatusCard label="Ready for Pickup" count={metrics.readyForPickup} icon={<Package size={16} className="text-emerald-500" />} color="emerald" />
        <StatusCard label="Completed Today" count={metrics.completed} icon={<CheckCircle2 size={16} className="text-gray-500" />} color="gray" />
      </div>

      {/* Revenue chart + Recent orders */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart */}
        <div className="col-span-2 rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="mb-4 text-lg font-medium text-gray-900">
            Revenue — Last 7 Days
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f3f4f6"
                />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip
                  cursor={{ fill: "#f9fafb" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value: any) => [`₹${value}`, "Revenue"]}
                />
                <Bar
                  dataKey="value"
                  fill="#BF976A"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent orders */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="mb-4 text-lg font-medium text-gray-900">
            Recent Activity
          </h2>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {orders.slice(0, 8).map((order) => (
              <div
                key={order._id}
                className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {order.customerName}
                  </p>
                  <p className="text-xs text-gray-500">
                    #{order._id.slice(-5)} ·{" "}
                    {new Date(order.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {toCurrency(order.totalAmount)}
                  </p>
                  <StatusPill status={order.status} />
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <p className="text-sm text-gray-500">No recent activity.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricCard({
  title,
  value,
  icon,
  accent,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1.5 text-3xl font-semibold text-gray-900">{value}</p>
        </div>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl bg-${accent}-50`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function StatusCard({
  label,
  count,
  icon,
  color,
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs font-medium text-gray-500">{label}</span>
      </div>
      <p className={`text-2xl font-bold text-${color}-600`}>{count}</p>
    </div>
  );
}

function StatusPill({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, string> = {
    Pending: "text-amber-600",
    Accepted: "text-blue-600",
    Preparing: "text-orange-600",
    "Ready for Pickup": "text-emerald-600",
    Completed: "text-gray-500",
    Cancelled: "text-red-500",
  };
  return (
    <span className={`text-xs font-medium ${map[status] ?? "text-gray-500"}`}>
      {status}
    </span>
  );
}

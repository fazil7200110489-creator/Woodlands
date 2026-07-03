"use client";

import { useMemo } from "react";
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
  Users,
  CalendarDays,
} from "lucide-react";
import { OrderStatus } from "@/lib/types";
import { usePOS } from "@/components/admin/OrderNotificationContext";

export default function DashboardPage() {
  const { orders, reservations, totalCustomers, isLoading } = usePOS();

  // ── Metrics ─────────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const todayKey = new Date().toDateString();
    
    // Filter orders for today
    const todayOrders = orders.filter(
      (o) => new Date(o.createdAt).toDateString() === todayKey
    );
    
    const revenueToday = todayOrders
      .filter((o) => o.status !== "Cancelled")
      .reduce((sum, o) => sum + o.totalAmount, 0);

    // Active status counts (all-time active or today's depending on view, let's count all active orders for POS dashboard)
    const pending = orders.filter((o) => o.status === "Pending").length;
    const accepted = orders.filter((o) => o.status === "Accepted").length;
    const preparing = orders.filter((o) => o.status === "Preparing").length;
    const readyForPickup = orders.filter((o) => o.status === "Ready for Pickup").length;
    const completedToday = todayOrders.filter((o) => o.status === "Completed").length;

    // Reservations count (today's active bookings)
    const todayDateStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const todayReservations = reservations.filter(
      (r) => r.date === todayDateStr && r.status !== "Cancelled"
    ).length;

    return {
      ordersToday: todayOrders.length,
      revenueToday,
      pending,
      accepted,
      preparing,
      readyForPickup,
      completedToday,
      totalReservations: reservations.length,
      todayReservations,
    };
  }, [orders, reservations]);

  // Chart Data: Revenue last 7 days
  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    
    // Sort orders by date ascending for the chart
    const sortedOrders = [...orders].reverse();
    
    sortedOrders.forEach((o) => {
      if (o.status === "Cancelled") return;
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

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-gray-100 rounded w-1/4 mb-2" />
        <div className="h-4 bg-gray-100 rounded w-1/3 mb-6" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 bg-white border border-gray-100 rounded-2xl p-5" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
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

      {/* Main Metric cards - 8 Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Today's Revenue"
          value={toCurrency(metrics.revenueToday)}
          icon={<TrendingUp size={20} className="text-emerald-500" />}
          accent="emerald"
          subtitle="From today's paid orders"
        />
        <MetricCard
          title="Today's Orders"
          value={String(metrics.ordersToday)}
          icon={<ShoppingBag size={20} className="text-blue-500" />}
          accent="blue"
          subtitle="Placed by takeaway customers"
        />
        <MetricCard
          title="Pending Orders"
          value={String(metrics.pending)}
          icon={<Clock size={20} className="text-amber-500" />}
          accent="amber"
          subtitle="Awaiting staff acceptance"
        />
        <MetricCard
          title="Completed Today"
          value={String(metrics.completedToday)}
          icon={<CheckCircle2 size={20} className="text-gray-500" />}
          accent="gray"
          subtitle="Picked up by customers"
        />
        <MetricCard
          title="Preparing"
          value={String(metrics.preparing)}
          icon={<ChefHat size={20} className="text-orange-500" />}
          accent="orange"
          subtitle="Currently inside the kitchen"
        />
        <MetricCard
          title="Ready for Pickup"
          value={String(metrics.readyForPickup)}
          icon={<Package size={20} className="text-[#BF976A]" />}
          accent="amber"
          subtitle="Packaged and on the counter"
        />
        <MetricCard
          title="New Customers"
          value={String(totalCustomers)}
          icon={<Users size={20} className="text-indigo-500" />}
          accent="indigo"
          subtitle="Registered customer profiles"
        />
        <MetricCard
          title="Reservations"
          value={String(metrics.todayReservations)}
          icon={<CalendarDays size={20} className="text-pink-500" />}
          accent="pink"
          subtitle={`${metrics.totalReservations} total bookings log`}
        />
      </div>

      {/* Revenue chart + Recent orders */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart */}
        <div className="col-span-2 rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="mb-4 text-lg font-medium text-gray-900">
            Revenue — Last 7 Days
          </h2>
          <div className="h-64">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                No orders record found to display.
              </div>
            ) : (
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
            )}
          </div>
        </div>

        {/* Recent activity list */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="mb-4 text-lg font-medium text-gray-900">
            Recent Activity
          </h2>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
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
                    #{order._id.slice(-5).toUpperCase()} ·{" "}
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
              <p className="text-sm text-gray-500 text-center py-10">No recent activity.</p>
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
  subtitle,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 transition-shadow hover:shadow-md flex flex-col justify-between h-28">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-${accent}-50`}
          style={{
            backgroundColor: 
              accent === "emerald" ? "rgba(16, 185, 129, 0.1)" :
              accent === "blue" ? "rgba(59, 130, 246, 0.1)" :
              accent === "amber" ? "rgba(245, 158, 11, 0.1)" :
              accent === "orange" ? "rgba(249, 115, 22, 0.1)" :
              accent === "indigo" ? "rgba(99, 102, 241, 0.1)" :
              accent === "pink" ? "rgba(236, 72, 153, 0.1)" :
              "rgba(107, 114, 128, 0.1)"
          }}
        >
          {icon}
        </div>
      </div>
      {subtitle && (
        <span className="text-[10px] text-gray-400 font-medium truncate mt-1">
          {subtitle}
        </span>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, string> = {
    Pending: "text-amber-600 bg-amber-50 ring-amber-600/10",
    Accepted: "text-blue-600 bg-blue-50 ring-blue-600/10",
    Preparing: "text-orange-600 bg-orange-50 ring-orange-600/10",
    "Ready for Pickup": "text-emerald-600 bg-emerald-50 ring-emerald-600/10",
    Completed: "text-gray-500 bg-gray-50 ring-gray-500/10",
    Cancelled: "text-red-500 bg-red-50 ring-red-500/10",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${map[status] ?? "text-gray-500 bg-gray-50 ring-gray-500/10"}`}>
      {status}
    </span>
  );
}

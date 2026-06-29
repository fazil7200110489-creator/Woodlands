"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  TrendingUp,
  RotateCw,
  ShoppingBag,
  Calendar,
  DollarSign,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  Clock,
  Award,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { toCurrency } from "@/lib/pickup";

const COLORS = ["#BF976A", "#1D0F07", "#8B7355", "#E8D8C8", "#9ca3af"];

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("daily"); // daily, weekly, monthly, yearly

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/analytics");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Real-time SSE updates
  useEffect(() => {
    let es: EventSource;
    let retryTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      es = new EventSource("/api/orders/events");

      es.addEventListener("analytics_refresh", () => {
        fetchAnalytics();
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
  }, [fetchAnalytics]);

  const handleExportCSV = () => {
    window.open(`/api/admin/reports?range=${range}&format=csv`, "_blank");
  };

  const handlePrintPDF = () => {
    window.open(`/api/admin/reports?range=${range}&format=pdf`, "_blank");
  };

  // Pie chart counts
  const orderPieData = useMemo(() => {
    if (!data?.orders) return [];
    return [
      { name: "Pending", value: data.orders.pending },
      { name: "Completed", value: data.orders.completed },
      { name: "Cancelled", value: data.orders.cancelled },
    ].filter((x) => x.value > 0);
  }, [data]);

  if (loading && !data) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#BF976A] border-t-transparent" />
        <p className="text-sm text-gray-500 font-serif">Aggregating business intelligence metrics…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 font-display">Business Intelligence Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Real-time sales, order summaries, reservation metrics, and item trends.
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-1.5 text-xs text-[#9B7340] border border-[#BF976A]/30 bg-white hover:bg-gray-50 rounded-xl px-4 py-2.5 transition-colors font-mono-num font-semibold uppercase tracking-wider"
        >
          <RotateCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh Charts
        </button>
      </div>

      {/* Reports Export Generator */}
      <div className="rounded-2xl bg-white p-5 border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">Downloadable Financial Reports</h3>
          <p className="text-xs text-gray-400 font-serif mt-0.5">
            Select a target timeframe to generate printable statements and spreadsheets.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="rounded-xl border border-gray-200 py-2 px-3 text-xs bg-white focus:border-[#BF976A] focus:outline-none focus:ring-1 focus:ring-[#BF976A]"
          >
            <option value="daily">Today's Transactions</option>
            <option value="weekly">Weekly Summary</option>
            <option value="monthly">Monthly Statement</option>
            <option value="yearly">Yearly Breakdown</option>
          </select>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider text-gray-500 transition-colors"
          >
            <FileSpreadsheet size={13} className="text-emerald-600" />
            Excel/CSV
          </button>
          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-1.5 rounded-xl border border-[#BF976A]/30 hover:bg-gray-50 px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider text-[#9B7340] transition-colors"
          >
            <Printer size={13} />
            Print PDF
          </button>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Revenue Today"
          value={toCurrency(data.revenue.today)}
          icon={<TrendingUp size={20} className="text-[#BF976A]" />}
        />
        <MetricCard
          title="Weekly Revenue"
          value={toCurrency(data.revenue.weekly)}
          icon={<DollarSign size={20} className="text-emerald-500" />}
        />
        <MetricCard
          title="Monthly Revenue"
          value={toCurrency(data.revenue.monthly)}
          icon={<DollarSign size={20} className="text-blue-500" />}
        />
        <MetricCard
          title="Average Order Value"
          value={toCurrency(data.averages.aov)}
          icon={<ShoppingBag size={20} className="text-purple-500" />}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Daily Sales Chart */}
        <div className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Daily Order Sales Trend (Last 30 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.charts.dailySales} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#BF976A" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#BF976A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                <Tooltip cursor={{ fill: "#f9fafb" }} contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} formatter={(val: any) => [`₹${val}`, "Revenue"]} />
                <Area type="monotone" dataKey="value" stroke="#BF976A" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 flex flex-col">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Order Status Distribution</h3>
          <div className="flex-1 h-44 min-h-[176px]">
            {orderPieData.length === 0 ? (
              <p className="text-center text-xs text-gray-400 mt-16 font-serif">No order data available.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={orderPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                    {orderPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, "Count"]} />
                  <Legend verticalAlign="bottom" height={36} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Category Revenue Breakdown */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 flex flex-col">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Revenue by Food Category</h3>
          <div className="flex-1 h-44 min-h-[176px]">
            {data.categoryRevenue.length === 0 ? (
              <p className="text-center text-xs text-gray-400 mt-16 font-serif">No category revenue available.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.categoryRevenue} cx="50%" cy="50%" outerRadius={70} dataKey="value">
                    {data.categoryRevenue.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`₹${value}`, "Revenue"]} />
                  <Legend verticalAlign="bottom" height={36} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Hourly Heatmap Trend */}
        <div className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Order Frequency by Peak Hours</h3>
          <div className="h-44 min-h-[176px]">
            {data.hourlyOrders.length === 0 ? (
              <p className="text-center text-xs text-gray-400 mt-16 font-serif">No hourly sales logs.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.hourlyOrders} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="hour" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: "#f9fafb" }} />
                  <Bar dataKey="count" fill="#1D0F07" radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Top / Least Items Tables */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top items */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Award className="text-[#BF976A]" size={18} />
            <h3 className="text-sm font-semibold text-gray-900">Top 5 Best-Selling Menu Items</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-mono text-[9px] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2.5">Menu Item</th>
                  <th className="px-4 py-2.5">Quantity Sold</th>
                  <th className="px-4 py-2.5">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {data.items.topSelling.map((it: any) => (
                  <tr key={it.name} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{it.name}</td>
                    <td className="px-4 py-3 font-mono-num font-semibold text-gray-700">{it.qty}</td>
                    <td className="px-4 py-3 font-mono-num font-bold text-emerald-600">{toCurrency(it.revenue)}</td>
                  </tr>
                ))}
                {data.items.topSelling.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-gray-400 italic">No sales logs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Least items */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="text-amber-500" size={18} />
            <h3 className="text-sm font-semibold text-gray-900">Least-Selling Menu Items</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-mono text-[9px] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2.5">Menu Item</th>
                  <th className="px-4 py-2.5">Quantity Sold</th>
                  <th className="px-4 py-2.5">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {data.items.leastSelling.map((it: any) => (
                  <tr key={it.name} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{it.name}</td>
                    <td className="px-4 py-3 font-mono-num font-semibold text-gray-700">{it.qty}</td>
                    <td className="px-4 py-3 font-mono-num font-bold text-emerald-600">{toCurrency(it.revenue)}</td>
                  </tr>
                ))}
                {data.items.leastSelling.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-gray-400 italic">No sales logs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1.5 text-2xl font-bold text-gray-900 font-display">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-50">{icon}</div>
      </div>
    </div>
  );
}

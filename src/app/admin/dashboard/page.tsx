"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { toCurrency } from "@/lib/pickup";
import { ArrowUpRight, TrendingUp, Users, ShoppingBag } from "lucide-react";

type Order = {
  _id: string;
  createdAt: string;
  totalAmount: number;
  status: "Pending" | "Completed" | "Cancelled";
};

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  const load = async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        setOrders(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };
  
  useEffect(() => { load(); }, []);

  const metrics = useMemo(() => {
    const todayKey = new Date().toDateString();
    const today = orders.filter((o) => new Date(o.createdAt).toDateString() === todayKey);
    const revenue = today.filter((o) => o.status !== "Cancelled").reduce((s, o) => s + o.totalAmount, 0);
    return {
      ordersToday: today.length,
      revenueToday: revenue,
      pending: today.filter((o) => o.status === "Pending").length,
      completed: today.filter((o) => o.status === "Completed").length,
    };
  }, [orders]);

  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach((o) => {
      const d = new Date(o.createdAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short' });
      map.set(d, (map.get(d) ?? 0) + o.totalAmount);
    });
    // Keep last 7 days
    return [...map.entries()].map(([date, value]) => ({ date, value })).slice(-7);
  }, [orders]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 font-display">Dashboard Overview</h1>
        <div className="text-sm text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Revenue Today" 
          value={toCurrency(metrics.revenueToday)} 
          icon={<TrendingUp className="text-emerald-500" />} 
          trend="+12%" 
        />
        <MetricCard 
          title="Orders Today" 
          value={String(metrics.ordersToday)} 
          icon={<ShoppingBag className="text-blue-500" />} 
          trend="+5%" 
        />
        <MetricCard 
          title="Pending Orders" 
          value={String(metrics.pending)} 
          icon={<Users className="text-amber-500" />} 
          trend={null}
        />
        <MetricCard 
          title="Completed" 
          value={String(metrics.completed)} 
          icon={<ArrowUpRight className="text-emerald-500" />} 
          trend="+8%" 
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="col-span-2 rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="mb-4 text-lg font-medium text-gray-900">Revenue Overview (Last 7 Days)</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }} 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`₹${value}`, 'Revenue']}
                />
                <Bar dataKey="value" fill="#BF976A" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="mb-4 text-lg font-medium text-gray-900">Recent Activity</h2>
          <div className="space-y-4">
            {orders.slice(0, 5).map((order) => (
              <div key={order._id} className="flex items-center justify-between border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">Order #{order._id.slice(-5)}</p>
                  <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{toCurrency(order.totalAmount)}</p>
                  <p className={`text-xs font-medium ${
                    order.status === 'Completed' ? 'text-emerald-500' :
                    order.status === 'Pending' ? 'text-amber-500' : 'text-red-500'
                  }`}>
                    {order.status}
                  </p>
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

function MetricCard({ title, value, icon, trend }: { title: string; value: string; icon: React.ReactNode; trend: string | null }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <span className="font-medium text-emerald-500">{trend}</span>
          <span className="ml-2 text-gray-500">vs last week</span>
        </div>
      )}
    </div>
  );
}

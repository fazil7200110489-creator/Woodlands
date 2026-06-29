"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  Search,
  TrendingUp,
  RotateCw,
  ShoppingBag,
  Calendar,
  DollarSign,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toCurrency } from "@/lib/pickup";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalSpent: 0,
    averageSpend: 0,
    repeatPercentage: 0,
  });
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("recent"); // spend, orders, recent
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/customers?search=${encodeURIComponent(search)}&sortBy=${sortBy}&page=${page}&limit=10`
      );
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
        setStats(data.stats || { totalCustomers: 0, totalSpent: 0, averageSpend: 0, repeatPercentage: 0 });
        setTotalPages(data.pagination?.pages || 1);
      }
    } catch (e) {
      console.error("Failed to load customers:", e);
    } finally {
      setLoading(false);
    }
  }, [search, sortBy, page]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Connect Server-Sent Events to refresh automatically in real-time
  useEffect(() => {
    let es: EventSource;
    let retryTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      es = new EventSource("/api/orders/events");

      es.addEventListener("customer_update", () => {
        fetchCustomers();
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
  }, [fetchCustomers]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 font-display">Customers Database</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage customer profiles, preferences, and transaction details.
          </p>
        </div>
        <button
          onClick={fetchCustomers}
          className="flex items-center gap-1.5 text-xs text-[#9B7340] border border-[#BF976A]/30 bg-white hover:bg-gray-50 rounded-xl px-4 py-2.5 transition-colors font-mono-num font-semibold uppercase tracking-wider"
        >
          <RotateCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Customers"
          value={String(stats.totalCustomers)}
          icon={<Users size={20} className="text-[#BF976A]" />}
        />
        <MetricCard
          title="Total Spent"
          value={toCurrency(stats.totalSpent)}
          icon={<TrendingUp size={20} className="text-emerald-500" />}
        />
        <MetricCard
          title="Average Spend / Customer"
          value={toCurrency(stats.averageSpend)}
          icon={<DollarSign size={20} className="text-blue-500" />}
        />
        <MetricCard
          title="Repeat Customers"
          value={`${stats.repeatPercentage}%`}
          icon={<RotateCw size={20} className="text-purple-500" />}
        />
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by name, phone or email…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm bg-white focus:border-[#BF976A] focus:outline-none focus:ring-2 focus:ring-[#BF976A]/10"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-gray-200 py-2.5 px-3 text-xs bg-white focus:border-[#BF976A] focus:outline-none focus:ring-1 focus:ring-[#BF976A]"
          >
            <option value="recent">Recent Signups</option>
            <option value="spend">Highest Spending</option>
            <option value="orders">Most Orders</option>
          </select>
        </div>
      </div>

      {/* Customer List Card */}
      <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-mono text-[10px] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Customer Details</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Orders</th>
                <th className="px-6 py-4">Bookings</th>
                <th className="px-6 py-4">Total Spent</th>
                <th className="px-6 py-4">Avg Order Value</th>
                <th className="px-6 py-4">Favorites</th>
                <th className="px-6 py-4">Preferred Table</th>
                <th className="px-6 py-4">Customer Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={9} className="px-6 py-6">
                      <div className="h-4 bg-gray-100 rounded w-1/3 mb-2" />
                      <div className="h-3 bg-gray-100 rounded w-1/4" />
                    </td>
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                    No customers found matching the search criteria.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{c.name}</div>
                      <div className="text-xs text-gray-500 font-mono-num">{c.phone}</div>
                      {c.email && <div className="text-xs text-gray-400">{c.email}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${
                          c.status === "Active"
                            ? "bg-green-50 text-green-700 ring-green-600/20"
                            : "bg-gray-50 text-gray-600 ring-gray-500/10"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono-num font-semibold text-gray-900 flex items-center gap-1 mt-1.5">
                      <ShoppingBag size={12} className="text-gray-400" />
                      {c.totalOrders}
                    </td>
                    <td className="px-6 py-4 font-mono-num font-semibold text-gray-900">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="text-gray-400" />
                        {c.totalReservations}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono-num font-bold text-emerald-600">
                      {toCurrency(c.totalAmountSpent)}
                    </td>
                    <td className="px-6 py-4 font-mono-num text-gray-600">
                      {toCurrency(Math.round(c.avgOrderValue))}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {c.favoriteItems?.length > 0 ? (
                          c.favoriteItems.map((f: string) => (
                            <span
                              key={f}
                              className="inline-block bg-[#BF976A]/5 border border-[#BF976A]/15 text-[#9B7340] px-1.5 py-0.5 rounded text-[9px] font-serif"
                            >
                              {f}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">None</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-gray-900 font-mono-num">
                      {c.preferredTable ? `T${c.preferredTable}` : "—"}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 bg-white px-6 py-4">
            <span className="text-xs text-gray-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
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

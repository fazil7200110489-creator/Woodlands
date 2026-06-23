"use client";

import { useEffect, useState } from "react";
import { Search, Calendar as CalendarIcon, Filter, CheckCircle, XCircle, Clock } from "lucide-react";
import { Reservation } from "@/lib/types";

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");

  const load = async () => {
    try {
      const res = await fetch("/api/reservations");
      if (res.ok) setReservations(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { load(); }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await fetch(`/api/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      load();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredReservations = reservations.filter(r => {
    const matchSearch = r.customerName.toLowerCase().includes(search.toLowerCase()) || 
                        r.referenceId.toLowerCase().includes(search.toLowerCase()) ||
                        r.customerPhone.includes(search);
    const matchStatus = statusFilter === "All" || r.status === statusFilter;
    const matchDate = !dateFilter || r.date === dateFilter;
    return matchSearch && matchStatus && matchDate;
  });

  // Statistics
  const today = new Date().toISOString().split("T")[0];
  const todayReservations = reservations.filter(r => r.date === today);
  const pendingCount = reservations.filter(r => r.status === "Pending").length;
  const confirmedToday = todayReservations.filter(r => r.status === "Confirmed").length;
  const todayGuests = todayReservations.reduce((sum, r) => r.status !== 'Cancelled' ? sum + r.guests : sum, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900 font-display">Table Reservations</h1>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Today's Guests", value: todayGuests, icon: CalendarIcon, color: "text-[#BF976A]" },
          { label: "Pending Requests", value: pendingCount, icon: Clock, color: "text-amber-500" },
          { label: "Confirmed Today", value: confirmedToday, icon: CheckCircle, color: "text-emerald-500" },
          { label: "Total Reservations", value: reservations.length, icon: Filter, color: "text-blue-500" }
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
              <p className="text-2xl font-display text-gray-900">{stat.value}</p>
            </div>
            <div className={`h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center ${stat.color}`}>
              <stat.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by name, ID or phone..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-4 text-sm focus:border-[#BF976A] focus:outline-none focus:ring-1 focus:ring-[#BF976A]"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <input 
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 focus:border-[#BF976A] focus:outline-none"
            />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 focus:border-[#BF976A] focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left text-sm">
            <thead className="bg-white text-gray-500">
              <tr>
                <th className="px-6 py-4 font-medium">Guest & Ref</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Date & Time</th>
                <th className="px-6 py-4 font-medium">Details</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredReservations.map((r) => (
                <tr key={r._id || r.referenceId} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{r.customerName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{r.referenceId}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-900">{r.customerPhone}</p>
                    {r.customerEmail && <p className="text-xs text-gray-500 mt-0.5">{r.customerEmail}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{r.date}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{r.timeSlot}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                        {r.guests} Guests
                      </span>
                      {r.specialOccasion !== "None" && (
                        <span className="inline-flex items-center justify-center bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">
                          {r.specialOccasion}
                        </span>
                      )}
                    </div>
                    {r.specialInstructions && (
                      <p className="text-xs text-gray-500 mt-1.5 max-w-[200px] truncate" title={r.specialInstructions}>
                        Note: {r.specialInstructions}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                      r.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' :
                      r.status === 'Pending' ? 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20' :
                      r.status === 'Completed' ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20' :
                      'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {r.status === 'Pending' && (
                        <>
                          <button onClick={() => handleUpdateStatus(r._id!, 'Confirmed')} className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50" title="Confirm">
                            <CheckCircle size={18} />
                          </button>
                          <button onClick={() => handleUpdateStatus(r._id!, 'Cancelled')} className="p-1.5 rounded-md text-red-600 hover:bg-red-50" title="Cancel">
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                      {r.status === 'Confirmed' && (
                        <button onClick={() => handleUpdateStatus(r._id!, 'Completed')} className="text-xs px-3 py-1.5 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                          Mark Completed
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredReservations.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No reservations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

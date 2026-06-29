"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Calendar as CalendarIcon,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Hash,
  Copy,
  Check,
  DollarSign,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { Reservation } from "@/lib/types";
import { RESTAURANT_TABLES } from "@/lib/tableConfig";

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("All");
  const [refundStatusFilter, setRefundStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [tableFilter, setTableFilter] = useState("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal / Cancel states
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [policyRefundAmount, setPolicyRefundAmount] = useState<number>(0);
  const [policyReason, setPolicyReason] = useState<string>("");
  const [customRefundAmount, setCustomRefundAmount] = useState<string>("");
  const [overrideRefund, setOverrideRefund] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/reservations");
      if (res.ok) setReservations(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await fetch(`/api/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      load();
    } catch (e) {
      console.error(e);
    }
  };

  const openCancelModal = async (reservation: Reservation) => {
    setCancelTarget(reservation);
    setPreviewLoading(true);
    setActionError(null);
    setOverrideRefund(false);
    setCustomRefundAmount("");
    setPolicyRefundAmount(0);
    setPolicyReason("");

    try {
      const res = await fetch("/api/reservations/refund-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referenceId: reservation.referenceId,
          customerPhone: reservation.customerPhone,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPolicyRefundAmount(data.refundAmount);
        setPolicyReason(data.reason);
        setCustomRefundAmount(String(data.refundAmount));
      } else {
        setActionError(data.error || "Could not retrieve cancellation preview.");
      }
    } catch (err: any) {
      setActionError("Failed to fetch refund preview.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleAdminCancel = async () => {
    if (!cancelTarget) return;
    setCancelLoading(true);
    setActionError(null);

    const finalRefund = overrideRefund ? Number(customRefundAmount) : policyRefundAmount;

    try {
      const res = await fetch("/api/reservations/admin-cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId: cancelTarget._id,
          refundAmount: finalRefund,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process cancellation.");
      }

      setCancelTarget(null);
      load();
    } catch (err: any) {
      setActionError(err.message || "An error occurred.");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const filteredReservations = reservations.filter((r) => {
    const matchSearch =
      r.customerName.toLowerCase().includes(search.toLowerCase()) ||
      r.referenceId.toLowerCase().includes(search.toLowerCase()) ||
      r.customerPhone.includes(search);
    
    const matchStatus = statusFilter === "All" || r.status === statusFilter;
    
    const matchPayment =
      paymentStatusFilter === "All" ||
      (paymentStatusFilter === "Unpaid" && (!r.paymentStatus || r.paymentStatus === "Pending")) ||
      r.paymentStatus === paymentStatusFilter;

    const matchRefund =
      refundStatusFilter === "All" ||
      (refundStatusFilter === "None" && (!r.refundStatus || r.refundStatus === "None")) ||
      r.refundStatus === refundStatusFilter;

    const matchDate = !dateFilter || r.date === dateFilter;
    const matchTable =
      tableFilter === "All" || (r.tableNumber != null && String(r.tableNumber) === tableFilter);

    return matchSearch && matchStatus && matchPayment && matchRefund && matchDate && matchTable;
  });

  // Statistics
  const today = new Date().toISOString().split("T")[0];
  const todayReservations = reservations.filter((r) => r.date === today);
  const pendingCount = reservations.filter((r) => r.status === "Pending").length;
  const confirmedToday = todayReservations.filter((r) => r.status === "Confirmed").length;
  const todayGuests = todayReservations.reduce(
    (sum, r) => (r.status !== "Cancelled" ? sum + r.guests : sum),
    0
  );
  const tablesOccupiedToday = new Set(
    todayReservations
      .filter((r) => r.tableNumber != null && r.status !== "Cancelled")
      .map((r) => r.tableNumber)
  ).size;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900 font-display">Table Reservations</h1>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Today's Guests", value: todayGuests, icon: CalendarIcon, color: "text-[#BF976A]" },
          { label: "Pending Requests", value: pendingCount, icon: Clock, color: "text-amber-500" },
          { label: "Confirmed Today", value: confirmedToday, icon: CheckCircle, color: "text-emerald-500" },
          { label: "Tables Occupied", value: `${tablesOccupiedToday}/${RESTAURANT_TABLES.length}`, icon: Hash, color: "text-indigo-500" },
          { label: "Total Reservations", value: reservations.length, icon: Filter, color: "text-blue-500" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 flex items-center justify-between"
          >
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
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
            {/* Search */}
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search by name, ID or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-4 text-sm focus:border-[#BF976A] focus:outline-none focus:ring-1 focus:ring-[#BF976A]"
              />
            </div>

            {/* Layout Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 focus:border-[#BF976A] focus:outline-none w-full"
              />
              <select
                value={tableFilter}
                onChange={(e) => setTableFilter(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 focus:border-[#BF976A] focus:outline-none w-full"
              >
                <option value="All">All Tables</option>
                {RESTAURANT_TABLES.map((t) => (
                  <option key={t.id} value={String(t.id)}>
                    {t.label} — {t.zone}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 focus:border-[#BF976A] focus:outline-none w-full"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Payment & Refund Filters */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1 border-t border-gray-100/50">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-medium font-mono uppercase tracking-wider">Payment:</span>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-600 focus:border-[#BF976A] focus:outline-none"
              >
                <option value="All">All Payments</option>
                <option value="Paid">Paid</option>
                <option value="Refunded">Refunded</option>
                <option value="Partially Refunded">Partially Refunded</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-medium font-mono uppercase tracking-wider">Refund:</span>
              <select
                value={refundStatusFilter}
                onChange={(e) => setRefundStatusFilter(e.target.value)}
                className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-600 focus:border-[#BF976A] focus:outline-none"
              >
                <option value="All">All Refunds</option>
                <option value="None">None</option>
                <option value="Processing">Processing</option>
                <option value="Processed">Processed</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left text-sm">
            <thead className="bg-white text-gray-500">
              <tr>
                <th className="px-6 py-4 font-medium">Guest & Ref</th>
                <th className="px-6 py-4 font-medium">Table</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Date & Time</th>
                <th className="px-6 py-4 font-medium">Details</th>
                <th className="px-6 py-4 font-medium">Payment</th>
                <th className="px-6 py-4 font-medium">Refund</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredReservations.map((r) => (
                <tr key={r._id || r.referenceId} className="hover:bg-gray-50/50 transition-colors">
                  {/* Name & Reference */}
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{r.customerName}</p>
                    <p className="text-xs text-gray-500 mt-0.5 font-mono uppercase tracking-wider">{r.referenceId}</p>
                  </td>

                  {/* Table */}
                  <td className="px-6 py-4">
                    {r.tableNumber ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#BF976A]/10 px-2.5 py-1 text-xs font-medium text-[#9B7340]">
                        <Hash size={12} />
                        T{r.tableNumber}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>

                  {/* Contact */}
                  <td className="px-6 py-4">
                    <p className="text-gray-900">{r.customerPhone}</p>
                    {r.customerEmail && <p className="text-xs text-gray-500 mt-0.5">{r.customerEmail}</p>}
                  </td>

                  {/* Date & Time */}
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{r.date}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{r.timeSlot}</p>
                  </td>

                  {/* Details */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                        {r.guests} Guests
                      </span>
                      {r.specialOccasion && r.specialOccasion !== "None" && (
                        <span className="inline-flex items-center justify-center bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">
                          {r.specialOccasion}
                        </span>
                      )}
                    </div>
                    {r.specialInstructions && (
                      <p
                        className="text-xs text-gray-500 mt-1.5 max-w-[200px] truncate"
                        title={r.specialInstructions}
                      >
                        Note: {r.specialInstructions}
                      </p>
                    )}
                  </td>

                  {/* Payment */}
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${
                            r.paymentStatus === "Paid"
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : r.paymentStatus === "Refunded"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : r.paymentStatus === "Partially Refunded"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-gray-50 text-gray-500 border border-gray-200"
                          }`}
                        >
                          {r.paymentStatus || "Unpaid"}
                        </span>
                        {r.paymentAmount !== undefined && (
                          <span className="text-xs font-medium text-gray-900">
                            ₹{r.paymentAmount}
                          </span>
                        )}
                      </div>
                      {r.razorpayPaymentId && (
                        <div className="flex items-center gap-1 text-[11px] text-gray-400">
                          <span className="font-mono truncate max-w-[90px]" title={r.razorpayPaymentId}>
                            {r.razorpayPaymentId}
                          </span>
                          <button
                            onClick={() => handleCopy(r.razorpayPaymentId!, `${r._id}-pay`)}
                            className="text-gray-400 hover:text-[#BF976A] transition-colors"
                            title="Copy Payment ID"
                          >
                            {copiedId === `${r._id}-pay` ? <Check size={10} className="text-green-600" /> : <Copy size={10} />}
                          </button>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Refund */}
                  <td className="px-6 py-4">
                    {r.refundId || (r.refundStatus && r.refundStatus !== "None") ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${
                              r.refundStatus === "Processed"
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : r.refundStatus === "Processing"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                          >
                            {r.refundStatus}
                          </span>
                          {r.refundAmount !== undefined && (
                            <span className="text-xs font-medium text-gray-900">
                              -₹{r.refundAmount}
                            </span>
                          )}
                        </div>
                        {r.refundId && (
                          <div className="flex items-center gap-1 text-[11px] text-gray-400">
                            <span className="font-mono truncate max-w-[90px]" title={r.refundId}>
                              {r.refundId}
                            </span>
                            <button
                              onClick={() => handleCopy(r.refundId!, `${r._id}-ref`)}
                              className="text-gray-400 hover:text-[#BF976A] transition-colors"
                              title="Copy Refund ID"
                            >
                              {copiedId === `${r._id}-ref` ? <Check size={10} className="text-green-600" /> : <Copy size={10} />}
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                        r.status === "Confirmed"
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                          : r.status === "Pending"
                          ? "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20"
                          : r.status === "Completed"
                          ? "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20"
                          : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {r.status === "Pending" && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(r._id!, "Confirmed")}
                            className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50"
                            title="Confirm"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            onClick={() => openCancelModal(r)}
                            className="p-1.5 rounded-md text-red-600 hover:bg-red-50"
                            title="Cancel & Refund"
                          >
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                      {r.status === "Confirmed" && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(r._id!, "Completed")}
                            className="text-xs px-3 py-1.5 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                          >
                            Mark Completed
                          </button>
                          <button
                            onClick={() => openCancelModal(r)}
                            className="p-1.5 rounded-md text-red-600 hover:bg-red-50"
                            title="Cancel & Refund"
                          >
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredReservations.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    No reservations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Cancel & Refund Override Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1D0F07]/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3 mb-4">
              <h2 className="text-lg font-bold text-gray-900">Cancel Reservation & Process Refund</h2>
              <button
                onClick={() => setCancelTarget(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {previewLoading ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-2">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#BF976A] border-t-transparent" />
                <p className="text-xs text-gray-500">Retrieving refund policies...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {actionError && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                    <AlertTriangle className="shrink-0 text-red-500" size={14} />
                    <span>{actionError}</span>
                  </div>
                )}

                {/* Target Reservation Details */}
                <div className="rounded-xl bg-gray-50 p-4 space-y-2 text-xs text-gray-700">
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Guest Name:</span>
                    <span className="font-semibold text-gray-900">{cancelTarget.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Reference ID:</span>
                    <span className="font-mono text-gray-900 uppercase font-semibold">
                      {cancelTarget.referenceId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Table Slot:</span>
                    <span className="font-semibold text-gray-900">
                      T{cancelTarget.tableNumber} ({cancelTarget.date} at {cancelTarget.timeSlot})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Amount Paid:</span>
                    <span className="font-semibold text-gray-900">₹{cancelTarget.paymentAmount || 0}</span>
                  </div>
                </div>

                {/* Refund Policy Information */}
                <div className="rounded-xl bg-[#BF976A]/5 border border-[#BF976A]/20 p-4 space-y-1.5 text-xs text-[#5C4A38]">
                  <p className="font-bold text-[#9B7340] uppercase tracking-wider text-[10px]">
                    Refund Policy Recommendation
                  </p>
                  <p className="font-serif leading-relaxed">
                    {policyReason || "No policy data found."}
                  </p>
                  <p className="text-[11px] font-medium text-[#1D0F07]">
                    Calculated Refund Amount: <span className="font-semibold text-emerald-600">₹{policyRefundAmount}</span>
                  </p>
                </div>

                {/* Override Checkbox */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="override"
                    checked={overrideRefund}
                    onChange={(e) => {
                      setOverrideRefund(e.target.checked);
                      if (!e.target.checked) {
                        setCustomRefundAmount(String(policyRefundAmount));
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-[#BF976A] focus:ring-[#BF976A]"
                  />
                  <label htmlFor="override" className="text-xs font-semibold text-gray-700 cursor-pointer">
                    Manual override refund amount
                  </label>
                </div>

                {/* Custom Refund Amount Input */}
                {overrideRefund && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Override Refund Amount (₹)
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                        <DollarSign size={14} />
                      </div>
                      <input
                        type="number"
                        placeholder="e.g. 100"
                        value={customRefundAmount}
                        onChange={(e) => setCustomRefundAmount(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 py-2 pl-8 pr-4 text-sm focus:border-[#BF976A] focus:outline-none"
                        max={cancelTarget.paymentAmount || 0}
                        min={0}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400">
                      Cannot exceed paid amount of ₹{cancelTarget.paymentAmount || 0}.
                    </p>
                  </div>
                )}

                {/* Warning message */}
                <p className="text-[11px] text-amber-600 font-medium leading-relaxed">
                  ⚠️ Warning: Cancellation cannot be undone. If refund amount is greater than zero, a Razorpay refund of ₹{overrideRefund ? customRefundAmount : policyRefundAmount} will be immediately initiated.
                </p>

                {/* Action buttons */}
                <div className="flex gap-3 justify-end pt-3 border-t border-gray-100">
                  <button
                    onClick={() => setCancelTarget(null)}
                    disabled={cancelLoading}
                    className="px-4 py-2 rounded-lg text-xs font-mono font-semibold uppercase tracking-wider text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleAdminCancel}
                    disabled={
                      cancelLoading ||
                      (overrideRefund &&
                        (isNaN(Number(customRefundAmount)) ||
                          Number(customRefundAmount) < 0 ||
                          Number(customRefundAmount) > (cancelTarget.paymentAmount || 0)))
                    }
                    className="px-4 py-2 rounded-lg text-xs font-mono font-semibold uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {cancelLoading ? "Processing..." : "Confirm & Refund"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

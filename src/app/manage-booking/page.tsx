"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Users,
  Mail,
  Phone,
  User,
  ArrowLeft,
  Search,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  XCircle,
  ArrowRight,
  Receipt,
  UtensilsCrossed,
} from "lucide-react";
import MagneticButton from "@/components/MagneticButton";
import { RESTAURANT_TABLES } from "@/lib/tableConfig";

const ease = [0.16, 1, 0.3, 1] as const;

function ManageBookingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [referenceId, setReferenceId] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reservation, setReservation] = useState<any | null>(null);
  
  // Refund / Cancel steps
  const [previewLoading, setPreviewLoading] = useState(false);
  const [refundPreview, setRefundPreview] = useState<any | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState<any | null>(null);

  // Auto-fill from query parameters if present
  useEffect(() => {
    const refParam = searchParams.get("ref");
    if (refParam) {
      setReferenceId(refParam);
    }
  }, [searchParams]);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceId.trim() || !customerPhone.trim()) {
      setError("Please fill in both the Booking Reference and Phone Number.");
      return;
    }

    setLoading(true);
    setError(null);
    setReservation(null);
    setCancelSuccess(null);
    setShowCancelConfirm(false);
    setRefundPreview(null);

    try {
      const res = await fetch("/api/reservations/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referenceId: referenceId.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Verification failed. Please check your details.");
      }

      setReservation(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefundPreview = async () => {
    setPreviewLoading(true);
    setError(null);
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
      if (!res.ok) {
        throw new Error(data.error || "Could not retrieve cancellation preview.");
      }

      setRefundPreview(data);
      setShowCancelConfirm(true);
    } catch (err: any) {
      setError(err.message || "Unable to load refund details.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    setCancelLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reservations/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referenceId: reservation.referenceId,
          customerPhone: reservation.customerPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel reservation.");
      }

      setCancelSuccess(data);
      setShowCancelConfirm(false);
      
      // Update local reservation state status to Cancelled
      setReservation((prev: any) => ({
        ...prev,
        status: "Cancelled",
        paymentStatus: data.refundAmount >= (prev.paymentAmount || 0) ? "Refunded" : (data.refundAmount > 0 ? "Partially Refunded" : prev.paymentStatus),
        refundId: data.refundId || undefined,
        refundAmount: data.refundAmount,
        refundStatus: data.refundStatus,
      }));
    } catch (err: any) {
      setError(err.message || "Could not process cancellation. Please try again.");
    } finally {
      setCancelLoading(false);
    }
  };

  const getTableLabel = (tableNum: number) => {
    const table = RESTAURANT_TABLES.find((t) => t.id === tableNum);
    return table ? table.label : `Table ${tableNum}`;
  };

  const getTableZone = (tableNum: number) => {
    const table = RESTAURANT_TABLES.find((t) => t.id === tableNum);
    return table ? table.zone : "";
  };

  const handleReset = () => {
    setReservation(null);
    setCancelSuccess(null);
    setRefundPreview(null);
    setShowCancelConfirm(false);
    setError(null);
    // Keep reference and phone for convenience but reset query params
    router.replace("/manage-booking");
  };

  return (
    <div className="relative z-10 mx-auto w-full max-w-[760px]">
      {/* Header */}
      <div className="mb-8 text-center">
        <m.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease }}
          className="font-mono-num text-[10px] uppercase tracking-[0.28em] text-[#9B7340] mb-5"
        >
          Customer Portal
        </m.p>
        <m.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease, delay: 0.1 }}
          className="font-display text-[clamp(2rem,4vw,3rem)] leading-[0.9] text-[#1D0F07]"
        >
          Manage your <em className="not-italic text-[#BF976A]">Booking.</em>
        </m.h1>
        <m.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease, delay: 0.2 }}
          className="mx-auto mt-4 max-w-[420px] font-serif text-[1rem] leading-[1.85] text-[#5C4A38]"
        >
          Verify details, check table layout status, or cancel your reservation with automatic refund processing.
        </m.p>
      </div>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <m.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-center font-serif text-sm text-red-600 flex items-center justify-center gap-2"
          >
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </m.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* LOOKUP FORM STATE */}
        {!reservation && (
          <m.div
            key="lookup-form"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease }}
            className="rounded-[28px] border border-[#BF976A]/20 bg-white/70 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.07)] backdrop-blur-md md:p-10"
          >
            <form onSubmit={handleLookup} className="space-y-6">
              <div>
                <label
                  htmlFor="ref"
                  className="block font-mono-num text-[10px] uppercase tracking-[0.2em] text-[#9B7340] mb-2"
                >
                  Booking Reference ID *
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Search className="h-4 w-4 text-[#BF976A]/75" />
                  </div>
                  <input
                    type="text"
                    id="ref"
                    placeholder="WGH-YYYYMMDD-NNNN"
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                    className="w-full rounded-2xl border border-[#BF976A]/20 bg-white/60 py-4 pl-11 pr-4 font-mono text-sm uppercase text-[#1D0F07] outline-none transition-all placeholder:normal-case placeholder:text-[#9B7340]/40 focus:border-[#BF976A] focus:ring-1 focus:ring-[#BF976A]"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block font-mono-num text-[10px] uppercase tracking-[0.2em] text-[#9B7340] mb-2"
                >
                  Mobile Number *
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Phone className="h-4 w-4 text-[#BF976A]/75" />
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    placeholder="e.g., 917200110489"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full rounded-2xl border border-[#BF976A]/20 bg-white/60 py-4 pl-11 pr-4 font-serif text-sm text-[#1D0F07] outline-none transition-all placeholder:text-[#9B7340]/40 focus:border-[#BF976A] focus:ring-1 focus:ring-[#BF976A]"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label
                    htmlFor="email"
                    className="font-mono-num text-[10px] uppercase tracking-[0.2em] text-[#9B7340]"
                  >
                    Email Address
                  </label>
                  <span className="font-mono-num text-[9px] uppercase tracking-[0.1em] text-[#9B7340]/55">
                    Optional Verification
                  </span>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Mail className="h-4 w-4 text-[#BF976A]/75" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    placeholder="e.g., name@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full rounded-2xl border border-[#BF976A]/20 bg-white/60 py-4 pl-11 pr-4 font-serif text-sm text-[#1D0F07] outline-none transition-all placeholder:text-[#9B7340]/40 focus:border-[#BF976A] focus:ring-1 focus:ring-[#BF976A]"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-center">
                <MagneticButton>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-3 rounded-full bg-[#1D0F07] px-8 py-4 font-mono-num text-[10px] uppercase tracking-[0.2em] text-[#FBF8F3] transition-all hover:bg-[#BF976A] hover:text-[#1D0F07] disabled:opacity-50"
                  >
                    {loading ? "Searching..." : "Verify & Find Reservation"}
                    {!loading && <ArrowRight size={14} />}
                  </button>
                </MagneticButton>
              </div>
            </form>
          </m.div>
        )}

        {/* RESERVATION DETAIL VIEW STATE */}
        {reservation && (
          <m.div
            key="reservation-details"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease }}
            className="space-y-6"
          >
            {/* Main Reservation Card */}
            <div className="rounded-[28px] border border-[#BF976A]/20 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.05)] overflow-hidden">
              {/* Card Header with Ref */}
              <div className="bg-[#1D0F07] p-6 text-center border-b border-[#BF976A]/10 text-[#FBF8F3]">
                <p className="font-mono-num text-[9px] uppercase tracking-[0.25em] text-[#BF976A] mb-1">
                  Woodlands Reservation
                </p>
                <h2 className="font-mono text-xl uppercase tracking-wider font-bold">
                  {reservation.referenceId}
                </h2>
              </div>

              {/* Card Body */}
              <div className="p-6 md:p-8 space-y-6">
                {/* Cancel Success Alert */}
                {cancelSuccess && (
                  <div className="rounded-2xl bg-green-50 border border-green-200 p-4 text-green-800 text-sm flex gap-3 items-start">
                    <CheckCircle className="shrink-0 text-green-600 mt-0.5" size={18} />
                    <div>
                      <p className="font-semibold mb-1">{cancelSuccess.message}</p>
                      {cancelSuccess.refundId && (
                        <p className="font-mono text-xs opacity-75">
                          Refund ID: {cancelSuccess.refundId}
                        </p>
                      )}
                      <p className="text-xs opacity-75 mt-1">
                        A confirmation email has been sent to your inbox.
                      </p>
                    </div>
                  </div>
                )}

                {/* Status Badges */}
                <div className="flex flex-wrap gap-3 items-center justify-between border-b border-[#BF976A]/10 pb-5">
                  <div className="space-y-1">
                    <span className="font-mono-num text-[9px] uppercase tracking-[0.1em] text-[#9B7340]">
                      Booking Status
                    </span>
                    <div className="flex">
                      {reservation.status === "Confirmed" && (
                        <span className="rounded-full bg-green-50 border border-green-200 px-3 py-1 font-serif text-xs text-green-700 font-medium">
                          Confirmed ✓
                        </span>
                      )}
                      {reservation.status === "Pending" && (
                        <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 font-serif text-xs text-amber-700 font-medium animate-pulse">
                          Pending Approval
                        </span>
                      )}
                      {reservation.status === "Completed" && (
                        <span className="rounded-full bg-purple-50 border border-purple-200 px-3 py-1 font-serif text-xs text-purple-700 font-medium">
                          Completed
                        </span>
                      )}
                      {reservation.status === "Cancelled" && (
                        <span className="rounded-full bg-red-50 border border-red-200 px-3 py-1 font-serif text-xs text-red-700 font-medium">
                          Cancelled
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 text-right">
                    <span className="font-mono-num text-[9px] uppercase tracking-[0.1em] text-[#9B7340]">
                      Payment Status
                    </span>
                    <div className="flex justify-end">
                      {reservation.paymentStatus === "Paid" && (
                        <span className="rounded-full bg-green-50 border border-green-200 px-3 py-1 font-serif text-xs text-green-700 font-medium">
                          Paid (₹{reservation.paymentAmount || 200})
                        </span>
                      )}
                      {reservation.paymentStatus === "Refunded" && (
                        <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 font-serif text-xs text-blue-700 font-medium">
                          Refunded (₹{reservation.refundAmount || 0})
                        </span>
                      )}
                      {reservation.paymentStatus === "Partially Refunded" && (
                        <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 font-serif text-xs text-amber-700 font-medium">
                          Partially Refunded (₹{reservation.refundAmount || 0})
                        </span>
                      )}
                      {(!reservation.paymentStatus || reservation.paymentStatus === "Pending") && (
                        <span className="rounded-full bg-gray-50 border border-gray-200 px-3 py-1 font-serif text-xs text-gray-700 font-medium">
                          Unpaid
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reservation Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#BF976A]/20 bg-[#BF976A]/5 text-[#BF976A]">
                      <User size={18} />
                    </div>
                    <div>
                      <span className="font-mono-num text-[9px] uppercase tracking-[0.1em] text-[#9B7340]">
                        Guest Details
                      </span>
                      <p className="font-serif text-base text-[#1D0F07] font-semibold">
                        {reservation.customerName}
                      </p>
                      <p className="font-serif text-xs text-[#5C4A38]">
                        {reservation.customerPhone}
                        {reservation.customerEmail ? ` · ${reservation.customerEmail}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#BF976A]/20 bg-[#BF976A]/5 text-[#BF976A]">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <span className="font-mono-num text-[9px] uppercase tracking-[0.1em] text-[#9B7340]">
                        Date & Time
                      </span>
                      <p className="font-serif text-base text-[#1D0F07] font-semibold">
                        {reservation.date}
                      </p>
                      <p className="font-serif text-xs text-[#5C4A38] flex items-center gap-1.5 mt-0.5">
                        <Clock size={12} className="text-[#BF976A]" />
                        {reservation.timeSlot}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#BF976A]/20 bg-[#BF976A]/5 text-[#BF976A]">
                      <UtensilsCrossed size={18} />
                    </div>
                    <div>
                      <span className="font-mono-num text-[9px] uppercase tracking-[0.1em] text-[#9B7340]">
                        Assigned Seat
                      </span>
                      <p className="font-serif text-base text-[#1D0F07] font-semibold">
                        Table {getTableLabel(reservation.tableNumber)}
                      </p>
                      <p className="font-serif text-xs text-[#5C4A38]">
                        {getTableZone(reservation.tableNumber)} Zone
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#BF976A]/20 bg-[#BF976A]/5 text-[#BF976A]">
                      <Users size={18} />
                    </div>
                    <div>
                      <span className="font-mono-num text-[9px] uppercase tracking-[0.1em] text-[#9B7340]">
                        Party Size
                      </span>
                      <p className="font-serif text-base text-[#1D0F07] font-semibold">
                        {reservation.guests} Guests
                      </p>
                      <p className="font-serif text-xs text-[#5C4A38]">
                        4 Seats per table maximum
                      </p>
                    </div>
                  </div>
                </div>

                {/* Special Occasions / Instructions if any */}
                {(reservation.specialOccasion && reservation.specialOccasion !== "None" || reservation.specialInstructions) && (
                  <div className="rounded-2xl border border-[#BF976A]/10 bg-[#FBF8F3]/50 p-4 space-y-2">
                    {reservation.specialOccasion && reservation.specialOccasion !== "None" && (
                      <div>
                        <span className="font-mono-num text-[8px] uppercase tracking-[0.1em] text-[#9B7340] block">
                          Occasion
                        </span>
                        <span className="font-serif text-xs text-[#1D0F07]">
                          🎉 Celebrating a {reservation.specialOccasion}
                        </span>
                      </div>
                    )}
                    {reservation.specialInstructions && (
                      <div>
                        <span className="font-mono-num text-[8px] uppercase tracking-[0.1em] text-[#9B7340] block">
                          Special Instructions
                        </span>
                        <span className="font-serif text-xs text-[#5C4A38] italic">
                          "{reservation.specialInstructions}"
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Refund metadata if already refunded */}
                {reservation.refundId && (
                  <div className="rounded-2xl border border-[#BF976A]/20 bg-[#FBF8F3] p-4 flex gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#BF976A]/20 bg-[#BF976A]/5 text-[#BF976A]">
                      <Receipt size={16} />
                    </div>
                    <div className="space-y-1">
                      <span className="font-mono-num text-[8px] uppercase tracking-[0.1em] text-[#9B7340] block">
                        Refund Details
                      </span>
                      <p className="font-serif text-xs text-[#1D0F07]">
                        Refund of <strong>₹{reservation.refundAmount}</strong> was processed.
                      </p>
                      <p className="font-mono text-[10px] text-[#5C4A38]">
                        ID: {reservation.refundId} · Status: {reservation.refundStatus}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons Footer */}
              <div className="bg-[#FBF8F3] border-t border-[#BF976A]/10 p-6 flex flex-wrap gap-4 justify-between items-center">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 font-mono-num text-[10px] uppercase tracking-[0.15em] text-[#9B7340] hover:text-[#1D0F07] transition-colors"
                >
                  <ArrowLeft size={12} />
                  Look up another booking
                </button>

                {(reservation.status === "Pending" || reservation.status === "Confirmed") && (
                  <MagneticButton>
                    <button
                      onClick={handleRefundPreview}
                      disabled={previewLoading}
                      className="rounded-full bg-red-600 hover:bg-red-700 px-6 py-3 font-mono-num text-[10px] uppercase tracking-[0.15em] text-white disabled:opacity-50 transition-colors shadow-sm"
                    >
                      {previewLoading ? "Calculating Policy..." : "Cancel Reservation"}
                    </button>
                  </MagneticButton>
                )}
              </div>
            </div>

            {/* Refund Preview / Cancel Confirmation Modal / Section */}
            <AnimatePresence>
              {showCancelConfirm && refundPreview && (
                <m.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-[24px] border border-red-200 bg-red-50/50 p-6 shadow-sm border-t-4 border-t-red-600"
                >
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                      <HelpCircle size={20} />
                    </div>
                    <div className="space-y-3 w-full">
                      <h3 className="font-serif text-lg font-semibold text-red-900">
                        Confirm Cancellation
                      </h3>
                      
                      <div className="space-y-2 text-sm text-red-800 font-serif">
                        <p>{refundPreview.reason}</p>
                        {refundPreview.refundAmount > 0 ? (
                          <p>
                            A refund of <strong className="text-base text-red-950 font-sans font-bold">₹{refundPreview.refundAmount}</strong> ({refundPreview.refundPercent}%) will be credited back to your original payment method. Refunds typically take 5–7 business days to process.
                          </p>
                        ) : (
                          <p className="font-medium text-red-900">
                            Please note: No refund is eligible under our terms for this booking time slot.
                          </p>
                        )}
                        <p className="text-xs text-red-700 italic pt-1">
                          Warning: This action cannot be undone. Your reserved seats will be immediately released back to the floor plan.
                        </p>
                      </div>

                      <div className="flex gap-4 pt-2">
                        <button
                          onClick={handleCancelBooking}
                          disabled={cancelLoading}
                          className="rounded-full bg-red-600 hover:bg-red-700 text-white px-5 py-2 text-xs font-mono uppercase tracking-wider font-semibold disabled:opacity-50 transition-colors"
                        >
                          {cancelLoading ? "Processing..." : "Yes, Cancel & Refund"}
                        </button>
                        <button
                          onClick={() => setShowCancelConfirm(false)}
                          disabled={cancelLoading}
                          className="rounded-full border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-5 py-2 text-xs font-mono uppercase tracking-wider font-semibold transition-colors"
                        >
                          Keep Reservation
                        </button>
                      </div>
                    </div>
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ManageBookingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#FBF8F3] text-[#1D0F07]">
      {/* Navigation */}
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-[#BF976A]/14 bg-[#FBF8F3]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-12">
          <Link
            href="/"
            className="flex items-center gap-2 font-display text-2xl leading-none text-[#1D0F07] transition-opacity hover:opacity-75"
          >
            <span className="text-[#BF976A] text-lg leading-none">◆</span> Woodlands
          </Link>
          <div className="flex items-center gap-6 font-mono-num text-[10px] uppercase tracking-[0.28em]">
            <Link href="/" className="text-[#9B7340] transition-colors hover:text-[#1D0F07]">
              Back to Menu
            </Link>
            <Link href="/book-a-table" className="text-[#9B7340] transition-colors hover:text-[#1D0F07]">
              Book Table
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <section className="relative min-h-screen px-4 pb-24 pt-28 md:px-8 md:pt-36">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_65%_55%_at_50%_40%,rgba(191,151,106,0.1)_0%,transparent_65%)]" />
        
        <Suspense
          fallback={
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#BF976A] border-t-transparent" />
            </div>
          }
        >
          <ManageBookingContent />
        </Suspense>
      </section>
    </main>
  );
}

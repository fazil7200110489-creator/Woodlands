"use client";

import { useState, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Users,
  Mail,
  Phone,
  User,
  MessageSquare,
  GlassWater,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import MagneticButton from "@/components/MagneticButton";
import StepIndicator from "@/components/booking/StepIndicator";
import FloorPlan from "@/components/booking/FloorPlan";
import TableInfoPanel from "@/components/booking/TableInfoPanel";
import { useRazorpay } from "@/hooks/useRazorpay";
import {
  RESTAURANT_TABLES,
  TableConfig,
  TableStatus,
  TABLE_STATUS_COLORS,
} from "@/lib/tableConfig";

const ADVANCE_AMOUNT = 200;

const occasions = [
  "None",
  "Birthday",
  "Anniversary",
  "Business Meeting",
  "Family Dinner",
  "Other",
];

const timeSlots = [
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
];

const ease = [0.16, 1, 0.3, 1] as const;

export default function BookTablePage() {
  /* ── Step management ── */
  const [step, setStep] = useState(1);

  /* ── Step 1: date/time/guests ── */
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [guestCount, setGuestCount] = useState(2);

  /* ── Step 2: table selection ── */
  const [bookedTableIds, setBookedTableIds] = useState<number[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableConfig | null>(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  /* ── Step 3: form ── */
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    specialOccasion: "None",
    specialInstructions: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any>(null);

  const { openRazorpay } = useRazorpay();
  const today = new Date().toISOString().split("T")[0];

  /* ── Step 1 → Step 2 ── */
  const handleFindTables = useCallback(async () => {
    if (!bookingDate || !bookingTime) return;
    setLoadingAvailability(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/reservations/availability?date=${bookingDate}&time=${bookingTime}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to check availability");
      setBookedTableIds(data.bookedTables || []);
      setSelectedTable(null);
      setShowInfoPanel(false);
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Could not check availability. Please try again.");
    } finally {
      setLoadingAvailability(false);
    }
  }, [bookingDate, bookingTime]);

  /* ── Table selection ── */
  const handleSelectTable = useCallback((table: TableConfig) => {
    setSelectedTable(table);
    setShowInfoPanel(true);
  }, []);

  const handleContinueToForm = useCallback(() => {
    setShowInfoPanel(false);
    setStep(3);
  }, []);

  /* ── Step 3: submit with Razorpay ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable) return;
    setIsSubmitting(true);
    setError(null);

    try {
      /* Step 1: Create Razorpay order for ₹200 advance */
      const createRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: ADVANCE_AMOUNT,
          notes: {
            customerName: formData.customerName,
            customerPhone: formData.customerPhone,
            type: "table_booking",
            tableNumber: selectedTable.id,
          },
        }),
      });
      const { orderId: rzpOrderId, amount: rzpAmount, keyId } =
        await createRes.json();
      if (!rzpOrderId)
        throw new Error("Could not initiate payment. Please try again.");

      /* Step 2: Open Razorpay popup */
      const paymentResponse = await openRazorpay({
        key: keyId ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: rzpAmount,
        currency: "INR",
        name: "Woodlands",
        description: `Table ${selectedTable.label} · ${bookingDate} at ${bookingTime} · ${guestCount} guests`,
        order_id: rzpOrderId,
        prefill: {
          name: formData.customerName,
          contact: formData.customerPhone,
          email: formData.customerEmail || undefined,
        },
        theme: { color: "#BF976A" },
        config: {
          display: {
            blocks: {
              utib: {
                name: "Pay via UPI",
                instruments: [{ method: "upi" }],
              },
              other: {
                name: "Other Methods",
                instruments: [{ method: "card" }, { method: "netbanking" }],
              },
            },
            sequence: ["block.utib", "block.other"],
            preferences: { show_default_blocks: false },
          },
        },
      });

      /* Step 3: Verify signature server-side */
      const verifyRes = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpayOrderId: paymentResponse.razorpay_order_id,
          razorpayPaymentId: paymentResponse.razorpay_payment_id,
          razorpaySignature: paymentResponse.razorpay_signature,
        }),
      });
      const { success: verified } = await verifyRes.json();
      if (!verified)
        throw new Error("Payment verification failed. Please contact us.");

      /* Step 4: Create reservation in MongoDB with payment details */
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tableNumber: selectedTable.id,
          date: bookingDate,
          timeSlot: bookingTime,
          guests: guestCount,
          razorpayOrderId: paymentResponse.razorpay_order_id,
          razorpayPaymentId: paymentResponse.razorpay_payment_id,
          paymentAmount: ADVANCE_AMOUNT,
          paymentStatus: "Paid",
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to book table");
      }

      // Save to local history
      try {
        const history = JSON.parse(
          localStorage.getItem("woodlands_reservations") || "[]"
        );
        history.unshift(data);
        localStorage.setItem("woodlands_reservations", JSON.stringify(history));
      } catch (_) {}

      setSuccessData({
        ...data,
        paymentId: paymentResponse.razorpay_payment_id,
        tableLabel: selectedTable.label,
        tableZone: selectedTable.zone,
      });
    } catch (err: any) {
      const reason = err?.message ?? "Payment did not complete.";
      if (reason.includes("cancelled")) {
        setError("Payment was cancelled. Please try again when ready.");
      } else {
        setError(reason);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Helper: Get table status ── */
  const getTableStatus = (table: TableConfig): TableStatus => {
    if (table.disabled) return "disabled";
    if (bookedTableIds.includes(table.id)) return "booked";
    return "available";
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#FBF8F3] text-[#1D0F07]">
      {/* Navigation */}
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-[#BF976A]/14 bg-[#FBF8F3]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-12">
          <Link
            href="/"
            className="flex items-center gap-2 font-display text-2xl leading-none text-[#1D0F07] transition-opacity hover:opacity-75"
          >
            <span className="text-[#BF976A] text-lg leading-none">◆</span>{" "}
            Woodlands
          </Link>
          <div className="flex items-center gap-6 font-mono-num text-[10px] uppercase tracking-[0.28em]">
            <Link
              href="/manage-booking"
              className="text-[#9B7340] transition-colors hover:text-[#1D0F07]"
            >
              Manage Booking
            </Link>
            <Link
              href="/"
              className="text-[#9B7340] transition-colors hover:text-[#1D0F07]"
            >
              Back to Menu
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <section className="relative min-h-screen px-4 pb-24 pt-28 md:px-8 md:pt-36">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_65%_55%_at_62%_42%,rgba(191,151,106,0.13)_0%,transparent_65%)]" />

        <div className="relative z-10 mx-auto w-full max-w-[1100px]">
          {/* Header */}
          <div className="mb-8 text-center">
            <m.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease }}
              className="section-label mb-5"
            >
              Premium Dining
            </m.p>
            <m.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease, delay: 0.1 }}
              className="font-display text-[clamp(2.2rem,5vw,4rem)] leading-[0.9] text-[#1D0F07]"
            >
              Reserve your{" "}
              <em className="not-italic text-[#BF976A]">Table.</em>
            </m.h1>
            <m.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease, delay: 0.2 }}
              className="mx-auto mt-4 max-w-[420px] font-serif text-[1rem] leading-[1.85] text-[#5C4A38]"
            >
              Select your preferred date, choose your table on our interactive
              floor plan, and secure it instantly.
            </m.p>
          </div>

          {/* Step Indicator */}
          <m.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.3 }}
            className="mb-10"
          >
            <StepIndicator currentStep={step} />
          </m.div>

          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <m.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mx-auto mb-6 max-w-[700px] rounded-2xl border border-red-200 bg-red-50 p-4 text-center font-serif text-sm text-red-600"
              >
                {error}
              </m.div>
            )}
          </AnimatePresence>

          {/* ═══════════════════════════════ STEP 1: Date/Time/Guests ═══════════════════════════════ */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <m.div
                key="step-1"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease }}
                className="mx-auto max-w-[600px]"
              >
                <div className="rounded-[28px] border border-[#BF976A]/20 bg-white/70 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.07)] backdrop-blur-md md:p-10">
                  <h2 className="mb-1 font-display text-2xl text-[#1D0F07]">
                    When would you like to dine?
                  </h2>
                  <p className="mb-8 font-serif text-sm text-[#5C4A38]">
                    Select your preferred date, time, and party size.
                  </p>

                  <div className="space-y-5">
                    {/* Date */}
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9B7340]/60" />
                      <input
                        required
                        type="date"
                        min={today}
                        className="w-full rounded-2xl border border-[#BF976A]/20 bg-white/50 py-4 pl-12 pr-4 font-serif text-[1rem] outline-none transition-all focus:border-[#BF976A] focus:bg-white"
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                      />
                    </div>

                    {/* Time */}
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9B7340]/60" />
                      <select
                        required
                        className="w-full appearance-none rounded-2xl border border-[#BF976A]/20 bg-white/50 py-4 pl-12 pr-4 font-serif text-[1rem] outline-none transition-all focus:border-[#BF976A] focus:bg-white"
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                      >
                        <option value="" disabled>
                          Select Time
                        </option>
                        {timeSlots.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Guests */}
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9B7340]/60" />
                      <select
                        required
                        className="w-full appearance-none rounded-2xl border border-[#BF976A]/20 bg-white/50 py-4 pl-12 pr-4 font-serif text-[1rem] outline-none transition-all focus:border-[#BF976A] focus:bg-white"
                        value={guestCount}
                        onChange={(e) => setGuestCount(Number(e.target.value))}
                      >
                        {[...Array(20)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1} {i === 0 ? "Guest" : "Guests"}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-8">
                    <MagneticButton
                      disabled={
                        !bookingDate || !bookingTime || loadingAvailability
                      }
                      onClick={handleFindTables}
                      className="w-full rounded-full bg-[#1D0F07] py-5 font-mono-num text-[11px] uppercase tracking-[0.2em] text-[#FBF8F3] transition-colors hover:bg-[#BF976A] hover:text-[#1D0F07] disabled:opacity-50"
                    >
                      {loadingAvailability
                        ? "Checking Availability…"
                        : "Find Available Tables"}
                    </MagneticButton>
                  </div>
                </div>
              </m.div>
            )}

            {/* ═══════════════════════════════ STEP 2: Floor Plan ═══════════════════════════════ */}
            {step === 2 && (
              <m.div
                key="step-2"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease }}
              >
                {/* Back button + summary */}
                <div className="mb-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 font-mono-num text-[11px] uppercase tracking-[0.2em] text-[#9B7340] transition-colors hover:text-[#1D0F07]"
                  >
                    <ArrowLeft size={14} /> Change Date/Time
                  </button>
                  <div className="flex items-center gap-4">
                    <span className="rounded-full border border-[#BF976A]/20 bg-[#BF976A]/8 px-4 py-1.5 font-mono-num text-[10px] uppercase tracking-[0.18em] text-[#9B7340]">
                      📅 {bookingDate}
                    </span>
                    <span className="rounded-full border border-[#BF976A]/20 bg-[#BF976A]/8 px-4 py-1.5 font-mono-num text-[10px] uppercase tracking-[0.18em] text-[#9B7340]">
                      🕐 {bookingTime}
                    </span>
                    <span className="rounded-full border border-[#BF976A]/20 bg-[#BF976A]/8 px-4 py-1.5 font-mono-num text-[10px] uppercase tracking-[0.18em] text-[#9B7340]">
                      👥 {guestCount}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <div className="mb-6 text-center">
                  <h2 className="font-display text-2xl text-[#1D0F07]">
                    Select Your Table
                  </h2>
                  <p className="mt-2 font-serif text-sm text-[#5C4A38]">
                    Tap on an available table to view details and reserve it.
                  </p>
                </div>

                {/* Floor Plan */}
                <div className="flex justify-center">
                  <FloorPlan
                    tables={RESTAURANT_TABLES}
                    bookedTableIds={bookedTableIds}
                    selectedTableId={selectedTable?.id ?? null}
                    onSelectTable={handleSelectTable}
                  />
                </div>

                {/* Table Info Panel */}
                <TableInfoPanel
                  table={selectedTable}
                  status={
                    selectedTable
                      ? getTableStatus(selectedTable)
                      : "available"
                  }
                  onContinue={handleContinueToForm}
                  onClose={() => {
                    setShowInfoPanel(false);
                    setSelectedTable(null);
                  }}
                />
              </m.div>
            )}

            {/* ═══════════════════════════════ STEP 3: Booking Form ═══════════════════════════════ */}
            {step === 3 && !successData && (
              <m.div
                key="step-3"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease }}
                className="mx-auto max-w-[700px]"
              >
                {/* Back button */}
                <button
                  onClick={() => setStep(2)}
                  className="mb-6 flex items-center gap-2 font-mono-num text-[11px] uppercase tracking-[0.2em] text-[#9B7340] transition-colors hover:text-[#1D0F07]"
                >
                  <ArrowLeft size={14} /> Back to Floor Plan
                </button>

                {/* Selected table + booking summary */}
                <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
                  <div className="flex items-center gap-2 rounded-full border border-[#BF976A]/30 bg-[#BF976A]/10 px-5 py-2.5">
                    <div className="h-2 w-2 rounded-full bg-[#2ECC71]" />
                    <span className="font-mono-num text-[11px] uppercase tracking-[0.15em] text-[#1D0F07] font-medium">
                      Table {selectedTable?.label}
                    </span>
                    <span className="font-serif text-[11px] text-[#9B7340]">
                      · {selectedTable?.zone}
                    </span>
                  </div>
                  <span className="rounded-full border border-[#BF976A]/15 px-4 py-2 font-mono-num text-[10px] uppercase tracking-[0.18em] text-[#9B7340]">
                    📅 {bookingDate}
                  </span>
                  <span className="rounded-full border border-[#BF976A]/15 px-4 py-2 font-mono-num text-[10px] uppercase tracking-[0.18em] text-[#9B7340]">
                    🕐 {bookingTime}
                  </span>
                  <span className="rounded-full border border-[#BF976A]/15 px-4 py-2 font-mono-num text-[10px] uppercase tracking-[0.18em] text-[#9B7340]">
                    👥 {guestCount}
                  </span>
                </div>

                <div className="rounded-[28px] border border-[#BF976A]/20 bg-white/70 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.07)] backdrop-blur-md md:p-10">
                  <h2 className="mb-1 font-display text-2xl text-[#1D0F07]">
                    Complete Your Reservation
                  </h2>
                  <p className="mb-8 font-serif text-sm text-[#5C4A38]">
                    Fill in your details to confirm your booking.
                  </p>

                  <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    {/* Name */}
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9B7340]/60" />
                      <input
                        required
                        type="text"
                        placeholder="Full Name"
                        className="w-full rounded-2xl border border-[#BF976A]/20 bg-white/50 py-4 pl-12 pr-4 font-serif text-[1rem] outline-none transition-all focus:border-[#BF976A] focus:bg-white"
                        value={formData.customerName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            customerName: e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* Phone */}
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9B7340]/60" />
                      <input
                        required
                        type="tel"
                        placeholder="Mobile Number"
                        className="w-full rounded-2xl border border-[#BF976A]/20 bg-white/50 py-4 pl-12 pr-4 font-serif text-[1rem] outline-none transition-all focus:border-[#BF976A] focus:bg-white"
                        value={formData.customerPhone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            customerPhone: e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* Email */}
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9B7340]/60" />
                      <input
                        type="email"
                        placeholder="Email Address (Optional)"
                        className="w-full rounded-2xl border border-[#BF976A]/20 bg-white/50 py-4 pl-12 pr-4 font-serif text-[1rem] outline-none transition-all focus:border-[#BF976A] focus:bg-white"
                        value={formData.customerEmail}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            customerEmail: e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* Occasion */}
                    <div className="relative">
                      <GlassWater className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9B7340]/60" />
                      <select
                        className="w-full appearance-none rounded-2xl border border-[#BF976A]/20 bg-white/50 py-4 pl-12 pr-4 font-serif text-[1rem] outline-none transition-all focus:border-[#BF976A] focus:bg-white"
                        value={formData.specialOccasion}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            specialOccasion: e.target.value,
                          })
                        }
                      >
                        <option value="None" disabled>
                          Occasion (Optional)
                        </option>
                        {occasions.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Special Instructions */}
                    <div className="relative">
                      <MessageSquare className="absolute left-4 top-6 h-5 w-5 text-[#9B7340]/60" />
                      <textarea
                        placeholder="Special Instructions (Dietary requirements, etc.)"
                        rows={3}
                        className="w-full resize-none rounded-2xl border border-[#BF976A]/20 bg-white/50 py-4 pl-12 pr-4 font-serif text-[1rem] outline-none transition-all focus:border-[#BF976A] focus:bg-white"
                        value={formData.specialInstructions}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            specialInstructions: e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* Advance payment notice */}
                    <div className="rounded-2xl border border-[#BF976A]/20 bg-[#BF976A]/6 px-5 py-4 flex items-start gap-3">
                      <svg
                        className="mt-0.5 h-5 w-5 shrink-0 text-[#9B7340]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.7}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div>
                        <p className="font-mono-num text-[10px] uppercase tracking-[0.2em] text-[#9B7340] mb-1">
                          Advance Required
                        </p>
                        <p className="font-serif text-sm text-[#5C4A38] leading-[1.6]">
                          A refundable advance of{" "}
                          <strong>₹{ADVANCE_AMOUNT}</strong> is required to
                          confirm your booking. This is adjusted against your
                          bill on arrival.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      <MagneticButton
                        disabled={isSubmitting}
                        className="mx-auto w-full max-w-sm rounded-full bg-[#1D0F07] py-5 font-mono-num text-[11px] uppercase tracking-[0.2em] text-[#FBF8F3] transition-colors hover:bg-[#BF976A] hover:text-[#1D0F07] disabled:opacity-50"
                      >
                        {isSubmitting
                          ? "Processing Payment…"
                          : `Pay ₹${ADVANCE_AMOUNT} & Reserve Table ${selectedTable?.label}`}
                      </MagneticButton>
                      <p className="font-mono-num text-[9px] uppercase tracking-[0.18em] text-[#9B7340]/55">
                        🔒 Secured by Razorpay · Test Mode
                      </p>
                    </div>
                  </form>
                </div>
              </m.div>
            )}
          </AnimatePresence>

          {/* ═══════════════════════════════ SUCCESS MODAL ═══════════════════════════════ */}
          <AnimatePresence>
            {successData && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
                <m.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-[#1D0F07]/40 backdrop-blur-sm"
                  onClick={() => setSuccessData(null)}
                />
                <m.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="relative z-10 w-full max-w-md overflow-hidden rounded-[32px] bg-white p-10 text-center shadow-2xl"
                >
                  {/* Success icon */}
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#2ECC71]/10 text-[#2ECC71]">
                    <svg
                      width="36"
                      height="36"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>

                  <h2 className="mb-2 font-display text-4xl text-[#1D0F07]">
                    Booking Confirmed!
                  </h2>
                  <p className="font-serif text-[#5C4A38]">
                    Your table has been reserved successfully.
                  </p>

                  <div className="my-8 rounded-2xl border border-[#BF976A]/20 bg-[#FBF8F3] p-6 text-left">
                    {/* Reference ID */}
                    <div className="mb-4 border-b border-[#BF976A]/10 pb-4">
                      <p className="font-mono-num text-[10px] uppercase tracking-widest text-[#9B7340]">
                        Reference ID
                      </p>
                      <p className="font-mono-num text-xl text-[#1D0F07]">
                        {successData.referenceId}
                      </p>
                    </div>

                    {/* Table + Details grid */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="font-mono-num text-[10px] uppercase tracking-widest text-[#9B7340]">
                          Table
                        </p>
                        <p className="font-serif text-sm text-[#1D0F07] font-medium">
                          {successData.tableLabel}{" "}
                          <span className="text-[#9B7340] font-normal">
                            · {successData.tableZone}
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="font-mono-num text-[10px] uppercase tracking-widest text-[#9B7340]">
                          Guests
                        </p>
                        <p className="font-serif text-sm text-[#1D0F07]">
                          {successData.guests} People
                        </p>
                      </div>
                      <div>
                        <p className="font-mono-num text-[10px] uppercase tracking-widest text-[#9B7340]">
                          Date
                        </p>
                        <p className="font-serif text-sm text-[#1D0F07]">
                          {successData.date}
                        </p>
                      </div>
                      <div>
                        <p className="font-mono-num text-[10px] uppercase tracking-widest text-[#9B7340]">
                          Time
                        </p>
                        <p className="font-serif text-sm text-[#1D0F07]">
                          {successData.timeSlot}
                        </p>
                      </div>
                    </div>

                    {/* Payment */}
                    {successData.paymentId && (
                      <div className="border-t border-[#BF976A]/10 pt-4">
                        <p className="font-mono-num text-[10px] uppercase tracking-widest text-[#9B7340] mb-1">
                          Payment ID
                        </p>
                        <p className="font-mono-num text-xs text-[#5C4A38] break-all">
                          {successData.paymentId}
                        </p>
                        <p className="mt-1 font-mono-num text-[9px] text-emerald-600">
                          ₹{ADVANCE_AMOUNT} advance paid ✓
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Share / Manage Actions */}
                  <div className="flex flex-col gap-3 mb-6">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `🍽️ I've booked a table at Woodlands Grill House!\n\n📋 Ref: ${successData.referenceId}\n🪑 Table: ${successData.tableLabel}\n📅 ${successData.date} at ${successData.timeSlot}\n👥 ${successData.guests} guests`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2.5 rounded-full border border-[#BF976A]/20 bg-[#FBF8F3] py-4 font-mono-num text-[10px] uppercase tracking-[0.18em] text-[#9B7340] hover:bg-[#BF976A] hover:text-[#1D0F07] transition-all cursor-pointer"
                    >
                      <svg
                        className="h-4.5 w-4.5 shrink-0 text-[#25D366]"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                      >
                        <path d="M17.472 14.382c-.022-.014-.029-.018-.084-.104-.055-.085-.294-.486-.349-.571-.055-.086-.11-.086-.165-.029-.055.057-.22.257-.27.314-.05.057-.1.057-.155.029-.055-.029-.232-.085-.442-.271-.164-.146-.274-.328-.306-.385-.032-.057-.003-.088.025-.116.026-.026.056-.057.085-.086.03-.03.039-.05.059-.085.02-.035.01-.064-.005-.093-.015-.029-.165-.396-.226-.54-.06-.142-.12-.122-.166-.124-.042-.002-.09-.002-.138-.002-.048 0-.127.018-.193.088-.067.07-.256.25-.256.611 0 .361.264.711.3.76.037.05.519.793 1.258 1.111.176.075.313.12.42.155.177.056.338.048.465.03.142-.02.435-.178.496-.35.061-.171.061-.318.043-.35-.018-.031-.067-.05-.122-.077zm-5.462 4.195H12c-1.393 0-2.75-.375-3.93-1.085l-.282-.167-2.92.766.78-2.846-.183-.292c-.779-1.242-1.19-2.673-1.19-4.148 0-4.17 3.4-7.568 7.58-7.568 2.025 0 3.929.79 5.36 2.223 1.43 1.432 2.219 3.34 2.219 5.347 0 4.17-3.4 7.57-7.576 7.57zm7.576-15.334C17.758 1.433 15.005.5 12 .5 5.658.5.508 5.626.508 11.93c0 2.014.529 3.98 1.534 5.719L.05 24l6.523-1.706c1.674.91 3.551 1.389 5.42 1.389 6.34 0 11.492-5.126 11.492-11.43 0-3.053-1.189-5.923-3.407-8.134z"/>
                      </svg>
                      Share on WhatsApp
                    </a>

                    <Link
                      href={`/manage-booking?ref=${successData.referenceId}`}
                      className="flex items-center justify-center gap-2 rounded-full border border-[#1D0F07]/20 bg-white py-3.5 font-mono-num text-[10px] uppercase tracking-[0.18em] text-[#1D0F07] hover:bg-[#1D0F07]/5 transition-all"
                    >
                      Manage Reservation Online
                    </Link>
                  </div>

                  <Link href="/">
                    <MagneticButton className="w-full rounded-full bg-[#1D0F07] py-4 font-mono-num text-[10px] uppercase tracking-[0.2em] text-[#FBF8F3] hover:bg-[#BF976A] hover:text-[#1D0F07]">
                      Back to Home
                    </MagneticButton>
                  </Link>
                </m.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </main>
  );
}

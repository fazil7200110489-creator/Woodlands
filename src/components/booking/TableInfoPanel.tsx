"use client";

import { m, AnimatePresence } from "framer-motion";
import { X, MapPin, Users, Hash, CheckCircle } from "lucide-react";
import { TableConfig, TableStatus, TABLE_STATUS_COLORS } from "@/lib/tableConfig";
import MagneticButton from "@/components/MagneticButton";

interface TableInfoPanelProps {
  table: TableConfig | null;
  status: TableStatus;
  onContinue: () => void;
  onClose: () => void;
}

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * Side panel / bottom sheet that shows details of a selected table.
 * Desktop: slides in from the right.
 * Mobile: slides up from the bottom as a sheet.
 */
export default function TableInfoPanel({
  table,
  status,
  onContinue,
  onClose,
}: TableInfoPanelProps) {
  const isClickable = status === "available" || status === "reserved-soon";
  const colors = table ? TABLE_STATUS_COLORS[status] : TABLE_STATUS_COLORS.available;

  return (
    <AnimatePresence mode="wait">
      {table && (
        <>
          {/* Backdrop — mobile only */}
          <m.div
            key="panel-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />

          {/* Panel */}
          <m.div
            key="panel"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ duration: 0.45, ease }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[380px] flex-col
                       max-lg:bottom-0 max-lg:top-auto max-lg:h-auto max-lg:max-h-[70vh] max-lg:max-w-full max-lg:rounded-t-[28px]
                       border-l border-[#BF976A]/15 bg-[#0F0C0A]/95 backdrop-blur-xl"
            style={{
              boxShadow: "-20px 0 60px rgba(0,0,0,0.4)",
            }}
          >
            {/* Handle for mobile */}
            <div className="flex justify-center pt-3 lg:hidden">
              <div className="h-1 w-10 rounded-full bg-[#BF976A]/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#BF976A]/10">
              <div>
                <p className="font-mono-num text-[9px] uppercase tracking-[0.3em] text-[#BF976A]/50 mb-1">
                  Selected Table
                </p>
                <h3 className="font-display text-3xl text-[#FBF8F3]">
                  {table.label}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#BF976A]/15 text-[#BF976A]/50 transition-colors hover:bg-[#BF976A]/10 hover:text-[#BF976A]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Details */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              {/* Seats */}
              <div className="flex items-center gap-4 rounded-2xl border border-[#BF976A]/10 bg-[#BF976A]/[0.04] px-5 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#BF976A]/10">
                  <Users size={18} className="text-[#BF976A]" />
                </div>
                <div>
                  <p className="font-mono-num text-[9px] uppercase tracking-[0.25em] text-[#BF976A]/50">
                    Seats
                  </p>
                  <p className="font-serif text-[15px] text-[#FBF8F3]">
                    {table.seats} Chairs
                  </p>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-4 rounded-2xl border border-[#BF976A]/10 bg-[#BF976A]/[0.04] px-5 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#BF976A]/10">
                  <MapPin size={18} className="text-[#BF976A]" />
                </div>
                <div>
                  <p className="font-mono-num text-[9px] uppercase tracking-[0.25em] text-[#BF976A]/50">
                    Location
                  </p>
                  <p className="font-serif text-[15px] text-[#FBF8F3]">
                    {table.zone}
                  </p>
                </div>
              </div>

              {/* Table Number */}
              <div className="flex items-center gap-4 rounded-2xl border border-[#BF976A]/10 bg-[#BF976A]/[0.04] px-5 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#BF976A]/10">
                  <Hash size={18} className="text-[#BF976A]" />
                </div>
                <div>
                  <p className="font-mono-num text-[9px] uppercase tracking-[0.25em] text-[#BF976A]/50">
                    Table Number
                  </p>
                  <p className="font-serif text-[15px] text-[#FBF8F3]">
                    Table #{table.id}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-4 rounded-2xl border border-[#BF976A]/10 bg-[#BF976A]/[0.04] px-5 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#BF976A]/10">
                  <CheckCircle size={18} className="text-[#BF976A]" />
                </div>
                <div>
                  <p className="font-mono-num text-[9px] uppercase tracking-[0.25em] text-[#BF976A]/50">
                    Status
                  </p>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: colors.text,
                        boxShadow: `0 0 6px ${colors.glow}`,
                      }}
                    />
                    <p className="font-serif text-[15px] capitalize" style={{ color: colors.text }}>
                      {status === "reserved-soon" ? "Reserved Soon" : status}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="border-t border-[#BF976A]/10 px-6 py-5">
              {isClickable ? (
                <MagneticButton
                  onClick={onContinue}
                  className="w-full rounded-full bg-[#BF976A] py-4 font-mono-num text-[11px] uppercase tracking-[0.2em] text-[#1D0F07] transition-all hover:bg-[#D4B07A] hover:shadow-[0_0_30px_rgba(191,151,106,0.3)]"
                >
                  Continue to Booking →
                </MagneticButton>
              ) : (
                <div className="rounded-full bg-[#333] py-4 text-center font-mono-num text-[11px] uppercase tracking-[0.2em] text-[#666]">
                  Table Not Available
                </div>
              )}
            </div>
          </m.div>
        </>
      )}
    </AnimatePresence>
  );
}

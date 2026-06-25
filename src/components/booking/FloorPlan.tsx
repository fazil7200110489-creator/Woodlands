"use client";

import { m } from "framer-motion";
import { TableConfig, TableStatus, RESTAURANT_TABLES, TABLE_STATUS_COLORS } from "@/lib/tableConfig";
import TableCard from "./TableCard";

interface FloorPlanProps {
  tables?: TableConfig[];
  bookedTableIds: number[];
  selectedTableId: number | null;
  onSelectTable: (table: TableConfig) => void;
}

function getTableStatus(table: TableConfig, bookedIds: number[]): TableStatus {
  if (table.disabled) return "disabled";
  if (bookedIds.includes(table.id)) return "booked";
  return "available";
}

/**
 * Interactive top-down restaurant floor plan.
 *
 * Layout matches the real restaurant:
 *          ENTRANCE
 *     T1            T2
 *          T3
 *     T4            T5
 *     T6            T7
 *          COUNTER
 */
export default function FloorPlan({
  tables = RESTAURANT_TABLES,
  bookedTableIds,
  selectedTableId,
  onSelectTable,
}: FloorPlanProps) {
  // Group tables by row for rendering
  const maxRow = Math.max(...tables.map((t) => t.position.row));
  const rows: { row: number; tables: TableConfig[] }[] = [];
  for (let r = 0; r <= maxRow; r++) {
    const rowTables = tables.filter((t) => t.position.row === r);
    if (rowTables.length > 0) rows.push({ row: r, tables: rowTables });
  }

  return (
    <div className="relative w-full">
      {/* Floor plan container — dark wood background */}
      <div
        className="relative mx-auto w-full max-w-[580px] overflow-auto rounded-[28px] border border-[#BF976A]/15"
        style={{
          background:
            "linear-gradient(165deg, #1A1210 0%, #0F0C0A 40%, #141110 100%)",
          boxShadow:
            "0 32px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(191,151,106,0.08)",
        }}
      >
        {/* Subtle wood grain overlay */}
        <div
          className="absolute inset-0 rounded-[28px] opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg width=\'200\' height=\'200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence baseFrequency=\'0.02\' numOctaves=\'3\' type=\'fractalNoise\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
          }}
        />

        <div className="relative z-10 px-4 py-8 sm:px-8 sm:py-10">
          {/* ENTRANCE Label */}
          <m.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="mb-8 flex items-center justify-center gap-4"
          >
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#BF976A]/30 to-transparent" />
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#BF976A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span className="font-mono-num text-[10px] uppercase tracking-[0.35em] text-[#BF976A]/60">
                Entrance
              </span>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#BF976A]/30 to-transparent" />
          </m.div>

          {/* Table Grid */}
          <div className="flex flex-col items-center gap-6 sm:gap-8">
            {rows.map(({ row, tables: rowTables }, rowIdx) => {
              // Check if this is a center-aligned single table
              const isCentered =
                rowTables.length === 1 && rowTables[0].position.col === 0.5;

              return (
                <m.div
                  key={row}
                  className={`flex items-center gap-6 sm:gap-12 ${
                    isCentered ? "justify-center" : "justify-between"
                  }`}
                  style={{
                    width: isCentered ? "auto" : "100%",
                    maxWidth: "400px",
                    paddingLeft: isCentered ? 0 : "10%",
                    paddingRight: isCentered ? 0 : "10%",
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.2 + rowIdx * 0.1,
                    duration: 0.5,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  {rowTables.map((table) => {
                    const status = getTableStatus(table, bookedTableIds);
                    return (
                      <TableCard
                        key={table.id}
                        table={table}
                        status={status}
                        isSelected={selectedTableId === table.id}
                        onSelect={onSelectTable}
                      />
                    );
                  })}
                </m.div>
              );
            })}
          </div>

          {/* COUNTER Label */}
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-8 flex items-center justify-center gap-4"
          >
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#BF976A]/30 to-transparent" />
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#BF976A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 7V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v3" />
              </svg>
              <span className="font-mono-num text-[10px] uppercase tracking-[0.35em] text-[#BF976A]/60">
                Counter
              </span>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#BF976A]/30 to-transparent" />
          </m.div>

          {/* Legend */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
          >
            {(
              [
                { status: "available" as TableStatus, label: "Available" },
                { status: "booked" as TableStatus, label: "Booked" },
                { status: "reserved-soon" as TableStatus, label: "Reserved Soon" },
                { status: "disabled" as TableStatus, label: "Maintenance" },
              ] as const
            ).map(({ status, label }) => (
              <div key={status} className="flex items-center gap-1.5">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor: TABLE_STATUS_COLORS[status].text,
                    boxShadow: `0 0 6px ${TABLE_STATUS_COLORS[status].glow}`,
                  }}
                />
                <span className="font-mono-num text-[9px] uppercase tracking-[0.2em] text-[#BF976A]/50">
                  {label}
                </span>
              </div>
            ))}
          </m.div>
        </div>
      </div>
    </div>
  );
}

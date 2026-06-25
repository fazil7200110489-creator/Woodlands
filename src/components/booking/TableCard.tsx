"use client";

import { m } from "framer-motion";
import { TableConfig, TableStatus, TABLE_STATUS_COLORS } from "@/lib/tableConfig";

interface TableCardProps {
  table: TableConfig;
  status: TableStatus;
  isSelected: boolean;
  onSelect: (table: TableConfig) => void;
}

/**
 * Reusable SVG table component.
 * Renders a round table with chairs around it, color-coded by status.
 * Supports any seat count — chairs are evenly distributed.
 */
export default function TableCard({ table, status, isSelected, onSelect }: TableCardProps) {
  const colors = TABLE_STATUS_COLORS[status];
  const isClickable = status === "available" || status === "reserved-soon";

  // Chair positions around the table — evenly spaced in a circle
  const chairAngleOffset = Math.PI / table.seats; // offset so chairs don't overlap label
  const chairs = Array.from({ length: table.seats }, (_, i) => {
    const angle = (2 * Math.PI * i) / table.seats + chairAngleOffset;
    return {
      x: 60 + Math.cos(angle) * 42,
      y: 60 + Math.sin(angle) * 42,
    };
  });

  return (
    <m.div
      className="relative"
      style={{ width: 120, height: 120 }}
      whileHover={isClickable ? { scale: 1.08 } : undefined}
      whileTap={isClickable ? { scale: 0.97 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <button
        onClick={() => isClickable && onSelect(table)}
        disabled={!isClickable}
        aria-label={`Table ${table.label}, ${table.seats} seats, ${table.zone}, ${status}`}
        aria-disabled={!isClickable}
        className="relative block w-full h-full outline-none focus-visible:ring-2 focus-visible:ring-[#BF976A] rounded-full"
        style={{ cursor: isClickable ? "pointer" : "not-allowed" }}
      >
        <svg
          viewBox="0 0 120 120"
          width="120"
          height="120"
          className="overflow-visible"
        >
          {/* Glow effect for selected or hovered */}
          {isSelected && (
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="#BF976A"
              strokeWidth="2"
              opacity="0.8"
              className="animate-pulse-glow"
            />
          )}

          {/* Outer ambient glow */}
          <circle
            cx="60"
            cy="60"
            r="48"
            fill="none"
            stroke={isSelected ? "#BF976A" : colors.text}
            strokeWidth={isSelected ? 2.5 : 1}
            opacity={isSelected ? 0.6 : 0.2}
          />

          {/* Table surface */}
          <circle
            cx="60"
            cy="60"
            r="26"
            fill={isSelected ? "rgba(191,151,106,0.25)" : colors.fill}
            stroke={isSelected ? "#BF976A" : colors.text}
            strokeWidth={isSelected ? 2 : 1.2}
            style={{
              filter: isSelected
                ? "drop-shadow(0 0 12px rgba(191,151,106,0.5))"
                : `drop-shadow(0 0 6px ${colors.glow})`,
              transition: "all 0.3s ease",
            }}
          />

          {/* Table label */}
          <text
            x="60"
            y="60"
            textAnchor="middle"
            dominantBaseline="central"
            fill={isSelected ? "#BF976A" : colors.text}
            fontSize="14"
            fontFamily="var(--font-dm-mono), monospace"
            fontWeight="500"
            style={{ transition: "fill 0.3s ease" }}
          >
            {table.label}
          </text>

          {/* Chairs */}
          {chairs.map((chair, i) => (
            <g key={i}>
              <circle
                cx={chair.x}
                cy={chair.y}
                r="7"
                fill={isSelected ? "rgba(191,151,106,0.18)" : `${colors.fill}`}
                stroke={isSelected ? "#BF976A" : colors.text}
                strokeWidth={isSelected ? 1.5 : 0.8}
                opacity={isSelected ? 0.9 : 0.7}
                style={{ transition: "all 0.3s ease" }}
              />
              {/* Small inner circle to give "seat cushion" feel */}
              <circle
                cx={chair.x}
                cy={chair.y}
                r="4"
                fill={isSelected ? "rgba(191,151,106,0.12)" : colors.fill}
                opacity={0.5}
                style={{ transition: "fill 0.3s ease" }}
              />
            </g>
          ))}

          {/* Status dot */}
          <circle
            cx="60"
            cy="88"
            r="4"
            fill={isSelected ? "#BF976A" : colors.text}
            opacity={0.9}
            style={{ transition: "fill 0.3s ease" }}
          />
        </svg>
      </button>

      {/* Inline styles for the pulse animation */}
      <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; r: 50; }
          50% { opacity: 0.8; r: 54; }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>
    </m.div>
  );
}

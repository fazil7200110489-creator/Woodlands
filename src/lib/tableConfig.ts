export type TableZone = "Near Entrance" | "Center" | "Near Counter";

export type TableStatus = "available" | "booked" | "reserved-soon" | "disabled";

export type TableConfig = {
  id: number;
  seats: number;
  label: string;
  zone: TableZone;
  /** Grid position: row 0 = nearest entrance, col 0 = left, col 1 = right */
  position: { row: number; col: number };
  disabled?: boolean;
};

/**
 * Restaurant table layout — single source of truth.
 *
 * Layout:
 *          ENTRANCE
 *     T1            T2
 *          T3
 *     T4            T5
 *     T6            T7
 *          COUNTER
 *
 * To add tables or change seat counts, edit this array only.
 */
export const RESTAURANT_TABLES: TableConfig[] = [
  { id: 1, seats: 4, label: "T1", zone: "Near Entrance", position: { row: 0, col: 0 } },
  { id: 2, seats: 4, label: "T2", zone: "Near Entrance", position: { row: 0, col: 1 } },
  { id: 3, seats: 4, label: "T3", zone: "Center",        position: { row: 1, col: 0.5 } },
  { id: 4, seats: 4, label: "T4", zone: "Center",        position: { row: 2, col: 0 } },
  { id: 5, seats: 4, label: "T5", zone: "Center",        position: { row: 2, col: 1 } },
  { id: 6, seats: 4, label: "T6", zone: "Near Counter",  position: { row: 3, col: 0 } },
  { id: 7, seats: 4, label: "T7", zone: "Near Counter",  position: { row: 3, col: 1 } },
];

/** Color palette for table statuses */
export const TABLE_STATUS_COLORS: Record<TableStatus, { fill: string; glow: string; text: string }> = {
  available:      { fill: "#1A3D2A", glow: "rgba(46,204,113,0.35)", text: "#2ECC71" },
  booked:         { fill: "#3D1A1A", glow: "rgba(231,76,60,0.30)",  text: "#E74C3C" },
  "reserved-soon": { fill: "#3D351A", glow: "rgba(241,196,15,0.30)", text: "#F1C40F" },
  disabled:       { fill: "#2A2A2A", glow: "rgba(100,100,100,0.15)", text: "#666666" },
};

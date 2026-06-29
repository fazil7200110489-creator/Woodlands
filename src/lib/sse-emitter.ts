/**
 * SSE Emitter — module-level singleton for real-time admin notifications.
 *
 * The Next.js server process keeps this alive for the lifetime of the server.
 * Each admin browser tab that opens /api/orders/events registers a controller
 * here and receives newline-delimited SSE payloads.
 */

import { EventEmitter } from "events";

// Global singleton — survive hot reloads in dev via globalThis cache
const g = globalThis as typeof globalThis & {
  __woodlandsSSE?: EventEmitter;
};

if (!g.__woodlandsSSE) {
  g.__woodlandsSSE = new EventEmitter();
  g.__woodlandsSSE.setMaxListeners(50); // allow up to 50 concurrent admin tabs
}

export const sseEmitter = g.__woodlandsSSE;

// ── Event names ─────────────────────────────────────────────────────────────

export const SSE_NEW_ORDER = "new_order";
export const SSE_STATUS_CHANGE = "status_change";

// ── Payload types ────────────────────────────────────────────────────────────

export type NewOrderPayload = {
  _id: string;
  customerName: string;
  customerPhone: string;
  pickupTime: string;
  items: { name: string; qty: number; price: number }[];
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
};

export type StatusChangePayload = {
  _id: string;
  status: string;
  updatedAt: string;
};

// ── Emitter helpers ──────────────────────────────────────────────────────────

export function emitNewOrder(order: NewOrderPayload) {
  sseEmitter.emit(SSE_NEW_ORDER, order);
}

export function emitStatusChange(payload: StatusChangePayload) {
  sseEmitter.emit(SSE_STATUS_CHANGE, payload);
}

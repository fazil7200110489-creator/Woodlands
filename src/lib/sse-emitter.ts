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
export const SSE_NEW_RESERVATION = "new_reservation";
export const SSE_NEW_REVIEW = "new_review";
export const SSE_CUSTOMER_UPDATE = "customer_update";
export const SSE_ANALYTICS_REFRESH = "analytics_refresh";

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
  sseEmitter.emit(SSE_ANALYTICS_REFRESH);
}

export function emitStatusChange(payload: StatusChangePayload) {
  sseEmitter.emit(SSE_STATUS_CHANGE, payload);
  sseEmitter.emit(SSE_ANALYTICS_REFRESH);
}

export function emitNewReservation(reservation: any) {
  sseEmitter.emit(SSE_NEW_RESERVATION, reservation);
  sseEmitter.emit(SSE_ANALYTICS_REFRESH);
}

export function emitNewReview(review: any) {
  sseEmitter.emit(SSE_NEW_REVIEW, review);
}

export function emitCustomerUpdate(customer: any) {
  sseEmitter.emit(SSE_CUSTOMER_UPDATE, customer);
}

export function emitAnalyticsRefresh() {
  sseEmitter.emit(SSE_ANALYTICS_REFRESH);
}

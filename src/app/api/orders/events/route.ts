import { NextRequest } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import {
  sseEmitter,
  SSE_NEW_ORDER,
  SSE_STATUS_CHANGE,
  type NewOrderPayload,
  type StatusChangePayload,
} from "@/lib/sse-emitter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/orders/events
 *
 * Admin-only Server-Sent Events stream.
 * Emits:
 *   - event: new_order   — when a new paid order is created
 *   - event: status_change — when an admin updates an order's status
 *
 * The browser (EventSource) will auto-reconnect on disconnect.
 */
export async function GET(req: NextRequest) {
  // Auth check — same session cookie used elsewhere
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  let controllerRef: ReadableStreamDefaultController<Uint8Array> | null = null;
  const encoder = new TextEncoder();

  const send = (eventName: string, data: unknown) => {
    if (!controllerRef) return;
    try {
      const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
      controllerRef.enqueue(encoder.encode(payload));
    } catch {
      // controller already closed — ignore
    }
  };

  const onNewOrder = (data: NewOrderPayload) => send(SSE_NEW_ORDER, data);
  const onStatusChange = (data: StatusChangePayload) => send(SSE_STATUS_CHANGE, data);

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controllerRef = controller;

      // Send an initial heartbeat so the browser knows connection is alive
      controller.enqueue(encoder.encode(": connected\n\n"));

      sseEmitter.on(SSE_NEW_ORDER, onNewOrder);
      sseEmitter.on(SSE_STATUS_CHANGE, onStatusChange);
    },
    cancel() {
      // Client disconnected — clean up listeners
      sseEmitter.off(SSE_NEW_ORDER, onNewOrder);
      sseEmitter.off(SSE_STATUS_CHANGE, onStatusChange);
      controllerRef = null;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable Nginx buffering
    },
  });
}

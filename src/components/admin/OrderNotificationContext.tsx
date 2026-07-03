"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Bell, Clock, AlertTriangle, ChefHat, Package, Check, X, Phone, Banknote, ShoppingBag } from "lucide-react";
import { AnimatePresence, m, LazyMotion, domAnimation } from "framer-motion";
import { Order, OrderStatus, Reservation } from "@/lib/types";
import { toCurrency } from "@/lib/pickup";

// ── Notification and Popup Types ───────────────────────────────────────────

export type POSNotification = {
  id: string;
  type: "new_order" | "pickup_reminder" | "overdue" | "status_change";
  title: string;
  body: string;
  orderId?: string;
  timestamp: Date;
  read: boolean;
};

export type POSPopup = {
  id: string;
  type: "new_order" | "pickup_reminder";
  order: Order;
  timestamp: Date;
};

interface OrderNotificationContextProps {
  orders: Order[];
  reservations: Reservation[];
  totalCustomers: number;
  notifications: POSNotification[];
  unreadCount: number;
  updateOrderStatus: (id: string, newStatus: OrderStatus) => Promise<boolean>;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  loadAllData: () => Promise<void>;
  isLoading: boolean;
}

const OrderNotificationContext = createContext<OrderNotificationContextProps | undefined>(undefined);

// ── Audio Helper ───────────────────────────────────────────────────────────

function playPOSChime(type: "order" | "reminder" | "overdue" = "order") {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const notes =
      type === "order"
        ? [523, 659, 784, 1047] // C5 E5 G5 C6 — cheerful ascending
        : type === "reminder"
        ? [784, 659, 784] // G5 E5 G5 — gentle reminder
        : [200, 150]; // low warning

    let t = ctx.currentTime;
    notes.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.start(t);
      osc.stop(t + 0.25);
      t += 0.16;
    });
  } catch {
    // Silently ignore audio failure
  }
}

// ── Overdue Helpers ────────────────────────────────────────────────────────

function parsePickupTime(pickupTime: string): Date | null {
  try {
    const now = new Date();
    const [timePart, meridiem] = pickupTime.trim().split(" ");
    const [hStr, mStr] = timePart.split(":");
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (meridiem?.toUpperCase() === "PM" && h !== 12) h += 12;
    if (meridiem?.toUpperCase() === "AM" && h === 12) h = 0;
    const d = new Date(now);
    d.setHours(h, m, 0, 0);
    return d;
  } catch {
    return null;
  }
}

function minutesUntilPickup(pickupTime: string): number {
  const pt = parsePickupTime(pickupTime);
  if (!pt) return Infinity;
  return Math.round((pt.getTime() - Date.now()) / 60000);
}

// ── Provider Component ──────────────────────────────────────────────────────

export function OrderNotificationProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [notifications, setNotifications] = useState<POSNotification[]>([]);
  const [popups, setPopups] = useState<POSPopup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();

  // Track notifications to prevent spam
  const remindedOrders = useRef<Set<string>>(new Set());
  const overdueOrders = useRef<Set<string>>(new Set());

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Load all initial data from existing APIs
  const loadAllData = useCallback(async () => {
    try {
      const [ordersRes, reservationsRes, customersRes] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/reservations"),
        fetch("/api/admin/customers?limit=1"),
      ]);

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData);
      }

      if (reservationsRes.ok) {
        const reservationsData = await reservationsRes.json();
        setReservations(reservationsData);
      }

      if (customersRes.ok) {
        const customerData = await customersRes.json();
        setTotalCustomers(customerData.stats?.totalCustomers || 0);
      }
    } catch (e) {
      console.error("[POS Context] Failed to fetch layout data:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize data on mount
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Update order status in DB & local state
  const updateOrderStatus = async (id: string, newStatus: OrderStatus): Promise<boolean> => {
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        const updated = await res.json();
        setOrders((prev) => prev.map((o) => (o._id === id ? updated : o)));
        return true;
      }
      return false;
    } catch (e) {
      console.error("[POS Context] Failed to update status:", e);
      return false;
    }
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // ── Establish Real-Time SSE Stream ──────────────────────────────────────────

  useEffect(() => {
    let es: EventSource;
    let retryTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      es = new EventSource("/api/orders/events");

      es.addEventListener("new_order", (e) => {
        const order = JSON.parse(e.data) as Order;
        
        // Update orders list
        setOrders((prev) => {
          if (prev.some((o) => o._id === order._id)) return prev;
          return [order, ...prev];
        });

        // Add Notification log
        const notif: POSNotification = {
          id: `new_${order._id}_${Date.now()}`,
          type: "new_order",
          title: "🔔 New Paid Order",
          body: `${order.customerName} · ${order.pickupTime} · ${toCurrency(order.totalAmount)}`,
          orderId: order._id,
          timestamp: new Date(),
          read: false,
        };
        setNotifications((prev) => [notif, ...prev].slice(0, 50));

        // Add floating Popup Card
        setPopups((prev) => {
          // Prevent duplicates
          if (prev.some((p) => p.order._id === order._id)) return prev;
          return [...prev, { id: `popup_new_${order._id}`, type: "new_order", order, timestamp: new Date() }];
        });

        // Play sound
        playPOSChime("order");
      });

      es.addEventListener("status_change", (e) => {
        const { _id, status } = JSON.parse(e.data);
        
        setOrders((prev) =>
          prev.map((o) => (o._id === _id ? { ...o, status } : o))
        );

        // Remove active popups for this order if status changes
        setPopups((prev) => prev.filter((p) => p.order._id !== _id));
      });

      es.addEventListener("new_reservation", (e) => {
        const res = JSON.parse(e.data);
        setReservations((prev) => {
          if (prev.some((r) => r.referenceId === res.referenceId)) return prev;
          return [res, ...prev];
        });

        const notif: POSNotification = {
          id: `res_${res.referenceId}_${Date.now()}`,
          type: "status_change",
          title: "🗓️ New Reservation",
          body: `${res.customerName} · Table ${res.tableNumber || "TBD"} · ${res.date} @ ${res.timeSlot}`,
          timestamp: new Date(),
          read: false,
        };
        setNotifications((prev) => [notif, ...prev].slice(0, 50));
        playPOSChime("reminder");
      });

      es.addEventListener("analytics_refresh", () => {
        loadAllData();
      });

      es.onerror = () => {
        es.close();
        retryTimeout = setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      es?.close();
      clearTimeout(retryTimeout);
    };
  }, [loadAllData]);

  // ── Periodic Monitor for Reminders & Overdues (15s interval) ────────────────

  useEffect(() => {
    const checkTimers = () => {
      const now = Date.now();
      const activeOrders = orders.filter(
        (o) => o.status !== "Completed" && o.status !== "Cancelled"
      );

      activeOrders.forEach((o) => {
        const mins = minutesUntilPickup(o.pickupTime);

        // 1. Pickup Reminder (15 minutes before pickup, up to -5 min margin)
        if (mins <= 15 && mins > -5 && !remindedOrders.current.has(o._id)) {
          remindedOrders.current.add(o._id);

          // Add to notification panel
          const notif: POSNotification = {
            id: `rem_${o._id}_${now}`,
            type: "pickup_reminder",
            title: "⏰ Pickup Reminder Soon",
            body: `${o.customerName} · Pickup is in ${mins <= 0 ? "a few minutes" : `${mins} min`}!`,
            orderId: o._id,
            timestamp: new Date(),
            read: false,
          };
          setNotifications((prev) => [notif, ...prev].slice(0, 50));

          // Only trigger popup if not completed/ready already
          if (o.status !== "Ready for Pickup") {
            setPopups((prev) => {
              if (prev.some((p) => p.order._id === o._id && p.type === "pickup_reminder")) return prev;
              return [...prev, { id: `popup_rem_${o._id}`, type: "pickup_reminder", order: o, timestamp: new Date() }];
            });
            playPOSChime("reminder");
          }
        }

        // 2. Overdue Monitor (pickup time has passed and status is not Completed/Cancelled)
        const pt = parsePickupTime(o.pickupTime);
        if (pt && now > pt.getTime() && !overdueOrders.current.has(o._id)) {
          overdueOrders.current.add(o._id);

          const elapsedMins = Math.round((now - pt.getTime()) / 60000);
          const notif: POSNotification = {
            id: `over_${o._id}_${now}`,
            type: "overdue",
            title: "⚠️ Late Pickup Alert",
            body: `${o.customerName} is late by ${elapsedMins} min!`,
            orderId: o._id,
            timestamp: new Date(),
            read: false,
          };
          setNotifications((prev) => [notif, ...prev].slice(0, 50));
          playPOSChime("overdue");
        }
      });
    };

    checkTimers();
    const interval = setInterval(checkTimers, 15000);
    return () => clearInterval(interval);
  }, [orders]);

  // ── Actions inside Floating Popups ──────────────────────────────────────────

  const handleDismissPopup = (id: string) => {
    setPopups((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAcceptOrderFromPopup = async (orderId: string, popupId: string) => {
    const success = await updateOrderStatus(orderId, "Accepted");
    if (success) {
      handleDismissPopup(popupId);
    }
  };

  const handleMarkReadyFromPopup = async (orderId: string, popupId: string) => {
    const success = await updateOrderStatus(orderId, "Ready for Pickup");
    if (success) {
      handleDismissPopup(popupId);
    }
  };

  const handleViewOrder = (orderId: string, popupId: string) => {
    handleDismissPopup(popupId);
    router.push("/admin/orders");
  };

  return (
    <OrderNotificationContext.Provider
      value={{
        orders,
        reservations,
        totalCustomers,
        notifications,
        unreadCount,
        updateOrderStatus,
        markAllNotificationsRead,
        clearNotifications,
        loadAllData,
        isLoading,
      }}
    >
      {children}

      {/* Floating real-time popups stack in bottom-right/top-right */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-4 max-w-md w-full pointer-events-none">
        <LazyMotion features={domAnimation}>
          <AnimatePresence>
            {popups.map((p) => {
              const orderNum = p.order._id.slice(-6).toUpperCase();
              const pt = parsePickupTime(p.order.pickupTime);
              const isLate = pt ? Date.now() > pt.getTime() : false;
              
              return (
                <m.div
                  key={p.id}
                  initial={{ opacity: 0, y: 50, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 100, transition: { duration: 0.2 } }}
                  className="pointer-events-auto w-full bg-white/95 border border-gray-100/80 rounded-2xl shadow-2xl backdrop-blur-md p-5 flex flex-col overflow-hidden text-gray-900 border-l-4 border-l-[#BF976A]"
                  style={{
                    borderLeftColor: p.type === "pickup_reminder" ? "#F59E0B" : "#BF976A"
                  }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between border-b border-gray-100 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      {p.type === "new_order" ? (
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#BF976A]/10 text-[#BF976A]">
                          <Bell size={16} className="animate-bounce" />
                        </span>
                      ) : (
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                          <Clock size={16} className="animate-pulse" />
                        </span>
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                          {p.type === "new_order" ? "🔔 New Order Received" : "⏰ Pickup Reminder"}
                        </h4>
                        <p className="text-[10px] text-gray-400 font-mono">#{orderNum}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDismissPopup(p.id)}
                      className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Details */}
                  <div className="space-y-2.5 text-xs text-gray-700 mb-4">
                    <div className="grid grid-cols-3">
                      <span className="text-gray-400 font-semibold">Customer</span>
                      <span className="col-span-2 font-medium text-gray-900">{p.order.customerName}</span>
                    </div>

                    <div className="grid grid-cols-3">
                      <span className="text-gray-400 font-semibold">Pickup Time</span>
                      <span className="col-span-2 font-semibold text-[#BF976A] flex items-center gap-1">
                        {p.order.pickupTime}
                        {isLate && <span className="text-red-500 text-[10px] font-bold">(Overdue)</span>}
                      </span>
                    </div>

                    {p.type === "pickup_reminder" && (
                      <div className="grid grid-cols-3">
                        <span className="text-gray-400 font-semibold">Status</span>
                        <span className="col-span-2 font-medium text-amber-600">{p.order.status}</span>
                      </div>
                    )}

                    <div className="border-t border-gray-50 my-1 pt-1">
                      <span className="text-gray-400 font-semibold block mb-1">Items</span>
                      <div className="max-h-20 overflow-y-auto space-y-0.5 pl-1">
                        {p.order.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-[11px] text-gray-800">
                            <span>{it.qty} × {it.name}</span>
                            <span className="text-gray-400">{toCurrency(it.price * it.qty)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between border-t border-gray-100 pt-2 font-semibold text-gray-900">
                      <span>Total Amount</span>
                      <span className="text-emerald-600">{toCurrency(p.order.totalAmount)}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md self-start">
                      <Check size={10} /> Paid ✓
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewOrder(p.order._id, p.id)}
                      className="flex-1 rounded-xl border border-gray-200 bg-white py-2 text-center text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      View Order
                    </button>

                    {p.type === "new_order" && p.order.status === "Pending" && (
                      <button
                        onClick={() => handleAcceptOrderFromPopup(p.order._id, p.id)}
                        className="flex-1 rounded-xl bg-[#1D0F07] hover:bg-[#BF976A] py-2 text-center text-xs font-semibold text-white transition-colors"
                      >
                        Accept Order
                      </button>
                    )}

                    {p.type === "pickup_reminder" && p.order.status === "Preparing" && (
                      <button
                        onClick={() => handleMarkReadyFromPopup(p.order._id, p.id)}
                        className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2 text-center text-xs font-semibold text-white transition-colors"
                      >
                        Mark Ready
                      </button>
                    )}

                    <button
                      onClick={() => handleDismissPopup(p.id)}
                      className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </m.div>
              );
            })}
          </AnimatePresence>
        </LazyMotion>
      </div>
    </OrderNotificationContext.Provider>
  );
}

export function usePOS() {
  const context = useContext(OrderNotificationContext);
  if (!context) {
    throw new Error("usePOS must be used within an OrderNotificationProvider");
  }
  return context;
}

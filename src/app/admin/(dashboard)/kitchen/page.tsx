"use client";

import { useMemo, useState, useEffect } from "react";
import { usePOS } from "@/components/admin/OrderNotificationContext";
import { Order, OrderStatus } from "@/lib/types";
import { 
  Clock, 
  ChefHat, 
  Package, 
  Maximize2, 
  Minimize2, 
  Check, 
  AlertTriangle 
} from "lucide-react";
import { AnimatePresence, m, LazyMotion, domAnimation } from "framer-motion";

// Helper to parse pickup times
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

export default function KitchenDisplayPage() {
  const { orders, updateOrderStatus, isLoading } = usePOS();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Keep a running clock to update elapsed times instantly
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  // Group active orders into Columns
  const groupedOrders = useMemo(() => {
    // Show only active, unpaid orders are not saved, completed/cancelled are ignored
    const active = orders.filter(
      (o) => ["Pending", "Accepted", "Preparing", "Ready for Pickup"].includes(o.status)
    );

    return {
      newOrders: active.filter((o) => ["Pending", "Accepted"].includes(o.status)),
      preparingOrders: active.filter((o) => o.status === "Preparing"),
      readyOrders: active.filter((o) => o.status === "Ready for Pickup"),
    };
  }, [orders]);

  const handleCardClick = async (orderId: string, currentStatus: OrderStatus) => {
    if (["Pending", "Accepted"].includes(currentStatus)) {
      await updateOrderStatus(orderId, "Preparing");
    } else if (currentStatus === "Preparing") {
      await updateOrderStatus(orderId, "Ready for Pickup");
    } else if (currentStatus === "Ready for Pickup") {
      await updateOrderStatus(orderId, "Completed");
    }
  };

  const getElapsedTime = (createdAt: string) => {
    const diff = currentTime.getTime() - new Date(createdAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    return `${mins}m ago`;
  };

  if (isLoading) {
    return (
      <div className="h-[80vh] flex items-center justify-center animate-pulse text-gray-500 font-medium">
        Loading active kitchen orders...
      </div>
    );
  }

  const { newOrders, preparingOrders, readyOrders } = groupedOrders;

  return (
    <div className={`space-y-6 flex flex-col h-full ${isFullscreen ? "p-6 bg-gray-900 text-white min-h-screen" : ""}`}>
      
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h1 className={`text-2xl font-bold font-display ${isFullscreen ? "text-white" : "text-gray-900"}`}>
            Kitchen Display Board
          </h1>
          <p className={`text-sm ${isFullscreen ? "text-gray-400" : "text-gray-500"} mt-0.5`}>
            {newOrders.length + preparingOrders.length + readyOrders.length} active tickets
          </p>
        </div>

        <div className="flex items-center gap-4">
          <span className={`text-sm font-mono font-semibold px-3 py-1.5 rounded-lg ${isFullscreen ? "bg-gray-800 text-gray-200" : "bg-gray-100 text-gray-700"}`}>
            🕒 {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>

          <button
            onClick={toggleFullscreen}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all border ${
              isFullscreen 
                ? "bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700" 
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm"
            }`}
          >
            {isFullscreen ? (
              <>
                <Minimize2 size={14} /> Exit Fullscreen
              </>
            ) : (
              <>
                <Maximize2 size={14} /> Fullscreen Mode
              </>
            )}
          </button>
        </div>
      </div>

      {/* Columns Grid */}
      <LazyMotion features={domAnimation}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start h-[calc(100vh-140px)] overflow-hidden">
          
          {/* COLUMN 1: NEW */}
          <div className={`flex flex-col h-full rounded-2xl border ${isFullscreen ? "bg-gray-800/40 border-gray-800" : "bg-gray-50 border-gray-100"} overflow-hidden`}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-amber-500/10 text-amber-600 font-bold tracking-wider text-xs">
              <span className="flex items-center gap-2">
                <Clock size={16} className="animate-pulse" /> NEW ({newOrders.length})
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence mode="popLayout">
                {newOrders.map((order) => (
                  <m.div
                    key={order._id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.2 }}
                  >
                    <KitchenCard 
                      order={order} 
                      isFullscreen={isFullscreen} 
                      getElapsedTime={getElapsedTime} 
                      onClick={() => handleCardClick(order._id, order.status)} 
                      nextLabel="Start Preparing"
                      accentColor="amber"
                    />
                  </m.div>
                ))}
              </AnimatePresence>

              {newOrders.length === 0 && (
                <div className="h-40 flex items-center justify-center text-gray-400 text-sm italic">
                  No new orders.
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 2: PREPARING */}
          <div className={`flex flex-col h-full rounded-2xl border ${isFullscreen ? "bg-gray-800/40 border-gray-800" : "bg-gray-50 border-gray-100"} overflow-hidden`}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-orange-500/10 text-orange-600 font-bold tracking-wider text-xs">
              <span className="flex items-center gap-2">
                <ChefHat size={16} /> PREPARING ({preparingOrders.length})
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence mode="popLayout">
                {preparingOrders.map((order) => (
                  <m.div
                    key={order._id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.2 }}
                  >
                    <KitchenCard 
                      order={order} 
                      isFullscreen={isFullscreen} 
                      getElapsedTime={getElapsedTime} 
                      onClick={() => handleCardClick(order._id, order.status)} 
                      nextLabel="Mark Ready"
                      accentColor="orange"
                    />
                  </m.div>
                ))}
              </AnimatePresence>

              {preparingOrders.length === 0 && (
                <div className="h-40 flex items-center justify-center text-gray-400 text-sm italic">
                  Kitchen is currently idle.
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 3: READY */}
          <div className={`flex flex-col h-full rounded-2xl border ${isFullscreen ? "bg-gray-800/40 border-gray-800" : "bg-gray-50 border-gray-100"} overflow-hidden`}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-emerald-500/10 text-emerald-600 font-bold tracking-wider text-xs">
              <span className="flex items-center gap-2">
                <Package size={16} /> READY ({readyOrders.length})
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence mode="popLayout">
                {readyOrders.map((order) => (
                  <m.div
                    key={order._id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.2 }}
                  >
                    <KitchenCard 
                      order={order} 
                      isFullscreen={isFullscreen} 
                      getElapsedTime={getElapsedTime} 
                      onClick={() => handleCardClick(order._id, order.status)} 
                      nextLabel="Complete Ticket"
                      accentColor="emerald"
                    />
                  </m.div>
                ))}
              </AnimatePresence>

              {readyOrders.length === 0 && (
                <div className="h-40 flex items-center justify-center text-gray-400 text-sm italic">
                  No orders waiting for pickup.
                </div>
              )}
            </div>
          </div>

        </div>
      </LazyMotion>
    </div>
  );
}

// ── Kitchen Ticket Card ───────────────────────────────────────────────────────

function KitchenCard({
  order,
  isFullscreen,
  getElapsedTime,
  onClick,
  nextLabel,
  accentColor,
}: {
  order: Order;
  isFullscreen: boolean;
  getElapsedTime: (createdAt: string) => string;
  onClick: () => void;
  nextLabel: string;
  accentColor: "amber" | "orange" | "emerald";
}) {
  const orderNum = order._id.slice(-6).toUpperCase();
  const pt = parsePickupTime(order.pickupTime);
  const isLate = pt ? Date.now() > pt.getTime() : false;
  const lateMins = pt ? Math.round((Date.now() - pt.getTime()) / 60000) : 0;

  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer relative border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between select-none ${
        isFullscreen 
          ? "bg-gray-800 hover:bg-gray-750 border-gray-700" 
          : "bg-white hover:border-[#BF976A]/40 border-gray-100"
      } ${isLate ? "border-red-400/80 ring-2 ring-red-500/10" : ""}`}
    >
      {/* Overdue Banner */}
      {isLate && (
        <div className="mb-3 flex items-center gap-1.5 rounded-lg bg-red-500/10 text-red-500 px-3 py-1 text-xs font-bold font-mono">
          <AlertTriangle size={12} /> LATE PICKUP · BY {lateMins} MINS
        </div>
      )}

      {/* Header info */}
      <div className="flex items-start justify-between mb-3.5">
        <div>
          <span className={`text-xs font-mono font-bold tracking-wider px-2 py-0.5 rounded ${
            isFullscreen ? "bg-gray-750 text-gray-300" : "bg-gray-100 text-gray-500"
          }`}>
            #{orderNum}
          </span>
          <h3 className={`text-base font-bold mt-1.5 ${isFullscreen ? "text-white" : "text-gray-900"}`}>
            {order.customerName}
          </h3>
        </div>
        
        <div className="text-right">
          <span className={`text-[10px] font-semibold block ${isFullscreen ? "text-gray-400" : "text-gray-400"}`}>
            Placed {getElapsedTime(order.createdAt)}
          </span>
          <span className={`text-xs font-bold block mt-0.5 text-emerald-500`}>
            Paid ✓
          </span>
        </div>
      </div>

      {/* Items list */}
      <div className={`border-t border-b py-3 my-1.5 space-y-1.5 ${
        isFullscreen ? "border-gray-700" : "border-gray-50"
      }`}>
        {order.items.map((it, idx) => (
          <div key={idx} className="flex justify-between items-center text-sm">
            <span className={`font-semibold ${isFullscreen ? "text-gray-200" : "text-gray-800"}`}>
              {it.qty} × {it.name}
            </span>
          </div>
        ))}
      </div>

      {/* Footer timers & actions */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs font-medium">
          <Clock size={12} className={isLate ? "text-red-500" : "text-[#BF976A]"} />
          <span className={isFullscreen ? "text-gray-300" : "text-gray-600"}>
            Pickup: <strong className={isLate ? "text-red-500" : isFullscreen ? "text-white" : "text-gray-800"}>{order.pickupTime}</strong>
          </span>
        </div>

        {/* Action Button HUD */}
        <button
          className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors text-white ${
            accentColor === "amber" ? "bg-amber-600 group-hover:bg-amber-700" :
            accentColor === "orange" ? "bg-orange-600 group-hover:bg-orange-700" :
            "bg-emerald-600 group-hover:bg-emerald-700"
          }`}
        >
          <Check size={12} /> {nextLabel}
        </button>
      </div>
    </div>
  );
}

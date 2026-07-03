import { Bell, Menu, Search, User, Trash2, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { usePOS } from "@/components/admin/OrderNotificationContext";

export default function Header({ 
  onMenuClick, 
  user 
}: { 
  onMenuClick: () => void; 
  user?: { username: string; role: string } 
}) {
  const { notifications, unreadCount, markAllNotificationsRead, clearNotifications, orders } = usePOS();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBellClick = () => {
    setDropdownOpen(!dropdownOpen);
    if (!dropdownOpen) {
      // Mark read when opening the dropdown
      markAllNotificationsRead();
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between bg-white px-4 shadow-sm md:px-6">
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="mr-4 rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 md:hidden"
        >
          <Menu size={20} />
        </button>
        
        <div className="hidden md:flex relative w-64">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-full border-0 bg-gray-100 py-2 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-[#BF976A] sm:text-sm sm:leading-6 transition-colors"
            placeholder="Search..."
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Bell with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={handleBellClick}
            className="relative rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 transition-colors"
          >
            <Bell size={20} className={unreadCount > 0 ? "text-[#BF976A] animate-swing" : ""} />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 z-50 w-96 rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden animate-fade-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                <span className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Bell size={16} className="text-[#BF976A]" /> Notifications
                </span>
                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium transition-colors"
                  >
                    <Trash2 size={12} /> Clear all
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center">
                    <Bell size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-400">All caught up! No notifications.</p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const matchedOrder = n.orderId ? orders.find(o => o._id === n.orderId) : null;
                    const isUnread = !n.read;

                    return (
                      <div
                        key={n.id}
                        className={`p-4 transition-colors ${
                          isUnread ? "bg-[#BF976A]/5" : "bg-white hover:bg-gray-50/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-1.5">
                              {isUnread && (
                                <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                              )}
                              <p className={`text-xs font-semibold ${isUnread ? "text-gray-900" : "text-gray-700"}`}>
                                {n.title}
                              </p>
                            </div>
                            
                            {/* Detailed Order Info */}
                            {matchedOrder ? (
                              <div className="text-xs space-y-1.5 pl-3.5">
                                <div className="flex justify-between text-gray-600">
                                  <span>Customer: <strong>{matchedOrder.customerName}</strong></span>
                                  <span className="text-gray-500 font-mono">#{matchedOrder._id.slice(-6).toUpperCase()}</span>
                                </div>
                                <div className="flex justify-between text-gray-500">
                                  <span>Pickup: <strong className="text-[#BF976A]">{matchedOrder.pickupTime}</strong></span>
                                  <span>Amount: <strong className="text-emerald-600">₹{matchedOrder.totalAmount}</strong></span>
                                </div>
                                <div className="flex items-center gap-1 text-[10px]">
                                  <span className="text-gray-400 font-medium">Status:</span>
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                                    matchedOrder.status === "Pending" ? "bg-amber-100 text-amber-800" :
                                    matchedOrder.status === "Accepted" ? "bg-blue-100 text-blue-800" :
                                    matchedOrder.status === "Preparing" ? "bg-orange-100 text-orange-800" :
                                    matchedOrder.status === "Ready for Pickup" ? "bg-emerald-100 text-emerald-800" :
                                    matchedOrder.status === "Completed" ? "bg-gray-100 text-gray-800" :
                                    "bg-red-100 text-red-800"
                                  }`}>
                                    {matchedOrder.status}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-600 pl-3.5">{n.body}</p>
                            )}

                            <span className="block text-[9px] text-gray-400 pl-3.5">
                              {new Date(n.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {notifications.length > 0 && (
                <div className="bg-gray-50 px-4 py-2 text-center border-t border-gray-100">
                  <Link 
                    href="/admin/orders" 
                    onClick={() => setDropdownOpen(false)}
                    className="text-xs font-semibold text-[#BF976A] hover:text-[#1D0F07] transition-colors"
                  >
                    View All Orders
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
        
        <Link href="/admin/profile" className="flex items-center gap-3 border-l pl-4 hover:opacity-85 transition-opacity">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#BF976A] text-white">
            <User size={16} />
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-semibold text-gray-900">{user?.username || "Admin"}</span>
            <span className="text-[10px] text-gray-400 capitalize">{user?.role || "Staff"}</span>
          </div>
        </Link>
      </div>

      <style jsx global>{`
        @keyframes swing {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-10deg); }
          40% { transform: rotate(10deg); }
          60% { transform: rotate(-5deg); }
          80% { transform: rotate(5deg); }
        }
        .animate-swing {
          animation: swing 1s ease-in-out infinite;
          transform-origin: top center;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </header>
  );
}


"use client";

import { useEffect, useState } from "react";
import { toCurrency } from "@/lib/pickup";
import { Clock, CheckCircle2, XCircle, ChevronDown, Search } from "lucide-react";

type Order = {
  _id: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  pickupTime: string;
  totalAmount: number;
  status: "Pending" | "Completed" | "Cancelled";
  items: { name: string; qty: number; price: number }[];
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const load = async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) setOrders(await res.json());
    } catch (e) {
      console.error(e);
    }
  };
  useEffect(() => { load(); }, []);

  const handleStatusUpdate = async (id: string, newStatus: "Pending" | "Completed" | "Cancelled") => {
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      
      if (res.ok) {
        const updated = await res.json();
        setOrders(orders.map(o => o._id === id ? updated : o));

        if (newStatus === "Completed") {
          const order = orders.find(o => o._id === id);
          if (order) {
            const itemsList = order.items.map(i => `- ${i.qty}x ${i.name}`).join("\n");
            const message = `Hello ${order.customerName}, your Woodlands order is ready! 🍳\n\nOrder Details:\n${itemsList}\n\nTotal: ${toCurrency(order.totalAmount)}\nPickup Time: ${order.pickupTime}\n\nThank you for ordering with us!`;
            
            const cleanPhone = order.customerPhone.replace(/\D/g, "");
            const recipient = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
            const waUrl = `https://wa.me/${recipient}?text=${encodeURIComponent(message)}`;
            window.open(waUrl, "_blank");
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o._id.includes(search) || o.customerName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900 font-display">Orders</h1>
      </div>

      <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by Order ID or Customer..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-gray-200 py-2 pl-9 pr-4 text-sm focus:border-[#BF976A] focus:outline-none focus:ring-1 focus:ring-[#BF976A]"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-sm text-gray-500">Filter:</span>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-gray-200 py-2 pl-3 pr-8 text-sm focus:border-[#BF976A] focus:outline-none focus:ring-1 focus:ring-[#BF976A]"
            >
              <option value="All">All Orders</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white text-gray-500 whitespace-nowrap">
              <tr>
                <th className="px-6 py-4 font-medium">Order ID</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium min-w-[200px]">Items</th>
                <th className="px-6 py-4 font-medium">Total</th>
                <th className="px-6 py-4 font-medium">Pickup Time</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredOrders.map((o) => (
                <tr key={o._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-gray-900">#{o._id.slice(-6).toUpperCase()}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{o.customerName}</div>
                    <div className="text-xs text-gray-500">{o.customerPhone}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <ul className="list-disc list-inside space-y-1">
                      {o.items?.map((item, idx) => (
                        <li key={idx} className="text-xs">
                          {item.qty}x {item.name}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{toCurrency(o.totalAmount)}</td>
                  <td className="px-6 py-4 text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock size={14} className="text-gray-400" />
                      {o.pickupTime}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium
                      ${o.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' : 
                        o.status === 'Pending' ? 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20' : 
                        'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10'}
                    `}>
                      {o.status === 'Completed' && <CheckCircle2 size={12} />}
                      {o.status === 'Pending' && <Clock size={12} />}
                      {o.status === 'Cancelled' && <XCircle size={12} />}
                      {o.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative inline-block text-left group">
                      <button className="flex items-center gap-1 text-sm text-[#BF976A] hover:text-[#9B7340] font-medium">
                        Update <ChevronDown size={14} />
                      </button>
                      <div className="absolute right-0 top-full z-10 mt-1 hidden w-32 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none group-hover:block">
                        <div className="py-1">
                          <button onClick={() => handleStatusUpdate(o._id, "Pending")} className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">Pending</button>
                          <button onClick={() => handleStatusUpdate(o._id, "Completed")} className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">Completed</button>
                          <button onClick={() => handleStatusUpdate(o._id, "Cancelled")} className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50">Cancel Order</button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No orders found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

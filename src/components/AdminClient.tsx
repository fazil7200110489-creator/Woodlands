"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { MenuItem } from "@/lib/types";
import { categories } from "@/lib/menuData";
import { toCurrency } from "@/lib/pickup";

type Order = {
  _id: string;
  createdAt: string;
  customerName: string;
  pickupTime: string;
  totalAmount: number;
  status: "Pending" | "Completed" | "Cancelled";
  items: { name: string; qty: number }[];
};

export default function AdminClient() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState({ shopOpen: true, acceptingOrders: true, busyMode: false, holidayMode: false });
  const [newItem, setNewItem] = useState({ name: "", price: 0, category: "Shawarma", image: "", inStock: true });

  const load = async () => {
    setMenu(await fetch("/api/menu").then((r) => r.json()));
    setOrders(await fetch("/api/orders").then((r) => r.json()));
    setSettings(await fetch("/api/settings").then((r) => r.json()));
  };
  useEffect(() => { load(); }, []);

  const metrics = useMemo(() => {
    const todayKey = new Date().toDateString();
    const today = orders.filter((o) => new Date(o.createdAt).toDateString() === todayKey);
    const revenue = today.filter((o) => o.status !== "Cancelled").reduce((s, o) => s + o.totalAmount, 0);
    return {
      ordersToday: today.length,
      revenueToday: revenue,
      pending: today.filter((o) => o.status === "Pending").length,
      completed: today.filter((o) => o.status === "Completed").length,
    };
  }, [orders]);

  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach((o) => {
      const d = new Date(o.createdAt).toLocaleDateString("en-GB");
      map.set(d, (map.get(d) ?? 0) + o.totalAmount);
    });
    return [...map.entries()].map(([date, value]) => ({ date, value }));
  }, [orders]);

  const updateSettings = async (patch: Partial<typeof settings>) => {
    await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...settings, ...patch }) });
    load();
  };

  return (
    <main className="min-h-screen bg-bg px-4 py-6 md:px-10">
      <h1 className="mb-6 text-3xl font-semibold">Premium Admin Dashboard</h1>
      <section className="mb-6 grid gap-4 md:grid-cols-4">
        <Card label="Orders Today" value={String(metrics.ordersToday)} />
        <Card label="Revenue Today" value={toCurrency(metrics.revenueToday)} />
        <Card label="Pending Orders" value={String(metrics.pending)} />
        <Card label="Completed Orders" value={String(metrics.completed)} />
      </section>

      <section className="glass mb-6 rounded-3xl p-5">
        <h2 className="mb-3 text-xl">Reports</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="date" stroke="#d1d5db" />
              <YAxis stroke="#d1d5db" />
              <Bar dataKey="value" fill="#7c5cff" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="glass mb-6 rounded-3xl p-5">
        <h2 className="mb-3 text-xl">Orders Table</h2>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-white/70"><th>Order ID</th><th>Customer Name</th><th>Items</th><th>Amount</th><th>Pickup Time</th><th>Status</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id} className="border-t border-white/10">
                  <td className="py-2">{o._id.slice(-6)}</td>
                  <td>{o.customerName}</td>
                  <td>{o.items?.map((i) => `${i.name} x${i.qty}`).join(", ")}</td>
                  <td>{toCurrency(o.totalAmount)}</td>
                  <td>{o.pickupTime}</td>
                  <td>{o.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="glass mb-6 rounded-3xl p-5">
        <h2 className="mb-3 text-xl">Menu Management</h2>
        <div className="mb-4 grid gap-2 rounded-xl bg-white/5 p-3 md:grid-cols-5">
          <input placeholder="Item name" className="rounded bg-black/30 px-2 py-1" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
          <input placeholder="Price" type="number" className="rounded bg-black/30 px-2 py-1" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })} />
          <select className="rounded bg-black/30 px-2 py-1" value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}>{categories.map((c) => <option key={c}>{c}</option>)}</select>
          <input placeholder="Image URL" className="rounded bg-black/30 px-2 py-1" value={newItem.image} onChange={(e) => setNewItem({ ...newItem, image: e.target.value })} />
          <button className="rounded bg-accent px-3 py-1" onClick={() => fetch("/api/menu", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newItem) }).then(load)}>Add Item</button>
        </div>
        <div className="space-y-2">
          {menu.map((m) => (
            <div key={m._id || m.name} className="flex items-center gap-2 rounded-xl bg-white/5 p-2">
              <input defaultValue={m.name} className="w-40 rounded bg-black/30 px-2 py-1" onBlur={(e) => m._id && fetch("/api/menu", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...m, name: e.target.value }) }).then(load)} />
              <input defaultValue={m.price} type="number" className="w-24 rounded bg-black/30 px-2 py-1" onBlur={(e) => m._id && fetch("/api/menu", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...m, price: Number(e.target.value) }) }).then(load)} />
              <select defaultValue={m.category} className="rounded bg-black/30 px-2 py-1" onChange={(e) => m._id && fetch("/api/menu", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...m, category: e.target.value }) }).then(load)}>{categories.map((c) => <option key={c}>{c}</option>)}</select>
              <button className="rounded bg-white/10 px-3 py-1" onClick={() => m._id && fetch("/api/menu", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...m, inStock: !m.inStock }) }).then(load)}>{m.inStock ? "In Stock" : "Out of Stock"}</button>
              <button className="rounded bg-red-500/30 px-3 py-1" onClick={() => m._id && fetch("/api/menu", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: m._id }) }).then(load)}>Delete</button>
            </div>
          ))}
        </div>
      </section>

      <section className="glass rounded-3xl p-5">
        <h2 className="mb-3 text-xl">Store Controls</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Toggle label="Shop Open / Closed" active={settings.shopOpen} onClick={() => updateSettings({ shopOpen: !settings.shopOpen })} />
          <Toggle label="Accepting Orders ON / OFF" active={settings.acceptingOrders} onClick={() => updateSettings({ acceptingOrders: !settings.acceptingOrders })} />
          <Toggle label="Busy Mode" active={settings.busyMode} onClick={() => updateSettings({ busyMode: !settings.busyMode })} />
          <Toggle label="Holiday Mode" active={settings.holidayMode} onClick={() => updateSettings({ holidayMode: !settings.holidayMode })} />
        </div>
      </section>
    </main>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return <div className="glass rounded-2xl p-4"><p className="text-sm text-white/60">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>;
}

function Toggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <button onClick={onClick} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3"><span>{label}</span><span className={`rounded-full px-3 py-1 text-xs ${active ? "bg-emerald-500/30" : "bg-red-500/30"}`}>{active ? "ON" : "OFF"}</span></button>;
}

"use client";

import { useEffect, useState } from "react";
import { MenuItem } from "@/lib/types";
import { categories } from "@/lib/menuData";
import { Plus, Edit2, Trash2, Search } from "lucide-react";
import Image from "next/image";
import { toCurrency } from "@/lib/pickup";

export default function MenuManagementPage() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [search, setSearch] = useState("");
  const [newItem, setNewItem] = useState({ name: "", price: 0, category: "Shawarma", image: "", inStock: true });
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/menu");
      if (res.ok) setMenu(await res.json());
    } catch (e) {
      console.error(e);
    }
  };
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    await fetch("/api/menu", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newItem) });
    setShowAddModal(false);
    load();
  };

  const handleUpdate = async (m: MenuItem, field: string, value: any) => {
    if (!m._id) return;
    await fetch("/api/menu", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...m, [field]: value }) });
    load();
  };

  const handleDelete = async (id: string | null) => {
    if (!id) return;
    await fetch("/api/menu", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setDeleteItemId(null);
    load();
  };

  const filteredMenu = menu.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900 font-display">Menu Management</h1>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-[#1D0F07] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#BF976A]"
        >
          <Plus size={16} /> Add New Item
        </button>
      </div>

      <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search items or categories..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-gray-200 py-2 pl-9 pr-4 text-sm focus:border-[#BF976A] focus:outline-none focus:ring-1 focus:ring-[#BF976A]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left text-sm">
            <thead className="bg-white text-gray-500">
              <tr>
                <th className="px-6 py-4 font-medium">Item</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Price</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredMenu.map((m) => (
                <tr key={m._id || m.name} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                        {m.image ? <Image src={m.image} alt={m.name} fill className="object-cover" /> : <div className="h-full w-full bg-gray-200" />}
                      </div>
                      <input 
                        defaultValue={m.name} 
                        onBlur={(e) => handleUpdate(m, 'name', e.target.value)}
                        className="font-medium text-gray-900 bg-transparent border-b border-transparent focus:border-[#BF976A] focus:outline-none px-1 py-0.5"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      defaultValue={m.category} 
                      onChange={(e) => handleUpdate(m, 'category', e.target.value)}
                      className="rounded border border-gray-200 bg-transparent px-2 py-1 text-gray-600 focus:border-[#BF976A] focus:outline-none"
                    >
                      {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-1">₹</span>
                      <input 
                        defaultValue={m.price} 
                        type="number"
                        onBlur={(e) => handleUpdate(m, 'price', Number(e.target.value))}
                        className="w-20 rounded border border-gray-200 bg-transparent px-2 py-1 text-gray-900 focus:border-[#BF976A] focus:outline-none"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleUpdate(m, 'inStock', !m.inStock)}
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${m.inStock ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10'}`}
                    >
                      {m.inStock ? "In Stock" : "Out of Stock"}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => m._id && setDeleteItemId(m._id)} className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-md hover:bg-red-50">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredMenu.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No items found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-5 text-xl font-semibold text-gray-900">Add New Menu Item</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                <input 
                  type="text" 
                  className="w-full rounded-md border border-gray-300 p-2 focus:border-[#BF976A] focus:outline-none focus:ring-1 focus:ring-[#BF976A]" 
                  value={newItem.name} 
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Price (₹)</label>
                  <input 
                    type="number" 
                    className="w-full rounded-md border border-gray-300 p-2 focus:border-[#BF976A] focus:outline-none focus:ring-1 focus:ring-[#BF976A]" 
                    value={newItem.price || ''} 
                    onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })} 
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
                  <select 
                    className="w-full rounded-md border border-gray-300 p-2 focus:border-[#BF976A] focus:outline-none focus:ring-1 focus:ring-[#BF976A]" 
                    value={newItem.category} 
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  >
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Image URL</label>
                <input 
                  type="text" 
                  placeholder="/images/items/example.png"
                  className="w-full rounded-md border border-gray-300 p-2 focus:border-[#BF976A] focus:outline-none focus:ring-1 focus:ring-[#BF976A]" 
                  value={newItem.image} 
                  onChange={(e) => setNewItem({ ...newItem, image: e.target.value })} 
                />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAdd}
                  disabled={!newItem.name || !newItem.price}
                  className="rounded-lg bg-[#1D0F07] px-4 py-2 text-sm font-medium text-white hover:bg-[#BF976A] disabled:opacity-50"
                >
                  Add Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteItemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-gray-100">
            <h2 className="mb-2 text-lg font-semibold text-gray-900 font-display">Delete Item</h2>
            <p className="mb-6 text-sm text-gray-500 leading-relaxed">
              Are you sure you want to delete this menu item? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeleteItemId(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDelete(deleteItemId)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

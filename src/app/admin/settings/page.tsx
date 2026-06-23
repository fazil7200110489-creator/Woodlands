"use client";

import { useEffect, useState } from "react";
import { Store, ShoppingCart, CalendarOff, BellOff } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState({ shopOpen: true, acceptingOrders: true, busyMode: false, holidayMode: false });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) setSettings(await res.json());
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const updateSettings = async (patch: Partial<typeof settings>) => {
    const newSettings = { ...settings, ...patch };
    setSettings(newSettings); // Optimistic update
    await fetch("/api/settings", { 
      method: "PATCH", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify(newSettings) 
    });
    load();
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading settings...</div>;

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 font-display">Store Settings</h1>
        <p className="mt-2 text-sm text-gray-500">Manage your store's availability, ordering status, and operating modes.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <SettingCard 
          title="Store Status" 
          description="Toggle whether the store is open or closed to the public."
          icon={<Store className="text-blue-500" size={24} />}
          active={settings.shopOpen}
          onToggle={() => updateSettings({ shopOpen: !settings.shopOpen })}
        />
        <SettingCard 
          title="Accepting Orders" 
          description="Enable or disable online ordering independently of store status."
          icon={<ShoppingCart className="text-emerald-500" size={24} />}
          active={settings.acceptingOrders}
          onToggle={() => updateSettings({ acceptingOrders: !settings.acceptingOrders })}
        />
        <SettingCard 
          title="Busy Mode" 
          description="Temporarily pause new orders if the kitchen is overwhelmed."
          icon={<BellOff className="text-amber-500" size={24} />}
          active={settings.busyMode}
          onToggle={() => updateSettings({ busyMode: !settings.busyMode })}
        />
        <SettingCard 
          title="Holiday Mode" 
          description="Set the store to holiday mode to show a custom message."
          icon={<CalendarOff className="text-purple-500" size={24} />}
          active={settings.holidayMode}
          onToggle={() => updateSettings({ holidayMode: !settings.holidayMode })}
        />
      </div>
    </div>
  );
}

function SettingCard({ title, description, icon, active, onToggle }: { title: string, description: string, icon: React.ReactNode, active: boolean, onToggle: () => void }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-full">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-50">
          {icon}
        </div>
        <div>
          <h3 className="font-medium text-gray-900">{title}</h3>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-gray-50 pt-4">
        <span className={`text-sm font-medium ${active ? 'text-emerald-600' : 'text-gray-500'}`}>
          {active ? 'Currently Active' : 'Currently Inactive'}
        </span>
        <button 
          onClick={onToggle}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#BF976A] focus:ring-offset-2 ${active ? 'bg-[#BF976A]' : 'bg-gray-200'}`}
          role="switch"
          aria-checked={active}
        >
          <span className="sr-only">Toggle {title}</span>
          <span 
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${active ? 'translate-x-5' : 'translate-x-0'}`} 
          />
        </button>
      </div>
    </div>
  );
}

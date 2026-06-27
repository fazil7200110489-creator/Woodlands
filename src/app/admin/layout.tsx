"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import { LogOut } from "lucide-react";

/**
 * Admin Layout — authentication is now handled entirely by Next.js Middleware.
 * By the time this layout renders, the user is guaranteed to be authenticated.
 * No localStorage, no client-side auth checks needed here.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } catch {
      // Best-effort logout; redirect regardless
    }
    router.replace("/admin/login");
  };

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden text-gray-900 font-sans">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <div className="bg-white border-b border-gray-100 px-4 py-2 flex justify-end md:px-8">
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors py-1 px-3 rounded-lg hover:bg-red-50"
          >
            <LogOut size={14} /> Log Out
          </button>
        </div>

        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8 lg:p-10">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import { Lock, User, AlertCircle, LogOut } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const auth = localStorage.getItem("admin_auth");
    if (auth === "true") {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Premium short delay for simulation
    setTimeout(() => {
      if (username === "Admin" && password === "Admin@123") {
        localStorage.setItem("admin_auth", "true");
        setIsLoggedIn(true);
      } else {
        setError("Invalid username or password. Please try again.");
      }
      setLoading(false);
    }, 600);
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_auth");
    setIsLoggedIn(false);
    setUsername("");
    setPassword("");
  };

  if (!isMounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1D0F07]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#BF976A] border-t-transparent" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-[#1D0F07] px-4 py-12 sm:px-6 lg:px-8 font-sans overflow-hidden">
        {/* Decorative radial glows */}
        <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(191,151,106,0.08)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(191,151,106,0.08)_0%,transparent_70%)] pointer-events-none" />

        <div className="w-full max-w-md space-y-8 z-10">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#BF976A]/20 bg-[#BF976A]/5">
              <span className="text-[#BF976A] text-2xl font-semibold leading-none">◆</span>
            </div>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-white font-display">
              Woodlands Portal
            </h2>
            <p className="mt-2 text-center text-sm text-gray-400">
              Sign in to manage your kitchen and settings
            </p>
          </div>

          <div className="bg-[#2D1B10]/40 backdrop-blur-xl border border-[#BF976A]/10 rounded-2xl p-8 shadow-2xl">
            <form className="space-y-6" onSubmit={handleLogin}>
              {error && (
                <div className="flex items-center gap-3 rounded-lg bg-red-500/10 border border-red-500/20 p-3.5 text-sm text-red-400 animate-pulse">
                  <AlertCircle size={18} className="shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label htmlFor="username" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <User className="h-5 w-5 text-[#BF976A]/60" />
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="block w-full rounded-xl border border-[#BF976A]/15 bg-[#1D0F07]/40 py-3 pl-10 pr-3 text-white placeholder-gray-500 focus:border-[#BF976A] focus:outline-none focus:ring-1 focus:ring-[#BF976A] transition-colors text-sm"
                      placeholder="Enter Admin username"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-5 w-5 text-[#BF976A]/60" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-xl border border-[#BF976A]/15 bg-[#1D0F07]/40 py-3 pl-10 pr-3 text-white placeholder-gray-500 focus:border-[#BF976A] focus:outline-none focus:ring-1 focus:ring-[#BF976A] transition-colors text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative flex w-full justify-center rounded-xl bg-[#BF976A] py-3.5 px-4 text-sm font-semibold text-[#1D0F07] hover:bg-[#D4A87B] focus:outline-none focus:ring-2 focus:ring-[#BF976A] focus:ring-offset-2 focus:ring-offset-[#1D0F07] transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#1D0F07] border-t-transparent" />
                  ) : (
                    "Access Admin Panel"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

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
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

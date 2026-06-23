"use client";

import MenuImage from "@/components/MenuImage";
import dynamic from "next/dynamic";
import { m, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { MenuItem } from "@/lib/types";
import { generatePickupSlots, toCurrency } from "@/lib/pickup";
import MagneticButton from "@/components/MagneticButton";
import { Home, Search, ShoppingBag, ClipboardList, CalendarDays } from "lucide-react";

const HeroModel = dynamic(() => import("@/components/HeroModel"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="h-32 w-32 rounded-full border border-[#BF976A]/20 animate-pulse bg-[#BF976A]/5" />
    </div>
  ),
});

type Cart = Record<string, { item: MenuItem; qty: number }>;

type PastOrder = {
  id: string;
  date: string;
  totalAmount: number;
  items: { name: string; qty: number }[];
};

const ease = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.85, ease },
};

const stagger = (delay: number) => ({
  ...fadeUp,
  transition: { ...fadeUp.transition, delay },
});

const ALL_CATEGORIES = "All";

export default function OrderingClient() {
  /* ── State ──────────────────────────────────────────────────────────── */
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [cart, setCart] = useState<Cart>({});
  const [drawer, setDrawer] = useState(false);
  const [pickupTime, setPickupTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [touchedName, setTouchedName] = useState(false);
  const [touchedPhone, setTouchedPhone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [settings, setSettings] = useState({
    shopOpen: true,
    acceptingOrders: true,
    busyMode: false,
    holidayMode: false,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [modalQty, setModalQty] = useState(1);
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORIES);
  const [orderHistory, setOrderHistory] = useState<PastOrder[]>([]);
  const [historyDrawer, setHistoryDrawer] = useState(false);
  const [reservationDrawer, setReservationDrawer] = useState(false);
  const [reservationHistory, setReservationHistory] = useState<any[]>([]);

  /* ── Derived ────────────────────────────────────────────────────────── */
  const slots = useMemo(() => generatePickupSlots(), []);
  const lines = Object.values(cart);
  const count = lines.reduce((s, x) => s + x.qty, 0);
  const total = lines.reduce((s, x) => s + x.qty * x.item.price, 0);
  const disabled =
    !settings.shopOpen || !settings.acceptingOrders || settings.holidayMode;

  const isNameValid = name.trim().length > 0;
  const phoneDigits = phone.replace(/\D/g, "");
  const isPhoneFormatValid = /^\+?[\d\s]*$/.test(phone);
  const isPhoneLengthValid = phoneDigits.length >= 10;
  const isPhoneValid =
    isPhoneFormatValid && isPhoneLengthValid && phone.trim().length > 0;

  const nameError =
    touchedName && !isNameValid ? "Customer name is required." : "";
  const phoneError = touchedPhone && !phone.trim()
    ? "Phone number is required."
    : touchedPhone && !isPhoneFormatValid
    ? "Phone must contain only numbers."
    : touchedPhone && !isPhoneLengthValid
    ? "Phone must be at least 10 digits."
    : "";

  const isFormValid = isNameValid && isPhoneValid && pickupTime !== "";

  // Category tabs
  const categories = useMemo(() => {
    const cats = Array.from(new Set(menu.map((i) => i.category)));
    return [ALL_CATEGORIES, ...cats];
  }, [menu]);

  // Displayed menu (filtered by category)
  const displayedMenu = useMemo(() => {
    if (activeCategory === ALL_CATEGORIES) return menu;
    return menu.filter((i) => i.category === activeCategory);
  }, [menu, activeCategory]);

  // Search results
  const filteredMenu = useMemo(() => {
    if (!searchQuery) return [];
    return menu.filter((i) =>
      i.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [menu, searchQuery]);

  /* ── Effects ────────────────────────────────────────────────────────── */
  useEffect(() => {
    fetch("/api/menu")
      .then((r) => {
        if (!r.ok) throw new Error(`Menu API returned ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setMenu(data);
        else throw new Error(data.error ?? "Unexpected menu response");
      })
      .catch((err) => {
        console.error("Failed to load menu:", err);
        setMenuError("Menu unavailable. Please try again later.");
      });

    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && !data.error) setSettings(data);
      })
      .catch(() => {});

    setPickupTime(generatePickupSlots()[0] ?? "");

    // Load order history
    try {
      const stored = localStorage.getItem("woodlands_orders");
      if (stored) setOrderHistory(JSON.parse(stored));
      const storedRes = localStorage.getItem("woodlands_reservations");
      if (storedRes) setReservationHistory(JSON.parse(storedRes));
    } catch (e) {}
  }, []);

  // Reset modalQty when a new item is selected
  useEffect(() => {
    setModalQty(1);
  }, [selectedItem]);

  /* ── Actions ────────────────────────────────────────────────────────── */
  const adjust = (item: MenuItem, delta: number) => {
    setCart((prev) => {
      const key = item._id || item.name;
      const old = prev[key]?.qty ?? 0;
      const qty = Math.max(0, old + delta);
      const next = { ...prev };
      if (qty === 0) delete next[key];
      else next[key] = { item, qty };
      return next;
    });
  };

  const placeOrder = async () => {
    if (!lines.length || !pickupTime || disabled || !isFormValid) return;
    setIsSubmitting(true);
    try {
      const payload = {
        customerName: name.trim(),
        customerPhone: phone.trim(),
        pickupTime,
        items: lines.map((x) => ({
          itemId: x.item._id,
          name: x.item.name,
          price: x.item.price,
          qty: x.qty,
        })),
        totalAmount: total,
      };
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      
      const newOrder: PastOrder = {
        id: new Date().getTime().toString(),
        date: new Date().toLocaleString(),
        totalAmount: total,
        items: lines.map((x) => ({ name: x.item.name, qty: x.qty })),
      };
      const updatedHistory = [newOrder, ...orderHistory];
      setOrderHistory(updatedHistory);
      try {
        localStorage.setItem("woodlands_orders", JSON.stringify(updatedHistory));
      } catch (e) {}

      setSuccess(true);
      setTimeout(() => {
        window.location.href = data.redirectUrl;
      }, 1000);
    } catch (err) {
      console.error("Order submission failed:", err);
      setIsSubmitting(false);
    }
  };

  /* ── Render ─────────────────────────────────────────────────────────── */
  return (
    <main className="min-h-screen pb-24 md:pb-0 overflow-x-hidden bg-[#FBF8F3] text-[#1D0F07]">

      {/* ════════════════════════════════════════════════════════════════
          NAV
      ════════════════════════════════════════════════════════════════ */}
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-[#BF976A]/14 bg-[#FBF8F3]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-12">
          {/* Logo */}
          <a
            href="#"
            className="flex items-center gap-2 font-display text-2xl leading-none text-[#1D0F07] transition-opacity hover:opacity-75"
          >
            <span className="text-[#BF976A] text-lg leading-none">◆</span>
            Woodlands
          </a>

          {/* Center links — desktop */}
          <div className="hidden md:flex items-center gap-8 font-mono-num text-[10px] uppercase tracking-[0.28em]">
            <a href="#" className="text-[#1D0F07] transition-colors hover:text-[#BF976A]">Home</a>
            <a href="#story" className="text-[#9B7340] transition-colors hover:text-[#1D0F07]">Story</a>
            <a href="#menu" className="text-[#9B7340] transition-colors hover:text-[#1D0F07]">Menu</a>
            <a href="#gallery" className="text-[#9B7340] transition-colors hover:text-[#1D0F07]">Gallery</a>
            <a href="#contact" className="text-[#9B7340] transition-colors hover:text-[#1D0F07]">Contact</a>
            <a href="/book-a-table" className="text-[#BF976A] font-semibold transition-colors hover:text-[#1D0F07]">Book Table</a>
          </div>

          {/* Right: search + cart */}
          <div className="flex items-center gap-3">
            {/* Search bar — desktop only */}
            <div className="relative hidden md:block">
              <div className="relative flex items-center">
                <svg
                  className="absolute left-4 h-3.5 w-3.5 text-[#9B7340] opacity-60"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search menu…"
                  className="input-editorial w-48 py-2 pl-10 pr-4 text-xs"
                />
              </div>
              <AnimatePresence>
                {searchQuery && (
                  <m.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-0 top-full mt-3 w-72 overflow-hidden rounded-[20px] border border-[#BF976A]/20 bg-white p-2 shadow-[0_20px_50px_rgba(0,0,0,0.10)]"
                  >
                    {filteredMenu.length > 0 ? (
                      filteredMenu.slice(0, 5).map((item) => (
                        <div
                          key={item._id || item.name}
                          onClick={() => { setSelectedItem(item); setSearchQuery(""); }}
                          className="group flex cursor-pointer items-center gap-3 rounded-[14px] p-2.5 transition-colors hover:bg-[#BF976A]/10"
                        >
                          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[10px]">
                            <MenuImage src={item.image} alt={item.name} category={item.category} fill sizes="44px" className="object-cover transition-transform duration-500 group-hover:scale-110" />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="truncate text-sm font-display text-[#1D0F07]">{item.name}</p>
                            <p className="font-mono-num text-[11px] text-[#9B7340]">{toCurrency(item.price)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="p-4 text-center text-xs text-[#9B7340]">No items found.</p>
                    )}
                  </m.div>
                )}
              </AnimatePresence>
            </div>

            {/* My Reservations button */}
            <m.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setReservationDrawer(true)}
              className="relative hidden md:flex items-center gap-2 rounded-full border border-[#BF976A]/35 bg-white/60 px-5 py-2.5 font-mono-num text-[10px] uppercase tracking-[0.22em] text-[#1D0F07] backdrop-blur-sm transition-colors hover:bg-[#BF976A]/10"
            >
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline">Tables</span>
            </m.button>

            {/* My Orders button */}
            <m.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setHistoryDrawer(true)}
              className="relative hidden md:flex items-center gap-2 rounded-full border border-[#BF976A]/35 bg-white/60 px-5 py-2.5 font-mono-num text-[10px] uppercase tracking-[0.22em] text-[#1D0F07] backdrop-blur-sm transition-colors hover:bg-[#BF976A]/10"
            >
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="hidden sm:inline">Orders</span>
            </m.button>

            {/* Cart button */}
            <m.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setDrawer(true)}
              className="relative hidden md:flex items-center gap-2 rounded-full border border-[#BF976A]/35 bg-white/60 px-5 py-2.5 font-mono-num text-[10px] uppercase tracking-[0.22em] text-[#1D0F07] backdrop-blur-sm transition-colors hover:bg-[#BF976A]/10"
            >
              {/* Bag icon */}
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="hidden sm:inline">Cart</span>
              {count > 0 && (
                <m.span
                  key={count}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-[#BF976A] font-mono-num text-[10px] font-medium text-[#1D0F07]"
                >
                  {count}
                </m.span>
              )}
            </m.button>
          </div>
        </div>
      </nav>

      {/* ════════════════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════════════════ */}
      <section
        id="hero"
        className="relative flex min-h-screen items-center overflow-hidden"
      >
        {/* Warm radial glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_65%_55%_at_62%_42%,rgba(191,151,106,0.13)_0%,transparent_65%)]" />
        {/* Bottom fade to next section */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#FBF8F3] to-transparent" />

        <div className="mx-auto w-full max-w-7xl px-6 pb-16 pt-28 md:px-12">
          <div className="grid items-center gap-12 md:grid-cols-2 md:min-h-[calc(100vh-7rem)]">

            {/* ── Text column ── */}
            <div className="relative z-10 flex flex-col justify-center">
              <m.p {...stagger(0)} className="section-label mb-7">
                Premium Dark Kitchen · Chennai
              </m.p>

              <m.h1
                {...stagger(0.08)}
                className="font-display text-[clamp(3.6rem,8.5vw,7.5rem)] leading-[0.86] text-[#1D0F07]"
              >
                Taste<br />
                <em className="not-italic text-[#BF976A]">Elevated.</em>
              </m.h1>

              <m.p
                {...stagger(0.18)}
                className="mt-8 max-w-[400px] font-serif text-[1.05rem] leading-[1.85] text-[#5C4A38]"
              >
                Minimal ordering, dramatic flavors. Premium grills, shawarma &amp; rice — crafted for the evening rush.
              </m.p>

              <m.div {...stagger(0.28)} className="mt-10 flex flex-wrap gap-4">
                <MagneticButton
                  as="a"
                  href="#menu"
                  className="rounded-full bg-[#1D0F07] px-8 py-4 font-mono-num text-[10px] uppercase tracking-[0.22em] text-[#FBF8F3] transition-colors hover:bg-[#BF976A] hover:text-[#1D0F07]"
                >
                  Explore Menu
                </MagneticButton>
                <m.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setDrawer(true)}
                  className="rounded-full border border-[#BF976A]/45 px-8 py-4 font-mono-num text-[10px] uppercase tracking-[0.22em] text-[#1D0F07] transition-colors hover:bg-[#BF976A]/10 hover:border-[#BF976A]"
                >
                  View Cart
                </m.button>
              </m.div>

              {/* Scroll hint */}
              <m.div
                {...stagger(0.4)}
                className="mt-14 flex items-center gap-4 text-[#9B7340]/60"
              >
                <div className="h-px w-14 bg-[#BF976A]/35" />
                <span className="font-mono-num text-[9px] uppercase tracking-[0.28em]">Scroll to discover</span>
                <svg
                  className="h-4 w-4 animate-scroll-bounce"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
              </m.div>
            </div>

            {/* ── Image/3D column ── */}
            <m.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease, delay: 0.3 }}
              className="relative hidden md:flex items-center justify-center"
            >
              {/* 3D Showcase container */}
              <div className="relative aspect-square w-full max-w-[550px] pointer-events-none">
                {/* Warm soft glow behind model */}
                <div className="absolute inset-[10%] rounded-full bg-[radial-gradient(circle,rgba(191,151,106,0.15)_0%,transparent_70%)]" />
                
                {/* 3D Model Canvas */}
                <div className="absolute inset-0 z-10 mix-blend-multiply opacity-0" />
                <HeroModel />
              </div>
            </m.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          STORY
      ════════════════════════════════════════════════════════════════ */}
      <section id="story" className="relative px-6 py-24 md:px-12 md:py-36">
        {/* Top separator */}
        <div className="absolute inset-x-0 top-0 mx-auto max-w-7xl h-px bg-[#BF976A]/14" />

        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-16 md:grid-cols-[1fr_1.15fr]">

            {/* Left */}
            <m.div {...fadeUp}>
              <p className="section-label mb-6">Our Story</p>
              <h2 className="font-display text-[clamp(2.4rem,4.5vw,4.2rem)] leading-[0.96] text-[#1D0F07]">
                Fire, spice, and<br />late-night comfort.
              </h2>

              {/* Stats row */}
              <div className="mt-10 grid grid-cols-3 gap-3">
                {[
                  { value: "230+", label: "Reviews" },
                  { value: "4.8★", label: "Rating" },
                  { value: "Est. '18", label: "Founded" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-2xl border border-[#BF976A]/18 bg-white/50 py-5 text-center"
                  >
                    <p className="font-display text-[1.6rem] text-[#1D0F07]">{s.value}</p>
                    <p className="mt-0.5 font-mono-num text-[9px] uppercase tracking-[0.22em] text-[#9B7340]">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </m.div>

            {/* Right */}
            <m.div {...stagger(0.14)} className="flex flex-col gap-7">
              <p className="font-serif text-[1.1rem] leading-[1.85] text-[#5C4A38]">
                Built around rich grills, shawarma, rice, and starters, Woodlands keeps the experience sharp: choose, pickup, eat.
              </p>
              <p className="text-[0.9rem] leading-[1.8] text-[#8B7355]">
                Visual-first ordering with layered motion, deep color, and enough restraint to let the food do the talking.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {["Halal Certified", "Fresh Daily", "Evening 6–11 pm", "Pickup Only"].map((tag) => (
                  <span key={tag} className="tag-pill">{tag}</span>
                ))}
              </div>
            </m.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          MENU
      ════════════════════════════════════════════════════════════════ */}
      <section id="menu" className="relative px-6 py-24 md:px-12">
        <div className="absolute inset-x-0 top-0 mx-auto max-w-7xl h-px bg-[#BF976A]/14" />
        <div className="mx-auto max-w-7xl">

          {/* Section header */}
          <m.div {...fadeUp} className="mb-10">
            <p className="section-label mb-5">Menu Showcase</p>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <h2 className="font-display text-[clamp(2.4rem,5.5vw,5rem)] leading-none text-[#1D0F07]">
                Signature picks
              </h2>
              {menuError && (
                <p className="font-mono-num text-sm text-[#9B7340]">{menuError}</p>
              )}
            </div>
          </m.div>

          {/* Category filter tabs */}
          {categories.length > 1 && (
            <m.div {...stagger(0.1)} className="mb-12 flex overflow-x-auto gap-3 pb-4 hide-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-full border px-5 py-2 font-mono-num text-[10px] uppercase tracking-[0.20em] transition-all duration-250 ${
                    activeCategory === cat ? "cat-tab-active" : "cat-tab-inactive"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </m.div>
          )}

          {/* Menu grid */}
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {displayedMenu.map((item, idx) => {
                const qty = cart[item._id || item.name]?.qty ?? 0;
                return (
                  <m.article
                    key={item._id || item.name}
                    layout
                    initial={{ opacity: 0, y: 28 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.5, ease, delay: idx * 0.04 }}
                    className="group flex flex-col overflow-hidden rounded-[22px] border border-[#BF976A]/15 bg-white shadow-[0_2px_16px_rgba(0,0,0,0.04)] card-lift"
                  >
                    {/* Image area */}
                    <div
                      className="relative h-52 cursor-pointer overflow-hidden"
                      onClick={() => setSelectedItem(item)}
                    >
                      <MenuImage
                        src={item.image}
                        alt={item.name}
                        category={item.category}
                        fill
                        sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.07]"
                      />
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/28 via-transparent to-transparent" />

                      {/* Category pill */}
                      <span className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1 font-mono-num text-[9px] uppercase tracking-[0.2em] text-[#9B7340] backdrop-blur-sm">
                        {item.category}
                      </span>

                      {/* Out of stock badge */}
                      {!item.inStock && (
                        <span className="absolute right-4 top-4 rounded-full bg-[#1D0F07]/80 px-3 py-1 font-mono-num text-[9px] uppercase tracking-[0.15em] text-white">
                          Sold Out
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col p-6">
                      <h3
                        className="cursor-pointer font-display text-[1.4rem] leading-tight text-[#1D0F07] transition-colors hover:text-[#BF976A]"
                        onClick={() => setSelectedItem(item)}
                      >
                        {item.name}
                      </h3>
                      <p className="mt-2.5 flex-1 text-[0.85rem] leading-[1.7] text-[#8B7355]">
                        Crafted with premium ingredients — layered with heat, texture, and deep flavor for a satisfying pickup.
                      </p>

                      {/* Price + qty row */}
                      <div className="mt-6 flex items-center justify-between">
                        <p className="font-display text-xl text-[#BF976A]">
                          {toCurrency(item.price)}
                        </p>

                        <div className="flex items-center gap-2.5">
                          <m.button
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => adjust(item, -1)}
                            className="flex h-11 w-11 md:h-9 md:w-9 items-center justify-center rounded-full border border-[#BF976A]/30 text-lg text-[#1D0F07] transition-colors hover:bg-[#BF976A]/10"
                          >
                            −
                          </m.button>
                          <span className="w-5 text-center font-mono-num text-sm text-[#5C4A38]">
                            {qty}
                          </span>
                          <m.button
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => adjust(item, 1)}
                            disabled={!item.inStock}
                            className="flex h-11 w-11 md:h-9 md:w-9 items-center justify-center rounded-full border border-[#BF976A]/30 text-lg text-[#1D0F07] transition-colors hover:bg-[#BF976A]/10 disabled:opacity-35"
                          >
                            +
                          </m.button>
                        </div>
                      </div>

                      {/* Add to cart CTA */}
                      <m.button
                        whileHover={item.inStock ? { scale: 1.01 } : {}}
                        whileTap={item.inStock ? { scale: 0.99 } : {}}
                        disabled={!item.inStock}
                        onClick={() => adjust(item, 1)}
                        className="mt-4 w-full rounded-full bg-[#1D0F07] py-4 md:py-3 font-mono-num text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-[#FBF8F3] transition-colors hover:bg-[#BF976A] hover:text-[#1D0F07] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {item.inStock ? "Add to Cart" : "Out of Stock"}
                      </m.button>
                    </div>
                  </m.article>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Empty state */}
          {displayedMenu.length === 0 && !menuError && menu.length > 0 && (
            <div className="mt-16 text-center">
              <p className="font-serif text-[#8B7355]">No items in this category.</p>
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          GALLERY
      ════════════════════════════════════════════════════════════════ */}
      <section id="gallery" className="relative bg-[#F3EDE4] px-6 py-24 md:px-12">
        <div className="absolute inset-x-0 top-0 h-px bg-[#BF976A]/14" />
        <div className="mx-auto max-w-7xl">

          <m.div {...fadeUp} className="mb-12">
            <p className="section-label mb-5">Gallery</p>
            <h2 className="font-display text-[clamp(2.4rem,5vw,4.5rem)] leading-[0.96] text-[#1D0F07]">
              Layers of heat<br />and texture.
            </h2>
          </m.div>

          {/* Food mosaic — only when menu has loaded */}
          {menu.length >= 3 && (
            <m.div
              {...stagger(0.12)}
              className="grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-2"
            >
              {/* Large featured tile */}
              <div
                className="relative col-span-1 row-span-1 h-72 cursor-pointer overflow-hidden rounded-[20px] md:row-span-2 md:h-auto"
                onClick={() => setSelectedItem(menu[0])}
              >
                <MenuImage
                  src={menu[0].image}
                  alt={menu[0].name}
                  category={menu[0].category}
                  fill
                  sizes="(max-width:768px) 100vw, 40vw"
                  className="object-cover transition-transform duration-700 hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1D0F07]/60 via-[#1D0F07]/10 to-transparent" />
                <div className="absolute bottom-6 left-6">
                  <p className="font-display text-2xl text-white">{menu[0].name}</p>
                  <p className="mt-1 font-mono-num text-sm text-[#BF976A]">{toCurrency(menu[0].price)}</p>
                </div>
              </div>

              {/* Two smaller tiles */}
              {[menu[1], menu[2]].map((item, i) => (
                <div
                  key={item._id || item.name}
                  className="relative h-56 cursor-pointer overflow-hidden rounded-[20px] md:h-auto"
                  onClick={() => setSelectedItem(item)}
                >
                  <MenuImage
                    src={item.image}
                    alt={item.name}
                    category={item.category}
                    fill
                    sizes="(max-width:768px) 100vw, 30vw"
                    className="object-cover transition-transform duration-700 hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1D0F07]/55 via-transparent to-transparent" />
                  <div className="absolute bottom-5 left-5">
                    <p className="font-display text-xl text-white">{item.name}</p>
                    <p className="mt-0.5 font-mono-num text-sm text-[#BF976A]">{toCurrency(item.price)}</p>
                  </div>
                </div>
              ))}
            </m.div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          CONTACT
      ════════════════════════════════════════════════════════════════ */}
      <section id="contact" className="relative bg-[#EDE8DF] px-6 py-24 md:px-12 md:py-32">
        <div className="absolute inset-x-0 top-0 h-px bg-[#BF976A]/16" />
        <div className="mx-auto max-w-7xl">

          <m.div {...fadeUp} className="mb-16 max-w-2xl">
            <p className="section-label mb-5">Reach Out</p>
            <h2 className="font-display text-[clamp(2.4rem,5vw,4.5rem)] leading-none text-[#1D0F07]">
              Find us here.
            </h2>
          </m.div>

          <div className="grid gap-12 md:grid-cols-2 lg:gap-20">
            <m.div {...stagger(0.1)} className="flex flex-col gap-10">
              {/* Address */}
              <div className="group flex gap-5">
                <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#BF976A]/22 bg-[#BF976A]/8 text-[#9B7340] transition-colors group-hover:bg-[#BF976A]/16">
                  <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-display text-xl text-[#1D0F07] transition-colors group-hover:text-[#9B7340]">Address</h4>
                  <p className="mt-2.5 font-serif leading-relaxed text-[#5C4A38]">
                    52/2, Ramanuja Iyer St,<br />
                    NN Garden, Washermanpet,<br />
                    Chennai, Tamil Nadu 600021
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="group flex gap-5">
                <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#BF976A]/22 bg-[#BF976A]/8 text-[#9B7340] transition-colors group-hover:bg-[#BF976A]/16">
                  <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-display text-xl text-[#1D0F07] transition-colors group-hover:text-[#9B7340]">Phone</h4>
                  <div className="mt-2.5 flex flex-col gap-1.5 font-serif text-[#5C4A38]">
                    <a href="tel:+919840489878" className="transition-colors hover:text-[#9B7340]">+91 98404 89878</a>
                    <a href="tel:+917200110489" className="transition-colors hover:text-[#9B7340]">+91 72001 10489</a>
                  </div>
                </div>
              </div>

              {/* Hours */}
              <div className="group flex gap-5">
                <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#BF976A]/22 bg-[#BF976A]/8 text-[#9B7340] transition-colors group-hover:bg-[#BF976A]/16">
                  <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-display text-xl text-[#1D0F07] transition-colors group-hover:text-[#9B7340]">Hours</h4>
                  <p className="mt-2.5 font-serif text-[#5C4A38]">
                    Mon – Sun<br />
                    <span className="text-[#9B7340]">6:00 pm – 11:00 pm</span>
                  </p>
                </div>
              </div>
            </m.div>

            {/* Map */}
            <m.div
              {...stagger(0.2)}
              className="h-80 w-full overflow-hidden rounded-[24px] border border-[#BF976A]/20 shadow-[0_16px_50px_rgba(0,0,0,0.07)] md:h-[420px]"
            >
              <iframe
                src="https://maps.google.com/maps?q=52/2,%20Ramanuja%20Iyer%20St,%20NN%20Garden,%20Washermanpet,%20Chennai,%20Tamil%20Nadu%20600021&t=&z=15&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="transition-transform duration-[2s] ease-out hover:scale-[1.02]"
              />
            </m.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════════════════ */}
      <footer className="relative border-t border-[#BF976A]/16 bg-[#E8E1D6] px-6 py-14 md:px-12">
        <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-8">
          <div>
            <p className="font-display text-4xl leading-none text-[#1D0F07]">
              <span className="text-[#BF976A]">◆</span> Woodlands
            </p>
            <p className="mt-2.5 font-mono-num text-[10px] uppercase tracking-[0.24em] text-[#9B7340]">
              Premium pickup restaurant
            </p>
          </div>
          <div className="flex flex-wrap gap-6 font-mono-num text-[10px] uppercase tracking-[0.22em] text-[#8B7355]">
            <a href="#" className="transition-colors hover:text-[#1D0F07]">Home</a>
            <a href="#story" className="transition-colors hover:text-[#1D0F07]">Story</a>
            <a href="#menu" className="transition-colors hover:text-[#1D0F07]">Menu</a>
            <a href="#gallery" className="transition-colors hover:text-[#1D0F07]">Gallery</a>
            <a href="#contact" className="transition-colors hover:text-[#1D0F07]">Contact</a>
          </div>
        </div>
      </footer>

      {/* ════════════════════════════════════════════════════════════════
          CART DRAWER & MY ORDERS DRAWER
      ════════════════════════════════════════════════════════════════ */}
      {/* Backdrop */}
      <AnimatePresence>
        {(drawer || historyDrawer || reservationDrawer) && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[55] bg-[#1D0F07]/20 backdrop-blur-[2px]"
            onClick={() => { setDrawer(false); setHistoryDrawer(false); setReservationDrawer(false); }}
          />
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <m.aside
        initial={false}
        animate={{ x: drawer ? 0 : 480 }}
        transition={{ type: "spring", damping: 32, stiffness: 300 }}
        className="fixed right-0 top-0 z-[60] flex h-screen w-[96vw] max-w-[420px] flex-col border-l border-[#BF976A]/18 bg-[#FBF8F3] shadow-[-24px_0_80px_rgba(0,0,0,0.09)]"
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between border-b border-[#BF976A]/18 px-6 py-5">
          <div>
            <p className="font-display text-2xl text-[#1D0F07]">Your Order</p>
            <p className="font-mono-num mt-0.5 text-[10px] uppercase tracking-[0.22em] text-[#9B7340]">
              {count} {count === 1 ? "item" : "items"}
            </p>
          </div>
          <m.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setDrawer(false)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#BF976A]/28 text-[#9B7340] transition-colors hover:bg-[#BF976A]/12"
          >
            <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </m.button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 pb-24 md:pb-6">
          {/* Order details form */}
          <div className="mt-5 grid gap-3">
            <div>
              <select
                className={`input-editorial w-full px-4 py-3 ${!pickupTime ? "border-red-400/50" : ""}`}
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
              >
                <option value="" disabled className="bg-white text-[#1D0F07]/50">
                  Select Pickup Time
                </option>
                {slots.map((s) => (
                  <option key={s} value={s} className="bg-white text-[#1D0F07]">{s}</option>
                ))}
              </select>
              {!pickupTime && (
                <p className="mt-1 font-mono-num text-[10px] text-red-400">Pickup time is required.</p>
              )}
            </div>

            <div>
              <input
                className={`input-editorial w-full px-4 py-3 ${nameError ? "border-red-400/50" : ""}`}
                placeholder="Customer Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouchedName(true)}
              />
              <AnimatePresence>
                {nameError && (
                  <m.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-1 font-mono-num text-[10px] text-red-400"
                  >
                    {nameError}
                  </m.p>
                )}
              </AnimatePresence>
            </div>

            <div>
              <input
                className={`input-editorial w-full px-4 py-3 ${phoneError ? "border-red-400/50" : ""}`}
                placeholder="Phone (e.g. 9876543210)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => setTouchedPhone(true)}
              />
              <AnimatePresence>
                {phoneError && (
                  <m.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-1 font-mono-num text-[10px] text-red-400"
                  >
                    {phoneError}
                  </m.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Cart line items */}
          <div className="mt-6">
            {lines.length === 0 ? (
              <div className="rounded-[16px] border border-[#BF976A]/18 py-8 text-center">
                <p className="font-serif text-sm text-[#8B7355]">No items yet.</p>
                <p className="mt-1 font-mono-num text-[11px] text-[#9B7340]">Add from the menu below.</p>
              </div>
            ) : (
              <AnimatePresence>
                {lines.map((l) => (
                  <m.div
                    layout
                    key={l.item._id || l.item.name}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-4 border-b border-[#BF976A]/14 py-4"
                  >
                    {/* Thumbnail */}
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[12px] border border-[#BF976A]/15">
                      <MenuImage
                        src={l.item.image}
                        alt={l.item.name}
                        category={l.item.category}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-display text-[1.05rem] leading-tight text-[#1D0F07] truncate">
                        {l.item.name}
                      </p>
                      <p className="font-mono-num mt-0.5 text-[11px] text-[#9B7340]">
                        {toCurrency(l.item.price)} × {l.qty}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <m.button
                        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                        onClick={() => adjust(l.item, -1)}
                        className="flex h-10 w-10 md:h-8 md:w-8 items-center justify-center rounded-full border border-[#BF976A]/28 text-sm text-[#1D0F07] transition-colors hover:bg-[#BF976A]/12"
                      >−</m.button>
                      <m.button
                        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                        onClick={() => adjust(l.item, 1)}
                        className="flex h-10 w-10 md:h-8 md:w-8 items-center justify-center rounded-full border border-[#BF976A]/28 text-sm text-[#1D0F07] transition-colors hover:bg-[#BF976A]/12"
                      >+</m.button>
                    </div>
                  </m.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Drawer footer: total + place order */}
        <div className="border-t border-[#BF976A]/18 px-6 py-5">
          <div className="flex items-baseline justify-between mb-4">
            <p className="font-mono-num text-[11px] uppercase tracking-[0.2em] text-[#8B7355]">Total</p>
            <m.p
              key={total}
              initial={{ scale: 0.92, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35 }}
              className="font-display text-3xl text-[#BF976A]"
            >
              {toCurrency(total)}
            </m.p>
          </div>

          <MagneticButton
            onClick={placeOrder}
            disabled={!lines.length || disabled || !isFormValid || isSubmitting || success}
            className="w-full rounded-full bg-[#1D0F07] py-4 font-mono-num text-[10px] uppercase tracking-[0.2em] text-[#FBF8F3] transition-colors hover:bg-[#BF976A] hover:text-[#1D0F07] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {success
              ? "Redirecting to WhatsApp…"
              : isSubmitting
              ? "Processing…"
              : "Place Order on WhatsApp"}
          </MagneticButton>
        </div>
      </m.aside>

      {/* My Orders Drawer */}
      <m.aside
        initial={false}
        animate={{ x: historyDrawer ? 0 : 480 }}
        transition={{ type: "spring", damping: 32, stiffness: 300 }}
        className="fixed right-0 top-0 z-[60] flex h-screen w-[96vw] max-w-[420px] flex-col border-l border-[#BF976A]/18 bg-[#FBF8F3] shadow-[-24px_0_80px_rgba(0,0,0,0.09)]"
      >
        <div className="flex items-center justify-between border-b border-[#BF976A]/18 px-6 py-5">
          <div>
            <p className="font-display text-2xl text-[#1D0F07]">My Orders</p>
            <p className="font-mono-num mt-0.5 text-[10px] uppercase tracking-[0.22em] text-[#9B7340]">
              Past Order History
            </p>
          </div>
          <m.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setHistoryDrawer(false)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#BF976A]/28 text-[#9B7340] transition-colors hover:bg-[#BF976A]/12"
          >
            <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </m.button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {orderHistory.length === 0 ? (
            <div className="rounded-[16px] border border-[#BF976A]/18 py-8 text-center">
              <p className="font-serif text-sm text-[#8B7355]">No past orders.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {orderHistory.map((order) => (
                <div key={order.id} className="rounded-[16px] border border-[#BF976A]/20 bg-white/50 p-5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#BF976A]/15 pb-3 mb-3">
                    <p className="font-mono-num text-[10px] uppercase text-[#8B7355]">{order.date}</p>
                    <p className="font-display text-lg text-[#BF976A]">{toCurrency(order.totalAmount)}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between font-serif text-[13px] text-[#1D0F07]">
                        <span>{item.qty}x {item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </m.aside>

      {/* My Reservations Drawer */}
      <m.aside
        initial={false}
        animate={{ x: reservationDrawer ? 0 : 480 }}
        transition={{ type: "spring", damping: 32, stiffness: 300 }}
        className="fixed right-0 top-0 z-[60] flex h-screen w-[96vw] max-w-[420px] flex-col border-l border-[#BF976A]/18 bg-[#FBF8F3] shadow-[-24px_0_80px_rgba(0,0,0,0.09)]"
      >
        <div className="flex items-center justify-between border-b border-[#BF976A]/18 px-6 py-5">
          <div>
            <p className="font-display text-2xl text-[#1D0F07]">Reservations</p>
            <p className="font-mono-num mt-0.5 text-[10px] uppercase tracking-[0.22em] text-[#9B7340]">
              Your Table Bookings
            </p>
          </div>
          <m.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setReservationDrawer(false)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#BF976A]/28 text-[#9B7340] transition-colors hover:bg-[#BF976A]/12"
          >
            <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </m.button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {reservationHistory.length === 0 ? (
            <div className="rounded-[16px] border border-[#BF976A]/18 py-8 text-center">
              <p className="font-serif text-sm text-[#8B7355]">No reservations yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {reservationHistory.map((res: any) => (
                <div key={res._id || res.referenceId} className="rounded-[16px] border border-[#BF976A]/20 bg-white/50 p-5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#BF976A]/15 pb-3 mb-3">
                    <p className="font-mono-num text-[10px] uppercase text-[#8B7355]">{res.date} · {res.timeSlot}</p>
                    <span className={`rounded-full px-2 py-1 font-mono-num text-[9px] uppercase tracking-wider ${res.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' : res.status === 'Pending' ? 'bg-amber-100 text-amber-700' : res.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                      {res.status}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 font-serif text-[13px] text-[#1D0F07]">
                    <p><strong>Ref:</strong> {res.referenceId}</p>
                    <p><strong>Guests:</strong> {res.guests}</p>
                  </div>
                  {res.status === 'Pending' && (
                    <button 
                      onClick={async () => {
                        try {
                          await fetch(`/api/reservations/${res._id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: "Cancelled" })
                          });
                          const updated = reservationHistory.map(r => r._id === res._id ? { ...r, status: "Cancelled" } : r);
                          setReservationHistory(updated);
                          localStorage.setItem("woodlands_reservations", JSON.stringify(updated));
                        } catch (e) {}
                      }}
                      className="mt-4 w-full rounded-lg border border-red-200 py-2 text-xs text-red-600 transition-colors hover:bg-red-50"
                    >
                      Cancel Reservation
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </m.aside>

      {/* ════════════════════════════════════════════════════════════════
          FLOATING CART FAB
      ════════════════════════════════════════════════════════════════ */}
      <m.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setDrawer(true)}
        className="fixed bottom-6 right-6 z-[45] hidden md:flex h-16 w-16 items-center justify-center rounded-full bg-[#1D0F07] text-[#FBF8F3] shadow-[0_12px_40px_rgba(29,15,7,0.35)] transition-colors hover:bg-[#BF976A] hover:text-[#1D0F07]"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#BF976A] font-mono-num text-[11px] font-medium text-[#1D0F07] border-2 border-[#1D0F07]">
            {count}
          </span>
        )}
      </m.button>

      {/* ════════════════════════════════════════════════════════════════
          ITEM MODAL
      ════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-5">
            {/* Backdrop */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setSelectedItem(null)}
              className="absolute inset-0 bg-[#1D0F07]/35 backdrop-blur-[3px]"
            />

            {/* Modal card */}
            <m.div
              initial={{ opacity: 0, scale: 0.88, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ type: "spring", damping: 26, stiffness: 220 }}
              className="relative z-10 flex w-full max-w-3xl flex-col mt-auto md:mt-0 rounded-b-none rounded-t-[28px] md:rounded-[28px] max-h-[85vh] overflow-y-auto md:max-h-none md:overflow-hidden border border-[#BF976A]/20 bg-white shadow-[0_0_80px_rgba(0,0,0,0.14)] md:flex-row pb-8 md:pb-0"
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute right-5 top-5 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-[#BF976A]/22 bg-white/70 text-[#9B7340] backdrop-blur-sm transition-colors hover:bg-[#BF976A]/20 hover:text-[#1D0F07]"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Image */}
              <div className="relative h-48 sm:h-64 md:h-auto w-full shrink-0 md:w-[48%]">
                <MenuImage
                  src={selectedItem.image}
                  alt={selectedItem.name}
                  category={selectedItem.category}
                  fill
                  sizes="(max-width:768px) 100vw, 48vw"
                  priority
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/30 via-transparent to-transparent md:bg-gradient-to-r" />
              </div>

              {/* Details */}
              <div className="flex flex-col justify-center p-6 sm:p-8 md:p-12">
                <p className="section-label mb-3">{selectedItem.category}</p>
                <h3 className="font-display text-[2rem] leading-tight text-[#1D0F07] md:text-[2.5rem]">
                  {selectedItem.name}
                </h3>
                <p className="mt-4 font-serif text-[0.9rem] leading-relaxed text-[#5C4A38]">
                  A signature dish crafted with premium ingredients, offering layers of heat, texture, and deep flavors. Prepared fresh and built for a satisfying meal.
                </p>
                <p className="mt-6 font-display text-3xl text-[#BF976A]">
                  {toCurrency(selectedItem.price)}
                </p>

                {/* Qty control in modal */}
                <div className="mt-6 flex items-center gap-4">
                  <div className="flex items-center gap-3 rounded-full border border-[#BF976A]/30 px-4 py-2">
                    <button
                      onClick={() => setModalQty((q) => Math.max(1, q - 1))}
                      className="flex h-9 w-9 md:h-7 md:w-7 items-center justify-center rounded-full text-lg text-[#1D0F07] transition-colors hover:bg-[#BF976A]/12"
                    >−</button>
                    <span className="w-6 text-center font-mono-num text-sm text-[#5C4A38]">{modalQty}</span>
                    <button
                      onClick={() => setModalQty((q) => q + 1)}
                      disabled={!selectedItem.inStock}
                      className="flex h-9 w-9 md:h-7 md:w-7 items-center justify-center rounded-full text-lg text-[#1D0F07] transition-colors hover:bg-[#BF976A]/12 disabled:opacity-35"
                    >+</button>
                  </div>
                  <p className="font-mono-num text-xs text-[#9B7340]">Qty</p>
                </div>

                <MagneticButton
                  onClick={() => {
                    for (let i = 0; i < modalQty; i++) adjust(selectedItem, 1);
                    setSelectedItem(null);
                    setDrawer(true);
                  }}
                  disabled={!selectedItem.inStock}
                  className="mt-6 w-full rounded-full bg-[#1D0F07] py-4 font-mono-num text-[10px] uppercase tracking-[0.2em] text-[#FBF8F3] transition-colors hover:bg-[#BF976A] hover:text-[#1D0F07] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {selectedItem.inStock ? "Add to Cart" : "Out of Stock"}
                </MagneticButton>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════════════
          MOBILE BOTTOM NAVIGATION
      ════════════════════════════════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden items-center justify-around border-t border-[#BF976A]/14 bg-[#FBF8F3]/90 px-4 py-3 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
        <a href="#" onClick={() => { setDrawer(false); setHistoryDrawer(false); setReservationDrawer(false); }} className="flex flex-col items-center gap-1.5 p-2 text-[#9B7340]">
          <Home className="h-5 w-5" />
          <span className="font-mono-num text-[9px] uppercase tracking-wider">Home</span>
        </a>
        <a href="#menu" onClick={() => { setDrawer(false); setHistoryDrawer(false); setReservationDrawer(false); }} className="flex flex-col items-center gap-1.5 p-2 text-[#9B7340]">
          <Search className="h-5 w-5" />
          <span className="font-mono-num text-[9px] uppercase tracking-wider">Menu</span>
        </a>
        <button onClick={() => { setDrawer(true); setHistoryDrawer(false); setReservationDrawer(false); }} className="relative flex flex-col items-center gap-1.5 p-2 text-[#9B7340]">
          <ShoppingBag className="h-5 w-5" />
          <span className="font-mono-num text-[9px] uppercase tracking-wider">Cart</span>
          {count > 0 && (
            <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-[#BF976A] font-mono-num text-[8px] font-bold text-[#1D0F07]">
              {count}
            </span>
          )}
        </button>
        <button onClick={() => { setHistoryDrawer(true); setDrawer(false); setReservationDrawer(false); }} className="flex flex-col items-center gap-1.5 p-2 text-[#9B7340]">
          <ClipboardList className="h-5 w-5" />
          <span className="font-mono-num text-[9px] uppercase tracking-wider">Orders</span>
        </button>
        <a href="/book-a-table" className="flex flex-col items-center gap-1.5 p-2 text-[#9B7340] hover:text-[#BF976A] transition-colors">
          <CalendarDays className="h-5 w-5" />
          <span className="font-mono-num text-[9px] uppercase tracking-wider">Book Table</span>
        </a>
      </div>
    </main>
  );
}

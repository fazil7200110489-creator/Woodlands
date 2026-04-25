"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { m, useScroll, useTransform } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { categories } from "@/lib/menuData";
import { MenuItem } from "@/lib/types";
import { generatePickupSlots, toCurrency } from "@/lib/pickup";
import { TextHoverEffect } from "@/components/ui/text-hover-effect";
import MagneticButton from "@/components/MagneticButton";
import { useCountUp } from "@/hooks/useCountUp";
import { useScrollReveal, useStaggerReveal } from "@/hooks/useScrollReveal";
import { useInView } from "@/hooks/useInView";
import { HeroSkeleton } from "@/components/skeletons/HeroSkeleton";
import { FoodCardSkeleton } from "@/components/skeletons/FoodCardSkeleton";
import { FeaturedSkeleton } from "@/components/skeletons/FeaturedSkeleton";

const FoodCard = dynamic(() => import("@/components/FoodCard"), { ssr: false });
const HorizontalScroll = dynamic(() => import("@/components/HorizontalScroll"), { ssr: false });

type Cart = Record<string, { item: MenuItem; qty: number }>;

export default function OrderingClient() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<Cart>({});
  const [drawer, setDrawer] = useState(false);
  const [pickupTime, setPickupTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [settings, setSettings] = useState({ shopOpen: true, acceptingOrders: true, busyMode: false, holidayMode: false });

  const headlineRef = useRef<HTMLHeadingElement | null>(null);
  const subtextRef = useRef<HTMLParagraphElement | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);
  const menuContainerRef = useRef<HTMLElement | null>(null);
  const categoriesRef = useScrollReveal<HTMLElement>();
  const statsRef = useScrollReveal<HTMLElement>();
  const menuHeaderRef = useScrollReveal<HTMLDivElement>();
  useStaggerReveal(menuContainerRef);

  const { ref: heroRef, hasBeenSeen: heroSeen } = useInView();
  const { ref: featuredRef, hasBeenSeen: featuredSeen } = useInView({ rootMargin: "200px", threshold: 0.1 });
  const { ref: menuRef, hasBeenSeen: menuSeen } = useInView({ rootMargin: "100px", threshold: 0.1 });

  const { scrollY } = useScroll();
  const parallaxY = useTransform(scrollY, [0, 500], [0, -150]);
  const { count: countOrders, ref: countOrdersRef } = useCountUp(2400);
  const { count: countHappy, ref: countHappyRef } = useCountUp(98);
  const { count: countRating, ref: countRatingRef } = useCountUp(49);

  useEffect(() => {
    fetch("/api/menu").then((r) => r.json()).then(setMenu);
    fetch("/api/settings").then((r) => r.json()).then(setSettings);
    setPickupTime(generatePickupSlots()[0] ?? "");
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (!headlineRef.current || !subtextRef.current || !ctaRef.current) return;

    const words = headlineRef.current.querySelectorAll("span[data-word]");
    const tl = gsap.timeline();
    tl.from(words, {
      yPercent: 100,
      opacity: 0,
      duration: 0.7,
      ease: "power4.out",
      stagger: 0.08,
      delay: 0.5,
    })
      .from(subtextRef.current, { y: 40, opacity: 0, duration: 1, ease: "power3.out" }, "-=0.35")
      .from(ctaRef.current, { y: 30, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.45");
    return () => {
      tl.kill();
    };
  }, []);

  const slots = useMemo(() => generatePickupSlots(), []);
  const lines = Object.values(cart);
  const count = lines.reduce((s, x) => s + x.qty, 0);
  const total = lines.reduce((s, x) => s + x.qty * x.item.price, 0);
  const disabled = !settings.shopOpen || !settings.acceptingOrders || settings.holidayMode;
  const headlineWords = "Order Fresh Food Before You Arrive".split(" ");

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
    if (!lines.length || !pickupTime || disabled) return;
    const payload = {
      customerName: name || "Customer",
      customerPhone: phone || "N/A",
      pickupTime,
      items: lines.map((x) => ({ itemId: x.item._id, name: x.item.name, price: x.item.price, qty: x.qty })),
      totalAmount: total,
    };
    const res = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    window.location.href = data.redirectUrl;
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-oryzo-black">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 flex justify-center opacity-45">
        <div className="h-[220px] w-full max-w-6xl md:h-[300px]">
          <TextHoverEffect text="WOODLANDS" className="h-full w-full" />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 flex justify-center opacity-45">
        <div className="h-[220px] w-full max-w-6xl md:h-[300px]">
          <TextHoverEffect text="WOODLANDS" className="h-full w-full" />
        </div>
      </div>

      <nav className="sticky top-0 z-30 border-b border-white/10 bg-[rgba(10,10,10,0.85)] px-4 py-4 shadow-[0_1px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl md:px-10">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <div className="font-display text-2xl text-oryzo-warm">Woodlands</div>
          <div className="hidden gap-6 text-[11px] uppercase tracking-[0.12em] text-oryzo-muted md:flex">
            <a className="text-oryzo-warm" href="#">Home</a>
            <a className="hover:text-oryzo-warm" href="#menu">Menu</a>
            <a className="hover:text-oryzo-warm" href="#categories">Categories</a>
          </div>
          <a className="rounded-full border border-white/15 px-4 py-2 text-[11px] uppercase tracking-[0.12em] text-oryzo-warm hover:border-oryzo-gold hover:text-oryzo-gold" href="https://wa.me/919840489878">Cart / WhatsApp</a>
        </div>
      </nav>

      <section ref={heroRef} className="relative isolate z-10 flex min-h-screen items-center px-4 pb-16 pt-8 md:px-10">
        {heroSeen ? null : <HeroSkeleton />}
        <m.div style={{ y: parallaxY }} className="absolute inset-0 -z-20">
          <Image
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836"
            alt="Food background"
            fill
            priority
            loading="eager"
            sizes="100vw"
            className="object-cover opacity-20"
          />
        </m.div>
        <div className="absolute inset-0 -z-10 bg-black/65" />
        <div className="mx-auto grid w-full max-w-6xl gap-10 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="mb-4 text-[11px] uppercase tracking-[0.15em] text-oryzo-accent">Fresh · Fast · Pickup</p>
            <h1 ref={headlineRef} className="font-display text-5xl leading-[1.05] text-oryzo-warm md:text-7xl">
              {headlineWords.map((word, i) => (
                <span key={`${word}-${i}`} className="mr-[0.25em] inline-block overflow-hidden">
                  <span data-word className="inline-block">{word}</span>
                </span>
              ))}
            </h1>
            <p ref={subtextRef} className="font-serif mt-5 max-w-md text-base text-oryzo-muted">Premium fast pickup ordering experience.</p>
            <div ref={ctaRef} className="mt-8 flex flex-wrap gap-3">
              <MagneticButton as="a" href="#menu" className="bg-oryzo-gold px-8 py-4 text-[11px] uppercase tracking-[0.15em] text-black transition hover:brightness-110">Order Now</MagneticButton>
              <MagneticButton as="a" href="#menu" className="border border-white/15 px-8 py-4 text-[11px] uppercase tracking-[0.15em] text-oryzo-warm transition hover:border-oryzo-gold hover:text-oryzo-gold">View Menu</MagneticButton>
            </div>
          </div>

          <div className="border border-white/10 bg-[var(--bg-card)] p-6">
            <p className="mb-4 text-[11px] uppercase tracking-[0.2em] text-oryzo-accent">Your Order</p>
            <select className="input-editorial w-full px-3 py-3" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)}>
              {slots.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input className="input-editorial mt-3 w-full px-3 py-3" placeholder="Customer Name" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="input-editorial mt-3 w-full px-3 py-3" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <div className="mt-4 border border-white/10 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.15em] text-oryzo-muted">Current Total</p>
              <p className="mt-1 text-lg text-oryzo-gold">{toCurrency(total)}</p>
            </div>
            {disabled ? <p className="mt-4 border border-oryzo-red/50 bg-oryzo-red/10 px-3 py-2 text-xs text-oryzo-red">Currently Closed. Please Order Later.</p> : null}
          </div>
        </div>
        <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.15em] text-oryzo-muted">Scroll to explore ↓</p>
      </section>

      <section ref={statsRef} className="mx-auto grid w-full max-w-6xl gap-4 px-4 pb-10 md:grid-cols-3 md:px-10">
        <div ref={countOrdersRef} className="border border-white/10 bg-[#0f0f0f] p-4">
          <p className="text-[11px] uppercase tracking-[0.15em] text-oryzo-muted">Orders Served</p>
          <p className="font-display mt-2 text-4xl text-oryzo-warm">{countOrders}+</p>
        </div>
        <div ref={countHappyRef} className="border border-white/10 bg-[#0f0f0f] p-4">
          <p className="text-[11px] uppercase tracking-[0.15em] text-oryzo-muted">Satisfaction</p>
          <p className="font-display mt-2 text-4xl text-oryzo-warm">{countHappy}%</p>
        </div>
        <div ref={countRatingRef} className="border border-white/10 bg-[#0f0f0f] p-4">
          <p className="text-[11px] uppercase tracking-[0.15em] text-oryzo-muted">Rating</p>
          <p className="font-display mt-2 text-4xl text-oryzo-warm">{(countRating / 10).toFixed(1)}</p>
        </div>
      </section>

      <section ref={categoriesRef} id="categories" className="relative z-10 mx-auto mb-8 mt-2 flex w-full max-w-6xl gap-2 overflow-x-auto px-4 pb-2 md:px-10">
        {categories.map((c) => (
          <button key={c} className="shrink-0 border border-white/10 px-5 py-2 text-[11px] uppercase tracking-[0.15em] text-oryzo-muted transition hover:text-oryzo-warm">
            {c}
          </button>
        ))}
      </section>

      <section ref={featuredRef} className="min-h-[500px]">
        {featuredSeen ? <HorizontalScroll items={menu} /> : <FeaturedSkeleton />}
      </section>

      <section ref={menuHeaderRef} className="mx-auto w-full max-w-6xl px-4 md:px-10">
        <div className="mb-4 border-l-2 border-oryzo-gold pl-3 section-label">Menu Showcase</div>
      </section>
      <section ref={menuRef} className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 md:px-10">
        {menuSeen ? (
          <section ref={menuContainerRef} id="menu" className="space-y-4">
            {menu.map((item) => {
              const qty = cart[item._id || item.name]?.qty ?? 0;
              return <FoodCard key={item._id || item.name} item={item} qty={qty} onAdjust={adjust} />;
            })}
          </section>
        ) : (
          <FoodCardSkeleton />
        )}
      </section>

      <m.button onClick={() => setDrawer((x) => !x)} whileTap={{ scale: 0.96 }} className="fixed bottom-6 right-6 z-40 border border-white/15 bg-[rgba(10,10,10,0.9)] px-4 py-2 text-[11px] uppercase tracking-[0.15em] text-oryzo-warm">
        Cart ({count})
      </m.button>

      <m.aside
        initial={false}
        animate={{ x: drawer ? 0 : 440, opacity: drawer ? 1 : 0.4 }}
        transition={{ type: "spring", damping: 30, stiffness: 280 }}
        className="fixed right-0 top-0 z-40 h-screen w-[94vw] max-w-md border-l border-white/10 bg-[#0f0f0f] p-5"
      >
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
          <p className="text-[11px] uppercase tracking-[0.15em] text-oryzo-accent">Your Order</p>
          <span className="rounded-full border border-white/15 px-2 py-1 text-[10px]">{count}</span>
        </div>
        <div className="max-h-[52vh] space-y-1 overflow-auto pr-1">
          {lines.length === 0 && <div className="border border-white/10 px-3 py-3 text-xs text-oryzo-muted">No items yet. Add from menu below.</div>}
          {lines.map((l) => (
            <div key={l.item._id || l.item.name} className="flex items-center justify-between border-b border-white/5 py-4">
              <div>
                <p className="font-display text-base">{l.item.name}</p>
                <p className="text-[12px] text-oryzo-gold">{toCurrency(l.item.price)} x {l.qty}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="h-8 w-8 rounded-full border border-white/15 text-sm" onClick={() => adjust(l.item, -1)}>-</button>
                <button className="h-8 w-8 rounded-full border border-white/15 text-sm" onClick={() => adjust(l.item, 1)}>+</button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-white/10 pt-4">
          <p className="text-[11px] uppercase tracking-[0.15em] text-oryzo-muted">Total Amount</p>
          <p className="mt-1 text-xl text-oryzo-gold">{toCurrency(total)}</p>
        </div>
        <MagneticButton onClick={placeOrder} disabled={!lines.length || disabled} className="mt-4 w-full bg-oryzo-gold py-4 text-[11px] uppercase tracking-[0.15em] text-black transition hover:brightness-110 disabled:opacity-40">
          Place Order on WhatsApp
        </MagneticButton>
      </m.aside>

      <footer className="relative z-10 mt-10 border-t border-white/10 bg-[#060606] px-4 py-10 md:px-10">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-end justify-between gap-8">
          <div>
            <p className="font-display text-3xl text-oryzo-warm">Woodlands</p>
            <p className="mt-2 text-[11px] uppercase tracking-[0.15em] text-oryzo-muted">Pickup-only premium kitchen</p>
          </div>
          <div className="flex gap-5 text-[11px] uppercase tracking-[0.12em] text-oryzo-muted">
            <a className="hover:text-oryzo-warm" href="#">Home</a>
            <a className="hover:text-oryzo-warm" href="#menu">Menu</a>
            <a className="hover:text-oryzo-warm" href="#categories">Categories</a>
          </div>
        </div>
        <p className="mx-auto mt-8 w-full max-w-6xl text-[10px] uppercase tracking-[0.12em] text-[#555]">Built with obsession · © 2026</p>
      </footer>
    </main>
  );
}

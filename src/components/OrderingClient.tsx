"use client";

import Image from "next/image";
import { m, useScroll, useTransform } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { MenuItem } from "@/lib/types";
import { generatePickupSlots, toCurrency } from "@/lib/pickup";
import MagneticButton from "@/components/MagneticButton";

type Cart = Record<string, { item: MenuItem; qty: number }>;

const galleryImages = [
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1",
  "https://images.unsplash.com/photo-1600891964092-4316c288032e",
  "https://images.unsplash.com/photo-1512058564366-18510be2db19",
  "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba",
];

const sharedHeroDishImage = "https://media-cdn.tripadvisor.com/media/photo-s/1a/b5/d5/d0/grill-chicken-full.jpg";

const premiumEase = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  initial: { opacity: 0, y: 42 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.8, ease: premiumEase },
};

export default function OrderingClient() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [cart, setCart] = useState<Cart>({});
  const [drawer, setDrawer] = useState(false);
  const [pickupTime, setPickupTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [settings, setSettings] = useState({ shopOpen: true, acceptingOrders: true, busyMode: false, holidayMode: false });

  const { scrollY } = useScroll();
  const heroImageY = useTransform(scrollY, [0, 900], [0, 170]);
  const heroTextY = useTransform(scrollY, [0, 900], [0, -90]);
  const storyImageY = useTransform(scrollY, [300, 1400], [80, -110]);
  const galleryY = useTransform(scrollY, [1400, 2600], [100, -120]);

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
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data && !data.error) setSettings(data); })
      .catch(() => { /* use defaults if settings fail */ });
    setPickupTime(generatePickupSlots()[0] ?? "");
  }, []);

  const slots = useMemo(() => generatePickupSlots(), []);
  const featured = menu.filter((item) => item.inStock).slice(0, 6);
  const heroItem = featured[0] ?? menu[0];
  const lines = Object.values(cart);
  const count = lines.reduce((s, x) => s + x.qty, 0);
  const total = lines.reduce((s, x) => s + x.qty * x.item.price, 0);
  const disabled = !settings.shopOpen || !settings.acceptingOrders || settings.holidayMode;

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
    <main className="min-h-screen overflow-x-hidden bg-[#1D0F07] text-[#f8efe1]">
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-[#BF976A]/10 bg-[#1D0F07]/55 px-5 py-5 backdrop-blur-2xl md:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <a href="#" className="font-display text-3xl leading-none text-[#f8efe1]">Woodlands</a>
          <div className="hidden items-center gap-9 text-[10px] uppercase tracking-[0.26em] text-[#BF976A] md:flex">
            <a className="text-[#f8efe1]" href="#">Home</a>
            <a className="transition hover:text-[#f8efe1]" href="#story">Story</a>
            <a className="transition hover:text-[#f8efe1]" href="#menu">Menu</a>
            <a className="transition hover:text-[#f8efe1]" href="#gallery">Gallery</a>
          </div>
          <button onClick={() => setDrawer(true)} className="rounded-full border border-[#BF976A]/35 px-5 py-2 text-[10px] uppercase tracking-[0.22em] text-[#f8efe1] transition hover:bg-[#BF976A] hover:text-[#1D0F07]">
            Cart {count}
          </button>
        </div>
      </nav>

      <section className="relative isolate min-h-screen overflow-hidden px-5 pb-16 pt-28 md:px-10">
        <Image
          src={sharedHeroDishImage}
          alt="Restaurant table"
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 -z-30 object-cover opacity-30"
        />
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_70%_35%,rgba(191,151,106,0.34),transparent_28%),linear-gradient(90deg,#1D0F07_0%,rgba(29,15,7,0.92)_42%,rgba(29,15,7,0.62)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-56 bg-gradient-to-t from-[#1D0F07] to-transparent" />

        <div className="mx-auto grid min-h-[calc(100vh-7rem)] max-w-7xl items-center gap-10 md:grid-cols-[0.95fr_1.05fr]">
          <m.div style={{ y: heroTextY }} className="relative z-10">
            <m.p {...fadeUp} className="mb-5 text-[11px] uppercase tracking-[0.35em] text-[#BF976A]">Premium dark kitchen</m.p>
            <m.h1 {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.08 }} className="font-display text-6xl leading-[0.88] text-[#f8efe1] md:text-8xl lg:text-9xl">
              Taste in
              <span className="block text-[#BF976A]">Motion</span>
            </m.h1>
            <m.p {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.16 }} className="mt-7 max-w-md font-serif text-lg leading-8 text-[#d8c4a0]">
              Minimal ordering, dramatic flavors, and warm pickup service from a kitchen built for the evening rush.
            </m.p>
            <m.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.24 }} className="mt-9 flex flex-wrap gap-4">
              <MagneticButton as="a" href="#menu" className="rounded-full bg-[#BF976A] px-8 py-4 text-[11px] uppercase tracking-[0.18em] text-[#1D0F07] transition hover:brightness-110">
                Explore Menu
              </MagneticButton>
              <button onClick={() => setDrawer(true)} className="rounded-full border border-[#BF976A]/35 px-8 py-4 text-[11px] uppercase tracking-[0.18em] text-[#f8efe1] transition hover:border-[#BF976A]">
                Place Order
              </button>
            </m.div>
          </m.div>

          <m.div style={{ y: heroImageY }} className="relative min-h-[520px]">
            <div className="absolute right-0 top-8 h-[78%] w-[74%] overflow-hidden rounded-[42px] shadow-[0_45px_110px_rgba(0,0,0,0.45)]">
              <Image
                src={sharedHeroDishImage}
                alt={heroItem?.name ?? "Featured dish"}
                fill
                priority
                sizes="(max-width: 768px) 90vw, 48vw"
                className="object-cover transition duration-700 hover:scale-105"
              />
            </div>
            <div className="absolute bottom-6 left-0 h-56 w-48 overflow-hidden rounded-[32px] border border-[#BF976A]/20 shadow-[0_30px_80px_rgba(0,0,0,0.4)] md:h-72 md:w-60">
              <Image src="https://images.unsplash.com/photo-1600891964092-4316c288032e" alt="Plated starter" fill sizes="260px" className="object-cover transition duration-700 hover:scale-105" />
            </div>
            <div className="absolute left-[18%] top-8 rounded-full border border-[#BF976A]/25 bg-[#5D1F0A]/80 px-5 py-3 text-[10px] uppercase tracking-[0.22em] text-[#f8efe1] shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
              Pickup ready
            </div>
          </m.div>
        </div>
      </section>

      <section id="story" className="relative px-5 py-24 md:px-10 md:py-32">
        <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-[0.9fr_1.1fr]">
          <m.div {...fadeUp}>
            <p className="text-[11px] uppercase tracking-[0.32em] text-[#BF976A]">Our Story</p>
            <h2 className="mt-5 font-display text-5xl leading-[0.95] text-[#f8efe1] md:text-7xl">Fire, spice, and late-night comfort.</h2>
          </m.div>
          <m.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.12 }} className="grid gap-8 md:grid-cols-2">
            <p className="font-serif text-lg leading-8 text-[#d8c4a0]">Built around rich grills, shawarma, rice, and starters, Woodlands keeps the experience sharp: choose, pickup, eat.</p>
            <p className="text-sm leading-7 text-[#a98d62]">Visual-first ordering with layered motion, deep color, and enough restraint to let the food do the talking.</p>
          </m.div>
        </div>
        <m.div style={{ y: storyImageY }} className="mx-auto mt-16 grid max-w-7xl gap-5 md:grid-cols-[1.2fr_0.8fr]">
          <div className="relative h-[420px] overflow-hidden rounded-[38px] shadow-[0_35px_100px_rgba(0,0,0,0.35)]">
            <Image src="https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba" alt="Grill" fill sizes="60vw" className="object-cover transition duration-700 hover:scale-105" />
          </div>
          <div className="relative mt-16 h-[340px] overflow-hidden rounded-[38px] shadow-[0_35px_100px_rgba(0,0,0,0.35)] md:mt-28">
            <Image src="https://images.unsplash.com/photo-1534422298391-e4f8c172dddb" alt="Rice dish" fill sizes="40vw" className="object-cover transition duration-700 hover:scale-105" />
          </div>
        </m.div>
      </section>

      <section id="menu" className="relative px-5 py-24 md:px-10">
        <div className="mx-auto max-w-7xl">
          <m.div {...fadeUp} className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.32em] text-[#BF976A]">Menu Showcase</p>
              <h2 className="mt-5 font-display text-5xl leading-none text-[#f8efe1] md:text-7xl">Signature picks</h2>
            </div>
            {menuError ? <p className="text-sm text-[#BF976A]">{menuError}</p> : null}
          </m.div>
          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {menu.map((item, index) => {
              const qty = cart[item._id || item.name]?.qty ?? 0;
              return (
                <m.article
                  key={item._id || item.name}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: index * 0.06 }}
                  className={[
                    "group overflow-hidden rounded-[30px] border border-[#BF976A]/15 bg-[#2a1309]/80 shadow-[0_30px_90px_rgba(0,0,0,0.28)]",
                    index % 3 === 1 ? "lg:mt-16" : "",
                  ].join(" ")}
                >
                  <div className="relative h-72 overflow-hidden">
                    <Image src={item.image} alt={item.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1D0F07]/92 via-transparent to-transparent" />
                    <p className="absolute left-5 top-5 rounded-full bg-[#1D0F07]/70 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-[#BF976A]">{item.category}</p>
                  </div>
                  <div className="p-6">
                    <h3 className="font-display text-4xl leading-none text-[#f8efe1]">{item.name}</h3>
                    <div className="mt-5 flex items-center justify-between gap-4">
                      <p className="text-lg text-[#BF976A]">{toCurrency(item.price)}</p>
                      <div className="flex items-center gap-2">
                        <button className="h-9 w-9 rounded-full border border-[#BF976A]/25 text-[#f8efe1]" onClick={() => adjust(item, -1)}>-</button>
                        <span className="w-5 text-center text-sm text-[#d8c4a0]">{qty}</span>
                        <button disabled={!item.inStock} className="h-9 rounded-full bg-[#BF976A] px-5 text-[10px] uppercase tracking-[0.16em] text-[#1D0F07] disabled:cursor-not-allowed disabled:opacity-40" onClick={() => adjust(item, 1)}>
                          {item.inStock ? "Add" : "Out"}
                        </button>
                      </div>
                    </div>
                  </div>
                </m.article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="gallery" className="relative overflow-hidden px-5 py-24 md:px-10 md:py-32">
        <div className="absolute inset-x-0 top-1/2 h-px bg-[#BF976A]/15" />
        <div className="mx-auto max-w-7xl">
          <m.div {...fadeUp} className="max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.32em] text-[#BF976A]">Gallery</p>
            <h2 className="mt-5 font-display text-5xl leading-none text-[#f8efe1] md:text-7xl">Layers of heat and texture.</h2>
          </m.div>
          <m.div style={{ y: galleryY }} className="relative mt-16 min-h-[760px] md:min-h-[680px]">
            {galleryImages.map((src, index) => (
              <div
                key={src}
                className={[
                  "absolute overflow-hidden rounded-[34px] shadow-[0_35px_100px_rgba(0,0,0,0.38)]",
                  index === 0 ? "left-0 top-6 h-80 w-[78%] md:h-[430px] md:w-[42%]" : "",
                  index === 1 ? "right-0 top-0 h-72 w-[70%] md:h-[360px] md:w-[34%]" : "",
                  index === 2 ? "bottom-24 left-[12%] h-72 w-[74%] md:bottom-0 md:left-[36%] md:h-[380px] md:w-[36%]" : "",
                  index === 3 ? "bottom-0 right-[2%] h-56 w-[58%] md:bottom-14 md:h-[290px] md:w-[24%]" : "",
                ].join(" ")}
              >
                <Image src={src} alt="Woodlands gallery" fill sizes="(max-width: 768px) 80vw, 42vw" className="object-cover transition duration-700 hover:scale-105" />
              </div>
            ))}
          </m.div>
        </div>
      </section>

      <m.aside
        initial={false}
        animate={{ x: drawer ? 0 : 460, opacity: drawer ? 1 : 0.35 }}
        transition={{ type: "spring", damping: 30, stiffness: 280 }}
        className="fixed right-0 top-0 z-[60] h-screen w-[94vw] max-w-md border-l border-[#BF976A]/15 bg-[#1D0F07] p-5 text-[#f8efe1] shadow-[0_0_90px_rgba(0,0,0,0.55)]"
      >
        <div className="mb-5 flex items-center justify-between border-b border-[#BF976A]/15 pb-5">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#BF976A]">Your Order</p>
          <button className="rounded-full border border-[#BF976A]/25 px-3 py-1 text-[10px]" onClick={() => setDrawer(false)}>Close</button>
        </div>
        <div className="grid gap-3">
          <select className="input-editorial w-full px-4 py-3" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)}>
            {slots.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input className="input-editorial w-full px-4 py-3" placeholder="Customer Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input-editorial w-full px-4 py-3" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="mt-5 max-h-[42vh] space-y-1 overflow-auto pr-1">
          {lines.length === 0 && <div className="border border-[#BF976A]/15 px-4 py-4 text-xs text-[#a98d62]">No items yet. Add from menu below.</div>}
          {lines.map((l) => (
            <div key={l.item._id || l.item.name} className="flex items-center justify-between border-b border-[#BF976A]/10 py-4">
              <div>
                <p className="font-display text-xl">{l.item.name}</p>
                <p className="text-[12px] text-[#BF976A]">{toCurrency(l.item.price)} x {l.qty}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="h-8 w-8 rounded-full border border-[#BF976A]/25 text-sm" onClick={() => adjust(l.item, -1)}>-</button>
                <button className="h-8 w-8 rounded-full border border-[#BF976A]/25 text-sm" onClick={() => adjust(l.item, 1)}>+</button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 border-t border-[#BF976A]/15 pt-5">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#a98d62]">Total Amount</p>
          <p className="mt-1 font-display text-4xl text-[#BF976A]">{toCurrency(total)}</p>
        </div>
        <MagneticButton onClick={placeOrder} disabled={!lines.length || disabled} className="mt-5 w-full rounded-full bg-[#BF976A] py-4 text-[11px] uppercase tracking-[0.18em] text-[#1D0F07] transition hover:brightness-110 disabled:opacity-40">
          Place Order on WhatsApp
        </MagneticButton>
      </m.aside>

      <footer className="relative border-t border-[#BF976A]/15 bg-[#160b05] px-5 py-12 md:px-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-8">
          <div>
            <p className="font-display text-5xl leading-none text-[#f8efe1]">Woodlands</p>
            <p className="mt-3 text-[11px] uppercase tracking-[0.22em] text-[#BF976A]">Premium pickup restaurant</p>
          </div>
          <div className="flex gap-6 text-[10px] uppercase tracking-[0.2em] text-[#a98d62]">
            <a className="hover:text-[#f8efe1]" href="#">Home</a>
            <a className="hover:text-[#f8efe1]" href="#story">Story</a>
            <a className="hover:text-[#f8efe1]" href="#menu">Menu</a>
            <a className="hover:text-[#f8efe1]" href="#gallery">Gallery</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

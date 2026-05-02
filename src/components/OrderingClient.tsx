"use client";

import Image from "next/image";
import { m, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState, useRef } from "react";
import { MenuItem } from "@/lib/types";
import { generatePickupSlots, toCurrency } from "@/lib/pickup";
import MagneticButton from "@/components/MagneticButton";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

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
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.9, ease: premiumEase },
};

export default function OrderingClient() {
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
  const [settings, setSettings] = useState({ shopOpen: true, acceptingOrders: true, busyMode: false, holidayMode: false });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const filteredMenu = useMemo(() => {
    if (!searchQuery) return [];
    return menu.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [menu, searchQuery]);

  const containerRef = useRef<HTMLElement>(null);
  const heroBgRef = useRef<HTMLImageElement>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const heroImageRef = useRef<HTMLDivElement>(null);
  const storySectionRef = useRef<HTMLElement>(null);
  const storyImage1Ref = useRef<HTMLDivElement>(null);
  const storyImage2Ref = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLElement>(null);

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

  useGSAP(() => {
    // Hero Parallax & Zoom
    gsap.to(heroBgRef.current, {
      yPercent: 15,
      scale: 1.05,
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "bottom top",
        scrub: 1,
      },
    });

    gsap.to(heroTextRef.current, {
      y: -50,
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "bottom top",
        scrub: 1,
      },
    });

    gsap.to(heroImageRef.current, {
      y: 110,
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "bottom top",
        scrub: 1,
      },
    });

    // Story Parallax
    gsap.to(storyImage1Ref.current, {
      y: -40,
      ease: "none",
      scrollTrigger: {
        trigger: storySectionRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
      },
    });

    gsap.to(storyImage2Ref.current, {
      y: -70,
      ease: "none",
      scrollTrigger: {
        trigger: storySectionRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
      },
    });

    // Gallery Parallax
    if (galleryRef.current) {
      const images = galleryRef.current.children;
      gsap.fromTo(
        images,
        { y: 50 },
        {
          y: -60,
          ease: "none",
          stagger: 0.05,
          scrollTrigger: {
            trigger: galleryRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        }
      );
    }
    
    // Menu Stagger
    if (menuRef.current) {
      const cards = gsap.utils.toArray(".menu-card");
      if (cards.length > 0) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            stagger: 0.08,
            ease: "power3.out",
            scrollTrigger: {
              trigger: menuRef.current,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }
    }
  }, { scope: containerRef, dependencies: [menu] });

  const slots = useMemo(() => generatePickupSlots(), []);
  const featured = menu.filter((item) => item.inStock).slice(0, 6);
  const heroItem = featured[0] ?? menu[0];
  const lines = Object.values(cart);
  const count = lines.reduce((s, x) => s + x.qty, 0);
  const total = lines.reduce((s, x) => s + x.qty * x.item.price, 0);
  const disabled = !settings.shopOpen || !settings.acceptingOrders || settings.holidayMode;

  // Validation Logic
  const isNameValid = name.trim().length > 0;
  const phoneDigits = phone.replace(/\D/g, "");
  const isPhoneFormatValid = /^\+?[\d\s]*$/.test(phone);
  const isPhoneLengthValid = phoneDigits.length >= 10;
  const isPhoneValid = isPhoneFormatValid && isPhoneLengthValid && phone.trim().length > 0;
  
  const nameError = touchedName && !isNameValid ? "Customer name is required." : "";
  const phoneError = touchedPhone && !phone.trim() ? "Phone number is required." 
    : touchedPhone && !isPhoneFormatValid ? "Phone must contain only numbers." 
    : touchedPhone && !isPhoneLengthValid ? "Phone must be at least 10 digits." 
    : "";

  const isFormValid = isNameValid && isPhoneValid && pickupTime !== "";

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
        items: lines.map((x) => ({ itemId: x.item._id, name: x.item.name, price: x.item.price, qty: x.qty })),
        totalAmount: total,
      };
      const res = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      setSuccess(true);
      setTimeout(() => {
        window.location.href = data.redirectUrl;
      }, 1000);
    } catch (err) {
      console.error("Order submission failed:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <main ref={containerRef} className="min-h-screen overflow-x-hidden bg-[#1D0F07] text-[#f8efe1]">
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-[#BF976A]/10 bg-[#1D0F07]/75 px-5 py-5 backdrop-blur-lg md:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <a href="#" className="font-display text-3xl leading-none text-[#f8efe1] transition-transform hover:scale-[1.02]">Woodlands</a>
          
          <div className="hidden flex-1 items-center justify-center gap-9 text-[10px] uppercase tracking-[0.26em] text-[#BF976A] md:flex">
            <a className="text-[#f8efe1] transition-colors hover:text-[#BF976A]" href="#">Home</a>
            <a className="transition-colors hover:text-[#f8efe1]" href="#story">Story</a>
            <a className="transition-colors hover:text-[#f8efe1]" href="#menu">Menu</a>
            <a className="transition-colors hover:text-[#f8efe1]" href="#gallery">Gallery</a>
            <a className="transition-colors hover:text-[#f8efe1]" href="#contact">Contact</a>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <div className="relative flex items-center">
                <svg className="absolute left-4 h-4 w-4 text-[#BF976A] opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for food items..." 
                  className="w-56 rounded-full border border-[#BF976A]/20 bg-[#1D0F07]/60 py-2.5 pl-11 pr-4 text-xs text-[#f8efe1] placeholder-[#BF976A]/50 outline-none transition-[border-color,background-color] duration-300 hover:border-[#BF976A]/40 focus:border-[#BF976A] focus:bg-[#1D0F07]/80"
                />
              </div>
              <AnimatePresence>
                {searchQuery && (
                  <m.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute left-0 top-full mt-4 w-full overflow-hidden rounded-[24px] border border-[#BF976A]/15 bg-[#1D0F07] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
                  >
                     {filteredMenu.length > 0 ? (
                       filteredMenu.slice(0, 5).map(item => (
                         <div 
                           key={item._id || item.name}
                           onClick={() => { setSelectedItem(item); setSearchQuery(""); }}
                           className="group flex cursor-pointer items-center gap-3 rounded-[16px] p-2 transition-colors hover:bg-[#BF976A]/10"
                         >
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[12px]">
                              <Image src={item.image} alt={item.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="truncate text-sm text-[#f8efe1] transition-colors group-hover:text-[#BF976A]">{item.name}</p>
                              <p className="text-[10px] text-[#BF976A]">{toCurrency(item.price)}</p>
                            </div>
                         </div>
                       ))
                     ) : (
                       <p className="p-4 text-center text-xs text-[#BF976A]">No items found.</p>
                     )}
                  </m.div>
                )}
              </AnimatePresence>
            </div>

            <m.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setDrawer(true)} 
              className="rounded-full border border-[#BF976A]/35 px-5 py-2.5 text-[10px] uppercase tracking-[0.22em] text-[#f8efe1] transition-colors hover:bg-[#BF976A] hover:text-[#1D0F07]"
            >
              Cart {count}
            </m.button>
          </div>
        </div>
      </nav>

      <section className="relative isolate min-h-screen overflow-hidden px-5 pb-16 pt-28 md:px-10">
        <Image
          ref={heroBgRef}
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
          <div ref={heroTextRef} className="relative z-10">
            <m.p {...fadeUp} className="mb-5 text-[11px] uppercase tracking-[0.35em] text-[#BF976A]">Premium dark kitchen</m.p>
            <m.h1 {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.08 }} className="font-display text-6xl leading-[0.88] text-[#f8efe1] md:text-8xl lg:text-9xl">
              Taste in
              <span className="block text-[#BF976A]">Motion</span>
            </m.h1>
            <m.p {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.16 }} className="mt-7 max-w-md font-serif text-lg leading-8 text-[#d8c4a0]">
              Minimal ordering, dramatic flavors, and warm pickup service from a kitchen built for the evening rush.
            </m.p>
            <m.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.24 }} className="mt-9 flex flex-wrap gap-4">
              <MagneticButton as="a" href="#menu" className="rounded-full bg-[#BF976A] px-8 py-4 text-[11px] uppercase tracking-[0.18em] text-[#1D0F07] transition-[filter] hover:brightness-110">
                Explore Menu
              </MagneticButton>
              <m.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setDrawer(true)} 
                className="rounded-full border border-[#BF976A]/35 px-8 py-4 text-[11px] uppercase tracking-[0.18em] text-[#f8efe1] transition-colors hover:border-[#BF976A] hover:bg-[#BF976A]/5"
              >
                Place Order
              </m.button>
            </m.div>
          </div>

          <div ref={heroImageRef} className="relative min-h-[520px]">
            <div className="absolute right-0 top-8 h-[78%] w-[74%] overflow-hidden rounded-[42px] shadow-[0_45px_110px_rgba(0,0,0,0.45)]">
              <Image
                src={sharedHeroDishImage}
                alt={heroItem?.name ?? "Featured dish"}
                fill
                priority
                sizes="(max-width: 768px) 90vw, 48vw"
                className="object-cover transition-transform duration-[1.2s] ease-out hover:scale-105"
              />
            </div>
            <div className="absolute bottom-6 left-0 h-56 w-48 overflow-hidden rounded-[32px] border border-[#BF976A]/20 shadow-[0_30px_80px_rgba(0,0,0,0.4)] md:h-72 md:w-60">
              <Image src="https://images.unsplash.com/photo-1600891964092-4316c288032e" alt="Plated starter" fill sizes="260px" className="object-cover transition-transform duration-[1.2s] ease-out hover:scale-105" />
            </div>
            <m.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 150, damping: 20 }}
              className="absolute left-[18%] top-8 rounded-full border border-[#BF976A]/25 bg-[#5D1F0A]/80 px-5 py-3 text-[10px] uppercase tracking-[0.22em] text-[#f8efe1] shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
            >
              Pickup ready
            </m.div>
          </div>
        </div>
      </section>

      <section id="story" ref={storySectionRef} className="relative px-5 py-24 md:px-10 md:py-32">
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
        <div className="mx-auto mt-16 grid max-w-7xl gap-5 md:grid-cols-[1.2fr_0.8fr]">
          <div ref={storyImage1Ref} className="relative h-[420px] overflow-hidden rounded-[38px] shadow-[0_35px_100px_rgba(0,0,0,0.35)]">
            <Image src="https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba" alt="Grill" fill sizes="60vw" className="object-cover transition-transform duration-[1.2s] ease-out hover:scale-105" />
          </div>
          <div ref={storyImage2Ref} className="relative mt-16 h-[340px] overflow-hidden rounded-[38px] shadow-[0_35px_100px_rgba(0,0,0,0.35)] md:mt-28">
            <Image src="https://images.unsplash.com/photo-1534422298391-e4f8c172dddb" alt="Rice dish" fill sizes="40vw" className="object-cover transition-transform duration-[1.2s] ease-out hover:scale-105" />
          </div>
        </div>
      </section>

      <section id="menu" ref={menuRef} className="relative px-5 py-24 md:px-10">
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
                <article
                  key={item._id || item.name}
                  className={[
                    "menu-card group overflow-hidden rounded-[30px] border border-[#BF976A]/15 bg-[#2a1309]/80 shadow-[0_30px_90px_rgba(0,0,0,0.28)] transition-colors duration-500 ease-out hover:border-[#BF976A]/30 opacity-0 translate-y-12",
                    index % 3 === 1 ? "lg:mt-16" : "",
                  ].join(" ")}
                >
                  <div className="relative h-72 overflow-hidden">
                    <Image src={item.image} alt={item.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1D0F07]/92 via-transparent to-transparent" />
                    <p className="absolute left-5 top-5 rounded-full bg-[#1D0F07]/70 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-[#BF976A]">{item.category}</p>
                  </div>
                  <div className="p-6">
                    <h3 className="font-display text-4xl leading-none text-[#f8efe1] transition-colors duration-300 group-hover:text-[#BF976A]">{item.name}</h3>
                    <div className="mt-5 flex items-center justify-between gap-4">
                      <p className="text-lg text-[#BF976A]">{toCurrency(item.price)}</p>
                      <div className="flex items-center gap-2">
                        <m.button 
                          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          className="h-9 w-9 rounded-full border border-[#BF976A]/25 text-[#f8efe1] transition-colors hover:bg-[#BF976A]/10" 
                          onClick={() => adjust(item, -1)}
                        >-</m.button>
                        <span className="w-5 text-center text-sm text-[#d8c4a0]">{qty}</span>
                        <m.button 
                          whileHover={item.inStock ? { scale: 1.02 } : {}} whileTap={item.inStock ? { scale: 0.98 } : {}}
                          disabled={!item.inStock} 
                          className="h-9 rounded-full bg-[#BF976A] px-5 text-[10px] uppercase tracking-[0.16em] text-[#1D0F07] transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40" 
                          onClick={() => adjust(item, 1)}
                        >
                          {item.inStock ? "Add" : "Out"}
                        </m.button>
                      </div>
                    </div>
                  </div>
                </article>
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
          <div ref={galleryRef} className="relative mt-16 min-h-[760px] md:min-h-[680px]">
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
                <Image src={src} alt="Woodlands gallery" fill sizes="(max-width: 768px) 80vw, 42vw" className="object-cover transition-transform duration-[1.2s] ease-out hover:scale-105" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="relative px-5 py-24 md:px-10 md:py-32 bg-[#1A0C06]">
        <div className="absolute inset-x-0 top-0 h-px bg-[#BF976A]/10" />
        <div className="mx-auto max-w-7xl">
          <m.div {...fadeUp} className="max-w-2xl mb-16">
            <p className="text-[11px] uppercase tracking-[0.32em] text-[#BF976A]">Reach Out</p>
            <h2 className="mt-5 font-display text-5xl leading-none text-[#f8efe1] md:text-7xl">Find us here.</h2>
          </m.div>
          
          <div className="grid gap-12 md:grid-cols-2 lg:gap-20">
            <m.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="flex flex-col gap-10">
              <div className="flex gap-5 group">
                <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#BF976A]/20 bg-[#BF976A]/5 text-[#BF976A] transition-colors duration-500 group-hover:bg-[#BF976A]/15">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <div>
                  <h4 className="font-display text-2xl text-[#f8efe1] transition-colors group-hover:text-[#BF976A]">Address</h4>
                  <p className="mt-3 font-serif text-[#d8c4a0] leading-relaxed max-w-sm">
                    52/2, 52/2, Ramanuja Iyer St,<br />
                    NN Garden, Washermanpet,<br />
                    Chennai, Tamil Nadu 600021
                  </p>
                </div>
              </div>

              <div className="flex gap-5 group">
                <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#BF976A]/20 bg-[#BF976A]/5 text-[#BF976A] transition-colors duration-500 group-hover:bg-[#BF976A]/15">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </div>
                <div>
                  <h4 className="font-display text-2xl text-[#f8efe1] transition-colors group-hover:text-[#BF976A]">Phone</h4>
                  <div className="mt-3 flex flex-col gap-2 font-serif text-[17px] text-[#d8c4a0]">
                    <a href="tel:+919840489878" className="transition-colors hover:text-[#BF976A]">+91 98404 89878</a>
                    <a href="tel:+917200110489" className="transition-colors hover:text-[#BF976A]">+91 72001 10489</a>
                  </div>
                </div>
              </div>
            </m.div>

            <m.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }} className="h-80 w-full overflow-hidden rounded-[30px] border border-[#BF976A]/15 shadow-[0_20px_60px_rgba(0,0,0,0.4)] md:h-[400px]">
              <iframe 
                src="https://maps.google.com/maps?q=52/2,%20Ramanuja%20Iyer%20St,%20NN%20Garden,%20Washermanpet,%20Chennai,%20Tamil%20Nadu%20600021&t=&z=15&ie=UTF8&iwloc=&output=embed" 
                width="100%" 
                height="100%" 
                style={{ border: 0, filter: "invert(90%) hue-rotate(180deg) brightness(85%) contrast(110%) sepia(35%) grayscale(20%)" }} 
                allowFullScreen 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                className="transition-transform duration-[2s] ease-out hover:scale-[1.03]"
              />
            </m.div>
          </div>
        </div>
      </section>

      <m.aside
        initial={false}
        animate={{ x: drawer ? 0 : 460, opacity: drawer ? 1 : 0.35 }}
        transition={{ type: "spring", damping: 30, stiffness: 280 }}
        className="fixed right-0 top-0 z-[60] h-screen w-[94vw] max-w-md border-l border-[#BF976A]/15 bg-[#1D0F07]/95 p-5 text-[#f8efe1] shadow-[-20px_0_90px_rgba(0,0,0,0.55)]"
      >
        <div className="mb-5 flex items-center justify-between border-b border-[#BF976A]/15 pb-5">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#BF976A]">Your Order</p>
          <m.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="rounded-full border border-[#BF976A]/25 px-3 py-1 text-[10px] transition-colors hover:bg-[#BF976A]/10" onClick={() => setDrawer(false)}>Close</m.button>
        </div>
        <div className="grid gap-4">
          <div>
            <select 
              className={`input-editorial w-full px-4 py-3 transition-colors ${!pickupTime ? 'border-red-500/50 hover:border-red-500/70 focus:border-red-500' : 'hover:border-[#BF976A]/40 focus:border-[#BF976A]'}`} 
              value={pickupTime} 
              onChange={(e) => setPickupTime(e.target.value)}
            >
              <option value="" disabled className="bg-[#1D0F07] text-[#f8efe1]/50">Select Pickup Time</option>
              {slots.map((s) => <option key={s} value={s} className="bg-[#1D0F07] text-[#f8efe1]">{s}</option>)}
            </select>
            {!pickupTime && <p className="mt-1 text-[10px] text-red-400">Pickup time is required.</p>}
          </div>
          <div>
            <input 
              className={`input-editorial w-full px-4 py-3 transition-colors ${nameError ? 'border-red-500/50 hover:border-red-500/70 focus:border-red-500' : 'hover:border-[#BF976A]/40 focus:border-[#BF976A]'}`} 
              placeholder="Customer Name" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouchedName(true)}
            />
            <AnimatePresence>
              {nameError && <m.p initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} className="mt-1 text-[10px] text-red-400">{nameError}</m.p>}
            </AnimatePresence>
          </div>
          <div>
            <input 
              className={`input-editorial w-full px-4 py-3 transition-colors ${phoneError ? 'border-red-500/50 hover:border-red-500/70 focus:border-red-500' : 'hover:border-[#BF976A]/40 focus:border-[#BF976A]'}`} 
              placeholder="Phone Number (e.g. 9876543210)" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)}
              onBlur={() => setTouchedPhone(true)}
            />
            <AnimatePresence>
              {phoneError && <m.p initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} className="mt-1 text-[10px] text-red-400">{phoneError}</m.p>}
            </AnimatePresence>
          </div>
        </div>
        <div className="mt-6 max-h-[42vh] space-y-1 overflow-auto pr-1">
          {lines.length === 0 && <div className="border border-[#BF976A]/15 px-4 py-4 text-xs text-[#a98d62]">No items yet. Add from menu below.</div>}
          {lines.map((l) => (
            <m.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} key={l.item._id || l.item.name} className="flex items-center justify-between border-b border-[#BF976A]/10 py-4">
              <div>
                <p className="font-display text-xl">{l.item.name}</p>
                <p className="text-[12px] text-[#BF976A]">{toCurrency(l.item.price)} x {l.qty}</p>
              </div>
              <div className="flex items-center gap-2">
                <m.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="h-8 w-8 rounded-full border border-[#BF976A]/25 text-sm transition-colors hover:bg-[#BF976A]/10" onClick={() => adjust(l.item, -1)}>-</m.button>
                <m.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="h-8 w-8 rounded-full border border-[#BF976A]/25 text-sm transition-colors hover:bg-[#BF976A]/10" onClick={() => adjust(l.item, 1)}>+</m.button>
              </div>
            </m.div>
          ))}
        </div>
        <div className="mt-5 border-t border-[#BF976A]/15 pt-5">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#a98d62]">Total Amount</p>
          <m.p key={total} initial={{ scale: 0.95, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }} className="mt-1 font-display text-4xl text-[#BF976A]">{toCurrency(total)}</m.p>
        </div>
        <MagneticButton 
          onClick={placeOrder} 
          disabled={!lines.length || disabled || !isFormValid || isSubmitting || success} 
          className="mt-5 w-full rounded-full bg-[#BF976A] py-4 text-[11px] uppercase tracking-[0.18em] text-[#1D0F07] transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {success ? "Redirecting..." : isSubmitting ? "Processing..." : "Place Order on WhatsApp"}
        </MagneticButton>
      </m.aside>

      <footer className="relative border-t border-[#BF976A]/15 bg-[#160b05] px-5 py-12 md:px-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-8">
          <div>
            <p className="font-display text-5xl leading-none text-[#f8efe1] transition-transform duration-500 ease-out hover:scale-[1.02] origin-left inline-block">Woodlands</p>
            <p className="mt-3 text-[11px] uppercase tracking-[0.22em] text-[#BF976A]">Premium pickup restaurant</p>
          </div>
          <div className="flex gap-6 text-[10px] uppercase tracking-[0.2em] text-[#a98d62]">
            <a className="transition-colors hover:text-[#f8efe1]" href="#">Home</a>
            <a className="transition-colors hover:text-[#f8efe1]" href="#story">Story</a>
            <a className="transition-colors hover:text-[#f8efe1]" href="#menu">Menu</a>
            <a className="transition-colors hover:text-[#f8efe1]" href="#gallery">Gallery</a>
            <a className="transition-colors hover:text-[#f8efe1]" href="#contact">Contact</a>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-5">
            <m.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="absolute inset-0 bg-[#1D0F07]/80"
            />
            <m.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative z-10 flex w-full max-w-3xl flex-col overflow-hidden rounded-[32px] border border-[#BF976A]/20 bg-[#1D0F07] shadow-[0_0_80px_rgba(0,0,0,0.8)] md:flex-row"
            >
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute right-6 top-6 z-20 rounded-full border border-[#BF976A]/20 bg-[#1D0F07]/50 p-2 text-[#BF976A] transition-colors hover:bg-[#BF976A]/20 hover:text-[#f8efe1]"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <div className="relative h-72 w-full md:h-auto md:w-1/2">
                <Image src={selectedItem.image} alt={selectedItem.name} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1D0F07] via-transparent to-transparent md:bg-gradient-to-r" />
              </div>
              <div className="flex flex-col justify-center p-8 md:w-1/2 md:p-12">
                <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-[#BF976A]">{selectedItem.category}</p>
                <h3 className="font-display text-4xl leading-tight text-[#f8efe1] md:text-5xl">{selectedItem.name}</h3>
                <p className="mt-5 font-serif text-[15px] leading-relaxed text-[#d8c4a0]">
                  A signature dish crafted with premium ingredients, offering layers of heat, texture, and deep flavors. Prepared fresh and built for a satisfying meal.
                </p>
                <p className="mt-8 text-3xl text-[#BF976A]">{toCurrency(selectedItem.price)}</p>
                
                <MagneticButton 
                  onClick={() => { adjust(selectedItem, 1); setSelectedItem(null); setDrawer(true); }}
                  disabled={!selectedItem.inStock}
                  className="mt-8 w-full rounded-full bg-[#BF976A] py-5 text-[11px] uppercase tracking-[0.18em] text-[#1D0F07] transition-[filter] hover:brightness-110 disabled:opacity-40"
                >
                  {selectedItem.inStock ? "Add to Cart" : "Out of Stock"}
                </MagneticButton>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}

"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MenuItem } from "@/lib/types";

type Props = {
  items: MenuItem[];
  cart: Record<string, { item: MenuItem; qty: number }>;
  onAdjust: (item: MenuItem, delta: number) => void;
};

export default function HorizontalScroll({ items, onAdjust }: Props) {
  const containerRef = useRef<HTMLElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (!containerRef.current || !trackRef.current) return;
    const totalWidth = Math.max(trackRef.current.scrollWidth - window.innerWidth, 0);
    if (!totalWidth) return;

    const tween = gsap.to(trackRef.current, {
      x: -totalWidth,
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: `+=${totalWidth}`,
        scrub: 1,
        pin: true,
        anticipatePin: 1,
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [items.length]);

  return (
    <section ref={containerRef} className="relative mb-12 overflow-hidden border-y border-[#5d1f0a]/10 bg-[#bbb0a3]/20 py-10">
      <div ref={trackRef} className="flex w-max gap-5 px-4 md:px-10">
        {items.slice(0, 8).map((item) => (
          <div key={`featured-${item._id || item.name}`} className="w-[310px] shrink-0 border border-[#5d1f0a]/10 bg-[#fffbf1]/72 p-4 text-[#1d0f07] shadow-[0_18px_45px_rgba(93,31,10,0.08)] transition hover:border-[#b4421f]/30">
            <div className="relative h-52 w-full overflow-hidden rounded-[999px] bg-[#f5efe1]" data-cursor="view">
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover p-2 transition duration-500 ease-out hover:scale-[1.03]"
                loading="lazy"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="font-display text-2xl text-[#1d0f07]">{item.name}</p>
                <p className="text-[11px] uppercase tracking-[0.12em] text-[#668b40]">{item.category}</p>
              </div>
              <button 
                onClick={() => onAdjust(item, 1)} 
                className="rounded-full border border-[#5d1f0a]/15 bg-[#1d0f07] px-4 py-2 text-[10px] uppercase text-[#fffbf1] transition hover:border-[#b4421f] hover:bg-[#b4421f]"
                data-cursor="button"
              >
                Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

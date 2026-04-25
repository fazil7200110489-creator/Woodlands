"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MenuItem } from "@/lib/types";

export default function HorizontalScroll({ items }: { items: MenuItem[] }) {
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
    <section ref={containerRef} className="relative mb-12 overflow-hidden border-y border-white/10 bg-black/30 py-8">
      <div ref={trackRef} className="flex w-max gap-5 px-4 md:px-10">
        {items.slice(0, 8).map((item) => (
          <div key={`featured-${item._id || item.name}`} className="w-[300px] shrink-0 border border-white/10 bg-[#101010] p-3">
            <div className="relative h-44 w-full overflow-hidden" data-cursor="view">
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover"
                loading="lazy"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
            <p className="font-display mt-3 text-2xl">{item.name}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-oryzo-muted">{item.category}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

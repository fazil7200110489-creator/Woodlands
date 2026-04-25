"use client";

import Image from "next/image";
import { m } from "framer-motion";
import { useState } from "react";
import { MenuItem } from "@/lib/types";
import MagneticButton from "@/components/MagneticButton";
import { toCurrency } from "@/lib/pickup";

type Props = {
  item: MenuItem;
  qty: number;
  onAdjust: (item: MenuItem, delta: number) => void;
};

export default function FoodCard({ item, qty, onAdjust }: Props) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientY - rect.top - rect.height / 2) / 15;
    const y = -(e.clientX - rect.left - rect.width / 2) / 15;
    setRotateX(x);
    setRotateY(y);
  };

  return (
    <div className="perspective-[1000px]" data-reveal-card>
      <m.article
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          setRotateX(0);
          setRotateY(0);
        }}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="group grid gap-4 border border-white/10 bg-[#0f0f0f] p-4 transition hover:border-[rgba(212,168,83,0.3)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.5)] md:grid-cols-[170px_1fr_auto]"
      >
        <div className="relative aspect-[4/3] overflow-hidden" data-cursor="view">
          <Image
            src={item.image}
            alt={item.name}
            width={260}
            height={190}
            loading="lazy"
            sizes="(max-width: 768px) 100vw, 33vw"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD"
            placeholder="blur"
            className="h-full w-full object-cover grayscale-[10%] transition duration-500 ease-out group-hover:scale-[1.03] group-hover:grayscale-0"
            style={{ transform: "translateZ(20px)" }}
          />
          <span className="absolute left-2 top-2 bg-black/70 px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-oryzo-accent">{item.category}</span>
        </div>
        <div>
          <h3 className="font-display mt-1 text-2xl text-oryzo-warm">{item.name}</h3>
          <p className="font-serif mt-2 max-w-xl text-[13px] leading-6 text-oryzo-muted">Crafted for quick pickup with premium flavor balance and consistent quality.</p>
          <p className="mt-3 text-[15px] text-oryzo-gold">{toCurrency(item.price)}</p>
          <p className="mt-1 text-[11px] text-oryzo-muted">★ 4.8 · 230 reviews</p>
          {!item.inStock && <span className="mt-3 inline-block border border-oryzo-red bg-oryzo-red/15 px-2 py-0.5 text-[9px] uppercase tracking-[0.15em] text-oryzo-red">Out of Stock</span>}
        </div>
        <div className="flex items-end gap-2 md:items-center">
          <button className="h-9 w-9 rounded-full border border-white/15 text-sm" onClick={() => onAdjust(item, -1)}>-</button>
          <span className="w-6 text-center text-[13px]">{qty}</span>
          <MagneticButton disabled={!item.inStock} className="border border-white/15 px-4 py-2 text-[11px] uppercase tracking-[0.15em] text-oryzo-warm transition hover:border-oryzo-gold hover:bg-oryzo-gold hover:text-black disabled:cursor-not-allowed disabled:opacity-35" onClick={() => onAdjust(item, 1)}>
            Add
          </MagneticButton>
        </div>
      </m.article>
    </div>
  );
}

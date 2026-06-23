"use client";

import { m } from "framer-motion";
import { useState } from "react";
import { MenuItem } from "@/lib/types";
import MagneticButton from "@/components/MagneticButton";
import { toCurrency } from "@/lib/pickup";
import MenuImage from "@/components/MenuImage";

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
        className="group relative min-h-[360px] overflow-hidden border-y border-[#BF976A]/15 bg-transparent px-4 py-8 text-[#1d0f07] transition hover:bg-[#BF976A]/5 md:min-h-[430px] md:px-10"
      >
        <h3 className="pointer-events-none absolute left-4 top-10 z-0 max-w-[90%] font-display text-[18vw] leading-[0.78] text-[#1D0F07]/6 md:left-10 md:text-[10vw]">{item.name}</h3>
        <div className="relative z-10 mx-auto h-60 w-60 overflow-hidden rounded-full bg-[#F5EFE5] shadow-[0_30px_80px_rgba(0,0,0,0.08)] md:h-80 md:w-80" data-cursor="view">
          {/* MenuImage handles skeleton + fallback + fade-in */}
          <MenuImage
            src={item.image}
            alt={item.name}
            category={item.category}
            fill
            sizes="(max-width: 768px) 240px, 320px"
            className="h-full w-full object-cover p-2 grayscale-[10%] transition duration-500 ease-out group-hover:scale-[1.03] group-hover:grayscale-0"
          />
          <span className="absolute left-4 top-4 rounded-full bg-[#1d0f07]/85 px-3 py-1 text-[10px] uppercase tracking-[0.1em] text-[#fffbf1]">{item.category}</span>
        </div>
        <div className="relative z-20 mt-6 grid gap-5 md:absolute md:inset-x-10 md:bottom-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-[#668b40]">{item.category}</p>
          <h3 className="font-display mt-2 text-5xl leading-none text-[#1d0f07] md:text-6xl">{item.name}</h3>
          <p className="font-serif mt-3 max-w-xl text-[14px] leading-6 text-[#6B6350]">Crafted for quick pickup with premium flavor balance and consistent quality.</p>
          <p className="mt-4 text-[15px] text-[#b4421f]">{toCurrency(item.price)}</p>
          <p className="mt-1 text-[11px] text-[#6B6350]">4.8 / 230 reviews</p>
          {!item.inStock && <span className="mt-3 inline-block border border-[#b4421f] bg-[#b4421f]/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.15em] text-[#b4421f]">Out of Stock</span>}
          </div>
        <div className="flex items-center gap-2 md:items-end">
          <button className="h-9 w-9 rounded-full border border-[#BF976A]/18 text-sm" onClick={() => onAdjust(item, -1)}>-</button>
          <span className="w-6 text-center text-[13px] text-[#6B6350]">{qty}</span>
          <MagneticButton disabled={!item.inStock} className="rounded-full border border-[#BF976A]/18 bg-[#1d0f07] px-4 py-2 text-[11px] uppercase tracking-[0.15em] text-[#fffbf1] transition hover:border-[#b4421f] hover:bg-[#b4421f] disabled:cursor-not-allowed disabled:opacity-35" onClick={() => onAdjust(item, 1)}>
            Add
          </MagneticButton>
        </div>
        </div>
      </m.article>
    </div>
  );
}

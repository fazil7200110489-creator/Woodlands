"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export default function Loader({ onComplete }: { onComplete: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const counter = { value: 0 };
    const tl = gsap.timeline({
      onComplete: () => {
        onComplete();
      },
    });

    tl.to(counter, {
      value: 100,
      duration: 1.8,
      ease: "power2.out",
      onUpdate: () => setCount(Math.round(counter.value)),
    })
      .to(barRef.current, { scaleX: 1, duration: 1.8, ease: "power2.out" }, 0)
      .to(topRef.current, { yPercent: -100, duration: 0.6, ease: "power4.inOut" }, "+=0.1")
      .to(bottomRef.current, { yPercent: 100, duration: 0.6, ease: "power4.inOut" }, "<")
      .to(rootRef.current, { autoAlpha: 0, duration: 0.2 }, "<0.3");

    return () => {
      tl.kill();
    };
  }, [onComplete]);

  return (
    <div ref={rootRef} className="fixed inset-0 z-[10001] bg-black">
      <div ref={topRef} className="absolute inset-x-0 top-0 h-1/2 bg-black" />
      <div ref={bottomRef} className="absolute inset-x-0 bottom-0 h-1/2 bg-black" />
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6">
        <p className="text-6xl text-oryzo-warm">{count}</p>
        <div className="h-px w-56 overflow-hidden bg-white/10">
          <div ref={barRef} className="h-px w-full origin-left scale-x-0 bg-oryzo-gold" />
        </div>
      </div>
    </div>
  );
}

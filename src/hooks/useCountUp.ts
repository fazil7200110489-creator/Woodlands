"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export function useCountUp(end: number, duration = 2) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        const state = { val: 0 };
        gsap.to(state, {
          val: end,
          duration,
          ease: "power2.out",
          onUpdate: () => setCount(Math.round(state.val)),
        });
        observer.disconnect();
      },
      { threshold: 0.5 },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [duration, end]);

  return { count, ref };
}

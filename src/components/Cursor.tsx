"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState("");

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const dotX = gsap.quickTo(dot, "x", { duration: 0.1, ease: "power2.out" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.1, ease: "power2.out" });
    const ringX = gsap.quickTo(ring, "x", { duration: 0.5, ease: "power3.out" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.5, ease: "power3.out" });

    const onMove = (e: MouseEvent) => {
      dotX(e.clientX - 4);
      dotY(e.clientY - 4);
      ringX(e.clientX - 20);
      ringY(e.clientY - 20);
    };

    const activate = (text?: string) => {
      setLabel(text ?? "");
      gsap.to(ring, { width: 60, height: 60, duration: 0.25, ease: "power3.out" });
      ring.style.mixBlendMode = "difference";
    };
    const deactivate = () => {
      setLabel("");
      gsap.to(ring, { width: 40, height: 40, duration: 0.3, ease: "power3.out" });
      ring.style.mixBlendMode = "normal";
    };

    const bindHover = () => {
      const buttonTargets = document.querySelectorAll("button, a, [data-cursor='button']");
      const imageTargets = document.querySelectorAll("[data-cursor='view']");
      buttonTargets.forEach((el) => {
        el.addEventListener("mouseenter", () => activate());
        el.addEventListener("mouseleave", deactivate);
      });
      imageTargets.forEach((el) => {
        el.addEventListener("mouseenter", () => activate("VIEW"));
        el.addEventListener("mouseleave", deactivate);
      });
      return () => {
        buttonTargets.forEach((el) => {
          el.removeEventListener("mouseenter", () => activate());
          el.removeEventListener("mouseleave", deactivate);
        });
        imageTargets.forEach((el) => {
          el.removeEventListener("mouseenter", () => activate("VIEW"));
          el.removeEventListener("mouseleave", deactivate);
        });
      };
    };

    const cleanupHover = bindHover();
    window.addEventListener("mousemove", onMove);
    return () => {
      cleanupHover();
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="pointer-events-none fixed left-0 top-0 z-[10000] h-2 w-2 rounded-full bg-white" />
      <div ref={ringRef} className="pointer-events-none fixed left-0 top-0 z-[9999] flex h-10 w-10 items-center justify-center rounded-full border border-white text-[9px] tracking-[0.14em] text-white">
        {label}
      </div>
    </>
  );
}

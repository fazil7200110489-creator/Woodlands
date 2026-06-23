"use client";

import { useEffect, useState } from "react";
import { m, useMotionValue, useSpring } from "framer-motion";

export default function Cursor() {
  const [label, setLabel] = useState("");
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 400, mass: 0.5 };
  const ringX = useSpring(cursorX, springConfig);
  const ringY = useSpring(cursorY, springConfig);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const activate = (text?: string) => setLabel(text ?? "HOVER");
    const deactivate = () => setLabel("");

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
    
    // Use MutationObserver to bind to new elements dynamically added (like cart items)
    const observer = new MutationObserver(() => {
      cleanupHover();
      bindHover();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener("mousemove", onMove);
    return () => {
      cleanupHover();
      observer.disconnect();
      window.removeEventListener("mousemove", onMove);
    };
  }, [cursorX, cursorY]);

  const active = label.length > 0;

  return (
    <m.div
      style={{ x: ringX, y: ringY, translateX: "-50%", translateY: "-50%" }}
      animate={{
        scale: active ? 1.5 : 1,
        opacity: 1,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="pointer-events-none fixed left-0 top-0 z-[9999] hidden items-center justify-center mix-blend-difference will-change-transform md:flex"
    >
      {/* Spoon and Fork Icon */}
      <div className={`relative flex items-center justify-center transition-all duration-300 ${active ? "text-[#BF976A]" : "text-white"}`}>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="transform rotate-45 drop-shadow-md"
        >
          <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
          <path d="M7 2v20" />
          <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
        </svg>
        
        {/* Label on hover */}
        {active && (
          <m.span 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -bottom-6 whitespace-nowrap font-mono-num text-[8px] tracking-[0.2em] uppercase text-[#BF976A]"
          >
            {label !== "HOVER" ? label : ""}
          </m.span>
        )}
      </div>
    </m.div>
  );
}

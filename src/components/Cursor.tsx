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

  const dotConfig = { damping: 20, stiffness: 800, mass: 0.1 };
  const dotX = useSpring(cursorX, dotConfig);
  const dotY = useSpring(cursorY, dotConfig);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const activate = (text?: string) => setLabel(text ?? "");
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
    window.addEventListener("mousemove", onMove);
    return () => {
      cleanupHover();
      window.removeEventListener("mousemove", onMove);
    };
  }, [cursorX, cursorY]);

  const active = label.length > 0;

  return (
    <>
      <m.div
        style={{ x: dotX, y: dotY, translateX: "-50%", translateY: "-50%" }}
        className="pointer-events-none fixed left-0 top-0 z-[10000] hidden h-2 w-2 rounded-full bg-white will-change-transform md:block"
      />
      <m.div
        style={{ x: ringX, y: ringY, translateX: "-50%", translateY: "-50%" }}
        animate={{
          width: active ? 60 : 40,
          height: active ? 60 : 40,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="pointer-events-none fixed left-0 top-0 z-[9999] hidden items-center justify-center rounded-full border border-white text-[9px] tracking-[0.14em] text-white mix-blend-difference will-change-transform md:flex"
      >
        {label}
      </m.div>
    </>
  );
}

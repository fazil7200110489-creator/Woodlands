"use client";

import { AnimatePresence, m } from "framer-motion";
import { usePathname } from "next/navigation";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <m.div
        key={pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <m.div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[9997] bg-black"
          initial={{ y: "-100%" }}
          animate={{ y: "100%" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
        {children}
      </m.div>
    </AnimatePresence>
  );
}

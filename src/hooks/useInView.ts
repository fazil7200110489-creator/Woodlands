"use client";

import { useEffect, useRef, useState } from "react";

type Options = IntersectionObserverInit;

export function useInView(options: Options = {}) {
  const ref = useRef<HTMLElement | null>(null);
  const [isInView, setIsInView] = useState(false);
  const [hasBeenSeen, setHasBeenSeen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          setHasBeenSeen(true);
        } else {
          setIsInView(false);
        }
      },
      { threshold: 0.1, rootMargin: "100px", ...options },
    );

    const current = ref.current;
    if (current) observer.observe(current);
    return () => observer.disconnect();
  }, [options]);

  return { ref, isInView, hasBeenSeen };
}

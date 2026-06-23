"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface ScrollManagerProps {
  cameraRigRef: React.RefObject<THREE.Group | null>;
  showcaseRef: React.RefObject<THREE.Group | null>;
}

export function ScrollManager({ cameraRigRef, showcaseRef }: ScrollManagerProps) {
  const { camera } = useThree();
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Wait one frame so all refs are mounted
    const raf = requestAnimationFrame(() => {
      if (!showcaseRef.current) return;

      const ctx = gsap.context(() => {
        // ── Initial State ────────────────────────────────────────────────────
        // Start: hero – food centered, large, proud
        gsap.set(showcaseRef.current!.position, { x: 0, y: -0.4, z: 0 });
        gsap.set(showcaseRef.current!.scale,    { x: 1, y: 1, z: 1 });
        gsap.set(showcaseRef.current!.rotation, { x: 0, y: 0, z: 0 });

        // ── Section 1: Hero → Story ──────────────────────────────────────────
        // Food gently drifts right + camera tilts slightly forward
        const tlStory = gsap.timeline({
          scrollTrigger: {
            trigger: "#story",
            start: "top bottom",
            end: "bottom center",
            scrub: 1.4,
          },
        });

        tlStory
          .to(showcaseRef.current!.position, {
            x: 2.8,          // move to right side to companion the text on left
            y: -0.6,
            z: -0.5,
            ease: "power2.inOut",
          }, 0)
          .to(showcaseRef.current!.scale, {
            x: 0.85,
            y: 0.85,
            z: 0.85,
            ease: "power2.inOut",
          }, 0)
          .to(camera.position, {
            y: -0.3,
            ease: "none",
          }, 0);

        // ── Section 2: Story → Menu ──────────────────────────────────────────
        // Companion moves to far right corner, scales down — still visible but
        // does NOT overlap the menu grid at all
        const tlMenu = gsap.timeline({
          scrollTrigger: {
            trigger: "#menu",
            start: "top 85%",
            end: "top 20%",
            scrub: 1.2,
          },
        });

        tlMenu
          .to(showcaseRef.current!.position, {
            x: 4.5,           // pushed well outside the grid viewport
            y: -2.2,
            z: -1.5,
            ease: "power3.inOut",
          }, 0)
          .to(showcaseRef.current!.scale, {
            x: 0.45,
            y: 0.45,
            z: 0.45,
            ease: "power2.in",
          }, 0);

        // ── Section 3: Menu → Gallery ───────────────────────────────────────
        // Food floats back into frame on the left as gallery arrives
        const tlGallery = gsap.timeline({
          scrollTrigger: {
            trigger: "#gallery",
            start: "top 80%",
            end: "center center",
            scrub: 1.4,
          },
        });

        tlGallery
          .to(showcaseRef.current!.position, {
            x: -2.8,
            y: -0.3,
            z: 0,
            ease: "power2.out",
          }, 0)
          .to(showcaseRef.current!.scale, {
            x: 0.75,
            y: 0.75,
            z: 0.75,
            ease: "power2.out",
          }, 0)
          .to(camera.position, {
            y: -0.6,
            ease: "none",
          }, 0);

        // ── Section 4: Gallery → Contact ────────────────────────────────────
        // Food gracefully exits downward
        const tlContact = gsap.timeline({
          scrollTrigger: {
            trigger: "#contact",
            start: "top 90%",
            end: "top 40%",
            scrub: 1,
          },
        });

        tlContact
          .to(showcaseRef.current!.position, {
            x: 0,
            y: -5,        // drops below the viewport
            z: -2,
            ease: "power3.in",
          }, 0)
          .to(showcaseRef.current!.scale, {
            x: 0.3,
            y: 0.3,
            z: 0.3,
            ease: "power2.in",
          }, 0);
      });

      cleanupRef.current = () => ctx.revert();
    });

    return () => {
      cancelAnimationFrame(raf);
      cleanupRef.current?.();
    };
  }, [camera, cameraRigRef, showcaseRef]);

  return null;
}

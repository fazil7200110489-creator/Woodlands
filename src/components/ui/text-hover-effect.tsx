"use client";

import { useEffect, useRef } from "react";

type TextHoverEffectProps = {
  text: string;
  className?: string;
};

export function TextHoverEffect({ text, className }: TextHoverEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const dpr = window.devicePixelRatio || 1;

    const draw = () => {
      const rect = wrapper.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.clearRect(0, 0, width, height);

      const fontSize = Math.min(width * 0.18, 200);
      ctx.font = `700 ${fontSize}px Inter, Segoe UI, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "rgba(124,92,255,0.2)");
      gradient.addColorStop(0.5, "rgba(255,255,255,0.17)");
      gradient.addColorStop(1, "rgba(49,208,255,0.2)");

      ctx.strokeStyle = "rgba(255,255,255,0.14)";
      ctx.lineWidth = 1.2;
      ctx.strokeText(text, width / 2, height / 2);
      ctx.fillStyle = gradient;
      ctx.fillText(text, width / 2, height / 2);

      const { x, y } = mouseRef.current;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 180);
      glow.addColorStop(0, "rgba(255,255,255,0.22)");
      glow.addColorStop(1, "rgba(255,255,255,0)");
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = "source-over";

      raf = window.requestAnimationFrame(draw);
    };

    const onMove = (e: MouseEvent) => {
      const rect = wrapper.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };

    wrapper.addEventListener("mousemove", onMove);
    wrapper.addEventListener("mouseleave", onLeave);
    raf = window.requestAnimationFrame(draw);

    return () => {
      wrapper.removeEventListener("mousemove", onMove);
      wrapper.removeEventListener("mouseleave", onLeave);
      window.cancelAnimationFrame(raf);
    };
  }, [text]);

  return (
    <div ref={wrapperRef} className={className}>
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}

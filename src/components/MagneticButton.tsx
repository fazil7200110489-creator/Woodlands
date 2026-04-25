"use client";

import gsap from "gsap";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  as?: "button" | "a";
  href?: string;
};

export default function MagneticButton({ className = "", children, as = "button", href, ...props }: Props) {
  const onMove: React.MouseEventHandler<HTMLElement> = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    gsap.to(e.currentTarget, { x: x * 0.3, y: y * 0.3, duration: 0.3, ease: "power2.out" });
  };

  const onLeave: React.MouseEventHandler<HTMLElement> = (e) => {
    gsap.to(e.currentTarget, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.5)" });
  };

  if (as === "a") {
    return (
      <a href={href} onMouseMove={onMove} onMouseLeave={onLeave} className={className}>
        {children}
      </a>
    );
  }

  return (
    <button {...props} onMouseMove={onMove} onMouseLeave={onLeave} className={className}>
      {children}
    </button>
  );
}

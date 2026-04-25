import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0a",
        panel: "rgba(255,255,255,0.06)",
        accent: "#c9b99a",
        accent2: "#d4a853",
        "oryzo-black": "#0a0a0a",
        "oryzo-card": "#111111",
        "oryzo-warm": "#f0ede6",
        "oryzo-muted": "#8a8680",
        "oryzo-accent": "#c9b99a",
        "oryzo-gold": "#d4a853",
        "oryzo-red": "#e05c3a",
      },
      boxShadow: {
        glass: "0 18px 45px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.18)",
      },
      backgroundImage: {
        "luxury-grid":
          "radial-gradient(circle at 10% 20%, rgba(124,92,255,0.25), transparent 35%), radial-gradient(circle at 90% 10%, rgba(49,208,255,0.18), transparent 45%)",
      },
      fontFamily: {
        sans: ["DM Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        display: ["DM Serif Display", "serif"],
        mono: ["DM Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        serif: ["Fraunces", "serif"],
      },
      animation: {
        shimmer: "shimmer 1.5s infinite",
        "fade-up": "fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
    },
  },
  plugins: [],
};

export default config;

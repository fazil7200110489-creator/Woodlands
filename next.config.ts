import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ["framer-motion", "gsap", "@react-three/fiber", "@react-three/drei"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "share.google" },
      { protocol: "https", hostname: "media-cdn.tripadvisor.com" },
    ],
  },
};

export default nextConfig;

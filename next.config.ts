import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ["framer-motion", "gsap", "@react-three/fiber", "@react-three/drei"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [320, 375, 414, 640, 750, 828, 1080, 1200, 1920],
    minimumCacheTTL: 86400, // 24h cache for optimized images
    remotePatterns: [
      // Unsplash (primary source)
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      // Supabase Storage (if images are stored in Supabase)
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.supabase.in" },
      // Google / TripAdvisor (legacy/external)
      { protocol: "https", hostname: "share.google" },
      { protocol: "https", hostname: "media-cdn.tripadvisor.com" },
      // Cloudinary (if admin uploads images via Cloudinary)
      { protocol: "https", hostname: "res.cloudinary.com" },
      // General CDNs
      { protocol: "https", hostname: "*.amazonaws.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
    ],
  },
};

export default nextConfig;

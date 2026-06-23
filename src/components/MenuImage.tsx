"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Category-specific fallback images (reliable, high-quality Unsplash photos).
 * These are used when the primary image fails to load.
 */
const CATEGORY_FALLBACKS: Record<string, string> = {
  Shawarma:
    "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800&q=80",
  Grill:
    "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80",
  Rice:
    "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=80",
  Noodles:
    "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=800&q=80",
  Starters:
    "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&q=80",
  Extras:
    "https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?w=800&q=80",
  default:
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
};

/**
 * A robust image component for menu items with:
 * - Skeleton loader while loading
 * - Category-specific fallback on error
 * - Smooth fade-in transition
 * - Never shows a broken image icon
 */
type MenuImageProps = {
  src: string;
  alt: string;
  category?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  priority?: boolean;
};

export default function MenuImage({
  src,
  alt,
  category = "default",
  fill,
  width,
  height,
  sizes,
  className = "",
  priority = false,
}: MenuImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const [triedFallback, setTriedFallback] = useState(false);

  const fallbackSrc =
    CATEGORY_FALLBACKS[category] ?? CATEGORY_FALLBACKS["default"];

  // Decide which source to use
  const resolvedSrc = errored && !triedFallback ? fallbackSrc : src;

  const handleError = () => {
    if (!triedFallback) {
      // First error: try category fallback
      setErrored(true);
      setTriedFallback(true);
      setLoaded(false);
    }
    // Second error (fallback also failed): stay with fallback, show loaded
    else {
      setLoaded(true);
    }
  };

  const handleLoad = () => {
    setLoaded(true);
  };

  const imageProps = fill
    ? { fill: true as const }
    : { width: width ?? 400, height: height ?? 300 };

  return (
    <>
      {/* Skeleton shimmer — shown until image loads */}
      {!loaded && (
        <div
          className="absolute inset-0 animate-pulse bg-gradient-to-r from-[#F5EFE5] via-[#EDE4D5] to-[#F5EFE5] bg-[length:200%_100%]"
          style={{
            animation: "skeleton-shimmer 1.6s ease-in-out infinite",
          }}
        />
      )}

      <Image
        {...imageProps}
        src={errored && triedFallback ? fallbackSrc : errored ? fallbackSrc : src}
        alt={alt}
        sizes={sizes}
        priority={priority}
        onLoad={handleLoad}
        onError={handleError}
        className={`${className} transition-opacity duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </>
  );
}

export { CATEGORY_FALLBACKS };

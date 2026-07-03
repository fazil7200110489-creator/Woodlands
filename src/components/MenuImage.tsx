"use client";

import Image from "next/image";
import { useState } from "react";

// ── Verified Category Fallbacks (HTTP 200 Checked) ─────────────────────────
export const CATEGORY_FALLBACKS: Record<string, string> = {
  Shawarma: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800&q=80",
  Grill: "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=800&q=80",
  Rice: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80",
  Noodles: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=800&q=80",
  Starters: "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=800&q=80",
  Extras: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80",
  Burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80",
  default: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80",
};

// ── Keyword Dictionary with Verified Images (HTTP 200 Checked) ──────────────
const IMAGE_DICTIONARY: Record<string, string> = {
  // Grill
  "full grill": "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=800&q=80",
  "half grill": "https://images.unsplash.com/photo-1616137422495-1e9e46e2aa77?w=800&q=80",
  "quarter grill": "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800&q=80",
  "grill chicken": "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=800&q=80",
  "grilled chicken": "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=800&q=80",
  "bbq chicken": "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80",

  // Chilli / Pepper / Fry
  "chilli chicken": "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=800&q=80",
  "pepper chicken": "https://images.unsplash.com/photo-1603496987351-f84a3bd5ea1f?w=800&q=80",
  "chicken 65": "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=800&q=80",
  "lollipop sauce": "https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=800&q=80",
  "lollipop": "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800&q=80",
  "chilli beef": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&q=80",
  "pepper beef": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&q=80",

  // Shawarma
  "special shawarma": "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=800&q=80",
  "shawarma": "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800&q=80",

  // Fried Rice & Noodles
  "schezwan chicken rice": "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=80",
  "schezwan beef rice": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&q=80",
  "chicken fried rice": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80",
  "beef rice": "https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=800&q=80",
  "fried rice": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80",
  "schezwan chicken noodles": "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&q=80",
  "chicken noodles": "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=800&q=80",
  "noodles": "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=800&q=80",

  // Sides, Bread, Mayonnaise
  "mayonnaise": "https://images.unsplash.com/photo-1607330289024-1535c6b4e1c1?w=800&q=80",
  "kuboos": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80",
  "french fries": "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=800&q=80",
  "pepsi": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&q=80",
  "coke": "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=800&q=80",
  "lime juice": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&q=80",
  "ice cream": "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=800&q=80",
  "biryani": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80",
  "veg burger": "https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?w=800&q=80",
  "burger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80"
};

// ── Normalization & Alias Layer ─────────────────────────────────────────────
export function normalizeMenuName(name: string): { normalized: string; aliasMatched: string } {
  // Convert to lowercase, remove punctuation/symbols, collapse extra spacing
  let normalized = name
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  let aliasMatched = "None";

  // Check aliases and normalize spelling variants
  if (normalized.includes("myonise")) {
    normalized = normalized.replace("myonise", "mayonnaise");
    aliasMatched = "myonise → mayonnaise";
  }
  if (normalized.includes("kupus")) {
    normalized = normalized.replace("kupus", "kuboos");
    aliasMatched = "kupus → kuboos";
  }
  if (normalized.includes("shawarmah")) {
    normalized = normalized.replace("shawarmah", "shawarma");
    aliasMatched = "shawarmah → shawarma";
  }
  if (normalized.includes("sezwan")) {
    normalized = normalized.replace("sezwan", "schezwan");
    aliasMatched = "sezwan → schezwan";
  }
  if (normalized.includes("1/2 grill") || normalized.includes("half grilled chicken")) {
    normalized = "half grill";
    aliasMatched = "grill fraction/alias → half grill";
  }
  if (normalized.includes("full grilled chicken")) {
    normalized = "full grill";
    aliasMatched = "full grilled chicken → full grill";
  }
  if (normalized.includes("quarter grilled chicken")) {
    normalized = "quarter grill";
    aliasMatched = "quarter grilled chicken → quarter grill";
  }

  return { normalized, aliasMatched };
}

// ── Unified Image Resolver Function ──────────────────────────────────────────
export function resolveFoodImage(
  name: string,
  category: string = "default",
  fallbackSrc?: string
): { url: string; level: string; matchedKey: string; normalizedName: string; aliasMatched: string } {
  const { normalized, aliasMatched } = normalizeMenuName(name);

  // Check first: if the image is a custom user-uploaded file, preserve it
  if (
    fallbackSrc &&
    fallbackSrc.trim() !== "" &&
    (fallbackSrc.startsWith("/uploads/") ||
      fallbackSrc.startsWith("data:") ||
      (!fallbackSrc.includes("unsplash.com") && !fallbackSrc.includes("/images/default")))
  ) {
    return {
      url: fallbackSrc,
      level: "Custom Upload",
      matchedKey: "None",
      normalizedName: normalized,
      aliasMatched,
    };
  }

  // Level 1: Exact Dictionary Match
  if (IMAGE_DICTIONARY[normalized]) {
    return {
      url: IMAGE_DICTIONARY[normalized],
      level: "Exact Match",
      matchedKey: normalized,
      normalizedName: normalized,
      aliasMatched,
    };
  }

  // Level 2: Substring Keyword Match
  for (const key of Object.keys(IMAGE_DICTIONARY)) {
    if (normalized.includes(key)) {
      return {
        url: IMAGE_DICTIONARY[key],
        level: "Keyword Match",
        matchedKey: key,
        normalizedName: normalized,
        aliasMatched,
      };
    }
  }

  // Level 3: Category Fallback Match
  const catKey = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  if (CATEGORY_FALLBACKS[catKey]) {
    return {
      url: CATEGORY_FALLBACKS[catKey],
      level: "Category Match",
      matchedKey: "None",
      normalizedName: normalized,
      aliasMatched,
    };
  }

  // Level 4: Generic Food Image Fallback
  return {
    url: fallbackSrc || CATEGORY_FALLBACKS["default"],
    level: fallbackSrc ? "Original Fallback" : "Generic Fallback",
    matchedKey: "None",
    normalizedName: normalized,
    aliasMatched,
  };
}

// ── MenuImage React Component ────────────────────────────────────────────────
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

  // Call the shared resolver
  const resolution = resolveFoodImage(alt, category, src);

  // Developer logging (in dev environments)
  if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
    console.debug(
      `[POS Image Resolver]\n` +
      `Original Name: "${alt}"\n` +
      `Normalized Name: "${resolution.normalizedName}"\n` +
      `Matched Alias: "${resolution.aliasMatched}"\n` +
      `Matched Key: "${resolution.matchedKey}"\n` +
      `Final URL: ${resolution.url}\n` +
      `Fallback Level: ${resolution.level}`
    );
  }

  const categoryFallback = CATEGORY_FALLBACKS[category] ?? CATEGORY_FALLBACKS["default"];

  // Decide image source: if network load errors out, immediately use category fallback
  const finalSrc = errored ? categoryFallback : resolution.url;

  const handleError = () => {
    if (!errored) {
      setErrored(true);
      setLoaded(false);
    } else {
      // If category fallback also fails, mark loaded so spinner terminates
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
        src={finalSrc}
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

import { MenuItem } from "@/lib/types";

/**
 * Each image URL is chosen to match the menu item name, category, and
 * cooking style as closely as possible using reliable Unsplash photos.
 * All URLs include width/quality params for optimal loading.
 */
export const initialMenu: MenuItem[] = [
  // ── Shawarma ──────────────────────────────────────────────────────────
  {
    name: "Normal Shawarma",
    price: 50,
    category: "Shawarma",
    image: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800&q=80",
    inStock: false,
  },
  {
    name: "Spl Shawarma",
    price: 90,
    category: "Shawarma",
    image: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=800&q=80",
    inStock: true,
  },

  // ── Grill ─────────────────────────────────────────────────────────────
  {
    name: "Full Grill",
    price: 350,
    category: "Grill",
    image: "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=800&q=80",
    inStock: true,
  },
  {
    name: "Half Grill",
    price: 180,
    category: "Grill",
    image: "https://images.unsplash.com/photo-1616137422495-1e9e46e2aa77?w=800&q=80",
    inStock: true,
  },

  // ── Extras ────────────────────────────────────────────────────────────
  {
    name: "Kupus",
    price: 10,
    category: "Extras",
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80",
    inStock: true,
  },
  {
    name: "Myonise",
    price: 20,
    category: "Extras",
    image: "https://images.unsplash.com/photo-1607330289024-1535c6b4e1c1?w=800&q=80",
    inStock: true,
  },

  // ── Rice ──────────────────────────────────────────────────────────────
  {
    name: "Chicken Fried Rice",
    price: 130,
    category: "Rice",
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80",
    inStock: true,
  },
  {
    name: "Sezwan Chicken Rice",
    price: 140,
    category: "Rice",
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=80",
    inStock: true,
  },
  {
    name: "Beef Rice",
    price: 110,
    category: "Rice",
    image: "https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=800&q=80",
    inStock: true,
  },
  {
    name: "Sezwan Beef Rice",
    price: 120,
    category: "Rice",
    image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&q=80",
    inStock: true,
  },
  {
    name: "Beef Rice 1/2",
    price: 120,
    category: "Rice",
    image: "https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=800&q=80",
    inStock: true,
  },
  {
    name: "Chicken Rice 1/2",
    price: 140,
    category: "Rice",
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80",
    inStock: true,
  },

  // ── Noodles ───────────────────────────────────────────────────────────
  {
    name: "Chicken Noodles",
    price: 130,
    category: "Noodles",
    image: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=800&q=80",
    inStock: true,
  },
  {
    name: "Sezwan Chicken Noodles",
    price: 140,
    category: "Noodles",
    image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&q=80",
    inStock: true,
  },

  // ── Starters ──────────────────────────────────────────────────────────
  {
    name: "Chilli Chicken",
    price: 130,
    category: "Starters",
    image: "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=800&q=80",
    inStock: true,
  },
  {
    name: "Pepper Chicken",
    price: 140,
    category: "Starters",
    image: "https://images.unsplash.com/photo-1603496987351-f84a3bd5ea1f?w=800&q=80",
    inStock: true,
  },
  {
    name: "Chilli Beef",
    price: 100,
    category: "Starters",
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&q=80",
    inStock: true,
  },
  {
    name: "Pepper Beef",
    price: 110,
    category: "Starters",
    image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&q=80",
    inStock: true,
  },
  {
    name: "Lollypop",
    price: 110,
    category: "Starters",
    image: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800&q=80",
    inStock: true,
  },
  {
    name: "Chicken 65",
    price: 110,
    category: "Starters",
    image: "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=800&q=80",
    inStock: true,
  },
  {
    name: "Lollypop Sayce",
    price: 0,
    category: "Starters",
    image: "https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=800&q=80",
    inStock: true,
  },
];


export const categories = ["Shawarma", "Grill", "Rice", "Noodles", "Starters", "Extras"] as const;

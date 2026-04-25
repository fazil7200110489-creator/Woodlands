import { MenuItem } from "@/lib/types";

export const initialMenu: MenuItem[] = [
  { name: "Normal Shawarma", price: 50, category: "Shawarma", image: "https://images.unsplash.com/photo-1544025162-d76694265947", inStock: false },
  { name: "Spl Shawarma", price: 90, category: "Shawarma", image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783", inStock: true },
  { name: "Full Grill", price: 350, category: "Grill", image: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba", inStock: true },
  { name: "Half Grill", price: 180, category: "Grill", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1", inStock: true },
  { name: "Kupus", price: 10, category: "Extras", image: "https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f", inStock: true },
  { name: "Myonise", price: 20, category: "Extras", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd", inStock: true },
  { name: "Chicken Fried Rice", price: 130, category: "Rice", image: "https://images.unsplash.com/photo-1512058564366-18510be2db19", inStock: true },
  { name: "Sezwan Chicken Rice", price: 140, category: "Rice", image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb", inStock: true },
  { name: "Beef Rice", price: 110, category: "Rice", image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d", inStock: true },
  { name: "Sezwan Beef Rice", price: 120, category: "Rice", image: "https://images.unsplash.com/photo-1516684669134-de6f7c473a2a", inStock: true },
  { name: "Beef Rice 1/2", price: 120, category: "Rice", image: "https://images.unsplash.com/photo-1505253758473-96b7015fcd40", inStock: true },
  { name: "Chicken Rice 1/2", price: 140, category: "Rice", image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b", inStock: true },
  { name: "Chicken Noodles", price: 130, category: "Noodles", image: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841", inStock: true },
  { name: "Sezwan Chicken Noodles", price: 140, category: "Noodles", image: "https://images.unsplash.com/photo-1585032226651-759b368d7246", inStock: true },
  { name: "Chilli Chicken", price: 130, category: "Starters", image: "https://images.unsplash.com/photo-1600891964092-4316c288032e", inStock: true },
  { name: "Pepper Chicken", price: 140, category: "Starters", image: "https://images.unsplash.com/photo-1527477396000-e27163b481c2", inStock: true },
  { name: "Chilli Beef", price: 100, category: "Starters", image: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143", inStock: true },
  { name: "Pepper Beef", price: 110, category: "Starters", image: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092", inStock: true },
  { name: "Lollypop", price: 110, category: "Starters", image: "https://images.unsplash.com/photo-1601050690597-df0568f70950", inStock: true },
  { name: "Chicken 65", price: 110, category: "Starters", image: "https://images.unsplash.com/photo-1601312378427-822b6f7a5d9c", inStock: true },
  { name: "Lollypop Sayce", price: 0, category: "Starters", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836", inStock: true },
];

export const categories = ["Shawarma", "Grill", "Rice", "Noodles", "Starters", "Extras"] as const;

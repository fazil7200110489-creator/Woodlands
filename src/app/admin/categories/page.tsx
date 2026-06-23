"use client";

import { Construction } from "lucide-react";

export default function CategoriesPage() {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        <Construction size={48} />
      </div>
      <h1 className="text-2xl font-semibold text-gray-900 font-display">Categories Management</h1>
      <p className="mt-2 text-gray-500 max-w-md">This module is currently under development. Soon you will be able to manage your menu categories here.</p>
    </div>
  );
}

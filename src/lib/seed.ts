import { initialMenu } from "@/lib/menuData";
import { connectDB } from "@/lib/db";
import { MenuItemModel, SettingsModel } from "@/lib/models";

export async function ensureSeeded() {
  await connectDB();
  const [count, settings] = await Promise.all([
    MenuItemModel.countDocuments(),
    SettingsModel.findOne().lean(),
  ]);

  await Promise.all([
    // If no items exist yet, insert all from seed data
    count === 0 ? MenuItemModel.insertMany(initialMenu) : syncImages(),
    !settings ? SettingsModel.create({}) : null,
  ]);
}

/**
 * Synchronizes image URLs for existing DB items against the corrected
 * menuData seed. Matches items by name (case-insensitive) and updates
 * the image if it differs — fixing stale / broken URLs without touching
 * any other fields (price, inStock, category, etc.).
 */
async function syncImages() {
  const updates = initialMenu.map((seedItem) =>
    MenuItemModel.updateOne(
      { name: { $regex: new RegExp(`^${escapeRegex(seedItem.name)}$`, "i") } },
      { $set: { image: seedItem.image } }
    )
  );
  await Promise.all(updates);
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

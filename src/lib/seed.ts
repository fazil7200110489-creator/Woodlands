import { initialMenu } from "@/lib/menuData";
import { connectDB } from "@/lib/db";
import { MenuItemModel, SettingsModel, UserModel } from "@/lib/models";
import * as bcrypt from "bcryptjs";

export async function ensureSeeded() {
  await connectDB();
  const [count, settings, adminExists] = await Promise.all([
    MenuItemModel.countDocuments(),
    SettingsModel.findOne().lean(),
    UserModel.findOne({ role: "admin" }).lean(),
  ]);

  const tasks: Promise<any>[] = [
    // If no items exist yet, insert all from seed data
    count === 0 ? MenuItemModel.insertMany(initialMenu) : syncImages(),
    !settings ? SettingsModel.create({}) : Promise.resolve(null),
  ];

  if (!adminExists) {
    const passwordHash = await bcrypt.hash("Admin@123", 12);
    tasks.push(
      UserModel.create({
        username: "Admin",
        email: "admin@woodlands.com",
        passwordHash,
        role: "admin",
        isActive: true,
      }).then(() => {
        console.log("Seeded default administrator account");
      })
    );
  }

  await Promise.all(tasks);
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

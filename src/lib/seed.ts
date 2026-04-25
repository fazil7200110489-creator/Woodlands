import { initialMenu } from "@/lib/menuData";
import { connectDB } from "@/lib/db";
import { MenuItemModel, SettingsModel } from "@/lib/models";

let seeded = false;

export async function ensureSeeded() {
  if (seeded) return;
  await connectDB();
  const count = await MenuItemModel.countDocuments();
  if (count === 0) await MenuItemModel.insertMany(initialMenu);
  const settings = await SettingsModel.findOne();
  if (!settings) await SettingsModel.create({});
  seeded = true;
}

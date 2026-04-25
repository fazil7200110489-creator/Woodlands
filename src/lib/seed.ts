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
    count === 0 ? MenuItemModel.insertMany(initialMenu) : null,
    !settings ? SettingsModel.create({}) : null,
  ]);
}

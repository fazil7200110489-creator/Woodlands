import { Schema, model, models } from "mongoose";

const menuItemSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    image: { type: String, required: true },
    inStock: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const orderSchema = new Schema(
  {
    customerName: String,
    customerPhone: String,
    pickupTime: String,
    items: [{ itemId: String, name: String, price: Number, qty: Number }],
    totalAmount: Number,
    status: { type: String, enum: ["Pending", "Completed", "Cancelled"], default: "Pending" },
  },
  { timestamps: true },
);

const settingsSchema = new Schema(
  {
    shopOpen: { type: Boolean, default: true },
    acceptingOrders: { type: Boolean, default: true },
    busyMode: { type: Boolean, default: false },
    holidayMode: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const MenuItemModel = models.MenuItem || model("MenuItem", menuItemSchema);
export const OrderModel = models.Order || model("Order", orderSchema);
export const SettingsModel = models.Settings || model("Settings", settingsSchema);

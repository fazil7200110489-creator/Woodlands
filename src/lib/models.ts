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
    // Payment fields (populated after Razorpay verification)
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    paymentStatus: { type: String, enum: ["Pending", "Paid", "Failed"], default: "Pending" },
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

const reservationSchema = new Schema(
  {
    referenceId: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerEmail: { type: String },
    date: { type: String, required: true },
    timeSlot: { type: String, required: true },
    guests: { type: Number, required: true },
    specialOccasion: { type: String },
    specialInstructions: { type: String },
    status: { type: String, enum: ["Pending", "Confirmed", "Completed", "Cancelled"], default: "Pending" },
    // Payment fields (populated after Razorpay verification)
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    paymentAmount: { type: Number },
    paymentStatus: { type: String, enum: ["Pending", "Paid", "Failed"], default: "Pending" },
  },
  { timestamps: true },
);

export const ReservationModel = models.Reservation || model("Reservation", reservationSchema);

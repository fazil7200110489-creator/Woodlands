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
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Preparing", "Ready for Pickup", "Completed", "Cancelled"],
      default: "Pending",
    },
    // Payment fields (populated after Razorpay verification)
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },
    amountPaid: { type: Number },
    paymentTime: { type: Date },
    // Refund fields
    refundId: { type: String },
    refundAmount: { type: Number },
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
    tableNumber: { type: Number },
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
    paymentStatus: { type: String, enum: ["Pending", "Paid", "Failed", "Refunded", "Partially Refunded"], default: "Pending" },
    // Refund fields (populated after cancellation + refund)
    refundId: { type: String },
    refundAmount: { type: Number },
    refundStatus: { type: String, enum: ["None", "Processing", "Processed", "Failed"], default: "None" },
    refundDate: { type: Date },
    cancelledAt: { type: Date },
  },
  { timestamps: true },
);

export const ReservationModel = models.Reservation || model("Reservation", reservationSchema);

const customerSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String },
    totalOrders: { type: Number, default: 0 },
    totalReservations: { type: Number, default: 0 },
    totalAmountSpent: { type: Number, default: 0 },
    lastOrderDate: { type: Date },
    lastReservationDate: { type: Date },
    favoriteItems: [{ type: String }],
    preferredTable: { type: Number },
    avgOrderValue: { type: Number, default: 0 },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  },
  { timestamps: true }
);

export const CustomerModel = models.Customer || model("Customer", customerSchema);

const reviewSchema = new Schema(
  {
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    reservationId: { type: Schema.Types.ObjectId, ref: "Reservation" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    reviewText: { type: String },
    foodOrdered: [{ type: String }],
    tableNumber: { type: Number },
    status: { type: String, enum: ["Approved", "Hidden"], default: "Approved" },
    replyText: { type: String },
  },
  { timestamps: true }
);

export const ReviewModel = models.Review || model("Review", reviewSchema);

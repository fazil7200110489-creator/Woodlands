export type Category =
  | "Shawarma"
  | "Grill"
  | "Rice"
  | "Noodles"
  | "Starters"
  | "Extras";

export type MenuItem = {
  _id?: string;
  name: string;
  price: number;
  category: Category;
  image: string;
  inStock: boolean;
};

export type CartLine = {
  itemId: string;
  name: string;
  price: number;
  qty: number;
};

export type OrderStatus =
  | "Pending"
  | "Accepted"
  | "Preparing"
  | "Ready for Pickup"
  | "Completed"
  | "Cancelled";

export type PaymentStatus = "Pending" | "Paid" | "Failed" | "Refunded";

export type Order = {
  _id: string;
  customerName: string;
  customerPhone: string;
  pickupTime: string;
  items: CartLine[];
  totalAmount: number;
  status: OrderStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentStatus: PaymentStatus;
  amountPaid?: number;
  paymentTime?: string;
  refundId?: string;
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
};

export type OrderPayload = {
  customerName: string;
  customerPhone: string;
  pickupTime: string;
  items: CartLine[];
  totalAmount: number;
  status: OrderStatus;
};

export type ReservationStatus = "Pending" | "Confirmed" | "Completed" | "Cancelled";

export type Reservation = {
  _id?: string;
  referenceId: string;
  tableNumber?: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  date: string;
  timeSlot: string;
  guests: number;
  specialOccasion?: string;
  specialInstructions?: string;
  status: ReservationStatus;
  // Payment
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentAmount?: number;
  paymentStatus?: string;
  // Refund
  refundId?: string;
  refundAmount?: number;
  refundStatus?: string;
  refundDate?: string;
  cancelledAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

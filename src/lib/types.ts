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

export type OrderStatus = "Pending" | "Completed" | "Cancelled";

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
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  date: string;
  timeSlot: string;
  guests: number;
  specialOccasion?: string;
  specialInstructions?: string;
  status: ReservationStatus;
  createdAt?: string;
  updatedAt?: string;
};

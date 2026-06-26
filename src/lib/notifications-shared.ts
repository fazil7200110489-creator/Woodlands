export type BookingDetails = {
  referenceId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  tableLabel: string;
  date: string;
  timeSlot: string;
  guests: number;
  paymentAmount: number;
  paymentId?: string;
};

/** Generate a WhatsApp redirect URL for the customer to share their booking */
export function buildWhatsAppShareUrl(booking: BookingDetails): string {
  const message = [
    `🍽️ I've booked a table at Woodlands Grill House!`,
    ``,
    `📋 Ref: ${booking.referenceId}`,
    `🪑 Table: ${booking.tableLabel}`,
    `📅 ${booking.date} at ${booking.timeSlot}`,
    `👥 ${booking.guests} guests`,
  ].join("\n");

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

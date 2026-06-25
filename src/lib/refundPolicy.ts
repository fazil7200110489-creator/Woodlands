/**
 * Configurable cancellation / refund policy for table bookings.
 *
 * Edit the POLICY array to change refund tiers.
 * Each entry: { hoursBeforeBooking, refundPercent }
 * Entries MUST be sorted descending by hoursBeforeBooking.
 */

type RefundTier = {
  hoursBeforeBooking: number;
  refundPercent: number;
  label: string;
};

const POLICY: RefundTier[] = [
  { hoursBeforeBooking: 24, refundPercent: 100, label: "More than 24 hours before booking" },
  { hoursBeforeBooking: 6,  refundPercent: 50,  label: "6–24 hours before booking" },
  { hoursBeforeBooking: 0,  refundPercent: 0,   label: "Less than 6 hours before booking" },
];

export type RefundCalculation = {
  eligible: boolean;
  refundAmount: number;
  refundPercent: number;
  reason: string;
};

/**
 * Calculate the refund amount based on how far the booking is from now.
 *
 * @param bookingDate - "YYYY-MM-DD"
 * @param bookingTime - "HH:MM" (24h)
 * @param paymentAmount - Amount paid in INR (e.g. 200)
 */
export function calculateRefund(
  bookingDate: string,
  bookingTime: string,
  paymentAmount: number
): RefundCalculation {
  if (!paymentAmount || paymentAmount <= 0) {
    return { eligible: false, refundAmount: 0, refundPercent: 0, reason: "No payment found for this booking." };
  }

  // Parse booking datetime
  const [hours, minutes] = bookingTime.split(":").map(Number);
  const bookingDt = new Date(`${bookingDate}T${bookingTime}:00`);

  // If date parsing fails, deny refund for safety
  if (isNaN(bookingDt.getTime())) {
    return { eligible: false, refundAmount: 0, refundPercent: 0, reason: "Invalid booking date/time." };
  }

  const now = new Date();
  const hoursUntilBooking = (bookingDt.getTime() - now.getTime()) / (1000 * 60 * 60);

  // If booking is in the past, no refund
  if (hoursUntilBooking < 0) {
    return { eligible: false, refundAmount: 0, refundPercent: 0, reason: "This booking has already passed. Refunds are not available." };
  }

  // Find the matching tier (first tier where hoursUntilBooking >= threshold)
  for (const tier of POLICY) {
    if (hoursUntilBooking >= tier.hoursBeforeBooking) {
      const refundAmount = Math.round((paymentAmount * tier.refundPercent) / 100);
      return {
        eligible: tier.refundPercent > 0,
        refundAmount,
        refundPercent: tier.refundPercent,
        reason: tier.refundPercent > 0
          ? `${tier.label}: ${tier.refundPercent}% refund (₹${refundAmount})`
          : `${tier.label}: No refund available.`,
      };
    }
  }

  // Fallback — no refund
  return { eligible: false, refundAmount: 0, refundPercent: 0, reason: "No refund available for this booking." };
}

/** Export the policy tiers for display in the UI */
export { POLICY as REFUND_POLICY_TIERS };

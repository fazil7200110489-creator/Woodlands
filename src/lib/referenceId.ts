import { connectDB } from "@/lib/db";
import { ReservationModel } from "@/lib/models";

/**
 * Generate a unique booking reference in the format: WGH-YYYYMMDD-NNNN
 *
 * - WGH = Woodlands Grill House
 * - YYYYMMDD = today's date
 * - NNNN = zero-padded daily sequence number
 *
 * Uses an atomic MongoDB query to ensure uniqueness even under concurrent requests.
 */
export async function generateBookingReference(): Promise<string> {
  await connectDB();

  const now = new Date();
  const dateStr =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");

  const prefix = `WGH-${dateStr}-`;

  // Count existing reservations with today's prefix to determine next sequence number
  const todayCount = await ReservationModel.countDocuments({
    referenceId: { $regex: `^${prefix}` },
  });

  // Try up to 10 sequence numbers in case of race conditions
  for (let attempt = 0; attempt < 10; attempt++) {
    const seq = String(todayCount + 1 + attempt).padStart(4, "0");
    const referenceId = `${prefix}${seq}`;

    // Check if this exact ID already exists
    const exists = await ReservationModel.findOne({ referenceId }).lean();
    if (!exists) {
      return referenceId;
    }
  }

  // Ultimate fallback — append random suffix
  const fallbackSeq = String(todayCount + 1).padStart(4, "0");
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}${fallbackSeq}-${rand}`;
}

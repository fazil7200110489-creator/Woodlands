import { connectDB } from "@/lib/db";
import { OrderModel, ReservationModel, CustomerModel } from "@/lib/models";

/**
 * Synchronize and recalculate customer metrics based on actual MongoDB transaction history.
 * This runs automatically when a payment is processed or booking is confirmed.
 */
export async function syncCustomer(phone: string) {
  if (!phone) return;

  try {
    await connectDB();

    // Fetch all successful paid orders (exclude Cancelled)
    const orders = await OrderModel.find({
      customerPhone: phone,
      paymentStatus: "Paid",
      status: { $ne: "Cancelled" },
    }).lean();

    // Fetch all confirmed/completed reservations
    const reservations = await ReservationModel.find({
      customerPhone: phone,
      status: { $in: ["Confirmed", "Completed"] },
    }).lean();

    if (orders.length === 0 && reservations.length === 0) {
      // Clean up if there are no records
      await CustomerModel.deleteOne({ phone });
      return;
    }

    let name = "";
    let email = "";
    let totalAmountSpent = 0;
    let lastOrderDate: Date | null = null;
    let lastReservationDate: Date | null = null;
    let customerSince = new Date();

    const itemCounts: Record<string, number> = {};
    const tableCounts: Record<number, number> = {};

    // Process Orders
    orders.forEach((o: any) => {
      if (o.customerName && !name) name = o.customerName;
      totalAmountSpent += o.totalAmount || 0;

      const orderDate = new Date(o.createdAt || o.paymentTime);
      if (!lastOrderDate || orderDate > lastOrderDate) {
        lastOrderDate = orderDate;
      }
      if (orderDate < customerSince) {
        customerSince = orderDate;
      }

      o.items?.forEach((it: any) => {
        if (it.name) {
          itemCounts[it.name] = (itemCounts[it.name] || 0) + (it.qty || 1);
        }
      });
    });

    // Process Reservations
    reservations.forEach((r: any) => {
      if (r.customerName && !name) name = r.customerName;
      if (r.customerEmail && !email) email = r.customerEmail;
      
      // Treat booking advance payment as spent amount
      totalAmountSpent += r.paymentAmount || 0;

      const resDate = new Date(r.createdAt || r.date);
      if (!lastReservationDate || resDate > lastReservationDate) {
        lastReservationDate = resDate;
      }
      if (resDate < customerSince) {
        customerSince = resDate;
      }

      if (r.tableNumber) {
        tableCounts[r.tableNumber] = (tableCounts[r.tableNumber] || 0) + 1;
      }
    });

    // Top 3 favorite items
    const favoriteItems = Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([itemName]) => itemName);

    // Preferred table
    let preferredTable: number | undefined;
    let maxTableCount = 0;
    Object.entries(tableCounts).forEach(([tblNum, count]) => {
      if (count > maxTableCount) {
        maxTableCount = count;
        preferredTable = Number(tblNum);
      }
    });

    const totalOrders = orders.length;
    const avgOrderValue =
      totalOrders > 0
        ? orders.reduce((sum, o: any) => sum + (o.totalAmount || 0), 0) / totalOrders
        : 0;

    // Upsert customer record
    const updatedCustomer = await CustomerModel.findOneAndUpdate(
      { phone },
      {
        name: name || "Customer",
        phone,
        email: email || undefined,
        totalOrders,
        totalReservations: reservations.length,
        totalAmountSpent,
        lastOrderDate,
        lastReservationDate,
        favoriteItems,
        preferredTable,
        avgOrderValue,
        status: "Active",
        createdAt: customerSince,
      },
      { upsert: true, new: true }
    );

    // Broadcast customer update in real-time
    try {
      const { emitCustomerUpdate } = await import("./sse-emitter");
      emitCustomerUpdate(updatedCustomer);
    } catch (sseErr) {
      console.warn("Could not emit customer SSE update", sseErr);
    }
  } catch (err) {
    console.error("Error in syncCustomer:", err);
  }
}

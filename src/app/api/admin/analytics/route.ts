import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { OrderModel, ReservationModel, CustomerModel, MenuItemModel } from "@/lib/models";
import { requireAdminAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  try {
    await connectDB();

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    // ── 1. Revenue Calculations ─────────────────────────────────────────────
    // Orders Revenue (exclude Cancelled)
    const ordersRevenue = await OrderModel.aggregate([
      { $match: { status: { $ne: "Cancelled" }, paymentStatus: "Paid" } },
      {
        $group: {
          _id: null,
          today: {
            $sum: { $cond: [{ $gte: ["$createdAt", todayStart] }, "$totalAmount", 0] },
          },
          weekly: {
            $sum: { $cond: [{ $gte: ["$createdAt", weekStart] }, "$totalAmount", 0] },
          },
          monthly: {
            $sum: { $cond: [{ $gte: ["$createdAt", monthStart] }, "$totalAmount", 0] },
          },
          yearly: {
            $sum: { $cond: [{ $gte: ["$createdAt", yearStart] }, "$totalAmount", 0] },
          },
          total: { $sum: "$totalAmount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Reservations Advance Revenue
    const reservationsRevenue = await ReservationModel.aggregate([
      { $match: { status: { $in: ["Confirmed", "Completed"] }, paymentStatus: "Paid" } },
      {
        $group: {
          _id: null,
          today: {
            $sum: { $cond: [{ $gte: ["$createdAt", todayStart] }, "$paymentAmount", 0] },
          },
          weekly: {
            $sum: { $cond: [{ $gte: ["$createdAt", weekStart] }, "$paymentAmount", 0] },
          },
          monthly: {
            $sum: { $cond: [{ $gte: ["$createdAt", monthStart] }, "$paymentAmount", 0] },
          },
          yearly: {
            $sum: { $cond: [{ $gte: ["$createdAt", yearStart] }, "$paymentAmount", 0] },
          },
          total: { $sum: "$paymentAmount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const orderRev = ordersRevenue[0] || { today: 0, weekly: 0, monthly: 0, yearly: 0, total: 0, count: 0 };
    const resRev = reservationsRevenue[0] || { today: 0, weekly: 0, monthly: 0, yearly: 0, total: 0, count: 0 };

    const totalRevenueToday = orderRev.today + resRev.today;
    const totalRevenueWeekly = orderRev.weekly + resRev.weekly;
    const totalRevenueMonthly = orderRev.monthly + resRev.monthly;
    const totalRevenueYearly = orderRev.yearly + resRev.yearly;

    // ── 2. Order/Reservation Counts ──────────────────────────────────────────
    const ordersTodayCount = await OrderModel.countDocuments({ createdAt: { $gte: todayStart } });
    const pendingOrders = await OrderModel.countDocuments({ status: "Pending" });
    const completedOrders = await OrderModel.countDocuments({ status: "Completed" });
    const cancelledOrders = await OrderModel.countDocuments({ status: "Cancelled" });

    const reservationsTodayCount = await ReservationModel.countDocuments({ date: now.toISOString().split("T")[0] });
    const upcomingReservations = await ReservationModel.countDocuments({
      status: "Confirmed",
      date: { $gte: now.toISOString().split("T")[0] },
    });
    const completedReservations = await ReservationModel.countDocuments({ status: "Completed" });
    const cancelledReservations = await ReservationModel.countDocuments({ status: "Cancelled" });

    // ── 3. Average Values ────────────────────────────────────────────────────
    const totalOrdersCount = await OrderModel.countDocuments({ status: { $ne: "Cancelled" } });
    const averageOrderValue = totalOrdersCount > 0 ? orderRev.total / totalOrdersCount : 0;

    const totalReservationsCount = await ReservationModel.countDocuments({ status: { $ne: "Cancelled" } });
    const averageBookingValue = totalReservationsCount > 0 ? resRev.total / totalReservationsCount : 0;

    // ── 4. Menu Item Popularity (Top / Least) ──────────────────────────────
    const itemSales = await OrderModel.aggregate([
      { $match: { status: { $ne: "Cancelled" } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          totalQty: { $sum: "$items.qty" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
        },
      },
      { $sort: { totalQty: -1 } },
    ]);

    const topSelling = itemSales.slice(0, 5).map((i) => ({ name: i._id, qty: i.totalQty, revenue: i.revenue }));
    const leastSelling = [...itemSales]
      .reverse()
      .slice(0, 5)
      .map((i) => ({ name: i._id, qty: i.totalQty, revenue: i.revenue }));

    // ── 5. Hourly Orders & Pickup Times ──────────────────────────────────────
    const hourlyOrders = await OrderModel.aggregate([
      { $match: { status: { $ne: "Cancelled" } } },
      {
        $project: {
          hour: { $hour: { $add: ["$createdAt", 5.5 * 60 * 60 * 1000] } }, // Offset to IST
        },
      },
      {
        $group: {
          _id: "$hour",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const pickupTimes = await OrderModel.aggregate([
      { $match: { status: { $ne: "Cancelled" } } },
      {
        $group: {
          _id: "$pickupTime",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 3 },
    ]);

    // ── 6. Preferred Table ──────────────────────────────────────────────────
    const tablePreferences = await ReservationModel.aggregate([
      { $match: { status: { $ne: "Cancelled" } } },
      {
        $group: {
          _id: "$tableNumber",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);

    // ── 7. Category Revenue ─────────────────────────────────────────────────
    // Query menu items to map category
    const menuItems = await MenuItemModel.find().lean();
    const itemToCategoryMap: Record<string, string> = {};
    menuItems.forEach((item: any) => {
      itemToCategoryMap[item.name] = item.category;
    });

    const categoryRevenue: Record<string, number> = {};
    itemSales.forEach((sale) => {
      const category = itemToCategoryMap[sale._id] || "Other";
      categoryRevenue[category] = (categoryRevenue[category] || 0) + sale.revenue;
    });

    // ── 8. Recharts Chart Historical Data ────────────────────────────────────
    const dailySalesHistory = await OrderModel.aggregate([
      { $match: { status: { $ne: "Cancelled" }, paymentStatus: "Paid" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]);

    const monthlySalesHistory = await OrderModel.aggregate([
      { $match: { status: { $ne: "Cancelled" }, paymentStatus: "Paid" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 12 },
    ]);

    // ── 9. Payments Metrics ──────────────────────────────────────────────────
    const totalPayments = await OrderModel.countDocuments({});
    const paidCount = await OrderModel.countDocuments({ paymentStatus: "Paid" });
    const failedCount = await OrderModel.countDocuments({ paymentStatus: "Failed" });
    const refundCount = await OrderModel.countDocuments({ paymentStatus: "Refunded" });

    const successRate = totalPayments > 0 ? Math.round((paidCount / totalPayments) * 100) : 100;
    const failureRate = totalPayments > 0 ? Math.round((failedCount / totalPayments) * 100) : 0;

    // ── 10. Customer Growth ─────────────────────────────────────────────────
    const totalCustomers = await CustomerModel.countDocuments();
    const repeatCustomers = await CustomerModel.countDocuments({ totalOrders: { $gt: 1 } });
    const repeatCustomerPercentage = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;

    return NextResponse.json({
      revenue: {
        today: totalRevenueToday,
        weekly: totalRevenueWeekly,
        monthly: totalRevenueMonthly,
        yearly: totalRevenueYearly,
      },
      orders: {
        today: ordersTodayCount,
        pending: pendingOrders,
        completed: completedOrders,
        cancelled: cancelledOrders,
      },
      reservations: {
        today: reservationsTodayCount,
        upcoming: upcomingReservations,
        completed: completedReservations,
        cancelled: cancelledReservations,
      },
      averages: {
        aov: Math.round(averageOrderValue),
        abv: Math.round(averageBookingValue),
      },
      items: {
        topSelling,
        leastSelling,
      },
      hourlyOrders: hourlyOrders.map((h) => ({ hour: `${h._id}:00`, count: h.count })),
      popularPickupTimes: pickupTimes.map((p) => ({ time: p._id, count: p.count })),
      popularTable: tablePreferences[0]?._id || "None",
      categoryRevenue: Object.entries(categoryRevenue).map(([name, value]) => ({ name, value })),
      paymentStats: {
        successRate,
        failureRate,
        refundCount,
      },
      customers: {
        total: totalCustomers,
        repeatPercentage: repeatCustomerPercentage,
      },
      charts: {
        dailySales: dailySalesHistory.map((d) => ({ date: d._id, value: d.revenue, count: d.orders })),
        monthlySales: monthlySalesHistory.map((m) => ({ month: m._id, value: m.revenue })),
      },
    });
  } catch (err: any) {
    console.error("[GET /api/admin/analytics]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

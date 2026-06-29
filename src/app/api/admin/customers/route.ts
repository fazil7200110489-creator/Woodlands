import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { CustomerModel } from "@/lib/models";
import { requireAdminAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/customers — Admin only paginated customer list
export async function GET(req: NextRequest) {
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  try {
    await connectDB();

    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const sortBy = url.searchParams.get("sortBy") || "recent"; // spend, orders, recent
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "15", 10);

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    let sortOptions: any = { createdAt: -1 };
    if (sortBy === "spend") {
      sortOptions = { totalAmountSpent: -1 };
    } else if (sortBy === "orders") {
      sortOptions = { totalOrders: -1 };
    } else if (sortBy === "recent") {
      sortOptions = { createdAt: -1 };
    }

    const skip = (page - 1) * limit;

    const total = await CustomerModel.countDocuments(query);
    const customers = await CustomerModel.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    // Summary statistics
    const allStats = await CustomerModel.aggregate([
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          totalSpent: { $sum: "$totalAmountSpent" },
          averageSpend: { $avg: "$totalAmountSpent" },
          repeatCustomers: {
            $sum: {
              $cond: [{ $gt: ["$totalOrders", 1] }, 1, 0],
            },
          },
        },
      },
    ]);

    const stats = allStats[0] || {
      totalCustomers: 0,
      totalSpent: 0,
      averageSpend: 0,
      repeatCustomers: 0,
    };

    const repeatPercent =
      stats.totalCustomers > 0
        ? Math.round((stats.repeatCustomers / stats.totalCustomers) * 100)
        : 0;

    return NextResponse.json({
      customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        totalCustomers: stats.totalCustomers,
        totalSpent: Math.round(stats.totalSpent),
        averageSpend: Math.round(stats.averageSpend),
        repeatPercentage: repeatPercent,
      },
    });
  } catch (err: any) {
    console.error("[GET /api/admin/customers]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

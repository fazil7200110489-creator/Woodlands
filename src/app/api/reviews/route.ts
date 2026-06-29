import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ReviewModel, OrderModel, ReservationModel } from "@/lib/models";
import { getSessionFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/reviews — Retrieve reviews
// - Admin sees all reviews (with pagination/search)
// - Customers see only approved reviews
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = getSessionFromRequest(req);
    const isAdmin = !!session;

    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);

    const query: any = {};

    if (isAdmin) {
      // Admin filter
      if (search) {
        query.$or = [
          { customerName: { $regex: search, $options: "i" } },
          { customerPhone: { $regex: search, $options: "i" } },
          { reviewText: { $regex: search, $options: "i" } },
        ];
      }
    } else {
      // Public filter
      query.status = "Approved";
    }

    const skip = (page - 1) * limit;

    const total = await ReviewModel.countDocuments(query);
    const reviews = await ReviewModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Summary statistics for admin
    let stats = null;
    if (isAdmin) {
      const allReviews = await ReviewModel.find().lean();
      const totalReviews = allReviews.length;
      const averageRating =
        totalReviews > 0
          ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
          : 0;

      stats = {
        totalReviews,
        averageRating: Number(averageRating.toFixed(1)),
        fiveStar: allReviews.filter((r) => r.rating === 5).length,
        fourStar: allReviews.filter((r) => r.rating === 4).length,
        threeStar: allReviews.filter((r) => r.rating === 3).length,
        twoStar: allReviews.filter((r) => r.rating === 2).length,
        oneStar: allReviews.filter((r) => r.rating === 1).length,
      };
    }

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats,
    });
  } catch (err: any) {
    console.error("[GET /api/reviews]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/reviews — Submit review (Public)
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { orderId, reservationId, rating, reviewText } = body;

    if (!rating) {
      return NextResponse.json(
        { error: "Star rating is required." },
        { status: 400 }
      );
    }

    let customerName = body.customerName || "";
    let customerPhone = body.customerPhone || "";
    let foodOrdered: string[] = [];
    let tableNumber: number | undefined;

    // Retrieve details if orderId is provided
    if (orderId) {
      const order = await OrderModel.findById(orderId).lean();
      if (order) {
        customerName = order.customerName || "";
        customerPhone = order.customerPhone || "";
        foodOrdered = order.items?.map((it: any) => it.name) || [];
      }
    }

    // Retrieve details if reservationId is provided
    if (reservationId) {
      const reservation = await ReservationModel.findById(reservationId).lean();
      if (reservation) {
        customerName = reservation.customerName || "";
        customerPhone = reservation.customerPhone || "";
        tableNumber = reservation.tableNumber;
      }
    }

    if (!customerName || !customerPhone) {
      return NextResponse.json(
        { error: "Could not associate review with a valid order or reservation." },
        { status: 400 }
      );
    }

    const review = await ReviewModel.create({
      customerName,
      customerPhone,
      orderId: orderId || undefined,
      reservationId: reservationId || undefined,
      rating: Number(rating),
      reviewText,
      foodOrdered,
      tableNumber,
      status: "Approved", // Approved by default, admin can hide it
    });

    // Notify admin panels in real-time
    try {
      const { emitNewReview } = await import("@/lib/sse-emitter");
      emitNewReview(review);
    } catch (_) {}

    return NextResponse.json({ success: true, review }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/reviews]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

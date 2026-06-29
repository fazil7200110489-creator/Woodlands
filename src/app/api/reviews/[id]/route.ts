import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ReviewModel } from "@/lib/models";
import { requireAdminAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// PATCH /api/reviews/[id] — Moderate review (approve, hide, reply)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await req.json();
    const { status, replyText } = body;

    await connectDB();

    const updateFields: any = {};
    if (status !== undefined) {
      if (status !== "Approved" && status !== "Hidden") {
        return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
      }
      updateFields.status = status;
    }
    if (replyText !== undefined) {
      updateFields.replyText = replyText;
    }

    const updated = await ReviewModel.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("[PATCH /api/reviews/[id]]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/reviews/[id] — Delete review
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  try {
    const { id } = await params;
    await connectDB();

    const deleted = await ReviewModel.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[DELETE /api/reviews/[id]]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

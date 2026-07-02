import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models";
import { getSessionFromRequest, verifyPassword, hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await UserModel.findById(session.sub);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify current password
    const isPasswordCorrect = await verifyPassword(currentPassword, user.passwordHash);
    if (!isPasswordCorrect) {
      return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
    }

    // Hash and save new password
    user.passwordHash = await hashPassword(newPassword);
    await user.save();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/admin/auth/change-password]", err);
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 }
    );
  }
}

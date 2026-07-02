import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models";
import {
  verifyPassword,
  createSessionToken,
  getSessionCookieOptions,
} from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required." },
        { status: 400 }
      );
    }

    await connectDB();

    const cleanUsername = username.trim().toLowerCase();
    
    // Find the user by username (case-insensitive)
    const user = await UserModel.findOne({
      username: { $regex: new RegExp(`^${escapeRegex(cleanUsername)}$`, "i") }
    });

    if (!user) {
      // Delay to prevent user enumeration
      await new Promise((r) => setTimeout(r, 300));
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Account has been deactivated." },
        { status: 403 }
      );
    }

    // Verify Password
    const passwordValid = await verifyPassword(password, user.passwordHash);

    if (!passwordValid) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Create session token
    const token = createSessionToken({
      sub: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    const response = NextResponse.json({ ok: true });
    const cookieOpts = getSessionCookieOptions();

    response.cookies.set({
      name: cookieOpts.name,
      value: token,
      httpOnly: cookieOpts.httpOnly,
      secure: cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      path: cookieOpts.path,
      maxAge: cookieOpts.maxAge,
    });

    return response;
  } catch (err) {
    console.error("[POST /api/admin/auth/login]", err);
    return NextResponse.json(
      { error: "An internal error occurred." },
      { status: 500 }
    );
  }
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

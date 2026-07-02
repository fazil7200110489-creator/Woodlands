import { NextResponse } from "next/server";
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

    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    // if (!adminUsername || !adminPasswordHash) {
    //   console.error("[login] ADMIN_USERNAME or ADMIN_PASSWORD_HASH not set");
    //   return NextResponse.json(
    //     { error: "Server configuration error." },
    //     { status: 500 }
    //   );
    // }
    if (!adminPasswordHash) {
      return NextResponse.json(
        { error: "ADMIN_PASSWORD_HASH is missing" },
        { status: 500 }
      );
    }
    // Validate username (case-sensitive)
    if (username !== adminUsername) {
      // Use the same delay as bcrypt to prevent username enumeration
      await new Promise((r) => setTimeout(r, 300));
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }

    // Validate password with bcrypt
    const passwordValid = await verifyPassword(password, adminPasswordHash);
    if (!passwordValid) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }

    // Create signed session token
    const token = createSessionToken({
      sub: "admin",
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

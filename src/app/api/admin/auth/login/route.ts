import { NextResponse } from "next/server";
import {
  verifyPassword,
  createSessionToken,
  getSessionCookieOptions,
  getAdminUsername,
  getAdminPasswordHash,
  hasAdminSessionSecret,
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

    // STEP 1 & STEP 7: Environment Loaded check
    const adminUsername = getAdminUsername();
    const adminPasswordHash = getAdminPasswordHash();
    const adminSessionSecretLoaded = hasAdminSessionSecret();

    console.log("Environment Loaded");
    console.log(`ADMIN_USERNAME Loaded: ${!!adminUsername}`);
    console.log(`ADMIN_PASSWORD_HASH Loaded: ${!!adminPasswordHash}`);
    console.log(`ADMIN_SESSION_SECRET Loaded: ${adminSessionSecretLoaded}`);

    // STEP 2: Verify login request
    console.log(`Username received: ${username}`);
    const usernameMatches = username === adminUsername;
    console.log(`Whether username matches ADMIN_USERNAME: ${usernameMatches}`);

    if (!adminUsername || !adminPasswordHash) {
      console.error("[login] ADMIN_USERNAME or ADMIN_PASSWORD_HASH not set");
      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 }
      );
    }

    // Validate username (case-sensitive)
    if (!usernameMatches) {
      // Use the same delay as bcrypt to prevent username enumeration
      await new Promise((r) => setTimeout(r, 300));
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }
    console.log("Username Match");

    // STEP 3: Verify Password Hash
    console.log("Checking verifyPassword()...");
    const passwordValid = await verifyPassword(password, adminPasswordHash);
    console.log(`Password Compare Result:\n${passwordValid}`);

    if (!passwordValid) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }
    console.log("Password Match");

    // STEP 5: Verify Session
    console.log("Creating session token...");
    const token = createSessionToken({
      sub: "admin",
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
    });
    console.log(`createSessionToken() works correctly: ${!!token}`);

    const response = NextResponse.json({ ok: true });
    const cookieOpts = getSessionCookieOptions();
    console.log(`HttpOnly cookie: ${!!cookieOpts.httpOnly}`);
    console.log(`Secure cookie: ${!!cookieOpts.secure}`);
    console.log(`SameSite: ${cookieOpts.sameSite}`);
    console.log(`Cookie path: ${cookieOpts.path}`);
    console.log(`Cookie expiry: ${cookieOpts.maxAge} seconds`);
    console.log("Session Created");

    response.cookies.set({
      name: cookieOpts.name,
      value: token,
      httpOnly: cookieOpts.httpOnly,
      secure: cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      path: cookieOpts.path,
      maxAge: cookieOpts.maxAge,
    });
    console.log("Cookie Set");
    console.log("Redirect");

    return response;
  } catch (err) {
    console.error("[POST /api/admin/auth/login]", err);
    return NextResponse.json(
      { error: "An internal error occurred." },
      { status: 500 }
    );
  }
}

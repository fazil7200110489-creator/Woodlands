import { NextResponse } from "next/server";
import { getSessionCookieOptions, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });

  // Clear the session cookie
  const opts = getSessionCookieOptions(true);
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: opts.httpOnly,
    secure: opts.secure,
    sameSite: opts.sameSite,
    path: opts.path,
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}

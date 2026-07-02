/**
 * auth.ts — Server-side authentication utilities.
 * This file must NEVER be imported by client components.
 */
// import "server-only";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";

export const SESSION_COOKIE_NAME = "admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not set");
  return secret;
}

// ---------------------------------------------------------------------------
// Password utilities
// ---------------------------------------------------------------------------

export function cleanEnvVar(val?: string): string {
  if (!val) return "";
  let clean = val.trim();
  if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
    clean = clean.slice(1, -1);
  }
  return clean.trim();
}

export function getAdminUsername(): string {
  return cleanEnvVar(process.env.ADMIN_USERNAME);
}

export function getAdminPasswordHash(): string {
  const hash = cleanEnvVar(process.env.ADMIN_PASSWORD_HASH);
  if (hash.startsWith("base64:")) {
    const base64Str = hash.substring("base64:".length);
    return Buffer.from(base64Str, "base64").toString("utf-8");
  }
  return hash;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ---------------------------------------------------------------------------
// Token utilities — HMAC-SHA256 signed tokens (no external JWT lib needed)
// Format: base64url(payload).base64url(signature)
// ---------------------------------------------------------------------------

function b64url(buf: Buffer | string): string {
  const b = typeof buf === "string" ? Buffer.from(buf) : buf;
  return b.toString("base64url");
}

function sign(data: string): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update(data)
    .digest("base64url");
}

export function createSessionToken(payload: Record<string, unknown>): string {
  const data = b64url(JSON.stringify({ ...payload, iat: Date.now() }));
  const sig = sign(data);
  return `${data}.${sig}`;
}

export function verifySessionToken(
  token: string
): Record<string, unknown> | null {
  try {
    const [data, sig] = token.split(".");
    if (!data || !sig) return null;

    const expectedSig = sign(data);
    // Constant-time comparison to prevent timing attacks
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expectedSig);
    if (
      sigBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(sigBuf, expectedBuf)
    ) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));

    // Check expiry
    if (payload.exp && Date.now() > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------

export function getSessionCookieOptions(forDelete = false) {
  const isProd = process.env.NODE_ENV === "production";
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: isProd,
    sameSite: "strict" as const,
    path: "/",
    maxAge: forDelete ? 0 : SESSION_TTL_SECONDS,
  };
}

/**
 * Read and validate the session from the Next.js cookies() store.
 * Only callable from Server Components / Route Handlers (not middleware).
 */
export async function getSession(): Promise<Record<string, unknown> | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Read and validate the session from a NextRequest (for middleware / API guards).
 */
export function getSessionFromRequest(
  req: NextRequest | Request
): Record<string, unknown> | null {
  const cookieHeader =
    "cookies" in req && typeof (req as NextRequest).cookies?.get === "function"
      ? (req as NextRequest).cookies.get(SESSION_COOKIE_NAME)?.value
      : req.headers.get("cookie")?.match(
          new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`)
        )?.[1];

  if (!cookieHeader) return null;
  return verifySessionToken(cookieHeader);
}

/**
 * Middleware-friendly guard for API routes.
 * Returns a 401 NextResponse if not authenticated, otherwise null (proceed).
 */
export function requireAdminAuth(req: NextRequest | Request): NextResponse | null {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  return null;
}

import "server-only";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import * as bcrypt from "bcryptjs";

export const SESSION_COOKIE_NAME = "admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  const secret = cleanEnvVar(process.env.ADMIN_SESSION_SECRET);
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

export function hasAdminSessionSecret(): boolean {
  return !!cleanEnvVar(process.env.ADMIN_SESSION_SECRET);
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

// Pure JS SHA-256 implementation (EZRA / antimatter15)
function SHA256(b: string): string {
  function h(j: number, k: number) {
    return (j >> e) + (k >> e) + ((p = (j & o) + (k & o)) >> e) << e | p & o;
  }
  function f(j: number, k: number) {
    return j >>> k | j << 32 - k;
  }
  var g: number[] = [], d, c = 3, l = [2], p, i, q, a: number[], m: number[] = [], n: number[] = [];
  i = b.length * 8;
  for (var e = 16, o = 65535, r = ""; c < 312; c++) {
    for (d = l.length; d-- && c % l[d] != 0;);
    d < 0 && l.push(c);
  }
  b += "\u0080";
  for (c = 0; c <= i; c += 8) n[c >> 5] |= (b.charCodeAt(c / 8) & 255) << 24 - c % 32;
  n[(i + 64 >> 9 << 4) + 15] = i;
  for (c = 8; c--;) m[c] = parseInt(Math.pow(l[c], 0.5).toString(e).substr(2, 8), e);
  for (c = 0; c < n.length; c += e) {
    a = m.slice(0);
    for (var idx = 0; idx < 64; idx++) {
      g[idx] = idx < e ? n[idx + c] : h(h(h(f(g[idx - 2], 17) ^ f(g[idx - 2], 19) ^ g[idx - 2] >>> 10, g[idx - 7]), f(g[idx - 15], 7) ^ f(g[idx - 15], 18) ^ g[idx - 15] >>> 3), g[idx - e]);
      i = h(h(h(h(a[7], f(a[4], 6) ^ f(a[4], 11) ^ f(a[4], 25)), a[4] & a[5] ^ ~a[4] & a[6]), parseInt(Math.pow(l[idx], 1 / 3).toString(e).substr(2, 8), e)), g[idx]);
      q = (f(a[0], 2) ^ f(a[0], 13) ^ f(a[0], 22)) + (a[0] & a[1] ^ a[0] & a[2] ^ a[1] & a[2]);
      for (d = 8; --d;) a[d] = d == 4 ? h(a[3], i) : a[d - 1];
      a[0] = h(i, q);
    }
    for (d = 8; d--;) m[d] += a[d];
  }
  for (c = 0; c < 8; c++) for (var kRound = 8; kRound--;) r += (m[c] >>> kRound * 4 & 15).toString(e);
  return r;
}

function hexToBytes(hex: string): number[] {
  const bytes = [];
  for (let c = 0; c < hex.length; c += 2) {
    bytes.push(parseInt(hex.substr(c, 2), 16));
  }
  return bytes;
}

function bytesToBinaryString(bytes: Uint8Array | number[]): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) {
    s += String.fromCharCode(bytes[i]);
  }
  return s;
}

function hmacSha256(key: string, message: string): string {
  let keyBytes = Array.from(new TextEncoder().encode(key));
  const msgBytes = Array.from(new TextEncoder().encode(message));

  const blockSize = 64;
  if (keyBytes.length > blockSize) {
    const keyHashHex = SHA256(key);
    keyBytes = hexToBytes(keyHashHex);
  }
  while (keyBytes.length < blockSize) {
    keyBytes.push(0);
  }

  const ipad = new Uint8Array(blockSize);
  const opad = new Uint8Array(blockSize);
  for (let i = 0; i < blockSize; i++) {
    ipad[i] = keyBytes[i] ^ 0x36;
    opad[i] = keyBytes[i] ^ 0x5C;
  }

  const innerMsg = new Uint8Array(ipad.length + msgBytes.length);
  innerMsg.set(ipad);
  innerMsg.set(msgBytes, ipad.length);
  const innerMsgStr = bytesToBinaryString(innerMsg);
  const innerHashHex = SHA256(innerMsgStr);
  const innerHashBytes = hexToBytes(innerHashHex);

  const outerMsg = new Uint8Array(opad.length + innerHashBytes.length);
  outerMsg.set(opad);
  outerMsg.set(innerHashBytes, opad.length);
  const outerMsgStr = bytesToBinaryString(outerMsg);
  const outerHashHex = SHA256(outerMsgStr);

  const outerHashBytes = hexToBytes(outerHashHex);
  return Buffer.from(outerHashBytes).toString("base64url");
}

function timingSafeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

function b64url(buf: Buffer | string): string {
  const b = typeof buf === "string" ? Buffer.from(buf) : buf;
  return b.toString("base64url");
}

function sign(data: string): string {
  return hmacSha256(getSecret(), data);
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
      !timingSafeEqual(sigBuf, expectedBuf)
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

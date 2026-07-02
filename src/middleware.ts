import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

/**
 * Next.js Middleware — runs on the Edge before every matched request.
 *
 * Protected paths:
 *   - /admin/*  (all admin pages except /admin/login)
 *   - /api/admin/auth/* — intentionally NOT protected (these are the auth endpoints)
 *   - Admin-only API routes: POST/PATCH/DELETE /api/menu, GET/PATCH /api/orders,
 *     GET/PATCH /api/settings, POST /api/reports/daily,
 *     GET /api/reservations (admin list), POST /api/reservations/admin-cancel
 */

const ADMIN_PAGE_MATCHER = /^\/admin(\/|$)/;
const ADMIN_LOGIN_PATH = "/admin/login";

/** Customer order status pages — always public */
const ORDER_STATUS_MATCHER = /^\/order\//;

/** API routes that are ALWAYS public (customer-facing) */
const PUBLIC_API_PATTERNS: { method?: string; path: RegExp }[] = [
  // Customer ordering — always public
  { method: "POST", path: /^\/api\/orders$/ },
  // Customer order status lookup (single order by ID) — always public
  { method: "GET", path: /^\/api\/orders\/[^/]+$/ },
  // Payment flows — always public
  { path: /^\/api\/payment\// },
  // Customer reservation actions — always public
  { method: "POST", path: /^\/api\/reservations$/ },
  { method: "GET", path: /^\/api\/reservations\/availability/ },
  { method: "POST", path: /^\/api\/reservations\/cancel/ },
  { method: "POST", path: /^\/api\/reservations\/lookup/ },
  { method: "GET", path: /^\/api\/reservations\/refund-preview/ },
  { method: "GET", path: /^\/api\/reservations\/[^/]+$/ }, // single reservation lookup
  // Menu read — public (storefront display)
  { method: "GET", path: /^\/api\/menu$/ },
  // Settings read — public (used by booking form for open/close state)
  { method: "GET", path: /^\/api\/settings$/ },
  // Reviews read and write (public)
  { method: "GET", path: /^\/api\/reviews$/ },
  { method: "POST", path: /^\/api\/reviews$/ },
  // Auth endpoints themselves
  { path: /^\/api\/admin\/auth\// },
];

/** API routes that require admin authentication */
const PROTECTED_API_PATTERNS: { method?: string; path: RegExp }[] = [
  // Menu mutations
  { method: "POST", path: /^\/api\/menu$/ },
  { method: "PATCH", path: /^\/api\/menu$/ },
  { method: "DELETE", path: /^\/api\/menu$/ },
  // Orders (admin view + update)
  { method: "GET", path: /^\/api\/orders/ },
  { method: "PATCH", path: /^\/api\/orders/ },
  // Settings mutations
  { method: "PATCH", path: /^\/api\/settings/ },
  // Reports & Analytics
  { path: /^\/api\/admin\/reports/ },
  { path: /^\/api\/admin\/analytics/ },
  { path: /^\/api\/admin\/customers/ },
  // Reviews moderation (admin only)
  { path: /^\/api\/reviews\/[^/]+$/ },
  // Reservations — admin list and admin-cancel
  { method: "GET", path: /^\/api\/reservations$/ },
  { method: "PATCH", path: /^\/api\/reservations/ },
  { method: "POST", path: /^\/api\/reservations\/admin-cancel/ },
];

function isPublicApi(pathname: string, method: string): boolean {
  return PUBLIC_API_PATTERNS.some(
    (p) =>
      p.path.test(pathname) &&
      (p.method === undefined || p.method === method)
  );
}

function isProtectedApi(pathname: string, method: string): boolean {
  return PROTECTED_API_PATTERNS.some(
    (p) =>
      p.path.test(pathname) &&
      (p.method === undefined || p.method === method)
  );
}

function getTokenFromRequest(req: NextRequest): string | undefined {
  return req.cookies.get(SESSION_COOKIE_NAME)?.value;
}

function isAuthenticated(req: NextRequest): boolean {
  const token = getTokenFromRequest(req);
  if (!token) return false;
  const payload = verifySessionToken(token);
  return payload !== null;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method.toUpperCase();

  // ── Customer order status pages — always public ────────────────────────
  if (ORDER_STATUS_MATCHER.test(pathname)) {
    return NextResponse.next();
  }

  // ── Admin page protection ──────────────────────────────────────────────
  if (ADMIN_PAGE_MATCHER.test(pathname)) {
    // /admin/login is always accessible
    if (pathname === ADMIN_LOGIN_PATH || pathname.startsWith("/admin/login")) {
      // If already authenticated, redirect away from login page
      if (isAuthenticated(req)) {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
      return NextResponse.next();
    }

    // All other /admin/* routes require authentication
    if (!isAuthenticated(req)) {
      const loginUrl = new URL(ADMIN_LOGIN_PATH, req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // ── API route protection ───────────────────────────────────────────────
  if (pathname.startsWith("/api/")) {
    // Skip if explicitly public
    if (isPublicApi(pathname, method)) {
      return NextResponse.next();
    }

    // Check if this is a protected API
    if (isProtectedApi(pathname, method)) {
      if (!isAuthenticated(req)) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except Next.js internals and static files.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|eot|css|js)$).*)",
  ],
};

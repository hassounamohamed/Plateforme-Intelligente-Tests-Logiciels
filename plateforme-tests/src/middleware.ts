import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { TOKEN_KEY, ROUTES } from "@/lib/constants";

// ─── Public paths (no auth required) ────────────────────────────────────────
const PUBLIC_PATHS = [
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
];

// ─── Role-gated paths ────────────────────────────────────────────────────────
const ROLE_PATHS: Record<string, string[]> = {
  [ROUTES.DEVELOPER]: ["DEVELOPER", "SUPER_ADMIN"],
  [ROUTES.PRODUCT_OWNER]: ["PRODUCT_OWNER", "SUPER_ADMIN"],
  [ROUTES.QA]: ["QA", "SUPER_ADMIN"],
  [ROUTES.SCRUM_MASTER]: ["SCRUM_MASTER", "SUPER_ADMIN"],
  [ROUTES.SUPER_ADMIN]: ["SUPER_ADMIN"],
};

// ─── JWT decode (Edge-compatible, no verify) ─────────────────────────────────
interface JwtPayload {
  sub?: string;
  role?: string;
  exp?: number;
}

function parseJwt(token: string): JwtPayload | null {
  try {
    return JSON.parse(atob(token.split(".")[1])) as JwtPayload;
  } catch {
    return null;
  }
}

function isExpired(payload: JwtPayload): boolean {
  if (!payload.exp) return false;
  return Date.now() >= payload.exp * 1000;
}

// ─── Middleware ───────────────────────────────────────────────────────────────
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public auth pages
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Read token from cookie (set by lib/auth.ts on login)
  const token = request.cookies.get(TOKEN_KEY)?.value;

  if (!token) {
    const url = new URL(ROUTES.LOGIN, request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  const payload = parseJwt(token);

  // Invalid or expired — redirect to login
  if (!payload || isExpired(payload)) {
    const url = new URL(ROUTES.LOGIN, request.url);
    const response = NextResponse.redirect(url);
    response.cookies.delete(TOKEN_KEY); // clear stale cookie
    return response;
  }

  // Role-based access control
  for (const [path, allowedRoles] of Object.entries(ROLE_PATHS)) {
    if (pathname.startsWith(path)) {
      if (!payload.role || !allowedRoles.includes(payload.role)) {
        // Redirect to generic dashboard (access denied)
        return NextResponse.redirect(new URL(ROUTES.DASHBOARD, request.url));
      }
      break;
    }
  }

  return NextResponse.next();
}

// ─── Matcher: only protect /dashboard routes ─────────────────────────────────
export const config = {
  matcher: ["/dashboard/:path*"],
};

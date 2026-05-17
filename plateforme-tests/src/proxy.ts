import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { TOKEN_KEY, ROUTES } from "@/lib/constants";

const PUBLIC_PATHS = [
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
];

const ROLE_PATHS: Record<string, string[]> = {
  [ROUTES.DEVELOPER]: ["DEVELOPPEUR", "SUPER_ADMIN"],
  [ROUTES.PRODUCT_OWNER]: ["PRODUCT_OWNER", "SUPER_ADMIN"],
  [ROUTES.QA]: ["TESTEUR_QA", "SUPER_ADMIN"],
  [ROUTES.SCRUM_MASTER]: ["SCRUM_MASTER", "SUPER_ADMIN"],
  [ROUTES.SUPER_ADMIN]: ["SUPER_ADMIN"],
};

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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(TOKEN_KEY)?.value;

  if (!token) {
    const url = new URL(ROUTES.LOGIN, request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  const payload = parseJwt(token);

  if (!payload || isExpired(payload)) {
    const url = new URL(ROUTES.LOGIN, request.url);
    const response = NextResponse.redirect(url);
    response.cookies.delete(TOKEN_KEY);
    return response;
  }

  for (const [path, allowedRoles] of Object.entries(ROLE_PATHS)) {
    if (pathname.startsWith(path)) {
      if (!payload.role || !allowedRoles.includes(payload.role)) {
        const url = new URL(ROUTES.LOGIN, request.url);
        return NextResponse.redirect(url);
      }
      break;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
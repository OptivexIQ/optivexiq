import { randomUUID } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import {
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SUPABASE_URL,
} from "./lib/env";
import { getUserRole } from "@/lib/auth/getUserRole";
import { planGuard, isQuotaPath } from "./middleware/planGuard";
import { rateLimitGuard } from "./middleware/rateLimitGuard";

const protectedPaths = ["/dashboard"];
const adminPaths = ["/admin", "/api/admin"];

function isProtectedPath(pathname: string) {
  return protectedPaths.some((path) => pathname.startsWith(path));
}

function isAdminPath(pathname: string) {
  return adminPaths.some((path) => pathname.startsWith(path));
}

export async function proxy(request: NextRequest) {
  const requestId = randomUUID();
  const isQuotaRequest = isQuotaPath(request.nextUrl.pathname);
  if (
    !isProtectedPath(request.nextUrl.pathname) &&
    !isAdminPath(request.nextUrl.pathname) &&
    !isQuotaRequest
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const supabaseUrl = NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseAnonKey = NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  const cookieMethods: CookieMethodsServer = {
    getAll() {
      return request.cookies
        .getAll()
        .map(({ name, value }) => ({ name, value }));
    },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set({ name, value, ...options });
      });
    },
  };

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: cookieMethods,
    cookieOptions: {
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  });

  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    if (isQuotaRequest || request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: { code: "unauthorized", message: "Unauthorized", requestId } },
        { status: 401, headers: { "x-request-id": requestId } },
      );
    }

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  if (isQuotaRequest) {
    const quotaResult = await planGuard(
      request.nextUrl.pathname,
      data.user.id,
      requestId,
    );
    if (quotaResult && quotaResult.response) {
      return quotaResult.response;
    }
  }

  // Extract IP address (works for Vercel/Next.js edge, adjust for your infra)
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  // Apply rate limiting to all API routes (except in mock mode)
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const rateLimitResult = await rateLimitGuard(
      ip,
      requestId,
      request.nextUrl.pathname,
      data.user.id,
    );
    if (rateLimitResult && rateLimitResult.response) {
      return rateLimitResult.response;
    }
  }

  if (isAdminPath(request.nextUrl.pathname)) {
    const role = getUserRole(data.user);

    if (role !== "admin" && role !== "super_admin") {
      if (request.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: { code: "forbidden", message: "Forbidden", requestId } },
          { status: 403, headers: { "x-request-id": requestId } },
        );
      }

      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

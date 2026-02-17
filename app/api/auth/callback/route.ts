import { NextResponse, type NextRequest } from "next/server";
import { exchangeAuthCodeForSession } from "@/features/auth/services/authCallbackService";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const redirectTo = searchParams.get("redirect");
  const result = await exchangeAuthCodeForSession(searchParams.get("code"));
  if (!result.ok) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("error", result.error);
    return NextResponse.redirect(redirectUrl);
  }

  const redirectPath =
    typeof redirectTo === "string" &&
    redirectTo.startsWith("/") &&
    !redirectTo.startsWith("//")
      ? redirectTo
      : "/dashboard";
  const redirectUrl = new URL(redirectPath, request.url);
  return NextResponse.redirect(redirectUrl);
}

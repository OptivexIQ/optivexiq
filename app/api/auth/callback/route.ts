import { NextResponse, type NextRequest } from "next/server";
import { exchangeAuthCodeForSession } from "@/features/auth/services/authCallbackService";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const result = await exchangeAuthCodeForSession(searchParams.get("code"));
  if (!result.ok) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("error", result.error);
    return NextResponse.redirect(redirectUrl);
  }

  const redirectUrl = new URL("/dashboard", request.url);
  return NextResponse.redirect(redirectUrl);
}

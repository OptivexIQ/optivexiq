import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import {
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SUPABASE_URL,
} from "@/lib/env";

export type AuthGuardResult = { userId: string } | { response: Response };

export async function authGuard(
  request: NextRequest,
): Promise<AuthGuardResult> {
  const supabaseUrl = NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseAnonKey = NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  const cookieMethods: CookieMethodsServer = {
    getAll() {
      return request.cookies
        .getAll()
        .map(({ name, value }) => ({ name, value }));
    },
    setAll() {
      // No-op for API route guards; session refresh handled elsewhere.
    },
  };

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: cookieMethods,
  });

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { userId: data.user.id };
}

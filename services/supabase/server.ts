import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SUPABASE_URL,
} from "@/lib/env";
import { logger } from "@/lib//logger";

export const createSupabaseServerClient = async () => {
  if (!NEXT_PUBLIC_SUPABASE_URL || !NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    logger.error("Missing Supabase environment variables.");
    throw new Error("Missing Supabase environment variables.");
  }

  try {
    const cookieStore = await cookies();
    const cookieMethods: CookieMethodsServer = {
      getAll() {
        const entries = cookieStore.getAll();
        return entries.map(({ name, value }) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            logger.warn("Unable to set Supabase cookies.", {
              name,
              error,
            });
          }
        });
      },
    };

    return createServerClient(
      NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: cookieMethods,
      },
    );
  } catch (error) {
    logger.error("Failed to create Supabase server client.", error);
    throw error;
  }
};

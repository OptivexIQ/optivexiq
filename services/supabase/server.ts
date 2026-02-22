import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SUPABASE_URL,
} from "@/lib/env";
import { logger } from "@/lib//logger";

type SupabaseServerClientMode = "readOnly" | "mutable";

function isDynamicServerUsageError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes("Dynamic server usage") &&
    error.message.includes("cookies")
  );
}

async function createSupabaseServerClientWithMode(
  mode: SupabaseServerClientMode,
) {
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
        if (mode === "readOnly") {
          return;
        }

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
    if (!isDynamicServerUsageError(error)) {
      logger.error("Failed to create Supabase server client.", error);
    }
    throw error;
  }
}

export const createSupabaseServerReadOnlyClient = async () =>
  createSupabaseServerClientWithMode("readOnly");

export const createSupabaseServerMutableClient = async () =>
  createSupabaseServerClientWithMode("mutable");

export const createSupabaseServerClient = createSupabaseServerMutableClient;

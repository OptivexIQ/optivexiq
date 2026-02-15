import { createBrowserClient } from "@supabase/ssr";
import {
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SUPABASE_URL,
} from "@/lib//env";
import { logger } from "@/lib//logger";

// Note: supabaseAdmin uses the SERVICE_ANON_KEY which you must only use in a secure server environment.
// NEVER expose this key on the client side.

export function createSupabaseBrowserClient() {
  if (!NEXT_PUBLIC_SUPABASE_URL || !NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    logger.error("Missing Supabase environment variables.");
    throw new Error("Missing Supabase environment variables.");
  }

  try {
    return createBrowserClient(
      NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  } catch (error) {
    logger.error("Failed to create Supabase browser client.", error);
    throw error;
  }
}

import { createBrowserClient } from "@supabase/ssr";
import { RuntimeClientConfig as RuntimeConfig } from "@/lib/config/runtime.client";

// Note: supabaseAdmin uses the SERVICE_ANON_KEY which you must only use in a secure server environment.
// NEVER expose this key on the client side.

export function createSupabaseBrowserClient() {
  const supabaseUrl = RuntimeConfig.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = RuntimeConfig.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables.");
    throw new Error("Missing Supabase environment variables.");
  }

  try {
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error("Failed to create Supabase browser client.", error);
    throw error;
  }
}

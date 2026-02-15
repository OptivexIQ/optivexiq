import { createClient } from "@supabase/supabase-js";
import {
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
} from "@/lib//env";
import { logger } from "@/lib/logger";

export type AdminClientContext =
  | "webhook"
  | "worker"
  | "cron"
  | "usage_rpc";

const ALLOWED_CONTEXTS: AdminClientContext[] = [
  "webhook",
  "worker",
  "cron",
  "usage_rpc",
];

function assertTrustedAdminClientContext(context: AdminClientContext) {
  if (!ALLOWED_CONTEXTS.includes(context)) {
    throw new Error("untrusted_admin_client_context");
  }
}

export const createSupabaseAdminClient = (context: AdminClientContext) => {
  try {
    assertTrustedAdminClientContext(context);
    return createClient(
      NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY!, // Never expose publicly
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  } catch (error) {
    logger.error("Failed to create Supabase admin client", error, {
      context,
    });
    throw error;
  }
};

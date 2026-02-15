import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for DB contract verification.",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function verifyRpc(rpcName) {
  const { data, error } = await supabase.rpc(rpcName);
  if (error) {
    return { ok: false, error: `${rpcName} rpc_error:${error.code ?? "unknown"}` };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row || row.is_ready !== true) {
    return {
      ok: false,
      error: `${rpcName} not ready (matching_count=${row?.matching_count ?? 0})`,
    };
  }

  return { ok: true, error: null };
}

const checks = await Promise.all([
  verifyRpc("verify_rate_limit_function_ready"),
  verifyRpc("verify_canonical_gap_completion_rpc_ready"),
  verifyRpc("verify_canonical_migration_snapshot_ready"),
]);

const failed = checks.filter((check) => !check.ok);
if (failed.length > 0) {
  for (const check of failed) {
    console.error(`DB contract check failed: ${check.error}`);
  }
  process.exit(1);
}

console.info("DB contract verification passed.");

import { randomUUID } from "crypto";
import { createSupabaseAdminClient } from "@/services/supabase/admin";
import { logger } from "@/lib/logger";
import { emitRewriteTelemetryEvent } from "@/features/rewrites/services/rewriteTelemetryService";

type MarkRewriteWinnerResult =
  | {
      ok: true;
      requestRef: string;
      experimentGroupId: string;
      winnerLabel: string | null;
      winnerMarkedAt: string;
    }
  | { ok: false; error: string };

export async function markRewriteWinnerForUser(params: {
  userId: string;
  requestRef: string;
  winnerLabel?: string | null;
}): Promise<MarkRewriteWinnerResult> {
  const requestRef = params.requestRef.trim();
  if (!requestRef) {
    return { ok: false, error: "Invalid request reference." };
  }

  const winnerLabel =
    typeof params.winnerLabel === "string" && params.winnerLabel.trim().length > 0
      ? params.winnerLabel.trim().slice(0, 120)
      : null;
  const winnerMarkedAt = new Date().toISOString();

  const admin = createSupabaseAdminClient("worker");
  const { data: target, error: targetError } = await admin
    .from("rewrite_generations")
    .select("request_ref, experiment_group_id")
    .eq("user_id", params.userId)
    .eq("request_ref", requestRef)
    .maybeSingle();

  if (targetError) {
    logger.error("rewrite_winner_lookup_failed", targetError, {
      user_id: params.userId,
      request_ref: requestRef,
    });
    return { ok: false, error: "Unable to load rewrite version." };
  }

  if (!target || !target.experiment_group_id) {
    return { ok: false, error: "Rewrite version not found." };
  }

  const experimentGroupId = target.experiment_group_id as string;
  const { error: resetError } = await admin
    .from("rewrite_generations")
    .update({
      is_winner: false,
      winner_label: null,
      winner_marked_at: null,
    })
    .eq("user_id", params.userId)
    .eq("experiment_group_id", experimentGroupId)
    .eq("is_winner", true);

  if (resetError) {
    logger.error("rewrite_winner_reset_failed", resetError, {
      user_id: params.userId,
      request_ref: requestRef,
      experiment_group_id: experimentGroupId,
    });
    return { ok: false, error: "Unable to update winner state." };
  }

  const { error: setError } = await admin
    .from("rewrite_generations")
    .update({
      is_winner: true,
      winner_label: winnerLabel,
      winner_marked_at: winnerMarkedAt,
    })
    .eq("user_id", params.userId)
    .eq("request_ref", requestRef);

  if (setError) {
    logger.error("rewrite_winner_set_failed", setError, {
      user_id: params.userId,
      request_ref: requestRef,
      experiment_group_id: experimentGroupId,
    });
    return { ok: false, error: "Unable to mark rewrite winner." };
  }

  logger.info("rewrite_marked_winner", {
    user_id: params.userId,
    request_ref: requestRef,
    experiment_group_id: experimentGroupId,
    winner_label: winnerLabel,
  });
  void emitRewriteTelemetryEvent({
    userId: params.userId,
    requestId: randomUUID(),
    eventType: "rewrite_marked_winner",
    requestRef,
    experimentGroupId,
    route: "server_action:markWinner",
    metadata: {
      winner_label: winnerLabel,
    },
  });

  return {
    ok: true,
    requestRef,
    experimentGroupId,
    winnerLabel,
    winnerMarkedAt,
  };
}

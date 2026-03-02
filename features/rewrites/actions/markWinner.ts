"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth/server";
import { markRewriteWinnerForUser } from "@/features/rewrites/services/rewriteWinnerService";

const payloadSchema = z.object({
  requestRef: z.string().trim().min(3).max(128),
  winnerLabel: z.string().trim().max(120).optional(),
});

type MarkWinnerActionResult =
  | {
      error: null;
      requestRef: string;
      experimentGroupId: string;
      winnerLabel: string | null;
      winnerMarkedAt: string;
    }
  | { error: string };

export async function markWinnerAction(
  payload: z.infer<typeof payloadSchema>,
): Promise<MarkWinnerActionResult> {
  const parsed = payloadSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: "Invalid winner payload." };
  }

  const user = await requireUser();
  const result = await markRewriteWinnerForUser({
    userId: user.id,
    requestRef: parsed.data.requestRef,
    winnerLabel: parsed.data.winnerLabel,
  });

  if (!result.ok) {
    return { error: result.error };
  }

  return {
    error: null,
    requestRef: result.requestRef,
    experimentGroupId: result.experimentGroupId,
    winnerLabel: result.winnerLabel,
    winnerMarkedAt: result.winnerMarkedAt,
  };
}

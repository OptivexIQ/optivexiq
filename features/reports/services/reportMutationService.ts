import { createReportAndProcess } from "@/features/reports/services/reportCreateService";
import type { GapEngineRequestValues } from "@/features/conversion-gap/validators/gapEngineSchema";

export type SubmitReportMutationInput = {
  userId: string;
  payload: GapEngineRequestValues;
  idempotencyKey?: string;
};

export type SubmitReportMutationResult =
  | { ok: true; reportId: string; status: string }
  | { ok: false; status: number; error: string };

export async function submitReportMutation(
  input: SubmitReportMutationInput,
): Promise<SubmitReportMutationResult> {
  const { userId, payload, idempotencyKey } = input;
  const { homepage_url, pricing_url, competitor_urls, user_id } = payload;

  if (user_id && user_id !== userId) {
    return { ok: false, status: 403, error: "Forbidden." };
  }

  const result = await createReportAndProcess(userId, {
    homepage_url,
    pricing_url,
    competitor_urls,
    idempotencyKey: idempotencyKey || undefined,
  });

  if (!result.ok) {
    return { ok: false, status: result.status, error: result.error };
  }

  return { ok: true, reportId: result.reportId, status: result.status };
}

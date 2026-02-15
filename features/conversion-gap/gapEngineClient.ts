import { httpClient, isHttpError, type HttpError } from "@/lib/api/httpClient";
import { resolveData } from "@/lib/data/dataSource";

export type GapEngineRunPayload = {
  homepage_url: string;
  pricing_url?: string | null;
  competitor_urls?: string[] | null;
  user_id?: string | null;
};

export type GapEngineRunResponse = {
  reportId: string;
  status: "queued";
};

export async function runGapEngine(
  payload: GapEngineRunPayload,
): Promise<GapEngineRunResponse> {
  const idempotencyKey =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return resolveData(
    "gap-engine-run",
    () =>
      httpClient<GapEngineRunResponse>("/api/reports/create", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "idempotency-key": idempotencyKey,
        },
      }),
    () => ({ reportId: "rep_mock", status: "queued" }),
  );
}

export function isApiError(error: unknown): error is HttpError {
  return isHttpError(error);
}

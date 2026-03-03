import { httpClient, isHttpError, type HttpError } from "@/lib/api/httpClient";

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

function buildIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  throw new Error("Secure idempotency generation is unavailable in this environment.");
}

export async function runGapEngine(
  payload: GapEngineRunPayload,
): Promise<GapEngineRunResponse> {
  const idempotencyKey = buildIdempotencyKey();
  return httpClient<GapEngineRunResponse>("/api/reports/create", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      "idempotency-key": idempotencyKey,
    },
  });
}

export function isApiError(error: unknown): error is HttpError {
  return isHttpError(error);
}

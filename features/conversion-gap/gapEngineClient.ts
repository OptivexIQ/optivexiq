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

function fallbackUuidLike(): string {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
    return [
      hex.slice(0, 4).join(""),
      hex.slice(4, 6).join(""),
      hex.slice(6, 8).join(""),
      hex.slice(8, 10).join(""),
      hex.slice(10, 16).join(""),
    ].join("-");
  }

  return `req-${Date.now().toString(36)}-${performance.now().toString(36).replace(".", "")}`;
}

function buildIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return fallbackUuidLike();
}

export async function runGapEngine(
  payload: GapEngineRunPayload,
): Promise<GapEngineRunResponse> {
  const idempotencyKey = buildIdempotencyKey();

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

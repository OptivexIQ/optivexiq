import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "invalid_payload"
  | "forbidden"
  | "not_found"
  | "rate_limited"
  | "provider_unavailable"
  | "stream_failed"
  | "internal_error"
  | "conflict"
  | "unauthorized";

export type ApiErrorResponse = {
  error: {
    code: ApiErrorCode;
    message: string;
    requestId?: string;
    details?: Record<string, unknown>;
  };
};

type ErrorResponseOptions = {
  requestId?: string;
  details?: Record<string, unknown>;
  headers?: HeadersInit;
};

export function errorResponse(
  code: ApiErrorCode,
  message: string,
  status: number,
  options: ErrorResponseOptions = {},
) {
  const { requestId, details, headers } = options;

  return NextResponse.json(
    {
      error: {
        code,
        message,
        requestId,
        details,
      },
    } satisfies ApiErrorResponse,
    {
      status,
      headers,
    },
  );
}

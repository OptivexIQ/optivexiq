export type HttpError = {
  status: number;
  message: string;
  code?: string;
};

export function normalizeErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "error" in payload) {
    const errorPayload = (payload as { error?: unknown }).error;
    if (typeof errorPayload === "string" && errorPayload.trim().length > 0) {
      return errorPayload;
    }
    if (
      errorPayload &&
      typeof errorPayload === "object" &&
      "message" in errorPayload
    ) {
      const message = (errorPayload as { message?: unknown }).message;
      if (typeof message === "string" && message.trim().length > 0) {
        return message;
      }
    }

    return fallback;
  }

  if (typeof payload === "string" && payload.trim().length > 0) {
    return payload;
  }

  return fallback;
}

export function normalizeErrorCode(payload: unknown) {
  if (payload && typeof payload === "object" && "error" in payload) {
    const errorPayload = (payload as { error?: unknown }).error;
    if (
      errorPayload &&
      typeof errorPayload === "object" &&
      "code" in errorPayload
    ) {
      const code = (errorPayload as { code?: unknown }).code;
      return typeof code === "string" ? code : undefined;
    }
  }

  return undefined;
}

export function isHttpError(error: unknown): error is HttpError {
  if (!error || typeof error !== "object") {
    return false;
  }

  return "status" in error && "message" in error;
}

export async function httpClient<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");

  if (!response.ok) {
    const message = normalizeErrorMessage(
      payload,
      response.statusText || "Request failed",
    );
    const code = normalizeErrorCode(payload);
    throw { status: response.status, message, code } satisfies HttpError;
  }

  return payload as T;
}

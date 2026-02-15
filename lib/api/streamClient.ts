import {
  normalizeErrorCode,
  normalizeErrorMessage,
  type HttpError,
} from "@/lib/api/httpClient";

export async function streamClient(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (response.ok) {
    return response;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");
  const message = normalizeErrorMessage(
    payload,
    response.statusText || "Request failed",
  );
  const code = normalizeErrorCode(payload);

  throw { status: response.status, message, code } satisfies HttpError;
}

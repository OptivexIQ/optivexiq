import { httpClient, type HttpError } from "@/lib/api/httpClient";

export type ApiError = HttpError;

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  return httpClient<T>(path, options);
}

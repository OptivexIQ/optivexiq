import { httpClient } from "@/lib/api/httpClient";
import type { StatusPayload } from "@/features/status/types/status.types";

export async function getStatus(): Promise<StatusPayload> {
  return httpClient<StatusPayload>("/api/status");
}

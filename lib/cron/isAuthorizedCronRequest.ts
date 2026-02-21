import type { NextRequest } from "next/server";
import { CRON_SECRET, NODE_ENV } from "@/lib/env";

function getBearerToken(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const [scheme, token] = value.split(" ", 2);
  if (!scheme || !token) {
    return null;
  }
  if (scheme.toLowerCase() !== "bearer") {
    return null;
  }
  return token;
}

export function isAuthorizedCronRequest(request: NextRequest): boolean {
  if (!CRON_SECRET) {
    return NODE_ENV !== "production";
  }

  const viaHeader = request.headers.get("x-cron-secret");
  if (viaHeader && viaHeader === CRON_SECRET) {
    return true;
  }

  const bearer = getBearerToken(request.headers.get("authorization"));
  return Boolean(bearer && bearer === CRON_SECRET);
}

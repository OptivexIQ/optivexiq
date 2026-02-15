import { logger } from "@/lib/logger";

export function logSignInEvent(userId: string, email?: string | null) {
  logger.info("auth.sign_in", { userId, email });
}

export function logSignOutEvent(userId: string, email?: string | null) {
  logger.info("auth.sign_out", { userId, email });
}

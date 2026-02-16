import { logger } from "@/lib/logger";
import { attributeSnapshotConversionByEmail } from "@/features/free-snapshot/services/freeSnapshotRepository";

export async function attributeSnapshotToSignup(input: {
  userId: string;
  email: string | null | undefined;
}) {
  const email = (input.email ?? "").trim().toLowerCase();
  if (!email) {
    return;
  }

  const snapshotId = await attributeSnapshotConversionByEmail({
    userId: input.userId,
    email,
  });

  if (snapshotId) {
    logger.info("free_snapshot.signup_conversion_attributed", {
      snapshot_id: snapshotId,
      user_id: input.userId,
      email,
    });
  }
}

import { buildFreeSnapshotPdf } from "@/features/free-snapshot/services/freeSnapshotPdfService";
import { sendFreeSnapshotEmail } from "@/features/free-snapshot/services/freeSnapshotEmailService";
import {
  findRecentSnapshotByEmailAndWebsite,
  getFreeSnapshotById,
  markFreeSnapshotUnlocked,
} from "@/features/free-snapshot/services/freeSnapshotRepository";
import { freeConversionSnapshotSchema } from "@/features/free-snapshot/validators/freeSnapshotSchema";

export async function unlockFreeSnapshot(input: {
  snapshotId: string;
  email: string;
  consent: boolean;
}) {
  const current = await getFreeSnapshotById(input.snapshotId);
  if (!current) {
    return { ok: false as const, status: 404, error: "Snapshot not found." };
  }

  const deduped = await findRecentSnapshotByEmailAndWebsite({
    email: input.email,
    websiteUrl: current.website_url,
  });
  const source = deduped ?? current;

  if (source.status !== "completed") {
    return {
      ok: false as const,
      status: 409,
      error: "Snapshot is not completed yet.",
    };
  }

  const parsed = freeConversionSnapshotSchema.safeParse(source.snapshot_data);
  if (!parsed.success) {
    return { ok: false as const, status: 500, error: "Snapshot data is invalid." };
  }

  const pdf = buildFreeSnapshotPdf(parsed.data);
  const sent = await sendFreeSnapshotEmail({
    to: input.email,
    websiteUrl: source.website_url,
    snapshotId: source.id,
    pdf,
  });
  if (!sent.ok) {
    return { ok: false as const, status: 502, error: "Failed to send snapshot email." };
  }

  const marked = await markFreeSnapshotUnlocked({
    snapshotId: source.id,
    email: input.email,
    consent: input.consent,
  });
  if (!marked) {
    return { ok: false as const, status: 500, error: "Failed to persist unlock state." };
  }

  return {
    ok: true as const,
    pdf,
    filename: `optivexiq-free-snapshot-${source.id}.pdf`,
    snapshotId: source.id,
  };
}

import { Resend } from "resend";
import { FROM_EMAIL, RESEND_API_KEY } from "@/lib/env";
import { logger } from "@/lib/logger";

type SendSnapshotEmailParams = {
  to: string;
  websiteUrl: string;
  snapshotId: string;
  pdf: Buffer;
};

export async function sendFreeSnapshotEmail(params: SendSnapshotEmailParams) {
  if (!RESEND_API_KEY) {
    logger.error("Free snapshot email send failed: missing RESEND_API_KEY.");
    return { ok: false as const, error: "email_provider_unavailable" };
  }

  const resend = new Resend(RESEND_API_KEY);
  const subject = `Your Free Conversion Snapshot for ${params.websiteUrl}`;
  const html = [
    "<p>Your free conversion snapshot is attached as a PDF.</p>",
    "<p>This snapshot was generated using live AI analysis of your website.</p>",
    "<p><strong>Next step:</strong> Upgrade to unlock the full Conversion Gap Report.</p>",
  ].join("");

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [params.to],
      subject,
      html,
      attachments: [
        {
          filename: `optivexiq-free-snapshot-${params.snapshotId}.pdf`,
          content: params.pdf.toString("base64"),
        },
      ],
    });
  } catch (error) {
    logger.error("Free snapshot email send failed.", error, {
      snapshot_id: params.snapshotId,
      to: params.to,
    });
    return { ok: false as const, error: "email_send_failed" };
  }

  logger.info("Free snapshot email sent.", {
    snapshot_id: params.snapshotId,
    to: params.to,
  });
  return { ok: true as const };
}

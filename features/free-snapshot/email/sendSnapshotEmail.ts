import { Resend } from "resend";
import { FROM_EMAIL, RESEND_API_KEY } from "@/lib/env";
import { logger } from "@/lib/logger";

type SendSnapshotEmailParams = {
  email: string;
  pdfBuffer: Buffer;
  website: string;
  snapshotId: string;
};

export async function sendSnapshotEmail(
  params: SendSnapshotEmailParams,
): Promise<void> {
  if (!RESEND_API_KEY) {
    throw new Error("free_snapshot_email_provider_unavailable");
  }

  const resend = new Resend(RESEND_API_KEY);
  const subject = `Your OptivexIQ Free Conversion Audit: ${params.website}`;
  const html = `
    <div style="font-family: Inter, Arial, sans-serif; line-height: 1.5; color: #0f172a;">
      <h2 style="margin: 0 0 12px; color: #0f172a;">Your Free Conversion Audit is Ready</h2>
      <p style="margin: 0 0 12px;">
        Attached is your OptivexIQ audit generated from live AI analysis of your website.
      </p>
      <p style="margin: 0 0 12px;">
        Website analyzed: <strong>${params.website}</strong>
      </p>
      <div style="margin: 16px 0; padding: 12px 14px; background: #0f172a; color: #ffffff; border-radius: 8px;">
        Upgrade to unlock the full Conversion Gap Report with deep diagnostics, rewrite recommendations, and executive export packs.
      </div>
      <p style="margin: 0; font-size: 12px; color: #64748b;">Snapshot ID: ${params.snapshotId}</p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [params.email],
      subject,
      html,
      attachments: [
        {
          filename: "OptivexIQ-Snapshot.pdf",
          content: params.pdfBuffer.toString("base64"),
        },
      ],
    });
    logger.info("free_snapshot.email_sent", {
      snapshot_id: params.snapshotId,
      email: params.email,
    });
  } catch (error) {
    logger.error("free_snapshot.email_failed", error, {
      snapshot_id: params.snapshotId,
      email: params.email,
    });
    throw error;
  }
}

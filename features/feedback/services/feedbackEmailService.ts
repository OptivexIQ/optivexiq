import { Resend } from "resend";
import { ADMIN_EMAIL, FROM_EMAIL, RESEND_API_KEY } from "@/lib/env";
import { logger } from "@/lib/logger";

type SendFeedbackEmailsParams = {
  requestType: "feature" | "bug";
  title: string;
  summary: string;
  productArea: string;
  impact: string;
  email: string;
  referenceId: string;
};

export async function sendFeedbackEmails(params: SendFeedbackEmailsParams) {
  if (!RESEND_API_KEY) {
    logger.warn("Feedback email notifications skipped: missing RESEND_API_KEY.");
    return;
  }

  const resend = new Resend(RESEND_API_KEY);
  const requestTypeLabel =
    params.requestType === "bug" ? "Bug Report" : "Feature Request";

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [params.email],
      subject: `${requestTypeLabel} received [${params.referenceId}]`,
      html: [
        `<p>We received your ${requestTypeLabel.toLowerCase()}.</p>`,
        `<p><strong>Reference:</strong> ${params.referenceId}</p>`,
        `<p><strong>Title:</strong> ${params.title}</p>`,
        "<p>We will review it during product triage and follow up if more details are required.</p>",
      ].join(""),
    });
  } catch (error) {
    logger.error("Feedback confirmation email failed.", error, {
      reference_id: params.referenceId,
      to: params.email,
    });
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [ADMIN_EMAIL],
      subject: `[Feedback] ${requestTypeLabel}: ${params.title}`,
      html: [
        `<p><strong>Reference:</strong> ${params.referenceId}</p>`,
        `<p><strong>Type:</strong> ${requestTypeLabel}</p>`,
        `<p><strong>Area:</strong> ${params.productArea}</p>`,
        `<p><strong>Impact:</strong> ${params.impact}</p>`,
        `<p><strong>Requester:</strong> ${params.email}</p>`,
        `<p><strong>Summary:</strong><br/>${params.summary}</p>`,
      ].join(""),
    });
  } catch (error) {
    logger.error("Feedback admin notification email failed.", error, {
      reference_id: params.referenceId,
      to: ADMIN_EMAIL,
    });
  }
}

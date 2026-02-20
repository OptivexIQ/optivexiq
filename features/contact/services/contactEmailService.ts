import { Resend } from "resend";
import { ADMIN_EMAIL, FROM_EMAIL, RESEND_API_KEY } from "@/lib/env";
import { logger } from "@/lib/logger";
import { CONTACT_TOPICS, type ContactTopicValue } from "@/features/contact/constants/contactTopics";

type SendContactEmailsParams = {
  requestId: string;
  name: string;
  email: string;
  topic: ContactTopicValue;
  company: string;
  message: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function resolveTopicLabel(topic: ContactTopicValue): string {
  const match = CONTACT_TOPICS.find((item) => item.value === topic);
  return match?.label ?? "General Inquiry";
}

export async function sendContactEmails(params: SendContactEmailsParams) {
  if (!RESEND_API_KEY) {
    logger.error("Contact email delivery skipped: missing RESEND_API_KEY.");
    return { ok: false as const };
  }

  const resend = new Resend(RESEND_API_KEY);
  const topicLabel = resolveTopicLabel(params.topic);
  const safeName = escapeHtml(params.name);
  const safeEmail = escapeHtml(params.email);
  const safeCompany = escapeHtml(params.company);
  const safeMessage = escapeHtml(params.message).replaceAll("\n", "<br/>");

  let confirmationOk = false;
  let adminOk = false;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [params.email],
      subject: `We received your inquiry [${params.requestId}]`,
      html: [
        `<p>Hi ${safeName},</p>`,
        "<p>Thanks for contacting OptivexIQ. We have received your inquiry and routed it to the right team.</p>",
        `<p><strong>Reference:</strong> ${params.requestId}</p>`,
        `<p><strong>Topic:</strong> ${topicLabel}</p>`,
        "<p>We will follow up by email as soon as possible.</p>",
      ].join(""),
    });
    confirmationOk = true;
  } catch (error) {
    logger.error("Contact confirmation email failed.", error, {
      request_id: params.requestId,
      to: params.email,
    });
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [ADMIN_EMAIL],
      subject: `[Contact] ${topicLabel} - ${params.name}`,
      html: [
        `<p><strong>Reference:</strong> ${params.requestId}</p>`,
        `<p><strong>Name:</strong> ${safeName}</p>`,
        `<p><strong>Email:</strong> ${safeEmail}</p>`,
        `<p><strong>Topic:</strong> ${topicLabel}</p>`,
        `<p><strong>Company:</strong> ${safeCompany || "Not provided"}</p>`,
        `<p><strong>Message:</strong><br/>${safeMessage}</p>`,
      ].join(""),
    });
    adminOk = true;
  } catch (error) {
    logger.error("Contact admin notification email failed.", error, {
      request_id: params.requestId,
      to: ADMIN_EMAIL,
    });
  }

  return { ok: confirmationOk && adminOk };
}

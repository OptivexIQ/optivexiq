"use server";

import { headers } from "next/headers";
import { logger } from "@/lib/logger";
import { createSupabaseServerClient } from "@/services/supabase/server";
import {
  contactRequestSchema,
  type ContactRequestInput,
} from "@/features/contact/validators/contactRequestSchema";
import { saveContactRequest } from "@/features/contact/services/contactRequestService";
import { sendContactEmails } from "@/features/contact/services/contactEmailService";

export type ContactActionState = {
  success: boolean;
  error: string | null;
};

const CONTACT_RATE_LIMIT_MAX = 5;
const CONTACT_RATE_LIMIT_WINDOW_SECONDS = 3600;

function extractClientIp(rawForwardedFor: string | null): string {
  if (!rawForwardedFor) {
    return "unknown";
  }

  const [first] = rawForwardedFor.split(",");
  return first?.trim() || "unknown";
}

async function consumeContactRateLimit(ipAddress: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("consume_request_rate_limit", {
    p_rate_key: `contact:${ipAddress}`,
    p_window_seconds: CONTACT_RATE_LIMIT_WINDOW_SECONDS,
    p_max_requests: CONTACT_RATE_LIMIT_MAX,
  });

  if (error) {
    logger.error("Contact request rate limit failed.", error, { ipAddress });
    return false;
  }

  const row = Array.isArray(data) ? data[0] : data;
  return Boolean(row?.allowed);
}

export async function submitContactAction(
  _previousState: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  const payload: ContactRequestInput = {
    name: String(formData.get("name") || ""),
    email: String(formData.get("email") || ""),
    topic: String(formData.get("topic") || "other") as ContactRequestInput["topic"],
    company: String(formData.get("company") || ""),
    message: String(formData.get("message") || ""),
    intent:
      String(formData.get("intent") || "").trim().toLowerCase() === "growth"
        ? "growth"
        : undefined,
    honeypot: String(formData.get("website") || ""),
  };

  const parsed = contactRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: "Please review the form fields and try again." };
  }

  if (parsed.data.honeypot.trim().length > 0) {
    return { success: true, error: null };
  }

  const requestHeaders = await headers();
  const ipAddress = extractClientIp(requestHeaders.get("x-forwarded-for"));
  const userAgent = requestHeaders.get("user-agent") || "unknown";

  const allowed = await consumeContactRateLimit(ipAddress);
  if (!allowed) {
    return {
      success: false,
      error: "Too many requests. Please wait and try again in about an hour.",
    };
  }

  const result = await saveContactRequest({
    payload: parsed.data,
    ipAddress,
    userAgent,
  });

  if (!result.ok) {
    logger.error("Failed to save contact request.", undefined, {
      email: parsed.data.email,
      topic: parsed.data.topic,
    });
    return { success: false, error: "Unable to submit your request right now." };
  }

  const emailResult = await sendContactEmails({
    requestId: result.requestId,
    name: parsed.data.name,
    email: parsed.data.email,
    topic: parsed.data.topic,
    company: parsed.data.company ?? "",
    message: parsed.data.message,
  });
  if (!emailResult.ok) {
    logger.error("Contact emails failed after request persistence.", undefined, {
      request_id: result.requestId,
      email: parsed.data.email,
      topic: parsed.data.topic,
    });
    return {
      success: false,
      error:
        "Your request was received, but we could not send email notifications right now. Please contact support@optivexiq.com.",
    };
  }

  return { success: true, error: null };
}

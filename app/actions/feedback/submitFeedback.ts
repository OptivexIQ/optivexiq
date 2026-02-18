"use server";

import { headers } from "next/headers";
import { logger } from "@/lib/logger";
import { createSupabaseServerClient } from "@/services/supabase/server";
import { requireUser } from "@/lib/auth/server";
import {
  feedbackSubmissionSchema,
  type FeedbackSubmissionInput,
} from "@/features/feedback/validators/feedbackSubmissionSchema";
import {
  findDuplicateFeedbackSubmission,
  saveFeedbackSubmission,
} from "@/features/feedback/services/feedbackSubmissionService";
import { sendFeedbackEmails } from "@/features/feedback/services/feedbackEmailService";

export type FeedbackActionState = {
  success: boolean;
  error: string | null;
  referenceId: string | null;
  duplicate: boolean;
};

const FEEDBACK_RATE_LIMIT_MAX = 8;
const FEEDBACK_RATE_LIMIT_WINDOW_SECONDS = 3600;

function extractClientIp(rawForwardedFor: string | null): string {
  if (!rawForwardedFor) {
    return "unknown";
  }

  const [first] = rawForwardedFor.split(",");
  return first?.trim() || "unknown";
}

async function consumeFeedbackRateLimit(ipAddress: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("consume_request_rate_limit", {
    p_rate_key: `feedback:${ipAddress}`,
    p_window_seconds: FEEDBACK_RATE_LIMIT_WINDOW_SECONDS,
    p_max_requests: FEEDBACK_RATE_LIMIT_MAX,
  });

  if (error) {
    logger.error("Feedback rate limit failed.", error, { ipAddress });
    return false;
  }

  const row = Array.isArray(data) ? data[0] : data;
  return Boolean(row?.allowed);
}

export async function submitFeedbackAction(
  _previousState: FeedbackActionState,
  formData: FormData,
): Promise<FeedbackActionState> {
  const user = await requireUser();

  const payload: FeedbackSubmissionInput = {
    requestType: String(formData.get("requestType") || "feature") as FeedbackSubmissionInput["requestType"],
    title: String(formData.get("title") || ""),
    summary: String(formData.get("summary") || ""),
    productArea: String(formData.get("productArea") || "other") as FeedbackSubmissionInput["productArea"],
    impact: String(formData.get("impact") || "medium") as FeedbackSubmissionInput["impact"],
    pageUrl: String(formData.get("pageUrl") || ""),
    reproductionSteps: String(formData.get("reproductionSteps") || ""),
    expectedBehavior: String(formData.get("expectedBehavior") || ""),
    actualBehavior: String(formData.get("actualBehavior") || ""),
    name: String(formData.get("name") || ""),
    email: String(formData.get("email") || ""),
    company: String(formData.get("company") || ""),
    honeypot: String(formData.get("website") || ""),
  };

  const parsed = feedbackSubmissionSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please review the form fields and try again.",
      referenceId: null,
      duplicate: false,
    };
  }

  if (parsed.data.honeypot.trim().length > 0) {
    return { success: true, error: null, referenceId: null, duplicate: false };
  }

  const requestHeaders = await headers();
  const ipAddress = extractClientIp(requestHeaders.get("x-forwarded-for"));
  const userAgent = requestHeaders.get("user-agent") || "unknown";

  const allowed = await consumeFeedbackRateLimit(ipAddress);
  if (!allowed) {
    return {
      success: false,
      error: "Too many requests. Please wait and submit again later.",
      referenceId: null,
      duplicate: false,
    };
  }

  const duplicate = await findDuplicateFeedbackSubmission({
    userId: user.id,
    email: parsed.data.email,
    requestType: parsed.data.requestType,
    title: parsed.data.title,
  });
  if (duplicate) {
    return {
      success: true,
      error: null,
      referenceId: duplicate.referenceId,
      duplicate: true,
    };
  }

  const result = await saveFeedbackSubmission({
    payload: parsed.data,
    userId: user.id,
    ipAddress,
    userAgent,
  });

  if (!result.ok) {
    logger.error("Failed to save feedback submission.", undefined, {
      request_type: parsed.data.requestType,
      product_area: parsed.data.productArea,
      email: parsed.data.email,
      db_error: result.detail,
      db_code: result.code,
    });
    return {
      success: false,
      error: "Unable to submit your request right now.",
      referenceId: null,
      duplicate: false,
    };
  }

  await sendFeedbackEmails({
    requestType: parsed.data.requestType,
    title: parsed.data.title,
    summary: parsed.data.summary,
    productArea: parsed.data.productArea,
    impact: parsed.data.impact,
    email: parsed.data.email,
    referenceId: result.requestRef,
  });

  logger.info("Product feedback submitted.", {
    reference_id: result.requestRef,
    request_type: parsed.data.requestType,
    product_area: parsed.data.productArea,
    impact: parsed.data.impact,
  });

  return {
    success: true,
    error: null,
    referenceId: result.requestRef,
    duplicate: false,
  };
}

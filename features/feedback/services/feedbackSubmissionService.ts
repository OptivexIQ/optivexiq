import { createSupabaseServerClient } from "@/services/supabase/server";
import type { FeedbackSubmissionInput } from "@/features/feedback/validators/feedbackSubmissionSchema";
import { logger } from "@/lib/logger";
import { generateRequestId } from "@/features/feedback/utils/generateRequestId";

type SaveFeedbackSubmissionParams = {
  payload: FeedbackSubmissionInput;
  userId: string;
  ipAddress: string;
  userAgent: string;
};

type SaveFeedbackSubmissionResult =
  | { ok: true; id: string; requestRef: string }
  | { ok: false; error: string; detail?: string; code?: string };

type ExistingFeedbackReference = {
  referenceId: string;
};

type FindDuplicateFeedbackParams = {
  email: string;
  requestType: "feature" | "bug";
  title: string;
};

const DUPLICATE_LOOKBACK_HOURS = 24;

export async function findDuplicateFeedbackSubmission({
  userId,
  email,
  requestType,
  title,
}: FindDuplicateFeedbackParams & { userId: string }): Promise<ExistingFeedbackReference | null> {
  const supabase = await createSupabaseServerClient();
  const lookback = new Date(
    Date.now() - DUPLICATE_LOOKBACK_HOURS * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await supabase
    .from("product_feedback")
    .select("id, request_ref")
    .eq("user_id", userId)
    .eq("email", email)
    .eq("request_type", requestType)
    .eq("title", title)
    .gte("created_at", lookback)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.warn("Duplicate feedback lookup failed.", {
      user_id: userId,
      email,
      request_type: requestType,
      title,
      db_error: error.message,
      db_code: error.code,
    });
    return null;
  }

  if (!data) {
    return null;
  }

  const fallbackId = String(data.id);
  const requestRef = String(data.request_ref || fallbackId);
  return { referenceId: requestRef };
}

export async function saveFeedbackSubmission({
  payload,
  userId,
  ipAddress,
  userAgent,
}: SaveFeedbackSubmissionParams): Promise<SaveFeedbackSubmissionResult> {
  const supabase = await createSupabaseServerClient();
  const feedbackId = crypto.randomUUID();
  const requestPrefix = payload.requestType === "bug" ? "BR" : "FR";
  const requestRef = generateRequestId(requestPrefix);
  const { error } = await supabase
    .from("product_feedback")
    .insert({
      id: feedbackId,
      request_ref: requestRef,
      user_id: userId,
      request_type: payload.requestType,
      title: payload.title,
      summary: payload.summary,
      product_area: payload.productArea,
      impact: payload.impact,
      page_url: payload.pageUrl || null,
      reproduction_steps: payload.reproductionSteps || null,
      expected_behavior: payload.expectedBehavior || null,
      actual_behavior: payload.actualBehavior || null,
      name: payload.name || null,
      email: payload.email,
      company: payload.company || null,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      status: "new",
    });

  if (error) {
    return {
      ok: false,
      error: "Unable to submit feedback.",
      detail: error?.message,
      code: error?.code,
    };
  }

  return { ok: true, id: feedbackId, requestRef };
}

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/server";
import { getProfile } from "@/features/saas-profile/services/profileService";
import { isProfileComplete } from "@/features/saas-profile/validators/profileSchema";
import { PLAN_LABELS } from "@/lib/constants/plans";
import { getSubscription } from "@/features/billing/services/planValidationService";
import { RewriteStudioView } from "@/features/rewrites/components/RewriteStudioView";
import type { RewriteGenerateRequest } from "@/features/rewrites/types/rewrites.types";
import {
  getRewriteHistoryByRequestRefForUser,
  listRewriteHistoryForUser,
} from "@/features/rewrites/services/rewriteHistoryReadService";

type RewritesPageProps = {
  searchParams?:
    | {
        rewriteType?: string;
        websiteUrl?: string;
        objection?: string;
        impact?: string;
        strategy?: string;
        theme?: string;
        rationale?: string;
        expectedImpact?: string;
        implementationDifficulty?: string;
        reportId?: string;
        requestRef?: string;
      }
    | Promise<{
        rewriteType?: string;
        websiteUrl?: string;
        objection?: string;
        impact?: string;
        strategy?: string;
        theme?: string;
        rationale?: string;
        expectedImpact?: string;
        implementationDifficulty?: string;
        reportId?: string;
        requestRef?: string;
      }>;
};

function sanitizeQueryValue(value: string | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function extractUserNotesFromHistoryNotes(notes: string | null | undefined) {
  const safe = notes ?? "";
  const marker = "\n\nUser notes:\n";
  const markerIndex = safe.indexOf(marker);
  if (markerIndex >= 0) {
    return safe.slice(markerIndex + marker.length).trim();
  }
  return safe.trim();
}

function resolvePrefillRequest(
  value: Awaited<RewritesPageProps["searchParams"]>,
): Partial<RewriteGenerateRequest> {
  const rewriteType =
    value?.rewriteType === "pricing" || value?.rewriteType === "homepage"
      ? value.rewriteType
      : "homepage";

  const websiteUrl = sanitizeQueryValue(value?.websiteUrl);
  const objection = sanitizeQueryValue(value?.objection);
  const impact = sanitizeQueryValue(value?.impact);
  const strategy = sanitizeQueryValue(value?.strategy);
  const theme = sanitizeQueryValue(value?.theme);
  const rationale = sanitizeQueryValue(value?.rationale);
  const expectedImpact = sanitizeQueryValue(value?.expectedImpact);
  const implementationDifficulty = sanitizeQueryValue(
    value?.implementationDifficulty,
  );
  const reportId = sanitizeQueryValue(value?.reportId);

  const noteSections = [
    objection ? `Address objection: ${objection}` : null,
    impact ? `Impact context: ${impact}` : null,
    strategy ? `Recommended strategy: ${strategy}` : null,
    theme ? `Positioning theme: ${theme}` : null,
    rationale ? `Rationale: ${rationale}` : null,
    expectedImpact ? `Expected impact: ${expectedImpact}` : null,
    implementationDifficulty
      ? `Implementation difficulty: ${implementationDifficulty}`
      : null,
    reportId ? `Source report: ${reportId}` : null,
  ].filter((item): item is string => Boolean(item));

  return {
    rewriteType,
    ...(websiteUrl ? { websiteUrl } : {}),
    ...(noteSections.length > 0 ? { notes: noteSections.join("\n\n") } : {}),
  };
}

export default async function RewritesPage({ searchParams }: RewritesPageProps) {
  const user = await requireUser();
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const profileResult = await getProfile();

  if (!profileResult.ok) {
    return (
      <div className="flex w-full flex-col gap-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Rewrite Studio
          </p>
          <h1 className="text-2xl font-semibold text-foreground">
            Rewrite Studio unavailable
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {profileResult.error}
          </p>
        </div>
      </div>
    );
  }

  if (!isProfileComplete(profileResult.data)) {
    redirect("/dashboard/onboarding");
  }

  const subscription = await getSubscription(user.id);
  const planLabel = subscription?.plan
    ? `${PLAN_LABELS[subscription.plan]} plan`
    : "No subscription";

  const requestRef = sanitizeQueryValue(resolvedSearchParams?.requestRef);
  const rewriteHistory = await listRewriteHistoryForUser(user.id, 20);
  const historyRecord = requestRef
    ? await getRewriteHistoryByRequestRefForUser(user.id, requestRef)
    : null;
  const historyUserNotes = extractUserNotesFromHistoryNotes(historyRecord?.notes);
  const initialStudioContext = historyRecord
    ? (() => {
        const parsed = historyRecord.strategyContext;
        const profileIcp = profileResult.data.icpRole.trim().toLowerCase();
        const parsedIcp = parsed.icp.trim().toLowerCase();
        const useCustomIcp =
          parsedIcp.length > 0 && profileIcp.length > 0
            ? parsedIcp !== profileIcp
            : parsedIcp.length > 0;

        return {
          useCustomIcp,
          customIcp: useCustomIcp ? parsed.icp : "",
          goal: parsed.goal,
          differentiationFocus: parsed.focus.differentiation,
          objectionFocus: parsed.focus.objection,
        } as const;
      })()
    : undefined;
  const resolvedDefaultRewriteRequest: Partial<RewriteGenerateRequest> =
    historyRecord
      ? {
          rewriteType: historyRecord.rewriteType,
          websiteUrl: historyRecord.websiteUrl ?? profileResult.data.websiteUrl,
          content: historyRecord.sourceContent ?? "",
          notes: historyUserNotes,
        }
      : resolvePrefillRequest(resolvedSearchParams);

  return (
    <div className="flex w-full flex-col gap-6">
      <RewriteStudioView
        initialData={{
          defaultWebsiteUrl: profileResult.data.websiteUrl,
          planLabel,
          profileIcpRole: profileResult.data.icpRole,
          defaultRewriteRequest: resolvedDefaultRewriteRequest,
          initialOutputMarkdown: historyRecord?.outputMarkdown ?? "",
          initialRequestRef: historyRecord?.requestRef ?? null,
          initialStudioContext,
          historyVersions: rewriteHistory.map((item) => {
            const strategy = item.strategyContext;
            return {
              requestRef: item.requestRef,
              isControl: item.isControl,
              controlRequestRef: item.controlRequestRef,
              experimentGroupId: item.experimentGroupId ?? undefined,
              parentRequestRef: item.parentRequestRef ?? undefined,
              versionNumber: item.versionNumber,
              isWinner: item.isWinner,
              winnerLabel: item.winnerLabel ?? undefined,
              winnerMarkedAt: item.winnerMarkedAt ?? undefined,
              rewriteType: item.rewriteType,
              createdAt: item.createdAt,
              outputMarkdown: item.outputMarkdown,
              websiteUrl: item.websiteUrl,
              sourceContent: item.sourceContent,
              userNotes: extractUserNotesFromHistoryNotes(item.notes),
              strategicContext: {
                goal: strategy.goal,
                icp: strategy.icp,
                differentiationFocus: strategy.focus.differentiation,
                objectionFocus: strategy.focus.objection,
              },
              tone: strategy.tone || undefined,
              length: strategy.length || undefined,
              emphasis: strategy.emphasis,
              constraints: strategy.constraints || undefined,
              audience: strategy.audience || undefined,
              idempotencyKey: item.idempotencyKey,
              hypothesis: item.hypothesis,
              promptVersion: item.promptVersion,
              systemTemplateVersion: item.systemTemplateVersion,
              modelTemperature: item.modelTemperature,
              deltaMetrics: item.deltaMetrics,
              strategyContext: {
                target: strategy.target,
                goal: strategy.goal,
                icp: strategy.icp,
                tone: strategy.tone as
                  | "neutral"
                  | "confident"
                  | "technical"
                  | "direct"
                  | "founder-led"
                  | "enterprise",
                length: strategy.length as "short" | "standard" | "long",
                emphasis: strategy.emphasis as (
                  | "clarity"
                  | "differentiation"
                  | "objection-handling"
                  | "pricing-clarity"
                  | "proof-credibility"
                )[],
                constraints: strategy.constraints,
                audience: strategy.audience,
                focus: strategy.focus,
                schemaVersion: strategy.schemaVersion,
              },
            };
          }),
        }}
      />
    </div>
  );
}

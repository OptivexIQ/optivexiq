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

function parseStudioContextFromNotes(notes: string | null | undefined) {
  const safe = notes ?? "";
  const parseMatch = (pattern: RegExp) => {
    const match = safe.match(pattern);
    return match?.[1]?.trim() ?? "";
  };
  const rawIcpLabel = parseMatch(/- ICP:\s*(.+)/i);
  const icpLabel = rawIcpLabel.toLowerCase();
  const goalLabel = parseMatch(/- Goal:\s*(.+)/i).toLowerCase();
  const differentiationLabel = parseMatch(
    /- Differentiation focus:\s*(.+)/i,
  ).toLowerCase();
  const objectionLabel = parseMatch(/- Objection focus:\s*(.+)/i).toLowerCase();

  return {
    icpLabel: rawIcpLabel,
    goal:
      goalLabel === "clarity"
        ? "clarity"
        : goalLabel === "differentiation"
          ? "differentiation"
          : "conversion",
    differentiationFocus: differentiationLabel !== "off",
    objectionFocus: objectionLabel === "on",
  } as const;
}

function parseStrategyFromNotes(notes: string | null | undefined) {
  const safe = notes ?? "";
  const parseMatch = (pattern: RegExp) => {
    const match = safe.match(pattern);
    return match?.[1]?.trim() ?? "";
  };
  const tone = parseMatch(/- Tone:\s*(.+)/i);
  const length = parseMatch(/- Length:\s*(.+)/i);
  const emphasisRaw = parseMatch(/- Emphasis:\s*(.+)/i);
  const emphasis =
    emphasisRaw.length > 0 && emphasisRaw.toLowerCase() !== "none"
      ? emphasisRaw.split(",").map((item) => item.trim()).filter(Boolean)
      : [];

  return { tone, length, emphasis };
}

function extractUserNotesFromHistoryNotes(notes: string | null | undefined) {
  const safe = notes ?? "";
  const marker = "\n\nUser notes:\n";
  const markerIndex = safe.indexOf(marker);
  return markerIndex >= 0
    ? safe.slice(markerIndex + marker.length).trim()
    : safe.trim();
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
        const parsed = parseStudioContextFromNotes(historyRecord.notes);
        const profileIcp = profileResult.data.icpRole.trim().toLowerCase();
        const parsedIcp = parsed.icpLabel.trim().toLowerCase();
        const useCustomIcp =
          parsedIcp.length > 0 && profileIcp.length > 0
            ? parsedIcp !== profileIcp
            : parsedIcp.length > 0;

        return {
          useCustomIcp,
          customIcp: useCustomIcp ? parsed.icpLabel : "",
          goal: parsed.goal,
          differentiationFocus: parsed.differentiationFocus,
          objectionFocus: parsed.objectionFocus,
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
            const strategy = parseStrategyFromNotes(item.notes);
            const context = parseStudioContextFromNotes(item.notes);
            return {
              requestRef: item.requestRef,
              rewriteType: item.rewriteType,
              createdAt: item.createdAt,
              outputMarkdown: item.outputMarkdown,
              websiteUrl: item.websiteUrl,
              sourceContent: item.sourceContent,
              userNotes: extractUserNotesFromHistoryNotes(item.notes),
              strategicContext: {
                goal: context.goal,
                icp: context.icpLabel,
                differentiationFocus: context.differentiationFocus,
                objectionFocus: context.objectionFocus,
              },
              tone: strategy.tone || undefined,
              length: strategy.length || undefined,
              emphasis: strategy.emphasis,
            };
          }),
        }}
      />
    </div>
  );
}

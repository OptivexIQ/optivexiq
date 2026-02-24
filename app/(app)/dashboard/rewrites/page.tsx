import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/server";
import { getProfile } from "@/features/saas-profile/services/profileService";
import { isProfileComplete } from "@/features/saas-profile/validators/profileSchema";
import { PLAN_LABELS } from "@/lib/constants/plans";
import { getSubscription } from "@/features/billing/services/planValidationService";
import { RewriteStudioView } from "@/features/rewrites/components/RewriteStudioView";
import type { RewriteGenerateRequest } from "@/features/rewrites/types/rewrites.types";

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
      }>;
};

function sanitizeQueryValue(value: string | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
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

  return (
    <div className="flex w-full flex-col gap-6">
      <RewriteStudioView
        initialData={{
          defaultWebsiteUrl: profileResult.data.websiteUrl,
          planLabel,
          defaultRewriteRequest: resolvePrefillRequest(resolvedSearchParams),
        }}
      />

      <div className="rounded-xl border border-border/60 bg-card p-6">
        <p className="text-sm text-foreground">
          Need the full audit workflow with score diagnostics and competitor
          benchmarking?
        </p>
        <div className="mt-4">
          <Button asChild variant="outline">
            <Link href="/dashboard/gap-engine">Run Gap Engine (Full report)</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

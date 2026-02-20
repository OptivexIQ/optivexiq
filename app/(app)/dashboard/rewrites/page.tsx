import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/server";
import { getProfile } from "@/features/saas-profile/services/profileService";
import { isProfileComplete } from "@/features/saas-profile/validators/profileSchema";
import { PLAN_LABELS } from "@/lib/constants/plans";
import { getSubscription } from "@/features/billing/services/planValidationService";
import { RewriteStudioView } from "@/features/rewrites/components/RewriteStudioView";

export default async function RewritesPage() {
  const user = await requireUser();
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

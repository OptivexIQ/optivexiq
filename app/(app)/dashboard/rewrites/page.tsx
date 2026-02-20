import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/server";
import { getProfile } from "@/features/saas-profile/services/profileService";
import { isProfileComplete } from "@/features/saas-profile/validators/profileSchema";

export default async function RewritesPage() {
  await requireUser();
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

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Rewrite Studio
        </p>
        <h1 className="text-2xl font-semibold text-foreground">
          Homepage and pricing rewrites
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          This route is now the dedicated rewrite entry point. Full rewrite
          generation UI is implemented next.
        </p>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-6">
        <p className="text-sm text-foreground">
          Need the full audit workflow with report scoring and diagnostics?
        </p>
        <div className="mt-4">
          <Button asChild variant="secondary">
            <Link href="/dashboard/gap-engine">Run Gap Engine</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, X } from "lucide-react";
import { requireUser } from "@/lib/auth/server";
import { getProfile } from "@/features/saas-profile/services/profileService";
import { isProfileComplete } from "@/features/saas-profile/validators/profileSchema";
import { ProfileView } from "@/features/saas-profile/components/ProfileView";
import { getUserSettings } from "@/features/settings/services/userSettingsService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type ProfilePageProps = {
  searchParams?: Promise<{ updated?: string | string[] }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const user = await requireUser();
  const profileResult = await getProfile();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const updatedFlag = resolvedSearchParams?.updated;
  const showUpdatedBanner = Array.isArray(updatedFlag)
    ? updatedFlag.includes("1")
    : updatedFlag === "1";

  if (!profileResult.ok) {
    return (
      <div className="flex w-full flex-col gap-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            SaaS profile
          </p>
          <h1 className="text-2xl font-semibold text-foreground">
            Profile unavailable
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {profileResult.error}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-6">
          <p className="text-sm text-muted-foreground">
            Refresh the page or contact support if the issue persists.
          </p>
        </div>
      </div>
    );
  }

  const profile = profileResult.data;

  if (!isProfileComplete(profile)) {
    redirect("/dashboard/onboarding");
  }
  const settingsResult = await getUserSettings(user.id);
  const currency = settingsResult.ok ? settingsResult.settings.currency : "USD";

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Configuration
        </p>
        <h1 className="text-2xl font-semibold text-foreground">SaaS Profile</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Your ICP, pricing model, and competitive positioning power every
          conversion analysis. Keep this data accurate to ensure OptivexIQ
          prioritizes the signals that drive revenue.
        </p>
      </div>

      {showUpdatedBanner ? (
        <Alert className="border-emerald-500/30 bg-emerald-500/8">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <AlertTitle>Profile updated</AlertTitle>
              <AlertDescription>
                Your profile changes were saved successfully.
              </AlertDescription>
            </div>
            <Link
              href="/dashboard/profile"
              aria-label="Dismiss success message"
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Link>
          </div>
        </Alert>
      ) : null}

      <ProfileView profile={profile} currency={currency} />
    </div>
  );
}

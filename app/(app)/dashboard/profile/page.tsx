import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/server";
import { getProfile } from "@/features/saas-profile/services/profileService";
import { isProfileComplete } from "@/features/saas-profile/validators/profileSchema";
import { ProfileView } from "@/features/saas-profile/components/ProfileView";
import { getUserSettings } from "@/features/settings/services/userSettingsService";

export default async function ProfilePage() {
  const user = await requireUser();
  const profileResult = await getProfile();

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

      <ProfileView profile={profile} currency={currency} />
    </div>
  );
}

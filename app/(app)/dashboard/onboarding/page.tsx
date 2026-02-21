import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/server";
import { ProfileForm } from "@/features/saas-profile/components/ProfileForm";
import { getProfile } from "@/features/saas-profile/services/profileService";
import { isProfileComplete } from "@/features/saas-profile/validators/profileSchema";
import { getUserSettings } from "@/features/settings/services/userSettingsService";

export default async function OnboardingPage() {
  const user = await requireUser();
  const profileResult = await getProfile();

  const profile = profileResult.ok ? profileResult.data : null;

  if (profile && isProfileComplete(profile)) {
    redirect("/dashboard");
  }
  const settingsResult = await getUserSettings(user.id);
  const currency = settingsResult.ok ? settingsResult.settings.currency : "USD";

  return (
    <div className="flex min-h-screen flex-col px-6 py-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Complete onboarding</h1>
        <p className="text-sm text-muted-foreground">
          Tell us about your SaaS so we can personalize your conversion
          playbooks.
        </p>
      </div>
      <div className="mt-6 rounded-lg border bg-background p-6">
        <ProfileForm
          initialValues={profile}
          mode="onboarding"
          currency={currency}
        />
      </div>
    </div>
  );
}

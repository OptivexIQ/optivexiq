import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/server";
import { getProfile } from "@/features/saas-profile/services/profileService";
import { isProfileComplete } from "@/features/saas-profile/validators/profileSchema";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Lock } from "lucide-react";
import { AccountPrivacyPanel } from "@/features/settings/components/AccountPrivacyPanel";
import { NotificationsPanel } from "@/features/settings/components/NotificationsPanel";
import { getUserSettings } from "@/features/settings/services/userSettingsService";
import { hasActiveSubscription } from "@/features/billing/services/planValidationService";

export default async function SettingsPage() {
  const user = await requireUser();
  const profileResult = await getProfile();

  if (!profileResult.ok) {
    redirect("/dashboard/onboarding");
  }

  const profile = profileResult.data;

  if (!isProfileComplete(profile)) {
    redirect("/dashboard/onboarding");
  }

  const settingsResult = await getUserSettings(user.id);

  if (!settingsResult.ok) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Settings unavailable
        </p>
        <p className="mt-2 text-sm text-foreground">{settingsResult.error}</p>
        <Button className="mt-4" asChild>
          <a href="/dashboard/settings">Reload</a>
        </Button>
      </div>
    );
  }

  const settings = settingsResult.settings;
  const hasSubscription = await hasActiveSubscription(user.id);

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Settings
        </p>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Manage account, security, and notification defaults for your OptivexIQ
          workspace.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <AccountPrivacyPanel initialSettings={settings} />

        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-border/60 bg-card p-6">
            <div className="flex items-start gap-3">
              <Lock className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Security posture
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Security controls are implemented at the infrastructure and
                  application level.
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-md border border-border/60 bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-chart-3" />
              <span>Baseline controls active</span>
            </div>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Role-based access control</li>
              <li>Authenticated API access</li>
              <li>Operational monitoring</li>
              <li>Ongoing security improvements</li>
            </ul>
          </div>

          <NotificationsPanel
            initialSettings={settings}
            hasSubscription={hasSubscription}
          />
        </div>
      </div>
    </div>
  );
}

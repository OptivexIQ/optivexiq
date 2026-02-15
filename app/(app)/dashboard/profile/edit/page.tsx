import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/server";
import { ProfileForm } from "@/features/saas-profile/components/ProfileForm";
import { getProfile } from "@/features/saas-profile/services/profileService";
import { isProfileComplete } from "@/features/saas-profile/validators/profileSchema";
import { Button } from "@/components/ui/button";

export default async function ProfileEditPage() {
  await requireUser();
  const profileResult = await getProfile();

  if (!profileResult.ok) {
    return (
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-10">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Edit profile
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

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Edit profile
          </p>
          <h1 className="text-2xl font-semibold text-foreground">
            Update your positioning inputs
          </h1>
          <p className="text-sm text-muted-foreground">
            Keep this current so OptivexIQ can deliver accurate conversion
            intelligence.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/profile">Back to overview</Link>
        </Button>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-6">
        <ProfileForm initialValues={profile} mode="edit" />
      </div>
    </div>
  );
}

import { SignUpForm } from "@/features/auth/components/SignUpForm";

export default function SignUpPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          Start your OptivexIQ workspace.
        </p>
      </div>
      <div className="mt-6 rounded-lg border bg-background p-6 shadow-sm">
        <SignUpForm />
      </div>
    </div>
  );
}

import Link from "next/link";
import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Access your OptivexIQ workspace.
        </p>
      </div>
      <div className="mt-6 rounded-lg border bg-background p-6 shadow-sm">
        <LoginForm />
        <p className="mt-4 text-sm text-muted-foreground">
          New here?{" "}
          <Link
            className="font-medium text-foreground underline"
            href="/sign-up"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

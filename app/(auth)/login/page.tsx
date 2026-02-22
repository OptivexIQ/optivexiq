import Link from "next/link";
import { LoginForm } from "@/features/auth/components/LoginForm";

type LoginPageProps = {
  searchParams?:
    | {
        redirect?: string;
      }
    | Promise<{
        redirect?: string;
      }>;
};

function sanitizeRedirect(value?: string): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }
  return value;
}

type LoginSearchParams = {
  redirect?: string;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedParams = (await Promise.resolve(searchParams)) ?? {};
  const redirectTo = sanitizeRedirect(resolvedParams?.redirect);

  return (
    <div className="max-w-sm mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Access your OptivexIQ workspace.
        </p>
      </div>
      <div className="mt-6 rounded-lg bg-background shadow-sm">
        <LoginForm redirectTo={redirectTo} />
        <p className="mt-4 text-sm text-muted-foreground">
          New here?{" "}
          <Link
            className="font-medium text-foreground underline"
            href={
              redirectTo
                ? `/sign-up?redirect=${encodeURIComponent(redirectTo)}`
                : "/sign-up"
            }
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

import Link from "next/link";
import { SignUpForm } from "@/features/auth/components/SignUpForm";

type SignUpPageProps = {
  searchParams?:
    | {
        redirect?: string;
      }
    | Promise<{
        redirect?: string;
      }>;
};

type SignUpSearchParams = {
  redirect?: string;
};

function sanitizeRedirect(value?: string): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }
  return value;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const resolvedParams = (await Promise.resolve(searchParams)) ?? {};
  const redirectTo = sanitizeRedirect(resolvedParams?.redirect);
  const loginHref = redirectTo
    ? `/login?redirect=${encodeURIComponent(redirectTo)}`
    : "/login";

  return (
    <div className="max-w-sm mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          Start your OptivexIQ workspace.
        </p>
      </div>
      <div className="mt-6 rounded-lg bg-background shadow-sm">
        <SignUpForm redirectTo={redirectTo} />
      </div>
      <p className="text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href={loginHref} className="underline underline-offset-4">
          Sign in
        </Link>
        .
      </p>
    </div>
  );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Page Not Found | OptivexIQ",
  description: "This dashboard page does not exist.",
};

export default function DashboardNotFoundPage() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-4xl items-center justify-center px-6 py-16">
      <div className="w-full rounded-2xl border border-border/70 bg-card/70 p-8 shadow-sm backdrop-blur md:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          Error 404
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Page not found.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          The page may have been moved, removed, or typed incorrectly. Continue from one of the
          core workspace paths below.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/reports">Open Reports</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/gap-engine">Open Gap Engine</Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link
            href="/dashboard/settings"
            className="rounded-lg border border-border/60 px-4 py-3 text-sm text-muted-foreground hover:text-foreground"
          >
            Go to Settings
          </Link>
          <Link
            href="/contact"
            className="rounded-lg border border-border/60 px-4 py-3 text-sm text-muted-foreground hover:text-foreground"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </section>
  );
}

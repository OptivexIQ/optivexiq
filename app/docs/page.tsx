import Link from "next/link";

export const metadata = {
  title: "Docs | OptivexIQ",
  description: "Product documentation for OptivexIQ.",
};

const lastUpdated = "February 16, 2026";

export default function DocsPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <h1 className="text-3xl font-semibold text-foreground">Documentation</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Last updated: {lastUpdated}
      </p>
      <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
        Learn how to run snapshots, interpret intelligence outputs, and manage
        billing and access controls.
      </p>

      <section className="mt-10 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Getting started
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Start from the homepage conversion flow, then create your first
            report from the dashboard.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Running a snapshot
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Submit your website and optional competitor URLs to generate a
            live, AI-structured snapshot.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Understanding reports
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Review messaging gaps, objection coverage, competitor overlap, and
            prioritized rewrite recommendations.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Billing and limits
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Usage and plan entitlements are enforced server-side. See pricing
            and account billing for current limits.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Security overview
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            OptivexIQ uses authenticated access controls, RLS-backed data
            isolation, and hardened billing mutation paths.
          </p>
        </div>
      </section>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/dashboard" className="text-sm text-primary hover:underline">
          Go to dashboard
        </Link>
        <Link href="/#pricing" className="text-sm text-primary hover:underline">
          View pricing
        </Link>
      </div>
    </main>
  );
}

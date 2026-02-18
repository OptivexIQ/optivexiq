import Link from "next/link";

export const metadata = {
  title: "Help Center | OptivexIQ",
  description:
    "Operational documentation for OptivexIQ setup, workflows, and troubleshooting.",
};

const lastUpdated = "February 17, 2026";

export default function DocsPage() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-42">
      <h1 className="text-3xl font-semibold text-foreground">Help Center</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Last updated: {lastUpdated}
      </p>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-foreground">
          Product Overview
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          OptivexIQ analyzes your website and selected competitors to identify
          messaging risk, positioning overlap, objection coverage gaps, and
          high-leverage rewrite opportunities. Reports are generated from
          canonical persisted report data and surfaced in the dashboard.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-foreground">
          Getting Started
        </h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Create an account and confirm your email address.</li>
          <li>
            Complete onboarding with company profile, ICP, and primary
            conversion goal.
          </li>
          <li>Select a plan from pricing and complete checkout.</li>
          <li>Run your first analysis from Dashboard {"->"} Gap Engine.</li>
          <li>
            Open the generated report and review recommendations by section.
          </li>
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-foreground">Usage Flows</h2>
        <div className="mt-3 space-y-4 text-sm text-muted-foreground">
          <div>
            <h3 className="font-medium text-foreground">
              Free Conversion Audit
            </h3>
            <p>
              Submit website URL and optional competitors, wait for completion,
              then unlock the PDF by email. This flow is public, rate-limited,
              and separate from paid quota.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-foreground">
              Full Report Generation
            </h3>
            <p>
              Authenticated users run reports through the canonical create
              route. Jobs are queued, processed in background workers, and
              status transitions are persisted until completion or failure.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-foreground">
              Billing and Entitlement
            </h3>
            <p>
              Checkout is auth-gated, server-issued, and verified by webhook.
              Access and limits are enforced server-side using plan data from
              the database.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-foreground">
          Troubleshooting
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">
              Analysis stuck in queued:
            </span>{" "}
            verify cron/worker route execution and review report job logs.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Checkout did not start:
            </span>{" "}
            confirm plan variant IDs, store ID, and LemonSqueezy API key
            configuration.
          </li>
          <li>
            <span className="font-medium text-foreground">
              No access after payment:
            </span>{" "}
            wait for webhook processing on billing return page; if delayed,
            contact support with account email.
          </li>
          <li>
            <span className="font-medium text-foreground">Scrape failure:</span>{" "}
            some sites block automated retrieval; retry with a public page or
            alternate URL.
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-foreground">
          Known Limitations
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>
            Results depend on publicly accessible content at analysis time.
          </li>
          <li>
            Competitor coverage is limited by provided URLs and crawlability.
          </li>
          <li>
            Outputs support strategy decisions but are not legal, financial, or
            regulatory advice.
          </li>
          <li>
            Downgrades are managed in Billing and apply at the next renewal
            period.
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-foreground">Support Paths</h2>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <Link href="/contact" className="text-primary hover:underline">
            Contact Support
          </Link>
          <Link href="/status" className="text-primary hover:underline">
            System Status
          </Link>
          <Link href="/dashboard" className="text-primary hover:underline">
            Open Dashboard
          </Link>
        </div>
      </section>
    </section>
  );
}

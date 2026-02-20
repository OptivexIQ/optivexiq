import Link from "next/link";
import { DocsToc, type DocsTocItem } from "@/components/docs/DocsToc";

export const metadata = {
  title: "Documentation | OptivexIQ",
  description:
    "OptivexIQ product documentation for setup, analysis workflows, report interpretation, billing, data handling, and troubleshooting.",
};

const lastUpdated = "February 19, 2026";

const tocItems: DocsTocItem[] = [
  { id: "overview", label: "Overview" },
  { id: "getting-started", label: "Getting Started" },
  { id: "running-analyses", label: "Running Analyses" },
  { id: "understanding-report", label: "Understanding Your Report" },
  { id: "scoring-methodology", label: "Scoring & Methodology" },
  { id: "billing-entitlements", label: "Billing & Entitlements" },
  { id: "data-security", label: "Data & Security" },
  { id: "operational-trust", label: "Operational Trust" },
  { id: "troubleshooting", label: "Troubleshooting" },
  { id: "faq", label: "FAQ" },
];

export default function DocsPage() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-42">
      <div className="xl:grid xl:grid-cols-[260px_minmax(0,1fr)_260px] xl:gap-8">
        <aside className="hidden xl:block">
          <DocsToc
            title="Documentation"
            items={tocItems}
            className="sticky top-24"
          />
        </aside>

        <article className="min-w-0">
          <header>
            <h1 className="text-3xl font-semibold text-foreground">
              Product Documentation
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Last updated: {lastUpdated}
            </p>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              This documentation explains how OptivexIQ works, how to interpret
              outputs, and how to use snapshot, report, and billing workflows
              effectively.
            </p>
          </header>

          <div className="mt-6 xl:hidden">
            <DocsToc title="Jump to topic" items={tocItems} />
          </div>

          <section id="overview" className="mt-10 scroll-mt-28">
            <h2 className="text-xl font-semibold text-foreground">Overview</h2>
            <div className="mt-3 space-y-3 text-sm text-muted-foreground">
              <p>
                OptivexIQ helps SaaS teams identify conversion friction in
                market-facing messaging and positioning using AI-assisted
                analysis of publicly accessible website content.
              </p>
              <p>
                It is designed for founders, product marketing teams, growth
                operators, and revenue teams that need structured diagnostic
                guidance before rewriting messaging or adjusting positioning.
              </p>
            </div>

            <h3 className="mt-6 text-base font-semibold text-foreground">
              Snapshot vs Full Report
            </h3>
            <div className="mt-3 overflow-x-auto rounded-lg border border-border/60">
              <table className="w-full min-w-170 text-left text-sm">
                <thead className="bg-secondary/50 text-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Capability</th>
                    <th className="px-4 py-3 font-semibold">Free Snapshot</th>
                    <th className="px-4 py-3 font-semibold">Full Report</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-t border-border/60">
                    <td className="px-4 py-3">Access</td>
                    <td className="px-4 py-3">Public entry flow</td>
                    <td className="px-4 py-3">Authenticated and plan-gated</td>
                  </tr>
                  <tr className="border-t border-border/60">
                    <td className="px-4 py-3">Depth</td>
                    <td className="px-4 py-3">Compact diagnostic summary</td>
                    <td className="px-4 py-3">Multi-section analysis</td>
                  </tr>
                  <tr className="border-t border-border/60">
                    <td className="px-4 py-3">Delivery</td>
                    <td className="px-4 py-3">Email-gated PDF unlock</td>
                    <td className="px-4 py-3">
                      Dashboard-first report delivery
                    </td>
                  </tr>
                  <tr className="border-t border-border/60">
                    <td className="px-4 py-3">Operational intent</td>
                    <td className="px-4 py-3">
                      Initial qualification and insight preview
                    </td>
                    <td className="px-4 py-3">
                      Ongoing messaging optimization workflow
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 rounded-md border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">What this means</p>
              <p className="mt-1">
                Use Snapshot to quickly evaluate direction. Use Full Report for
                structured prioritization and execution planning.
              </p>
            </div>
          </section>

          <section id="getting-started" className="mt-12 scroll-mt-28">
            <h2 className="text-xl font-semibold text-foreground">
              Getting Started
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
              <li>Create an account and verify your email.</li>
              <li>Complete onboarding profile details.</li>
              <li>
                Define your ideal customer profile (ICP) and conversion goal.
              </li>
              <li>Choose a plan that matches expected usage.</li>
              <li>Run analysis from Snapshot or dashboard workflows.</li>
            </ol>

            <h3 className="mt-6 text-base font-semibold text-foreground">
              Why ICP and conversion goals matter
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              The system is more useful when it can evaluate messaging relevance
              against a clear audience and objective. Strong profile context
              improves interpretability of recommendations.
            </p>

            <div className="mt-4 rounded-md border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">When to use this</p>
              <p className="mt-1">
                Review this section before your first report and whenever your
                target segment or conversion objective changes.
              </p>
            </div>
          </section>

          <section id="running-analyses" className="mt-12 scroll-mt-28">
            <h2 className="text-xl font-semibold text-foreground">
              Running Analyses
            </h2>
            <h3 className="mt-4 text-base font-semibold text-foreground">
              Processing lifecycle (conceptual)
            </h3>
            <div className="mt-3 rounded-lg border border-border/60 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">
                Submitted {"->"} Queued {"->"} Running {"->"} Completed / Failed
              </p>
              <p className="mt-2">
                Analysis requests are processed asynchronously so longer
                operations do not depend on a single page request lifecycle.
              </p>
            </div>

            <h3 className="mt-6 text-base font-semibold text-foreground">
              Expected behavior by state
            </h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">Queued:</span>{" "}
                request accepted and waiting for processing capacity.
              </li>
              <li>
                <span className="font-medium text-foreground">Running:</span>{" "}
                content is being analyzed and report sections are being
                prepared.
              </li>
              <li>
                <span className="font-medium text-foreground">Completed:</span>{" "}
                results are available for interpretation and export.
              </li>
              <li>
                <span className="font-medium text-foreground">Failed:</span>{" "}
                processing could not complete; retry and input checks are
                recommended.
              </li>
            </ul>

            <h3 className="mt-6 text-base font-semibold text-foreground">
              Common failure patterns
            </h3>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>Invalid or unreachable URLs.</li>
              <li>Target website access restrictions.</li>
              <li>Temporary provider or network disruption.</li>
            </ul>

            <div className="mt-4 rounded-md border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">What to do</p>
              <p className="mt-1">
                Validate URL format, retry later for transient failures, and use
                publicly accessible pages when possible.
              </p>
            </div>
          </section>

          <section id="understanding-report" className="mt-12 scroll-mt-28">
            <h2 className="text-xl font-semibold text-foreground">
              Understanding Your Report
            </h2>

            <div className="mt-4 space-y-5 text-sm text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground">
                  Executive diagnosis
                </h3>
                <p className="mt-1">
                  Summarizes primary conversion risks and directional
                  priorities.
                </p>
                <p className="mt-1">
                  High-risk signals indicate messaging clarity or
                  differentiation needs immediate attention.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground">
                  Messaging overlap
                </h3>
                <p className="mt-1">
                  Highlights where narrative appears similar to competitors.
                </p>
                <p className="mt-1">
                  Higher overlap generally means lower distinctiveness in market
                  perception.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground">
                  Objection coverage
                </h3>
                <p className="mt-1">
                  Indicates how clearly common buyer concerns are addressed.
                </p>
                <p className="mt-1">
                  Lower coverage suggests missed persuasion opportunities.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground">
                  Competitive matrix
                </h3>
                <p className="mt-1">
                  Compares positioning strengths and gaps across competitors.
                </p>
                <p className="mt-1">
                  Use it to prioritize narrative areas where differentiation is
                  currently weak.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground">
                  Positioning map
                </h3>
                <p className="mt-1">
                  Visual reference for where your message sits in competitive
                  context.
                </p>
                <p className="mt-1">
                  Use this for strategic alignment discussions across product
                  and marketing stakeholders.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground">
                  Rewrite recommendations
                </h3>
                <p className="mt-1">
                  Structured guidance for improving headline, positioning, and
                  conversion-critical copy.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground">
                  Revenue impact modeling
                </h3>
                <p className="mt-1">
                  Directional estimate of potential impact based on observed
                  friction patterns.
                </p>
                <p className="mt-1">
                  Treat this as planning guidance, not a guaranteed forecast.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-md border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">What this means</p>
              <p className="mt-1">
                Reports support prioritization and decision quality. They do not
                replace experimentation, market testing, or cross-functional
                review.
              </p>
            </div>
          </section>

          <section id="scoring-methodology" className="mt-12 scroll-mt-28">
            <h2 className="text-xl font-semibold text-foreground">
              Scoring & Methodology (Conceptual Only)
            </h2>
            <div className="mt-3 space-y-3 text-sm text-muted-foreground">
              <p>
                Scoring reflects multiple factors across messaging clarity,
                differentiation, objection handling, and competitive context.
              </p>
              <p>
                The system detects conversion friction patterns and uses
                AI-assisted synthesis to produce structured findings and
                recommendations.
              </p>
              <p>
                Scores are directional indicators intended for prioritization,
                not absolute truth metrics.
              </p>
            </div>

            <div className="mt-4 rounded-md border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">
                Interpretation guidance
              </p>
              <p className="mt-1">
                Focus on trends and relative strengths/weaknesses across
                sections rather than any single score in isolation.
              </p>
            </div>
          </section>

          <section id="billing-entitlements" className="mt-12 scroll-mt-28">
            <h2 className="text-xl font-semibold text-foreground">
              Billing & Entitlements
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                One-time plans grant non-recurring access scope as described at
                purchase.
              </li>
              <li>
                Subscription plans renew by billing cycle unless cancelled.
              </li>
              <li>
                Entitlement checks and feature access controls are enforced
                server-side.
              </li>
              <li>
                Access changes after billing events may require a short sync
                window.
              </li>
            </ul>

            <div className="mt-4 rounded-md border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">When to use this</p>
              <p className="mt-1">
                Check this section when comparing plans, managing renewals, or
                diagnosing access mismatches after payment events.
              </p>
            </div>
          </section>

          <section id="data-security" className="mt-12 scroll-mt-28">
            <h2 className="text-xl font-semibold text-foreground">
              Data & Security
            </h2>
            <div className="mt-3 space-y-3 text-sm text-muted-foreground">
              <p>
                OptivexIQ processes account data, billing metadata, usage
                events, submitted URLs, and analysis outputs required for
                service operation.
              </p>
              <p>
                Public webpage analysis is limited to content that is publicly
                accessible at the time of processing.
              </p>
              <p>
                AI services are used to assist analysis synthesis and structured
                report generation.
              </p>
              <p>
                Data retention is governed by policy and legal obligations.
                Contractual data processing terms (including DPA) are available
                for eligible customer legal workflows.
              </p>
              <p>
                Subprocessor categories include hosting, data storage,
                authentication, billing, communications, and AI infrastructure.
              </p>
            </div>
          </section>

          <section id="operational-trust" className="mt-12 scroll-mt-28">
            <h2 className="text-xl font-semibold text-foreground">
              Operational Trust
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              This section focuses on service governance and communication
              practices. Technical controls are documented in Data & Security.
            </p>

            <div className="mt-4 overflow-x-auto rounded-lg border border-border/60">
              <table className="w-full min-w-170 text-left text-sm">
                <thead className="bg-secondary/50 text-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Area</th>
                    <th className="px-4 py-3 font-semibold">Current practice</th>
                    <th className="px-4 py-3 font-semibold">Where to verify</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-t border-border/60">
                    <td className="px-4 py-3">Status visibility</td>
                    <td className="px-4 py-3">
                      Public service status and incident summaries are published.
                    </td>
                    <td className="px-4 py-3">
                      <Link href="/status" className="text-primary hover:underline">
                        System Status
                      </Link>
                    </td>
                  </tr>
                  <tr className="border-t border-border/60">
                    <td className="px-4 py-3">Incident communication</td>
                    <td className="px-4 py-3">
                      Customer-impacting incidents include updates and resolution
                      state where applicable.
                    </td>
                    <td className="px-4 py-3">
                      <Link href="/status" className="text-primary hover:underline">
                        Status incident log
                      </Link>
                    </td>
                  </tr>
                  <tr className="border-t border-border/60">
                    <td className="px-4 py-3">Support escalation</td>
                    <td className="px-4 py-3">
                      Published support, security, and legal channels with routed
                      request handling.
                    </td>
                    <td className="px-4 py-3">
                      <Link href="/contact" className="text-primary hover:underline">
                        Contact hub
                      </Link>
                    </td>
                  </tr>
                  <tr className="border-t border-border/60">
                    <td className="px-4 py-3">Policy transparency</td>
                    <td className="px-4 py-3">
                      Privacy and terms documents are versioned and updated with
                      effective dates.
                    </td>
                    <td className="px-4 py-3">
                      <Link href="/privacy" className="text-primary hover:underline">
                        Privacy
                      </Link>
                      {" / "}
                      <Link href="/terms" className="text-primary hover:underline">
                        Terms
                      </Link>
                    </td>
                  </tr>
                  <tr className="border-t border-border/60">
                    <td className="px-4 py-3">Change communication</td>
                    <td className="px-4 py-3">
                      Product-facing updates are published in release notes.
                    </td>
                    <td className="px-4 py-3">
                      <Link href="/whats-new" className="text-primary hover:underline">
                        What&apos;s New
                      </Link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

          </section>

          <section id="troubleshooting" className="mt-12 scroll-mt-28">
            <h2 className="text-xl font-semibold text-foreground">
              Troubleshooting
            </h2>
            <div className="mt-4 space-y-5 text-sm text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground">
                  Report appears stuck in queued
                </h3>
                <p className="mt-1">
                  Processing capacity or temporary upstream delays may affect
                  start time.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Snapshot differs from full report
                </h3>
                <p className="mt-1">
                  Snapshot is intentionally compact. Full reports include deeper
                  diagnostics and additional interpretive layers.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Payment completed but access not updated
                </h3>
                <p className="mt-1">
                  Billing entitlement synchronization may require short
                  processing time before access updates appear.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Scrape limitations
                </h3>
                <p className="mt-1">
                  Some sites block automated retrieval or restrict access to key
                  pages.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Temporary rate limiting
                </h3>
                <p className="mt-1">
                  Protective controls may limit repeated requests to preserve
                  service stability.
                </p>
              </div>
            </div>
          </section>

          <section id="faq" className="mt-12 scroll-mt-28">
            <h2 className="text-xl font-semibold text-foreground">FAQ</h2>
            <div className="mt-4 space-y-5 text-sm text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground">
                  Why is my score lower than expected?
                </h3>
                <p className="mt-1">
                  Scores reflect multiple signal categories. A strong page can
                  still receive lower directional scoring if clarity,
                  differentiation, or objection handling is inconsistent.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground">
                  Can I rerun a report?
                </h3>
                <p className="mt-1">
                  Yes. Re-running is useful after messaging updates, positioning
                  changes, or significant competitive shifts.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground">
                  Does OptivexIQ store competitor content?
                </h3>
                <p className="mt-1">
                  The system processes publicly accessible content to generate
                  analysis outputs. Data handling follows documented retention
                  and policy boundaries.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground">
                  Can I export reports?
                </h3>
                <p className="mt-1">
                  Export availability depends on plan entitlements and workflow
                  context.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground">
                  How is data protected?
                </h3>
                <p className="mt-1">
                  OptivexIQ applies layered technical and organizational
                  controls for access governance, secure transport, and
                  operational monitoring.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground">
                  Is AI output guaranteed accurate?
                </h3>
                <p className="mt-1">
                  No. AI output is probabilistic and should be interpreted as
                  decision support rather than guaranteed fact.
                </p>
              </div>
            </div>
          </section>
        </article>

        <aside className="mt-10 border-l border-border/70 pl-6 xl:mt-0">
          <div className="space-y-4 xl:sticky xl:top-24">
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Need help fast
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Start with Troubleshooting for common issues, then contact
                support if you still need help.
              </p>
              <Link
                href="#troubleshooting"
                className="mt-3 inline-block text-sm text-primary hover:underline"
              >
                Go to Troubleshooting
              </Link>
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Quick links
              </p>
              <div className="mt-2 flex flex-col gap-1 text-sm">
                <Link
                  href="/#free-snapshot"
                  className="text-primary hover:underline"
                >
                  Free Conversion Snapshot
                </Link>
                <Link href="/#pricing" className="text-primary hover:underline">
                  Pricing
                </Link>
                <Link
                  href="/whats-new"
                  className="text-primary hover:underline"
                >
                  What&apos;s New
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Related policies
              </p>
              <div className="mt-2 flex flex-col gap-1 text-sm">
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>
                <Link href="/status" className="text-primary hover:underline">
                  System Status
                </Link>
                <Link href="/contact" className="text-primary hover:underline">
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

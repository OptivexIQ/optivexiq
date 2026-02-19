import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "About | OptivexIQ",
  description: "OptivexIQ mission, operating model, and product principles.",
};

const principles = [
  {
    title: "Structured by design",
    body: "Every report follows a canonical contract so outputs stay reliable across UI, export, and automation.",
  },
  {
    title: "Operationally durable",
    body: "Long-running analysis is queued and state-tracked instead of tied to request lifecycle volatility.",
  },
  {
    title: "Guarded by default",
    body: "Billing, usage, and mutation paths are server-enforced with authenticated boundaries.",
  },
  {
    title: "Transparent failure states",
    body: "When a process fails, users see explicit status and recovery paths instead of silent fallback output.",
  },
] as const;

const systemLayers = [
  {
    name: "Input",
    detail: "Website + competitor URLs with validation and normalization.",
  },
  {
    name: "Analysis",
    detail:
      "Live scraping, structured AI synthesis, and deterministic score assembly.",
  },
  {
    name: "Execution",
    detail: "Durable job lifecycle with persisted stage and completion state.",
  },
  {
    name: "Delivery",
    detail:
      "Actionable recommendations surfaced in dashboard and export workflows.",
  },
] as const;

export default function AboutPage() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 py-42">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at top, hsl(210 60% 50% / 0.12), transparent 62%)",
        }}
      />

      <header className="max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          About OptivexIQ
        </p>
        <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
          Built for SaaS teams that treat conversion as an operating system.
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
          OptivexIQ helps teams diagnose messaging and positioning gaps with
          evidence, not guesswork. The platform combines live website analysis,
          competitor context, and structured outputs so growth decisions can be
          executed with confidence.
        </p>
      </header>

      <section className="mt-14 rounded-2xl border border-border/60 bg-card/70 p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Mission
        </p>
        <p className="mt-4 text-xl leading-relaxed text-foreground md:text-2xl">
          Reduce uncertainty in B2B SaaS messaging decisions by making
          conversion diagnosis measurable, comparable, and operationally
          actionable.
        </p>
      </section>

      <section className="mt-12">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Product System
          </h2>
          <p className="text-sm text-primary">How a report moves end-to-end</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {systemLayers.map((layer, index) => (
            <article
              key={layer.name}
              className="rounded-xl border border-border/60 bg-card/70 p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Step {index + 1}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-foreground">
                {layer.name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {layer.detail}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Engineering Principles
          </h2>
          <p className="text-sm text-primary">
            Design constraints we enforce in production
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {principles.map((item) => (
            <article
              key={item.title}
              className="rounded-xl border border-border/60 bg-card/70 p-6"
            >
              <h3 className="text-lg font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-3">
        <article className="rounded-xl border border-border/60 bg-card/70 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Audience
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Founders, product marketers, growth operators, and revenue teams
            accountable for messaging and conversion performance.
          </p>
        </article>
        <article className="rounded-xl border border-border/60 bg-card/70 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Scope
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Positioning diagnostics, overlap analysis, objection coverage,
            rewrite prioritization, and executive narrative synthesis.
          </p>
        </article>
        <article className="rounded-xl border border-border/60 bg-card/70 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Readiness
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Queue-backed execution, canonical report contracts, and server-side
            guardrails for access, billing, and usage enforcement.
          </p>
        </article>
      </section>

      <section className="mt-12 rounded-2xl border border-border/60 bg-card/70 p-8 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Explore the product
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Start with the Free Conversion Audit, then move into full report
          workflows and billing-protected execution paths when you are ready to
          operationalize conversion intelligence.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/#free-snapshot">Run Free Conversion Audit</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/#pricing">View Pricing</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/contact">Contact Sales</Link>
          </Button>
        </div>
      </section>
    </section>
  );
}

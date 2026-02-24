import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "About | OptivexIQ",
  description:
    "What OptivexIQ does, why it exists, and how it helps SaaS teams make better conversion decisions.",
};

const principles = [
  {
    title: "Conversion is a system",
    body: "Messaging, positioning, and objections work together. We treat them as one operating layer, not disconnected copy tasks.",
  },
  {
    title: "Risk compounds quietly",
    body: "Small positioning gaps can reduce pipeline quality and win rates over time. Early detection matters.",
  },
  {
    title: "Evidence over opinion",
    body: "Strategic decisions should be backed by structured signals, not internal debate alone.",
  },
  {
    title: "Output must be usable",
    body: "Insights are only useful when teams can act on them quickly and consistently.",
  },
] as const;

const workflow = [
  {
    step: "Step 1 - Input",
    detail:
      "You provide your website and optional competitor URLs so analysis starts from real market context.",
  },
  {
    step: "Step 2 - Analysis",
    detail:
      "The platform reviews messaging clarity, differentiation, objection coverage, and competitive overlap.",
  },
  {
    step: "Step 3 - Processing",
    detail:
      "Signals are synthesized into a structured analysis that prioritizes risks, gaps, and improvement opportunities.",
  },
  {
    step: "Step 4 - Delivery",
    detail:
      "Results are delivered as actionable recommendations your team can apply directly in planning and execution.",
  },
] as const;

const audiences = [
  {
    title: "Founders",
    detail:
      "When strategic messaging decisions are still centralized and every conversion improvement has direct financial impact.",
  },
  {
    title: "Product Marketing",
    detail:
      "When positioning needs to be explicit across homepage, pricing, and competitive narrative.",
  },
  {
    title: "Growth Teams",
    detail:
      "When acquisition is working but conversion efficiency is inconsistent or difficult to diagnose.",
  },
  {
    title: "Revenue Leaders",
    detail:
      "When pipeline quality and sales objections show that messaging alignment needs stronger operational discipline.",
  },
] as const;

const differentiators = [
  "Focused on positioning decisions, not traffic reporting alone.",
  "Built to produce actions teams can execute, not just observations.",
  "Designed for repeatable operating cadence, not one-off diagnostics.",
  "Supports defensible decision-making for operators and leadership.",
] as const;

const trustSignals = [
  "Designed for real production use in active SaaS workflows.",
  "Built with reliability, continuity, and operational consistency in mind.",
  "Developed with a data protection mindset across customer-facing workflows.",
  "Transparent about limitations and intended for decision support, not guarantees.",
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
          OptivexIQ helps SaaS teams turn conversion from guesswork into a
          measurable system.
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
          Most teams can see pipeline outcomes but cannot clearly explain why
          messaging performs or where positioning breaks down. OptivexIQ closes
          that gap with structured analysis teams can use to make faster, more
          confident decisions. Explainability depth is highest in full reports
          and exports.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
          OptivexIQ is a SaaS platform that analyzes website messaging and
          competitive positioning to identify conversion risk and improvement
          opportunities.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Built for teams that treat messaging as infrastructure, not copy.
        </p>
      </header>

      <section className="mt-14 rounded-2xl border border-border/60 bg-card/70 p-8 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Why We Exist
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
          SaaS messaging quality is often evaluated through opinion, isolated
          tests, or inconsistent feedback loops. Traditional analytics tools
          explain what happened, but not why positioning is weak or where
          objection handling is incomplete.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
          We built OptivexIQ to make conversion risk visible earlier, prioritize
          the right fixes, and support decisions that can stand up to internal
          and external scrutiny.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          What We Believe
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
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

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          How The Platform Works
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {workflow.map((item) => (
            <article
              key={item.step}
              className="rounded-xl border border-border/60 bg-card/70 p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {item.step}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.detail}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Who It&apos;s For
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {audiences.map((item) => (
            <article
              key={item.title}
              className="rounded-xl border border-border/60 bg-card/70 p-6"
            >
              <h3 className="text-lg font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.detail}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-2xl border border-border/60 bg-card/70 p-8 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          What Makes OptivexIQ Different
        </h2>
        <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted-foreground">
          {differentiators.map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
      </section>

      <section className="mt-12 rounded-2xl border border-border/60 bg-card/70 p-8 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Readiness & Trust
        </h2>
        <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted-foreground">
          {trustSignals.map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
      </section>

      <section className="mt-12 rounded-2xl border border-border/60 bg-card/70 p-8 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Next Steps
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Start with a Free Conversion Audit to see immediate messaging and
          positioning risk. When you are ready to operationalize conversion
          decision-making, move to a full plan.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/#free-snapshot">Get a Free Conversion Audit</Link>
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

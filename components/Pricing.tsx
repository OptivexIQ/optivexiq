import Link from "next/link";
import { startCheckoutAction } from "@/app/actions/billing/startCheckout";

type Plan = {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted: boolean;
  cta: string;
  badge?: string;
  highlightNote?: string;
} & (
  | { action: "checkout"; planKey: "starter" | "pro" | "growth" }
  | { action: "contact"; planKey?: never }
);

export function Pricing() {
  const plans: Plan[] = [
    {
      name: "Conversion Starter",
      price: "49",
      period: "one-time",
      description:
        "A quick positioning audit and strategic rewrite for your core pages.",
      features: [
        "Homepage rewrite",
        "Pricing page rewrite",
        "Basic gap analysis",
        "Export as PDF",
      ],
      highlighted: false,
      cta: "Get My Conversion Audit",
      action: "checkout",
      planKey: "starter",
    },
    {
      name: "SaaS Conversion Pro",
      price: "99",
      period: "/month",
      description:
        "Ongoing conversion intelligence and optimization for serious founders.",
      highlightNote: "Best for mid-market + enterprise teams",
      features: [
        "Unlimited homepage + pricing rewrites",
        "Competitor Gap Analysis (3/month)",
        "Objection Engine",
        "Differentiation Builder",
        "Export integration (JSON, HTML, Markdown)",
        "Priority analysis queue",
      ],
      highlighted: true,
      cta: "Upgrade to Pro",
      badge: "Most Popular",
      action: "checkout",
      planKey: "pro",
    },
    {
      name: "Growth Intelligence",
      price: "149",
      period: "/month",
      description: "Advanced competitive intelligence for scaling SaaS teams.",
      features: [
        "Everything in Pro",
        "Counter-positioning engine",
        "Quarterly positioning refresh",
        "Advanced competitive intelligence",
        "Team collaboration (up to 5)",
        "Dedicated account manager",
      ],
      highlighted: false,
      cta: "Scale With Growth",
      action: "checkout",
      planKey: "growth",
    },
  ];

  return (
    <section id="pricing" className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Pricing
          </p>
          <h2 className="text-balance text-3xl font-bold leading-[1.15] tracking-tight text-foreground md:text-[2.75rem]">
            Invest in Positioning,
            <br />
            <span className="text-muted-foreground">Not Guesswork</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground">
            Every plan includes the core Conversion Gap Engine. Choose the depth
            that fits your stage.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Want a preview first?{" "}
            <Link
              href="/#free-snapshot"
              className="font-medium text-primary hover:underline"
            >
              Try the free snapshot
            </Link>
          </p>
        </div>

        <div className="grid items-center gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl transition-all duration-300 ${
                plan.highlighted
                  ? "z-10 border border-primary/50 bg-card p-8 shadow-xl shadow-black/30 lg:-translate-y-3 lg:scale-110 lg:py-10"
                  : "border border-border/60 bg-card p-8 hover:border-border"
              }`}
            >
              {plan.badge ? (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-primary px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary-foreground shadow-sm shadow-black/30">
                    {plan.badge}
                  </span>
                </div>
              ) : null}

              <div className="mb-6">
                <h3 className="mb-2 text-base font-semibold tracking-tight text-foreground">
                  {plan.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {plan.description}
                </p>
                {plan.highlightNote ? (
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    {plan.highlightNote}
                  </p>
                ) : null}
              </div>

              <div className="mb-8 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-foreground">
                  {"\u20AC"}
                  {plan.price}
                </span>
                <span className="text-sm text-muted-foreground">
                  {plan.period}
                </span>
              </div>

              {plan.action === "checkout" ? (
                <form action={startCheckoutAction} className="mb-8">
                  <input type="hidden" name="plan" value={plan.planKey} />
                  <button
                    type="submit"
                    className={`block w-full rounded-xl py-3 text-center text-sm font-semibold transition-all duration-200 ${
                      plan.highlighted
                        ? "bg-primary text-primary-foreground shadow-md shadow-black/30 hover:bg-primary/90"
                        : "border border-border bg-secondary text-foreground hover:bg-muted"
                    }`}
                  >
                    {plan.cta}
                  </button>
                </form>
              ) : (
                <a
                  href="mailto:sales@optivexiq.com?subject=OptivexIQ%20Growth%20Plan"
                  className={`mb-8 block rounded-xl py-3 text-center text-sm font-semibold transition-all duration-200 ${
                    plan.highlighted
                      ? "bg-primary text-primary-foreground shadow-md shadow-black/30 hover:bg-primary/90"
                      : "border border-border bg-secondary text-foreground hover:bg-muted"
                  }`}
                >
                  {plan.cta}
                </a>
              )}

              <div className="border-t border-border/60 pt-6">
                <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  What&apos;s included
                </p>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 16 16"
                        fill="none"
                        className={`mt-0.5 shrink-0 ${
                          plan.highlighted
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      >
                        <path
                          d="M3.5 8L6.5 11L12.5 5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="text-sm text-muted-foreground">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>Need custom enterprise terms or volume pricing?</span>
          <Link
            href="/contact"
            className="inline-flex font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            Contact Sales
          </Link>
        </div>
      </div>
    </section>
  );
}

export function BeforeAfter() {
  const comparisons = [
    {
      context: "Homepage Hero",
      before: {
        headline: "The all-in-one platform for modern teams",
        subtext:
          "Powerful tools to help you manage, collaborate, and grow your business.",
      },
      after: {
        headline:
          "Close 3x more enterprise deals with AI-powered sales proposals",
        subtext:
          "The only proposal platform built for B2B teams selling $50k+ deals. Cut creation time by 80% while increasing win rates.",
      },
      improvement: "+47% clarity score",
    },
    {
      context: "Pricing Page Header",
      before: {
        headline: "Simple, transparent pricing",
        subtext:
          "Choose the plan that works best for you and your team. Start free, upgrade anytime.",
      },
      after: {
        headline:
          "Start with 5 proposals free. Scale when you close your first deal.",
        subtext:
          "No per-seat pricing. No feature gating. Pay based on proposals sent, aligned with your revenue growth.",
      },
      improvement: "+31% pricing page conversion",
    },
  ];

  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Real Results
          </p>
          <h2 className="text-balance text-3xl font-bold leading-[1.15] tracking-tight text-foreground md:text-[2.75rem]">
            From Generic to
            <br />
            <span className="text-muted-foreground">Differentiated</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground">
            See how OptivexIQ transforms undifferentiated messaging into
            strategic, conversion-focused copy.
          </p>
        </div>

        <div className="space-y-6">
          {comparisons.map((comparison) => (
            <div
              key={comparison.context}
              className="rounded-2xl border border-border/60 bg-card p-1.5"
            >
              <div className="rounded-xl bg-secondary/50 p-6 md:p-8">
                {/* Context label + improvement */}
                <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    <span className="text-xs font-semibold uppercase tracking-widest text-foreground">
                      {comparison.context}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      className="text-chart-3"
                    >
                      <path
                        d="M2 8L5 4L8 6L11 2"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="text-xs font-medium text-chart-3">
                      {comparison.improvement}
                    </span>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  {/* Before */}
                  <div className="rounded-xl border border-border/40 bg-card/50 p-6">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Before
                      </span>
                    </div>
                    <h3 className="mb-2.5 text-lg font-semibold leading-snug text-muted-foreground/60">
                      {comparison.before.headline}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground/40">
                      {comparison.before.subtext}
                    </p>
                  </div>

                  {/* After */}
                  <div className="relative rounded-xl border border-primary/30 bg-card p-6">
                    <div className="relative">
                      <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                          After OptivexIQ
                        </span>
                      </div>
                      <h3 className="mb-2.5 text-lg font-semibold leading-snug text-foreground">
                        {comparison.after.headline}
                      </h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {comparison.after.subtext}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28">
      {/* Subtle grid background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, hsl(0 0% 100% / 0.06) 1px, transparent 1px), linear-gradient(to bottom, hsl(0 0% 100% / 0.06) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage:
            "radial-gradient(circle at 50% 0%, black 0%, black 55%, transparent 78%)",
        }}
      />

      {/* Top radial glow */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-175 w-225 -translate-x-1/2"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(210 45% 45% / 0.12) 0%, hsl(200 55% 40% / 0.06) 40%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-4xl text-center">
          {/* Trust badge */}
          <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-border/80 bg-card/80 px-4 py-1.5 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-chart-3 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-chart-3" />
            </span>
            <span className="text-xs font-medium text-secondary-foreground">
              Strategic Conversion Intelligence for B2B SaaS
            </span>
          </div>

          <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-[3.6rem] lg:text-[4.15rem]">
            Conversion intelligence for
            <br className="hidden sm:block" />
            <span className="text-primary">enterprise SaaS teams</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg md:leading-relaxed">
            OptivexIQ benchmarks your homepage and pricing against top
            competitors, flags the gaps stalling pipeline, and ships strategic
            rewrites your revenue team can deploy in days.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/#free-snapshot"
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-md shadow-black/30 transition-all hover:bg-primary/90"
            >
              <span className="relative z-10 flex items-center gap-2">
                Run Free Conversion Audit
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="transition-transform group-hover:translate-x-0.5"
                >
                  <path
                    d="M6 12L10 8L6 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </Link>
            <Link
              href="/#solution"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-card/50 px-8 py-3.5 text-sm font-medium text-foreground backdrop-blur-sm transition-all hover:border-border hover:bg-secondary"
            >
              See How It Works
            </Link>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="relative mx-auto mt-16 max-w-5xl md:mt-20">
          {/* Outer frame with gradient border effect */}
          <div className="rounded-2xl border border-border/70 bg-card/40 p-1 shadow-xl shadow-black/30">
            <div className="rounded-[1.15rem] bg-card">
              <div className="p-6 md:p-7">
                {/* Dashboard header */}
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 16 16"
                        fill="none"
                        className="text-primary"
                      >
                        <path
                          d="M2 4L8 2L14 4L8 6L2 4Z"
                          fill="currentColor"
                          opacity="0.9"
                        />
                        <path
                          d="M2 4V10L8 12V6L2 4Z"
                          fill="currentColor"
                          opacity="0.6"
                        />
                        <path d="M8 6V12L14 10V4L8 6Z" fill="currentColor" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Enterprise Conversion Audit
                      </p>
                      <p className="text-sm text-foreground/90">
                        acme-saas.com | Segment: Enterprise | 5 competitors
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-chart-3/10 px-2.5 py-1 text-sm font-medium text-chart-3">
                      Confidence 96%
                    </span>
                    <span className="rounded-md bg-secondary px-2.5 py-1 text-sm text-foreground/90">
                      Refreshed 2 min ago
                    </span>
                  </div>
                </div>

                {/* Top row: Enterprise KPIs */}
                <div className="mb-4 grid gap-4 sm:grid-cols-4">
                  {[
                    {
                      label: "Gap Score",
                      value: "34",
                      meta: "/100",
                      tone: "text-foreground",
                    },
                    {
                      label: "Pipeline at Risk",
                      value: "$1.8M",
                      meta: "30d",
                      tone: "text-destructive",
                    },
                    {
                      label: "Win Rate Delta",
                      value: "-9.4%",
                      meta: "vs peers",
                      tone: "text-chart-4",
                    },
                    {
                      label: "Time to Clarity",
                      value: "6 days",
                      meta: "avg. fix",
                      tone: "text-chart-3",
                    },
                  ].map((kpi) => (
                    <div
                      key={kpi.label}
                      className="rounded-xl border border-border/60 bg-secondary/50 p-4"
                    >
                      <p className="text-sm font-medium text-foreground/90">
                        {kpi.label}
                      </p>
                      <div className={`mt-1.5 text-lg font-bold ${kpi.tone}`}>
                        {kpi.value}
                        <span className="ml-1 text-sm font-medium text-foreground/90">
                          {kpi.meta}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: kpi.label === "Gap Score" ? "34%" : "72%",
                            background:
                              kpi.label === "Gap Score"
                                ? "linear-gradient(to right, hsl(0 84% 60%), hsl(43 74% 66%))"
                                : "linear-gradient(to right, hsl(210 70% 55%), hsl(175 60% 45%))",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Middle row: Trend + Risk */}
                <div className="mb-4 grid gap-4 md:grid-cols-5">
                  <div className="rounded-xl border border-border/60 bg-secondary/50 p-4 md:col-span-3">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground/90">
                        Funnel Impact Forecast (90d)
                      </p>
                      <span className="text-sm text-foreground/90">
                        Baseline vs optimized
                      </span>
                    </div>
                    <div
                      className="flex items-end gap-2"
                      style={{ height: "100px" }}
                    >
                      {[42, 48, 46, 55, 62, 68].map((point, i) => (
                        <div key={point} className="flex-1">
                          <div
                            className="rounded-t bg-primary/30"
                            style={{ height: `${point}px` }}
                          />
                          <div
                            className="-mt-1 rounded-t bg-primary"
                            style={{ height: `${point * 0.7}px` }}
                          />
                          <div className="mt-1 text-center text-sm text-foreground/90">
                            W{i + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="mt-2.5 text-sm text-foreground/90">
                      Forecasted lift:{" "}
                      <span className="font-medium text-foreground">
                        +18.6%
                      </span>{" "}
                      win rate
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-secondary/50 p-4 md:col-span-2">
                    <p className="mb-3 text-sm font-medium text-foreground/90">
                      Risk by Stage
                    </p>
                    <div className="space-y-3">
                      {[
                        { label: "Top-of-funnel", pct: 62 },
                        { label: "Pricing evaluation", pct: 78 },
                        { label: "Security review", pct: 41 },
                        { label: "Procurement", pct: 55 },
                      ].map((stage) => (
                        <div key={stage.label}>
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-sm leading-snug text-foreground/90">
                              {stage.label}
                            </span>
                            <span className="font-mono text-sm text-foreground/90">
                              {stage.pct}%
                            </span>
                          </div>
                          <div className="h-1 w-full rounded-full bg-muted">
                            <div
                              className="h-1 rounded-full"
                              style={{
                                width: `${stage.pct}%`,
                                background:
                                  stage.pct > 65
                                    ? "hsl(0 84% 60%)"
                                    : stage.pct > 50
                                      ? "hsl(43 74% 66%)"
                                      : "hsl(217 91% 60%)",
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom row: Priority gaps + rewrite queue */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-border/60 bg-secondary/50 p-4 md:col-span-2">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground/90">
                        Priority Gaps
                      </p>
                      <span className="text-sm text-foreground/90">
                        Impact score
                      </span>
                    </div>
                    <div className="space-y-3">
                      {[
                        {
                          name: "Hero value proposition",
                          impact: 92,
                          owner: "Homepage",
                        },
                        {
                          name: "Pricing tier clarity",
                          impact: 84,
                          owner: "Pricing",
                        },
                        { name: "Security proof", impact: 76, owner: "Trust" },
                        {
                          name: "Competitive differentiation",
                          impact: 71,
                          owner: "Positioning",
                        },
                      ].map((gap) => (
                        <div
                          key={gap.name}
                          className="flex items-center justify-between rounded-lg bg-card/60 px-3 py-2.5"
                        >
                          <div>
                            <p className="text-sm font-medium leading-snug text-foreground">
                              {gap.name}
                            </p>
                            <p className="text-sm text-foreground/90">
                              {gap.owner}
                            </p>
                          </div>
                          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-sm font-semibold text-destructive">
                            {gap.impact}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <p className="mb-3 text-sm font-medium text-primary">
                      Rewrite Queue
                    </p>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          12 rewrites
                        </p>
                        <p className="text-sm text-foreground/90">
                          4 enterprise variants
                        </p>
                      </div>
                      <div className="rounded-lg bg-card/70 p-3">
                        <p className="text-sm font-medium text-foreground">
                          Next up
                        </p>
                        <p className="text-sm text-foreground/90">
                          Security + ROI sections
                        </p>
                      </div>
                      <span className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">
                        Review rewrites
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reflection glow */}
      <div
        className="pointer-events-none absolute -bottom-32 left-1/2 h-64 w-4/5 -translate-x-1/2"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(210 40% 45% / 0.08) 0%, transparent 70%)",
        }}
      />
    </section>
  );
}


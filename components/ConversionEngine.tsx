export function ConversionEngine() {
  const features = [
    {
      title: "Gap Detection",
      description:
        "Identifies missing value propositions, unclear positioning, and weak differentiation across your entire homepage.",
      tag: "Core",
    },
    {
      title: "Objection Coverage Analysis",
      description:
        "Maps every common buyer objection against your current copy to surface unanswered concerns that kill conversions.",
      tag: "Intelligence",
    },
    {
      title: "Pricing Clarity Score",
      description:
        "Evaluates your pricing page structure, tier naming, feature framing, and value communication for conversion friction.",
      tag: "Analysis",
    },
    {
      title: "Differentiation Map",
      description:
        "Visualizes where your messaging overlaps with competitors and where you can own positioning territory nobody else claims.",
      tag: "Strategy",
    },
  ];

  const gapRows = [
    {
      name: "Hero value proposition",
      severity: "Critical",
      pct: 22,
      color: "hsl(0 84% 60%)",
      badgeBg: "hsl(0 84% 60% / 0.12)",
    },
    {
      name: "Pricing tier framing",
      severity: "Warning",
      pct: 48,
      color: "hsl(43 74% 66%)",
      badgeBg: "hsl(43 74% 66% / 0.18)",
    },
    {
      name: "Security proof",
      severity: "Critical",
      pct: 19,
      color: "hsl(0 84% 60%)",
      badgeBg: "hsl(0 84% 60% / 0.12)",
    },
    {
      name: "ROI articulation",
      severity: "Moderate",
      pct: 61,
      color: "hsl(217 91% 60%)",
      badgeBg: "hsl(217 91% 60% / 0.12)",
    },
    {
      name: "Competitive differentiation",
      severity: "Critical",
      pct: 14,
      color: "hsl(0 84% 60%)",
      badgeBg: "hsl(0 84% 60% / 0.12)",
    },
  ];

  const benchmarks = [
    { label: "Clarity vs category", value: "42%", trend: "-12%" },
    { label: "Enterprise readiness", value: "58%", trend: "+6%" },
    { label: "Pricing confidence", value: "49%", trend: "-9%" },
  ];

  return (
    <section id="features" className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Feature Deep Dive
          </p>
          <h2 className="text-balance text-3xl font-bold leading-[1.15] tracking-tight text-foreground md:text-[2.75rem]">
            The SaaS Conversion
            <br />
            <span className="text-muted-foreground">Gap Engine</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground">
            A structured intelligence layer that goes beyond surface-level copy
            suggestions. Systematic analysis, not guesswork.
          </p>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left: Feature list */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group flex gap-5 rounded-2xl border border-border/60 bg-card p-6 transition-all duration-300 hover:border-border hover:bg-secondary/50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-mono text-sm font-bold text-primary">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="flex-1">
                  <div className="mb-1.5 flex items-center gap-2">
                    <h3 className="text-sm font-semibold tracking-tight text-foreground">
                      {feature.title}
                    </h3>
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                      {feature.tag}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Report preview - more realistic */}
          <div className="rounded-2xl bg-linear-to-b from-border/80 to-border/20 p-px">
            <div className="rounded-2xl bg-card">
              {/* Window chrome */}
              <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2.5">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-foreground/10" />
                  <div className="h-2 w-2 rounded-full bg-foreground/10" />
                  <div className="h-2 w-2 rounded-full bg-foreground/10" />
                </div>
                <div className="ml-3 flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">
                    Conversion Gap Report
                  </span>
                  <span className="rounded bg-chart-3/10 px-1.5 py-0.5 text-[8px] font-medium text-chart-3">
                    LIVE
                  </span>
                </div>
              </div>

              <div className="p-5">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      acme-saas.com
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Segment: Mid-market + Enterprise
                    </p>
                  </div>
                  <span className="rounded-md bg-secondary px-2 py-1 text-[10px] text-muted-foreground">
                    6 sources ingested
                  </span>
                </div>

                {/* Score overview */}
                <div className="mb-5 grid grid-cols-4 gap-3">
                  {[
                    { label: "Overall", value: "34", meta: "/100" },
                    { label: "Gaps Found", value: "12" },
                    { label: "Critical", value: "4" },
                    { label: "ETA to Fix", value: "6 days" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl bg-secondary p-3.5"
                    >
                      <p className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="mt-1 text-lg font-bold text-foreground">
                        {item.value}
                        {item.meta && (
                          <span className="text-[10px] text-muted-foreground">
                            {item.meta}
                          </span>
                        )}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mb-4 grid gap-4 md:grid-cols-5">
                  <div className="rounded-xl bg-secondary p-3.5 md:col-span-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground">
                        Priority gaps
                      </p>
                      <span className="text-[9px] text-muted-foreground">
                        Impact score
                      </span>
                    </div>
                    <div className="space-y-2">
                      {gapRows.map((gap) => (
                        <div
                          key={gap.name}
                          className="rounded-lg bg-card/60 p-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium text-foreground">
                              {gap.name}
                            </span>
                            <span
                              className="rounded px-2 py-0.5 text-[9px] font-semibold"
                              style={{
                                background: gap.badgeBg,
                                color: gap.color,
                              }}
                            >
                              {gap.severity}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="h-1 flex-1 rounded-full bg-muted">
                              <div
                                className="h-1 rounded-full"
                                style={{
                                  width: `${gap.pct}%`,
                                  background: gap.color,
                                }}
                              />
                            </div>
                            <span className="font-mono text-[9px] text-muted-foreground">
                              {gap.pct}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl bg-secondary p-3.5 md:col-span-2">
                    <p className="mb-2 text-[9px] font-medium uppercase tracking-widest text-muted-foreground">
                      Benchmarks
                    </p>
                    <div className="space-y-2.5">
                      {benchmarks.map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center justify-between"
                        >
                          <div>
                            <p className="text-[10px] text-muted-foreground">
                              {item.label}
                            </p>
                            <p className="text-sm font-semibold text-foreground">
                              {item.value}
                            </p>
                          </div>
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-semibold text-primary">
                            {item.trend}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <p className="text-[10px] font-medium text-foreground">
                        Recommended modules
                      </p>
                      <p className="text-[9px] text-muted-foreground">
                        Security proof, ROI framing, pricing anchors
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom action */}
                <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-3.5">
                  <div>
                    <span className="text-[11px] font-medium text-foreground">
                      Strategic rewrite ready
                    </span>
                    <p className="text-[9px] text-muted-foreground">
                      12 gaps addressed, 4 enterprise variants queued
                    </p>
                  </div>
                  <span className="rounded-lg bg-primary px-3 py-1.5 text-[10px] font-semibold text-primary-foreground">
                    View Rewrites
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

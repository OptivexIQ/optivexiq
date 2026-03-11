export function Methodology() {
  const principles = [
    {
      title: "Narrative signal capture",
      description: "Homepage, pricing, proof, and objections",
    },
    {
      title: "Market-relative scoring",
      description: "Competitive context, overlap, and confidence gaps",
    },
    {
      title: "Decision-ready prioritization",
      description: "Ranked actions for review, rewrites, and testing",
    },
  ];

  const outputs = ["Priority gaps", "Competitive overlap", "Objection coverage", "Rewrite recommendations"];

  const scope = [
    "Messaging diagnostics",
    "Competitive gap analysis",
    "Decision prioritization",
    "Rewrite workflows",
  ];

  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Credibility
          </p>
          <h2 className="text-balance text-3xl font-bold leading-[1.15] tracking-tight text-foreground md:text-[2.75rem]">
            The Confidence Gap Framework
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground">
            Capture narrative signals, score them in market context, then rank
            the confidence gaps most likely to slow evaluation or weaken pricing
            conviction.
          </p>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="rounded-2xl border border-border/60 bg-card p-7">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">How it works</p>
              <span className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                3-step framework
              </span>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {principles.map((item, index) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-border/60 bg-secondary/30 p-5"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 font-mono text-sm font-bold text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-7">
            <p className="text-sm font-semibold text-foreground">What teams get</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {outputs.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-border/60 bg-card/80 px-3 py-1.5 text-xs text-foreground/90"
                >
                  {item}
                </span>
              ))}
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Platform scope
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {scope.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-border/60 bg-secondary/40 px-3 py-1 text-xs text-foreground/90"
                >
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-6 rounded-xl border border-border/60 bg-card/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Boundaries
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Directional guidance for prioritization. Teams still review and
                test before rollout.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

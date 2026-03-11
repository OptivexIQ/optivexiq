export function PlatformArchitecture() {
  const layers = [
    {
      title: "Messaging diagnostics",
      description:
        "Inspect homepage and pricing narrative for clarity, overlap, proof gaps, and objection coverage.",
    },
    {
      title: "Competitive gap analysis",
      description:
        "Map where your story converges with the market and where you have a credible chance to differentiate.",
    },
    {
      title: "Decision prioritization",
      description:
        "Translate raw findings into a structured report with ranked actions and directional guidance.",
    },
    {
      title: "Rewrite workflows",
      description:
        "Generate, compare, and export candidate narratives before rollout or experimentation.",
    },
  ];

  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Platform Scope
          </p>
          <h2 className="text-balance text-3xl font-bold leading-[1.15] tracking-tight text-foreground md:text-[2.75rem]">
            Messaging diagnostics are the wedge.
            <br />
            <span className="text-muted-foreground">Conversion intelligence is the platform.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground">
            OptivexIQ starts where buyer-facing friction is easiest to observe,
            then extends that signal into prioritization and rewrite workflows
            teams can actually use.
          </p>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-4">
          {layers.map((layer, index) => (
            <div
              key={layer.title}
              className="rounded-2xl border border-border/60 bg-card p-6"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 font-mono text-sm font-bold text-primary">
                {String(index + 1).padStart(2, "0")}
              </div>
              <h3 className="mt-5 text-base font-semibold text-foreground">
                {layer.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {layer.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

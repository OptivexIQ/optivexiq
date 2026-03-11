export function Methodology() {
  const principles = [
    {
      title: "Competitive context first",
      description:
        "OptivexIQ evaluates your pages against the language your buyers are already seeing in-market, not in isolation.",
    },
    {
      title: "Structured diagnostic outputs",
      description:
        "Reports are organized around clarity, differentiation, pricing friction, and objection coverage so teams can prioritize action.",
    },
    {
      title: "Directional, not magical",
      description:
        "The system is designed to improve decision quality. It does not claim guaranteed lift or replace testing.",
    },
  ];

  const outputs = [
    "Priority gaps ranked by severity and likely buying impact",
    "Competitive overlap and differentiation signals",
    "Objection coverage and missing proof areas",
    "Rewrite recommendations tied to report findings",
  ];

  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Credibility
          </p>
          <h2 className="text-balance text-3xl font-bold leading-[1.15] tracking-tight text-foreground md:text-[2.75rem]">
            Built to support messaging decisions,
            <br />
            <span className="text-muted-foreground">not generate random copy</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground">
            OptivexIQ is most useful when teams need a structured way to inspect
            messaging risk, align on priorities, and evaluate rewrite options
            with real market context.
          </p>
        </div>

        <div className="mt-16 grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="rounded-2xl border border-border/60 bg-card p-7">
            <p className="text-sm font-semibold text-foreground">How the methodology works</p>
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
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-7">
            <p className="text-sm font-semibold text-foreground">What teams actually get</p>
            <ul className="mt-5 space-y-3">
              {outputs.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-primary" />
                  <span className="text-sm leading-relaxed text-foreground/90">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-xl border border-border/60 bg-card/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Important
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Scores and rewrite recommendations are directional guidance for
                prioritization. Teams should still review, adapt, and test before
                rollout.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

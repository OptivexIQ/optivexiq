export function Solution() {
  const steps = [
    {
      number: "01",
      title: "Enter Your Homepage + Competitors",
      description:
        "Paste your homepage URL and up to 5 competitor URLs. OptivexIQ crawls and ingests all positioning signals, CTAs, and value propositions.",
    },
    {
      number: "02",
      title: "OptivexIQ Maps Positioning Gaps",
      description:
        "Our engine identifies where your messaging overlaps, where critical value props are missing, and ranks gaps by conversion impact.",
    },
    {
      number: "03",
      title: "Get Strategic Rewrite with Rationale",
      description:
        "Receive conversion-optimized copy backed by competitive intelligence, positioning frameworks, and objection analysis.",
    },
    {
      number: "04",
      title: "Deploy Optimized Copy",
      description:
        "Export your report artifacts as JSON, HTML, PDF, or TXT and implement the recommendations in your CMS or dev workflow.",
    },
  ];

  return (
    <section id="solution" className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            How It Works
          </p>
          <h2 className="text-balance text-3xl font-bold leading-[1.15] tracking-tight text-foreground md:text-[2.75rem]">
            Turn Messaging Into a
            <br />
            <span className="text-muted-foreground">Conversion Engine</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground">
            Four steps from undifferentiated copy to strategic, high-converting
            SaaS messaging.
          </p>
        </div>

        <div className="relative mt-16 grid items-stretch gap-5 md:grid-cols-4">
          {/* Connecting line */}
          <div
            className="pointer-events-none absolute top-16 left-0 right-0 hidden h-px md:block"
            style={{
              background:
                "linear-gradient(to right, transparent, hsl(210 70% 55% / 0.3), hsl(175 60% 45% / 0.3), transparent)",
            }}
          />

          {steps.map((step, index) => (
            <div key={step.number} className="group relative h-full">
              {/* Step card */}
              <div className="flex h-full flex-col rounded-2xl border border-border/60 bg-card p-6 transition-all duration-300 hover:border-border hover:bg-secondary/50">
                {/* Number + connector dot */}
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 font-mono text-sm font-bold text-primary">
                    {step.number}
                  </div>
                  {index < 3 && (
                    <div className="hidden flex-1 md:block">
                      <div className="h-px w-full bg-linear-to-r from-border to-transparent" />
                    </div>
                  )}
                </div>
                <h3 className="mb-2 text-base font-semibold tracking-tight text-foreground">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

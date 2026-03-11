export function ProofSection() {
  const evidence = [
    "Observed overlap in category language across hero and pricing copy",
    "Missing trust and proof coverage in evaluation-critical sections",
    "Unanswered buyer objections tied to implementation and ROI confidence",
  ];

  const outputs = [
    "Executive diagnosis",
    "Priority gap list",
    "Competitive overlap view",
    "Rewrite recommendations",
  ];

  const commercialEffects = [
    "Slower evaluation when buyers cannot connect value to proof",
    "More pricing hesitation when packaging is clear but conviction is weak",
    "Lower win confidence when differentiation collapses into category language",
  ];

  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Proof Layer
          </p>
          <h2 className="text-balance text-3xl font-bold leading-[1.15] tracking-tight text-foreground md:text-[2.75rem]">
            What the platform actually produces
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground">
            The value is not generic AI output. It is a structured set of
            findings and decisions your team can review, challenge, and use.
          </p>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Sample diagnostic excerpt
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Illustrative anonymized output structure
                </p>
              </div>
              <span className="rounded-md bg-secondary px-2 py-1 text-xs text-foreground/90">
                Report section
              </span>
            </div>

            <div className="mt-5 space-y-5">
              <div className="rounded-xl border border-border/60 bg-secondary/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Executive diagnosis
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground">
                  Buyers can understand the category quickly, but the current
                  narrative does not build enough confidence in differentiated
                  value. Pricing reinforces packaging structure without fully
                  explaining why a buyer should trust the premium option, which
                  increases evaluation drag and weakens commercial conviction.
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-secondary/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Evidence signals
                </p>
                <ul className="mt-3 space-y-2">
                  {evidence.map((item) => (
                    <li key={item} className="text-sm text-foreground">
                      - {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Recommended next action
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground">
                  Rewrite the hero and pricing narrative around buyer confidence,
                  proof, and differentiation before expanding acquisition spend.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <p className="text-sm font-semibold text-foreground">
              Typical review package
            </p>
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
            <div className="mt-6 rounded-xl border border-border/60 bg-secondary/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Commercial impact layer
              </p>
              <ul className="mt-3 space-y-2">
                {commercialEffects.map((item) => (
                  <li key={item} className="text-sm leading-relaxed text-muted-foreground">
                    - {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

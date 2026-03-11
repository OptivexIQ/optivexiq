export function WhyNotChatGPT() {
  const rows = [
    {
      label: "Starts from your market context",
      optivex: "Uses your pages, competitor pages, and report context",
      generic: "Usually starts from a prompt with limited context",
    },
    {
      label: "Diagnoses before rewriting",
      optivex: "Finds overlap, missing proof, pricing friction, and objections first",
      generic: "Often jumps straight to drafting copy",
    },
    {
      label: "Produces structured outputs",
      optivex: "Returns a report, priorities, and rewrite workflow",
      generic: "Returns text that still needs manual framing",
    },
    {
      label: "Supports team review",
      optivex: "Designed for comparison, export, and implementation review",
      generic: "Works best as a solo drafting assistant",
    },
  ];

  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Differentiation
          </p>
          <h2 className="text-balance text-3xl font-bold leading-[1.15] tracking-tight text-foreground md:text-[2.75rem]">
            Why teams use this instead of
            <br />
            <span className="text-muted-foreground">just prompting ChatGPT</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground">
            ChatGPT can help write copy. OptivexIQ is designed to help teams
            diagnose where the message breaks, decide what to fix, and then test
            stronger options in a repeatable workflow.
          </p>
        </div>

        <div className="mt-16 overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] border-b border-border/60 bg-secondary/40">
            <div className="px-5 py-4 text-sm font-semibold text-foreground">
              Capability
            </div>
            <div className="px-5 py-4 text-sm font-semibold text-foreground">
              OptivexIQ
            </div>
            <div className="px-5 py-4 text-sm font-semibold text-foreground">
              Generic AI chat workflow
            </div>
          </div>
          {rows.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] border-b border-border/60 last:border-b-0"
            >
              <div className="px-5 py-4 text-sm font-medium text-foreground">
                {row.label}
              </div>
              <div className="px-5 py-4 text-sm leading-relaxed text-foreground/90">
                {row.optivex}
              </div>
              <div className="px-5 py-4 text-sm leading-relaxed text-muted-foreground">
                {row.generic}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

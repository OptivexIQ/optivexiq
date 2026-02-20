export function Problem() {
  const problems = [
    {
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9.75 9.75L4.5 19.5L14.25 14.25M9.75 9.75L14.25 14.25M9.75 9.75L12 2.25L14.25 9.75M14.25 14.25L21.75 12" />
        </svg>
      ),
      title: "Weak Homepage Clarity",
      description:
        "Your hero headline sounds like every other SaaS. Visitors can't tell what makes you different within 5 seconds, so they leave.",
      stat: "68%",
      statLabel: "of SaaS homepages fail the 5-second clarity test",
    },
    {
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Pricing Page Friction",
      description:
        "Your pricing page creates friction instead of clarity. Prospects don't understand what they're paying for or why your tiers exist.",
      stat: "42%",
      statLabel: "of high-intent leads lost due to pricing confusion",
    },
    {
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
      ),
      title: "Messaging Overlap",
      description:
        "You're using the same value propositions as your competitors. There's no strategic differentiation, just noise in a crowded market.",
      stat: "73%",
      statLabel: "messaging overlap with top 3 competitors",
    },
  ];

  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            The Problem
          </p>
          <h2 className="text-balance text-3xl font-bold leading-[1.15] tracking-tight text-foreground md:text-[2.75rem]">
            Most SaaS Founders Fix Features.
            <br />
            <span className="text-muted-foreground">Not Positioning.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground">
            You{"'"}re spending on ads, building features, and tweaking funnels,
            but your messaging is the real conversion bottleneck.
          </p>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {problems.map((problem) => (
            <div
              key={problem.title}
              className="group relative flex flex-col rounded-2xl border border-border/60 bg-card p-7 transition-all duration-300 hover:border-border hover:bg-secondary/50"
            >
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary/15">
                {problem.icon}
              </div>
              <h3 className="mb-2 text-base font-semibold tracking-tight text-foreground">
                {problem.title}
              </h3>
              <p className="mb-6 flex-1 text-sm leading-relaxed text-muted-foreground">
                {problem.description}
              </p>
              <div className="border-t border-border/60 pt-5">
                <p className="text-2xl font-bold text-foreground">
                  {problem.stat}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {problem.statLabel}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

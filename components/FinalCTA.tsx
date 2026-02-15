export function FinalCTA() {
  return (
    <section id="cta" className="relative py-24 md:py-32">
      {/* Dot grid background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, hsl(226 20% 94% / 0.03) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(210 40% 45% / 0.08) 0%, transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-border/60 bg-card/40 p-1">
            <div className="rounded-[1.15rem] bg-card p-10 text-center md:p-16">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Get Started
              </p>
              <h2 className="text-balance text-3xl font-bold leading-[1.15] tracking-tight text-foreground md:text-[2.5rem]">
                Fix Your SaaS Messaging Before You Spend Another Dollar on Ads.
              </h2>

              <p className="mx-auto mt-5 max-w-lg text-pretty text-base leading-relaxed text-muted-foreground">
                Stop guessing why your homepage isn{"'"}t converting. Get a
                data-backed analysis and strategic rewrite in minutes.
              </p>

              <div className="mt-10">
                <a
                  href="#free-audit"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-10 py-4 text-sm font-semibold text-primary-foreground shadow-md shadow-black/30 transition-all hover:bg-primary/90"
                >
                  Run Free Conversion Audit
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 18 18"
                    fill="none"
                    className="transition-transform group-hover:translate-x-0.5"
                  >
                    <path
                      d="M7 13L11 9L7 5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              </div>

              <p className="mt-5 text-xs text-muted-foreground">
                Takes 3 minutes. No credit card required.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

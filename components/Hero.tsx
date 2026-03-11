import Link from "next/link";
import { SubtleBackgroundGrid } from "@/components/ui/background-ripple-effect";
import { HeroDashboardPreview } from "@/components/HeroDashboardPreview";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28">
      {/* Subtle grid background + desktop cell hover effect */}
      <SubtleBackgroundGrid />

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
              Conversion Intelligence Platform for B2B SaaS
            </span>
          </div>

          <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-[3.6rem] lg:text-[4.15rem]">
            See where your SaaS
            <br className="hidden sm:block" />
            <span className="text-primary">messaging loses buyers</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg md:leading-relaxed">
            OptivexIQ is a conversion intelligence platform that analyzes your
            homepage and pricing in competitive context, surfaces overlap,
            missing proof, and unanswered objections, then helps your team test
            rewrite options before rollout.
          </p>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Built around a report-first workflow: diagnose gaps, review
            evidence, then move into Rewrite Studio.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/#free-snapshot"
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-md shadow-black/30 transition-all hover:bg-primary/90"
            >
              <span className="relative z-20 flex items-center gap-2">
                Run Free Messaging Snapshot
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
              className="relative z-20 inline-flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-card/50 px-8 py-3.5 text-sm font-medium text-foreground backdrop-blur-sm transition-all hover:border-border hover:bg-secondary"
            >
              See How It Works
            </Link>
          </div>
        </div>

        <HeroDashboardPreview />
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

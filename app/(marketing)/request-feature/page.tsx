import Link from "next/link";
import { FeedbackIntakeForm } from "@/features/feedback/components/FeedbackIntakeForm";

export const metadata = {
  title: "Request a Feature | OptivexIQ",
  description:
    "Submit product feature requests and bug reports to the OptivexIQ team.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RequestFeaturePage() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 py-42">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at top, hsl(210 60% 50% / 0.12), transparent 62%)",
        }}
      />

      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Product Feedback
        </p>
        <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          Request a feature or report a bug
        </h1>
        <p className="mt-5 text-base leading-relaxed text-muted-foreground">
          Submit structured product feedback to help us prioritize roadmap work
          and reliability fixes. Use this page for feature requests and
          reproducible bug reports.
        </p>
      </header>

      <section className="mt-12 grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:items-start">
        <FeedbackIntakeForm />

        <aside className="space-y-6">
          <div className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-sm backdrop-blur">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground">
              Triage policy
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                Critical bugs are reviewed first and escalated immediately.
              </li>
              <li>
                Feature requests are reviewed weekly with product and
                engineering.
              </li>
              <li>Duplicate submissions are merged during intake.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-sm backdrop-blur">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground">
              Response expectations
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Critical bug acknowledgement: within 24 hours.</li>
              <li>Standard bug acknowledgement: within 2 business days.</li>
              <li>Feature request acknowledgement: within 3 business days.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-sm backdrop-blur">
            <p className="text-xs leading-relaxed text-muted-foreground">
              For account, billing, legal, or security matters, use{" "}
              <Link href="/contact" className="text-primary hover:underline">
                Contact
              </Link>{" "}
              instead of this form.
            </p>
          </div>
        </aside>
      </section>
    </section>
  );
}

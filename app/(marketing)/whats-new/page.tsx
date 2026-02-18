export const metadata = {
  title: "What's New | OptivexIQ",
  description: "Release notes and platform updates for OptivexIQ.",
};

const releases = [
  {
    version: "v1.9.0",
    date: "February 17, 2026",
    summary: "Public operations pages and contact intake hardening",
    changes: [
      "Published production business pages for Help Center, Terms, Privacy, Status, About, and Contact.",
      "Added server-validated contact form with anti-bot honeypot and database-backed intake.",
      "Applied request-level rate limiting to contact submissions.",
    ],
  },
  {
    version: "v1.8.0",
    date: "February 16, 2026",
    summary: "Free Conversion Audit execution lifecycle stabilization",
    changes: [
      "Added persisted execution stage tracking for free snapshot generation.",
      "Improved running/completed/failure UX with real backend state transitions.",
      "Expanded PDF and email delivery flow reliability.",
    ],
  },
  {
    version: "v1.7.0",
    date: "February 14, 2026",
    summary: "Canonical report contract enforcement",
    changes: [
      "Standardized report write path to canonical report_data structure.",
      "Removed compatibility envelope handling on report reads.",
      "Added legacy backfill support for envelope-shaped historical records.",
    ],
  },
  {
    version: "v1.6.0",
    date: "February 10, 2026",
    summary: "Durable queue-backed report processing",
    changes: [
      "Replaced fire-and-forget report processing with durable job queue semantics.",
      "Added cron/worker processing route for retry-safe execution.",
      "Improved deterministic failure transitions and status observability.",
    ],
  },
];

export default function WhatsNewPage() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-42">
      <h1 className="text-3xl font-semibold text-foreground">
        What&apos;s New
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Release notes for production changes affecting product behavior,
        reliability, and operations.
      </p>

      <div className="mt-10 space-y-10">
        {releases.map((release) => (
          <article
            key={release.version}
            className="border-b border-border/50 pb-8"
          >
            <div className="flex flex-wrap items-center gap-3">
              <p className="rounded bg-secondary px-2 py-1 text-xs font-semibold text-foreground">
                {release.version}
              </p>
              <p className="text-xs text-muted-foreground">{release.date}</p>
            </div>
            <h2 className="mt-3 text-lg font-semibold text-foreground">
              {release.summary}
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              {release.changes.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

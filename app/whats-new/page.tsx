export const metadata = {
  title: "What's New | OptivexIQ",
  description: "Product and platform changelog for OptivexIQ.",
};

const updates = [
  {
    date: "February 16, 2026",
    title: "Free Conversion Audit pipeline hardening",
    details:
      "Added durable execution stages, strict schema validation, and email-gated PDF delivery for snapshot flows.",
  },
  {
    date: "February 14, 2026",
    title: "Canonical report contract enforcement",
    details:
      "Report writes and reads now enforce a strict canonical report_data schema with migration backfill support.",
  },
  {
    date: "February 10, 2026",
    title: "Job queue durability for report execution",
    details:
      "Moved report execution to a database-backed queue with worker processing and retry-safe lifecycle transitions.",
  },
];

export default function WhatsNewPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <h1 className="text-3xl font-semibold text-foreground">What&apos;s New</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Product updates and platform reliability improvements.
      </p>

      <div className="mt-10 space-y-8">
        {updates.map((item) => (
          <article key={`${item.date}-${item.title}`} className="border-b border-border/50 pb-8">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {item.date}
            </p>
            <h2 className="mt-2 text-lg font-semibold text-foreground">{item.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {item.details}
            </p>
          </article>
        ))}
      </div>
    </main>
  );
}

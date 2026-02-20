import { whatsNewReleases } from "@/data/whatsNew";
import { AppInfo } from "@/lib/config/appInfo";

export const metadata = {
  title: "What's New | OptivexIQ",
  description:
    "Customer-facing release notes for OptivexIQ with product improvements, fixes, and operational updates.",
};

export default function WhatsNewPage() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-42">
      <h1 className="text-3xl font-semibold text-foreground">
        What&apos;s New
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        This page tracks customer-facing product updates, reliability
        improvements, and operational changes. Entries are ordered by release
        date, newest first.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        App version: v{AppInfo.version}. Release note versions describe product
        update batches and may not match app build version numbers.
      </p>

      <div className="mt-10 space-y-10">
        {whatsNewReleases.map((release) => (
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
            <div className="mt-4 space-y-4">
              {release.sections.map((section) => (
                <div key={`${release.version}-${section.label}`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground">
                    {section.label}
                  </p>
                  <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                    {section.items.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

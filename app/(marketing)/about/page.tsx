export const metadata = {
  title: "About | OptivexIQ",
  description: "Company mission, product scope, and operating principles.",
};

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-42">
      <h1 className="text-3xl font-semibold text-foreground">
        About OptivexIQ
      </h1>

      <section className="mt-8 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          OptivexIQ is a SaaS conversion intelligence platform. We analyze
          website messaging, competitor positioning, and conversion friction,
          then produce structured recommendations for teams responsible for
          growth performance.
        </p>
        <p>
          The product is built for operators who need defensible output:
          founders, growth leads, product marketers, and revenue teams. Reports
          are generated from live scraping and AI-assisted synthesis, not static
          templates.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-foreground">Mission</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Reduce messaging uncertainty in B2B SaaS decision cycles. We aim to
          make positioning and conversion diagnosis measurable, comparable, and
          operationally actionable.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-foreground">
          What We Deliver
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>
            Conversion gap reports based on real site and competitor inputs.
          </li>
          <li>
            Positioning map and messaging overlap analysis for market context.
          </li>
          <li>
            Rewrite recommendations prioritized by likely conversion impact.
          </li>
          <li>Durable report execution with explicit lifecycle tracking.</li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-foreground">
          Operating Principles
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Evidence over assumptions.</li>
          <li>Canonical data contracts over compatibility shortcuts.</li>
          <li>Server-side guardrails for billing, quota, and authorization.</li>
          <li>
            Transparent failure states instead of silent fallback behavior.
          </li>
        </ul>
      </section>
    </section>
  );
}

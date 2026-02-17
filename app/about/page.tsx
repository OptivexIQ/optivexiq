export const metadata = {
  title: "About | OptivexIQ",
  description: "About OptivexIQ and our conversion intelligence mission.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <h1 className="text-3xl font-semibold text-foreground">About OptivexIQ</h1>
      <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
        OptivexIQ helps SaaS teams diagnose conversion gaps using structured AI
        analysis, competitor synthesis, and execution-ready messaging guidance.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        The platform is built for founders, growth teams, and product marketers
        who need clear positioning signals and reliable conversion intelligence
        without guesswork.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        We focus on operational rigor: deterministic scoring, canonical report
        contracts, durable background execution, and strict billing integrity.
      </p>
    </main>
  );
}

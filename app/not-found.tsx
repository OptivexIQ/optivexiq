import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RootNotFoundPage() {
  return (
    <section className="relative flex min-h-[70vh] items-center justify-center px-6 py-42">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at top, hsl(210 60% 50% / 0.14), transparent 62%)",
        }}
      />

      <div className="w-full max-w-4xl rounded-2xl border border-border/70 bg-card/70 p-8 shadow-sm backdrop-blur md:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          Error 404
        </p>
        <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          The page you requested was not found.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          The URL may be incorrect, outdated, or removed. Continue from homepage
          or jump into your dashboard workspace.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <Link href="/">Back to Homepage</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/dashboard">Open Dashboard</Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href="/contact">Contact Support</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

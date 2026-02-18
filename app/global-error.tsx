"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <section className="relative flex min-h-screen items-center justify-center px-6 py-42">
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(ellipse at top, hsl(210 60% 50% / 0.14), transparent 62%)",
            }}
          />
          <div className="w-full max-w-3xl rounded-2xl border border-border/70 bg-card/70 p-8 shadow-sm backdrop-blur md:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              Unexpected error
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Something went wrong while loading this page.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              The issue has been logged. Retry, go back to dashboard, or return
              to homepage.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={reset}>Try again</Button>
              <Button asChild variant="outline">
                <Link href="/dashboard">Open Dashboard</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/">Back to Homepage</Link>
              </Button>
            </div>
          </div>
        </section>
      </body>
    </html>
  );
}

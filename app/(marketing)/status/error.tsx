"use client";

export default function StatusError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <div className="rounded-xl border border-border/70 p-6">
        <h1 className="text-xl font-semibold text-foreground">System Status</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Unable to load status. Please refresh.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 text-sm font-medium text-primary underline underline-offset-4"
        >
          Try again
        </button>
      </div>
    </section>
  );
}

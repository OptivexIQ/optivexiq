export default function StatusLoading() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <div className="space-y-4">
        <div className="h-8 w-56 animate-pulse rounded bg-muted" />
        <div className="h-5 w-80 animate-pulse rounded bg-muted" />
      </div>
      <div className="mt-8 h-28 animate-pulse rounded-xl bg-muted" />
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-40 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </section>
  );
}

export const metadata = {
  title: "System Status | OptivexIQ",
  description: "Current operational status for OptivexIQ services.",
};

export default function StatusPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <h1 className="text-3xl font-semibold text-foreground">System Status</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        All core services are currently operational.
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        For urgent incidents, contact <a className="text-primary hover:underline" href="mailto:support@optivexiq.com">support@optivexiq.com</a>.
      </p>
    </main>
  );
}

export const metadata = {
  title: "Terms of Service | OptivexIQ",
  description: "Terms governing use of OptivexIQ services.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <h1 className="text-3xl font-semibold text-foreground">Terms of Service</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        These terms govern access to and use of OptivexIQ, including the Free Conversion Audit,
        paid subscriptions, and exports.
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        Questions can be sent to <a className="text-primary hover:underline" href="mailto:legal@optivexiq.com">legal@optivexiq.com</a>.
      </p>
    </main>
  );
}

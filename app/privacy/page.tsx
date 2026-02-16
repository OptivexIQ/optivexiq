export const metadata = {
  title: "Privacy Policy | OptivexIQ",
  description: "How OptivexIQ collects and processes data.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <h1 className="text-3xl font-semibold text-foreground">Privacy Policy</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        OptivexIQ processes account and website analysis data to deliver product functionality,
        support, security, and billing operations.
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        For privacy requests, contact <a className="text-primary hover:underline" href="mailto:privacy@optivexiq.com">privacy@optivexiq.com</a>.
      </p>
    </main>
  );
}

export const metadata = {
  title: "Contact | OptivexIQ",
  description: "Contact OptivexIQ sales and support.",
};

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <h1 className="text-3xl font-semibold text-foreground">Contact</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Reach out for enterprise pricing, sales questions, or support.
      </p>

      <div className="mt-8 space-y-4 text-sm text-muted-foreground">
        <p>
          Sales:{" "}
          <a className="text-primary hover:underline" href="mailto:sales@optivexiq.com">
            sales@optivexiq.com
          </a>
        </p>
        <p>
          Support:{" "}
          <a className="text-primary hover:underline" href="mailto:support@optivexiq.com">
            support@optivexiq.com
          </a>
        </p>
        <p>
          Privacy:{" "}
          <a className="text-primary hover:underline" href="mailto:privacy@optivexiq.com">
            privacy@optivexiq.com
          </a>
        </p>
      </div>
    </main>
  );
}

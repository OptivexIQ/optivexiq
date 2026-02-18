import Link from "next/link";
import { ContactForm } from "@/features/contact/components/ContactForm";

export const metadata = {
  title: "Contact | OptivexIQ",
  description: "Contact OptivexIQ support, sales, legal, and security teams.",
};

export default function ContactPage() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 py-42">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at top, hsl(210 60% 50% / 0.12), transparent 58%)",
        }}
      />
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Contact
        </p>
        <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          Talk to the right team, fast.
        </h1>
        <p className="mt-5 text-base leading-relaxed text-muted-foreground">
          Use the form below for support, sales, billing, legal, or security
          requests. We route submissions to the responsible team and keep a
          service record for follow-up.
        </p>
      </header>

      <section className="mt-12 grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:items-start">
        <ContactForm />

        <aside className="space-y-6">
          <div className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-sm backdrop-blur">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground">
              Response targets
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Support and billing: within 1 business day</li>
              <li>Sales inquiries: within 1 business day</li>
              <li>Legal and privacy requests: within 3 business days</li>
              <li>Security disclosure acknowledgement: within 24 hours</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-sm backdrop-blur">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground">
              Direct mailboxes
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                Support:{" "}
                <a
                  className="text-primary hover:underline"
                  href="mailto:support@optivexiq.com"
                >
                  support@optivexiq.com
                </a>
              </li>
              <li>
                Sales:{" "}
                <a
                  className="text-primary hover:underline"
                  href="mailto:sales@optivexiq.com"
                >
                  sales@optivexiq.com
                </a>
              </li>
              <li>
                Legal:{" "}
                <a
                  className="text-primary hover:underline"
                  href="mailto:legal@optivexiq.com"
                >
                  legal@optivexiq.com
                </a>
              </li>
              <li>
                Privacy:{" "}
                <a
                  className="text-primary hover:underline"
                  href="mailto:privacy@optivexiq.com"
                >
                  privacy@optivexiq.com
                </a>
              </li>
              <li>
                Security:{" "}
                <a
                  className="text-primary hover:underline"
                  href="mailto:security@optivexiq.com"
                >
                  security@optivexiq.com
                </a>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-sm backdrop-blur">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Do not send passwords, API keys, or payment card details by email.
              Review our{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>{" "}
              before sharing personal information.
            </p>
          </div>
        </aside>
      </section>
    </section>
  );
}

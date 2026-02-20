import Link from "next/link";
import { ContactForm } from "@/features/contact/components/ContactForm";
import {
  CONTACT_CHANNELS,
  CONTACT_OPTIONS,
  CONTACT_QUICK_LINKS,
  CONTACT_RESPONSE_EXPECTATIONS,
  CONTACT_TRUST_SIGNALS,
} from "@/features/contact/constants/contactPageContent";

export const metadata = {
  title: "Contact | OptivexIQ",
  description:
    "Official contact hub for support, sales, billing, legal, privacy, and security requests.",
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

      <header className="max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Contact</p>
        <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          Talk to the right team
        </h1>
        <p className="mt-5 text-base leading-relaxed text-muted-foreground">
          Contact the team that can help you fastest. Send your request here and we will route it to the appropriate team based on your topic.
        </p>
      </header>

      <section className="mt-10 rounded-2xl border border-border/70 bg-card/70 p-6 shadow-sm backdrop-blur">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground">Self-service first</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {CONTACT_QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-border/70 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Contact options</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CONTACT_OPTIONS.map((option) => (
            <article key={option.title} className="rounded-xl border border-border/70 bg-card/70 p-5 shadow-sm">
              <h3 className="text-base font-semibold text-foreground">{option.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{option.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:items-start">
        <div className="space-y-4">
          <ContactForm />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Your message is reviewed by a human and routed to the right team. We prioritize security, billing, and access issues appropriately. For policy details, review our{" "}
            <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> and{" "}
            <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>.
          </p>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-sm backdrop-blur">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground">Typical response times</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {CONTACT_RESPONSE_EXPECTATIONS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Complex legal or security matters may require additional review time.
            </p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-sm backdrop-blur">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground">Direct channels</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {CONTACT_CHANNELS.map((email) => (
                <li key={email}>
                  <a className="text-primary hover:underline" href={`mailto:${email}`}>
                    {email}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              If your organization requires direct email communication, use these addresses. For the fastest routing and complete context, the form above is recommended. Do not send passwords, API keys, or payment data by email.
            </p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-sm backdrop-blur">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground">Trust and operations</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {CONTACT_TRUST_SIGNALS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/70 p-6 shadow-sm backdrop-blur">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground">Enterprise and procurement</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              For larger-team evaluations, sales can support vendor onboarding, legal review, security questionnaires, and commercial discussions.
            </p>
          </div>
        </aside>
      </section>
    </section>
  );
}

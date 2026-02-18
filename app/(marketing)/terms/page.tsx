import Link from "next/link";

export const metadata = {
  title: "Terms of Service | OptivexIQ",
  description: "Terms governing use of OptivexIQ services.",
};

const lastUpdated = "February 17, 2026";

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-42">
      <h1 className="text-3xl font-semibold text-foreground">
        Terms of Service
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Last updated: {lastUpdated}
      </p>

      <section className="mt-8 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          These Terms of Service govern your use of OptivexIQ. By creating an
          account, accessing the platform, or purchasing a plan, you agree to
          these terms.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          1. Service Scope
        </h2>
        <p className="text-sm text-muted-foreground">
          OptivexIQ provides conversion intelligence outputs, including website
          analysis, competitor synthesis, scoring, and recommendations. The
          service is provided on an as-available basis and may change over time.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          2. Accounts and Access
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>
            You are responsible for account credentials and all activity under
            your account.
          </li>
          <li>
            You must provide accurate registration and billing information.
          </li>
          <li>
            We may suspend or terminate access for fraud, abuse, or violations
            of these terms.
          </li>
        </ul>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          3. Plans, Billing, and Renewals
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>
            Starter is a one-time purchase unless explicitly stated otherwise.
          </li>
          <li>Pro and Growth are recurring subscriptions billed per cycle.</li>
          <li>
            Downgrades and cancellations are managed in Billing and apply per
            plan policy.
          </li>
          <li>
            Payments are processed by LemonSqueezy; you also agree to their
            applicable checkout terms.
          </li>
        </ul>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          4. Acceptable Use
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>
            No unlawful activity, credential abuse, scraping abuse, or attempts
            to bypass limits.
          </li>
          <li>
            No reverse engineering or interference with platform integrity or
            availability.
          </li>
          <li>
            No upload or submission of malicious payloads or prohibited content.
          </li>
        </ul>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          5. Intellectual Property
        </h2>
        <p className="text-sm text-muted-foreground">
          OptivexIQ and its software, models, and documentation are our property
          or licensed to us. You retain rights to your submitted data. You
          receive a limited, non-exclusive right to use the service while your
          account is active and in good standing.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          6. Disclaimers
        </h2>
        <p className="text-sm text-muted-foreground">
          Outputs are decision-support information and do not constitute legal,
          financial, or tax advice. You are responsible for evaluating
          recommendations before implementation.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          7. Limitation of Liability
        </h2>
        <p className="text-sm text-muted-foreground">
          To the maximum extent permitted by law, OptivexIQ is not liable for
          indirect, incidental, special, consequential, or punitive damages, or
          for lost profits or revenues. Our aggregate liability for claims
          related to the service is limited to amounts paid by you in the prior
          twelve months.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          8. Termination
        </h2>
        <p className="text-sm text-muted-foreground">
          You may stop using the service at any time. We may terminate or
          suspend access for material violations, fraudulent activity, or
          security risk. Sections that by nature should survive termination
          remain in effect.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold text-foreground">9. Contact</h2>
        <p className="text-sm text-muted-foreground">
          Questions about these terms:{" "}
          <a
            className="text-primary hover:underline"
            href="mailto:legal@optivexiq.com"
          >
            legal@optivexiq.com
          </a>
          . For support operations, visit{" "}
          <Link href="/contact" className="text-primary hover:underline">
            Contact
          </Link>
          .
        </p>
      </section>
    </section>
  );
}

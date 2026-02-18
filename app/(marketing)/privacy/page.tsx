export const metadata = {
  title: "Privacy Policy | OptivexIQ",
  description:
    "How OptivexIQ collects, uses, shares, and protects personal data.",
};

const lastUpdated = "February 17, 2026";

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-42">
      <h1 className="text-3xl font-semibold text-foreground">Privacy Policy</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Last updated: {lastUpdated}
      </p>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          1. Data Controller
        </h2>
        <p className="text-sm text-muted-foreground">
          OptivexIQ controls personal data processed through this service. For
          privacy matters, contact{" "}
          <a
            className="text-primary hover:underline"
            href="mailto:privacy@optivexiq.com"
          >
            privacy@optivexiq.com
          </a>
          .
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          2. Data We Collect
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Account data: name, email, authentication identifiers.</li>
          <li>
            Billing data: plan, subscription status, provider identifiers.
          </li>
          <li>
            Usage data: report requests, snapshot events, timestamps, request
            metadata.
          </li>
          <li>
            Website analysis inputs: URLs and content retrieved for analysis
            workflows.
          </li>
          <li>
            Support data: contact form submissions and correspondence records.
          </li>
        </ul>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          3. How We Use Data
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Deliver and operate product functionality.</li>
          <li>Process billing, enforce quotas, and prevent abuse.</li>
          <li>Provide support, legal responses, and security handling.</li>
          <li>
            Maintain reliability, audit integrity, and investigate incidents.
          </li>
        </ul>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          4. Legal Bases (GDPR)
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>
            Performance of a contract (service delivery and account operations).
          </li>
          <li>
            Legitimate interests (security, fraud prevention, reliability).
          </li>
          <li>Legal obligations (financial records, compliance duties).</li>
          <li>Consent where required by law (for optional communications).</li>
        </ul>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          5. Data Sharing and Processors
        </h2>
        <p className="text-sm text-muted-foreground">
          We share data only with providers required to operate the service (for
          example hosting, database, authentication, payments, email delivery,
          and AI processing). We do not sell personal data. Providers process
          data under contractual obligations.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          6. International Transfers
        </h2>
        <p className="text-sm text-muted-foreground">
          Data may be processed outside your jurisdiction. Where required, we
          rely on appropriate safeguards such as standard contractual clauses
          and equivalent transfer mechanisms.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold text-foreground">7. Retention</h2>
        <p className="text-sm text-muted-foreground">
          We retain personal data only as long as needed for service delivery,
          legal obligations, dispute resolution, and security investigation.
          Retention periods depend on data type and regulatory requirements.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          8. Your Rights
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Access, correction, deletion, and portability requests.</li>
          <li>Restriction or objection to certain processing activities.</li>
          <li>Withdrawal of consent where processing relies on consent.</li>
          <li>
            Lodging a complaint with a supervisory authority where applicable.
          </li>
        </ul>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold text-foreground">9. Security</h2>
        <p className="text-sm text-muted-foreground">
          We implement technical and organizational safeguards to protect data
          integrity and confidentiality, including authenticated access
          controls, server-side guardrails, and operational monitoring. No
          system is absolutely secure.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold text-foreground">10. Contact</h2>
        <p className="text-sm text-muted-foreground">
          Privacy inquiries and rights requests:{" "}
          <a
            className="text-primary hover:underline"
            href="mailto:privacy@optivexiq.com"
          >
            privacy@optivexiq.com
          </a>
          .
        </p>
      </section>
    </section>
  );
}

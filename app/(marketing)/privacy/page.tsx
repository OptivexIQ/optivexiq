import Link from "next/link";
import type { ReactNode } from "react";
import { LegalToc, type LegalTocItem } from "@/components/legal/LegalToc";

export const metadata = {
  title: "Privacy Policy | OptivexIQ",
  description:
    "GDPR privacy notice for OptivexIQ, including AI processing, website analysis, and international transfers.",
};

const lastUpdated = "February 18, 2026";

const tocItems: LegalTocItem[] = [
  { id: "controller-identity", label: "1. Controller Identity" },
  { id: "definitions", label: "2. Definitions" },
  { id: "data-categories", label: "3. Data Categories" },
  { id: "purposes-legal-bases", label: "4. Purposes & Legal Bases" },
  { id: "processors-recipients", label: "5. Processors & Recipients" },
  { id: "international-transfers", label: "6. International Transfers" },
  { id: "ai-processing", label: "7. AI & Website Analysis" },
  { id: "automated-decisioning", label: "8. Automated Decision-Making" },
  { id: "cookies-analytics", label: "9. Cookies & Analytics" },
  { id: "data-subject-rights", label: "10. Data Subject Rights" },
  { id: "exercise-rights", label: "11. Exercise Rights" },
  { id: "complaints", label: "12. Complaints" },
  { id: "security-measures", label: "13. Security Measures" },
  { id: "breach-handling", label: "14. Data Breach Handling" },
  { id: "retention", label: "15. Retention" },
  { id: "children", label: "16. Children" },
  { id: "policy-versioning", label: "17. Policy Changes" },
];

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-xl font-semibold text-foreground">{children}</h2>;
}

function SubTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-base font-semibold text-foreground">{children}</h3>
  );
}

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-42">
      <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
        <aside className="hidden lg:block">
          <LegalToc
            title="Privacy contents"
            items={tocItems}
            className="sticky top-24"
          />
        </aside>

        <article className="min-w-0">
          <h1 className="text-3xl font-semibold text-foreground">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
          <div className="mt-6 lg:hidden">
            <LegalToc title="Jump to section" items={tocItems} />
          </div>

          <section
            id="controller-identity"
            className="mt-8 scroll-mt-28 space-y-4 text-sm text-muted-foreground"
          >
            <SectionTitle>1. Controller Identity</SectionTitle>
            <p>
              This Privacy Policy applies to OptivexIQ and its SaaS platform.
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Legal entity: [LEGAL ENTITY NAME]</li>
              <li>Registered address: [REGISTERED ADDRESS]</li>
              <li>Registration number: [COMPANY REGISTRATION NUMBER]</li>
              <li>VAT number: [VAT NUMBER]</li>
              <li>Privacy contact: [privacy@yourdomain.com]</li>
              <li>General support: [support@yourdomain.com]</li>
            </ul>
            <p>
              <span className="font-medium text-foreground">
                Data Protection Officer (Art. 37 GDPR):
              </span>{" "}
              At this stage, we have determined that formal DPO appointment is
              not mandatory based on current processing scope and scale. We
              monitor this assessment and will appoint a DPO if legal thresholds
              are met. Privacy-related requests should be sent to
              {" [privacy@yourdomain.com]"}.
            </p>
          </section>

          <section
            id="definitions"
            className="mt-10 scroll-mt-28 space-y-4 text-sm text-muted-foreground"
          >
            <SectionTitle>2. Definitions</SectionTitle>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <span className="font-medium text-foreground">Controller:</span>{" "}
                the entity deciding why and how personal data is processed.
              </li>
              <li>
                <span className="font-medium text-foreground">Processor:</span>{" "}
                a third party processing personal data on our behalf.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Personal data:
                </span>{" "}
                any information related to an identified or identifiable natural
                person.
              </li>
              <li>
                <span className="font-medium text-foreground">Customer:</span> a
                business user or organization using our services.
              </li>
              <li>
                <span className="font-medium text-foreground">Service:</span>{" "}
                the OptivexIQ web platform, APIs, reports, and related
                operations.
              </li>
            </ul>
          </section>

          <section
            id="data-categories"
            className="mt-10 scroll-mt-28 space-y-4 text-sm text-muted-foreground"
          >
            <SectionTitle>3. Categories of Data We Process</SectionTitle>
            <SubTitle>3.1 Account and identity data</SubTitle>
            <p>
              Name, email address, authentication identifiers, account role,
              organization profile data, and account lifecycle timestamps.
            </p>

            <SubTitle>3.2 Billing and subscription data</SubTitle>
            <p>
              Plan selection, billing status, payment provider customer and
              subscription IDs, transaction references, invoices, tax-related
              records, and anti-fraud signals.
            </p>

            <SubTitle>3.3 Service usage and technical data</SubTitle>
            <p>
              Request logs, usage counters, rate-limit events, IP address,
              device or browser metadata, security event logs, and service
              diagnostics.
            </p>

            <SubTitle>3.4 Analysis input data</SubTitle>
            <p>
              Submitted website URLs, optional competitor URLs, optional
              analysis context, and content extracted from publicly accessible
              pages for conversion analysis workflows.
            </p>

            <SubTitle>3.5 AI processing data</SubTitle>
            <p>
              Prompt inputs and structured outputs needed to generate reports,
              diagnostics, scoring, summaries, and recommendations.
            </p>

            <SubTitle>3.6 Support and communications data</SubTitle>
            <p>
              Contact form submissions, support conversations, feedback
              requests, issue reports, and response metadata.
            </p>
          </section>

          <section
            id="purposes-legal-bases"
            className="mt-10 scroll-mt-28 space-y-4 text-sm text-muted-foreground"
          >
            <SectionTitle>
              4. Purposes, Principles, and Legal Bases
            </SectionTitle>
            <p>
              We process personal data in accordance with Article 5 GDPR
              principles: lawfulness, fairness, and transparency; purpose
              limitation; data minimization; accuracy; storage limitation;
              integrity and confidentiality; and accountability. We apply a
              risk-based approach to technical and organizational controls based
              on processing sensitivity and potential impact on data subjects.
            </p>
            <div className="space-y-3">
              <p>
                <span className="font-medium text-foreground">
                  Contract performance (Art. 6(1)(b)):
                </span>{" "}
                account provisioning, subscription management, report
                generation, feature delivery, and customer support.
              </p>
              <p>
                <span className="font-medium text-foreground">
                  Legitimate interests (Art. 6(1)(f)):
                </span>{" "}
                service security, abuse prevention, operational monitoring,
                reliability, product improvement, and incident response.
              </p>
              <p>
                For processing based on legitimate interests, we perform and
                document balancing assessments considering necessity,
                proportionality, and impact on data subjects. You have the right
                to object to such processing under Article 21 GDPR.
              </p>
              <p>
                <span className="font-medium text-foreground">
                  Legal obligation (Art. 6(1)(c)):
                </span>{" "}
                tax/accounting retention, compliance response, and lawful
                disclosure duties.
              </p>
              <p>
                <span className="font-medium text-foreground">
                  Consent (Art. 6(1)(a)), where required:
                </span>{" "}
                optional communications and non-essential cookies/analytics
                where local law requires consent.
              </p>
            </div>
          </section>

          <section
            id="processors-recipients"
            className="mt-10 scroll-mt-28 space-y-4 text-sm text-muted-foreground"
          >
            <SectionTitle>5. Data Processors and Recipients</SectionTitle>
            <p>
              We use vetted processors to operate the service. Typical
              categories include hosting and infrastructure, database and
              authentication, payment processing (LemonSqueezy), email delivery,
              AI model APIs, and observability tools. Processors are bound by
              contractual and security obligations.
            </p>
            <p>
              We may also disclose data to public authorities where legally
              required, or in connection with legal claims, audits, or corporate
              transactions.
            </p>
            <p>
              Where required, we provide a Data Processing Agreement (DPA) for
              customer review and execution. For customer-submitted URLs and
              analysis content, OptivexIQ acts as a processor/service provider
              for instructed analysis workflows. Customers remain responsible
              for ensuring they have lawful rights and legal basis to submit
              URLs and related content for processing.
            </p>
            <p>
              We may use anonymized and aggregated usage information, which does
              not identify individuals or specific customers, for service
              reliability, security, and product improvement.
            </p>
            <p>
              Our subprocessor list is available upon request at
              {" [privacy@yourdomain.com]"} and may be updated as operational
              needs evolve. For material subprocessor changes affecting data
              handling, we provide advance notice through appropriate customer
              communication channels where feasible.
            </p>
          </section>

          <section
            id="international-transfers"
            className="mt-10 scroll-mt-28 space-y-4 text-sm text-muted-foreground"
          >
            <SectionTitle>6. International Data Transfers</SectionTitle>
            <p>
              When data is transferred outside the EEA/UK/Switzerland, we apply
              lawful safeguards such as the European Commission Standard
              Contractual Clauses (SCCs), adequacy decisions where available,
              and additional technical/organizational controls appropriate to
              transfer risk.
            </p>
            <p>
              Transfer safeguards are supported by risk-based controls including
              contractual controls, access restrictions, encryption safeguards,
              and vendor due diligence proportionate to transfer risk.
            </p>
          </section>

          <section
            id="ai-processing"
            className="mt-10 scroll-mt-28 space-y-4 text-sm text-muted-foreground"
          >
            <SectionTitle>
              7. AI Processing and Website Analysis Disclosure
            </SectionTitle>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                We process submitted URLs and content extracted from publicly
                accessible webpages to generate conversion diagnostics and
                structured recommendations.
              </li>
              <li>
                AI outputs are probabilistic and intended as decision support,
                not legal, financial, or regulatory advice.
              </li>
              <li>
                We do not guarantee that third-party website content is
                complete, current, accurate, or legally reusable for any
                downstream purpose.
              </li>
              <li>
                Customers are responsible for downstream use of outputs and for
                independent review before business, legal, or compliance
                decisions.
              </li>
              <li>
                We implement schema validation and integrity checks to reduce
                output corruption and malformed responses.
              </li>
              <li>
                We do not use submitted customer data for unrelated advertising.
              </li>
            </ul>
          </section>

          <section
            id="automated-decisioning"
            className="mt-10 scroll-mt-28 space-y-4 text-sm text-muted-foreground"
          >
            <SectionTitle>
              8. Automated Decision-Making and Profiling
            </SectionTitle>
            <p>
              We use automated scoring and analytical models to classify
              conversion risk and prioritize recommendations. These outputs do
              not create legal effects for individuals and are intended for
              business decision support by customer teams.
            </p>
            <p>
              Data subjects may have rights under Article 22 GDPR, including the
              right not to be subject to decisions based solely on automated
              processing that produce legal or similarly significant effects,
              except where legal exceptions apply.
            </p>
          </section>

          <section
            id="cookies-analytics"
            className="mt-10 scroll-mt-28 space-y-4 text-sm text-muted-foreground"
          >
            <SectionTitle>9. Cookies and Analytics</SectionTitle>
            <p>
              We may use essential cookies for authentication, session
              continuity, and security. Non-essential analytics or performance
              cookies are used only where lawful under applicable EU cookie
              rules and, where required, based on user consent.
            </p>
          </section>

          <section
            id="data-subject-rights"
            className="mt-10 scroll-mt-28 space-y-4 text-sm text-muted-foreground"
          >
            <SectionTitle>10. Data Subject Rights</SectionTitle>
            <p>Subject to applicable law, you may request:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Access to your personal data.</li>
              <li>Rectification of inaccurate data.</li>
              <li>Erasure of data under Article 17.</li>
              <li>Restriction of processing.</li>
              <li>Data portability.</li>
              <li>Objection to processing based on legitimate interests.</li>
              <li>Withdrawal of consent for consent-based processing.</li>
              <li>
                Rights related to automated decision-making as described in
                Article 22 GDPR.
              </li>
            </ul>
            <p>
              Some requests, including erasure requests, may be limited or
              refused where processing is required for legal obligations, legal
              claims, security investigations, fraud prevention, or other lawful
              retention grounds.
            </p>
          </section>

          <section
            id="exercise-rights"
            className="mt-10 scroll-mt-28 space-y-4 text-sm text-muted-foreground"
          >
            <SectionTitle>11. How to Exercise Rights</SectionTitle>
            <p>
              Submit requests to [privacy@yourdomain.com] from your account
              email or with sufficient verification information. We will verify
              identity before processing rights requests and respond within
              statutory timelines.
            </p>
            <p>
              We may request additional identity verification information where
              needed to prevent unauthorized disclosure, deletion, or account
              manipulation.
            </p>
          </section>

          <section
            id="complaints"
            className="mt-10 scroll-mt-28 space-y-4 text-sm text-muted-foreground"
          >
            <SectionTitle>12. Complaints</SectionTitle>
            <p>
              If you believe we have processed your data unlawfully, you may
              contact us first at [privacy@yourdomain.com]. You also have the
              right to lodge a complaint with your local supervisory authority
              in the EU/EEA and, where relevant, with the supervisory authority
              in the Controller&apos;s EU Member State of establishment: [LEAD
              SUPERVISORY AUTHORITY NAME].
            </p>
          </section>

          <section
            id="security-measures"
            className="mt-10 scroll-mt-28 space-y-4 text-sm text-muted-foreground"
          >
            <SectionTitle>13. Security Measures</SectionTitle>
            <p>
              We apply technical and organizational safeguards including access
              controls, principle of least privilege, encryption in transit,
              authenticated service boundaries, logging, and incident response
              procedures.
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Encryption in transit (e.g., TLS/HTTPS) for data flows.</li>
              <li>
                Encryption at rest where supported by our infrastructure and
                data stores.
              </li>
              <li>Role-based and least-privilege access control policies.</li>
              <li>
                Security monitoring, alerting, and incident triage governance.
              </li>
              <li>
                Vendor onboarding and periodic security review practices for key
                processors.
              </li>
            </ul>
          </section>

          <section
            id="breach-handling"
            className="mt-10 scroll-mt-28 space-y-4 text-sm text-muted-foreground"
          >
            <SectionTitle>14. Data Breach Handling</SectionTitle>
            <p>
              We maintain breach triage and response processes. Where required
              by law, we notify competent supervisory authorities and affected
              data subjects within statutory deadlines.
            </p>
          </section>

          <section
            id="retention"
            className="mt-10 scroll-mt-28 space-y-4 text-sm text-muted-foreground"
          >
            <SectionTitle>15. Retention</SectionTitle>
            <p>
              We retain personal data only for as long as necessary for service
              delivery, security, legal obligations, and dispute resolution. See
              our detailed retention schedule in{" "}
              <Link href="/docs" className="text-primary hover:underline">
                Help Center
              </Link>
              .
            </p>
          </section>

          <section
            id="children"
            className="mt-10 scroll-mt-28 space-y-4 text-sm text-muted-foreground"
          >
            <SectionTitle>16. Children</SectionTitle>
            <p>
              The service is designed for business users and is not directed to
              children under 16. We do not knowingly collect personal data from
              children under 16.
            </p>
          </section>

          <section
            id="policy-versioning"
            className="mt-10 scroll-mt-28 space-y-4 text-sm text-muted-foreground"
          >
            <SectionTitle>17. Policy Changes and Versioning</SectionTitle>
            <p>
              We may update this policy to reflect legal, technical, or
              operational changes. Material updates will be published on this
              page with a revised &quot;Last updated&quot; date.
            </p>
            <p>Current version: Privacy Policy v2.0 (EU Launch Hardened).</p>
          </section>
        </article>
      </div>
    </section>
  );
}

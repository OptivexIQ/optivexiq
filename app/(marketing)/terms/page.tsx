import Link from "next/link";
import type { ReactNode } from "react";
import {
  LegalToc,
  type LegalTocItem,
} from "@/components/legal/LegalToc";

export const metadata = {
  title: "Terms of Service | OptivexIQ",
  description:
    "Terms governing use of OptivexIQ for AI-powered conversion analysis, subscriptions, and one-time purchases.",
};

const lastUpdated = "February 18, 2026";

const tocItems: LegalTocItem[] = [
  { id: "definitions", label: "1. Definitions" },
  { id: "acceptance", label: "2. Acceptance of Terms" },
  { id: "accounts", label: "3. Account Responsibility" },
  { id: "acceptable-use", label: "4. Acceptable Use" },
  { id: "prohibited-use", label: "5. Prohibited Use" },
  { id: "ai-disclaimer", label: "6. AI Output Disclaimer" },
  { id: "no-results", label: "7. No Guarantee of Results" },
  { id: "ip-license", label: "8. Intellectual Property" },
  { id: "customer-data", label: "9. Customer Data" },
  { id: "billing-terms", label: "10. Billing Terms" },
  { id: "refunds", label: "11. Refunds & Cancellations" },
  { id: "warranty", label: "12. Warranty Disclaimer" },
  { id: "security-enforcement", label: "13. Suspension & Enforcement" },
  { id: "post-termination", label: "14. Post-Termination Data" },
  { id: "availability", label: "15. Service Availability" },
  { id: "liability", label: "16. Limitation of Liability" },
  { id: "indemnification", label: "17. Indemnification" },
  { id: "force-majeure", label: "18. Force Majeure" },
  { id: "governing-law", label: "19. Governing Law" },
  { id: "changes", label: "20. Changes to Terms" },
  { id: "additional-terms", label: "21. Additional Legal Terms" },
  { id: "contact", label: "22. Contact" },
];

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-xl font-semibold text-foreground">{children}</h2>;
}

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-42">
      <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
        <aside className="hidden lg:block">
          <LegalToc
            title="Terms contents"
            items={tocItems}
            className="sticky top-24"
          />
        </aside>

        <article className="min-w-0">
          <h1 className="text-3xl font-semibold text-foreground">
            Terms of Service
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
          <div className="mt-6 lg:hidden">
            <LegalToc title="Jump to section" items={tocItems} />
          </div>

          <section
            id="definitions"
            className="mt-8 scroll-mt-28 space-y-4 text-sm text-muted-foreground"
          >
            <SectionTitle>1. Definitions</SectionTitle>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <span className="font-medium text-foreground">Company:</span>{" "}
                [LEGAL ENTITY NAME], operating OptivexIQ.
              </li>
              <li>
                <span className="font-medium text-foreground">Customer:</span> a
                business entity or individual using the Service for commercial
                purposes.
              </li>
              <li>
                <span className="font-medium text-foreground">Service:</span>{" "}
                OptivexIQ web application, APIs, reports, AI analysis workflows,
                and related support functions.
              </li>
              <li>
                <span className="font-medium text-foreground">Subscription:</span>{" "}
                recurring paid plan billed by cycle.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  One-time purchase:
                </span>{" "}
                non-recurring paid plan with defined entitlement scope.
              </li>
              <li>
                <span className="font-medium text-foreground">Customer Data:</span>{" "}
                any data, content, URLs, and materials submitted by Customer
                through the Service.
              </li>
            </ul>
          </section>

          <section
            id="acceptance"
            className="mt-10 scroll-mt-28 space-y-4 text-sm text-muted-foreground"
          >
            <SectionTitle>2. Acceptance of Terms</SectionTitle>
            <p>
              By creating an account, accessing the Service, or purchasing a
              plan, you agree to these Terms and our{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              . If you do not agree, do not use the Service.
            </p>
          </section>

          <section
            id="accounts"
            className="mt-10 scroll-mt-28 space-y-4 text-sm text-muted-foreground"
          >
            <SectionTitle>3. Account Creation and Responsibility</SectionTitle>
            <ul className="list-disc space-y-1 pl-5">
              <li>You must provide accurate, current, and complete information.</li>
              <li>
                You are responsible for account credentials and all activity
                under your account.
              </li>
              <li>
                You must promptly notify us of unauthorized access or security
                incidents.
              </li>
              <li>
                We may require identity verification for billing, security, or
                legal reasons.
              </li>
            </ul>
          </section>

          <section
            id="acceptable-use"
            className="mt-10 scroll-mt-28 space-y-4 text-sm text-muted-foreground"
          >
            <SectionTitle>4. Acceptable Use Policy (Updated)</SectionTitle>
            <p>
              You agree to use the Service only for lawful business purposes and
              in accordance with these Terms.
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Use the Service in compliance with applicable law and third-party
                rights.
              </li>
              <li>
                Submit only URLs and content you are legally permitted to submit
                for analysis.
              </li>
              <li>
                Maintain account security and prevent unauthorized credential
                use.
              </li>
              <li>
                Use AI outputs responsibly and only for lawful business decision
                support.
              </li>
            </ul>
          </section>

          <section
            id="prohibited-use"
            className="mt-10 scroll-mt-28 space-y-4 text-sm text-muted-foreground"
          >
            <SectionTitle>5. Prohibited Use (Updated)</SectionTitle>
            <ul className="list-disc space-y-1 pl-5">
              <li>Unlawful, fraudulent, deceptive, or abusive activity.</li>
              <li>
                Attempts to bypass quotas, access controls, billing controls, or
                rate limits.
              </li>
              <li>
                Attempts to bypass anti-abuse controls, request throttling, or
                usage-limit enforcement.
              </li>
              <li>Security testing or probing without written authorization.</li>
              <li>
                Reverse engineering, decompiling, disassembling, or attempting
                to derive source code, models, or non-public system logic.
              </li>
              <li>
                Account sharing, credential sharing, sublicensing, resale, or
                providing the Service to third parties as a bureau or managed
                service without written authorization.
              </li>
              <li>
                Automated scraping, crawling, or extraction outside the Service
                for competitive product replication or dataset harvesting.
              </li>
              <li>
                Benchmarking the Service for publication or competitive
                replication purposes without prior written consent.
              </li>
              <li>
                Submission of malware, harmful code, or payloads intended to
                disrupt service integrity.
              </li>
              <li>
                Excessive or abusive scraping behavior through the Service that
                violates applicable law or third-party rights.
              </li>
              <li>
                Use of AI outputs to facilitate unlawful activity,
                discrimination, harassment, or violation of third-party rights.
              </li>
            </ul>
          </section>

          <section
            id="ai-disclaimer"
            className="mt-10 scroll-mt-28 space-y-4 text-sm text-muted-foreground"
          >
            <SectionTitle>6. AI Output Disclaimer</SectionTitle>
            <p>
              Service outputs are generated using automated analysis and AI
              systems. Outputs are informational and decision-support in nature.
              We do not guarantee factual completeness, legal compliance, or
              commercial outcomes.
            </p>
          </section>

          <section
            id="no-results"
            className="mt-10 scroll-mt-28 space-y-4 text-sm text-muted-foreground"
          >
            <SectionTitle>7. No Guarantee of Conversion Results</SectionTitle>
            <p>
              We do not promise increased conversions, revenue, lead volume, or
              commercial performance. Business outcomes depend on implementation,
              market conditions, and factors beyond our control.
            </p>
          </section>

          <section
            id="ip-license"
            className="mt-10 scroll-mt-28 space-y-4 text-sm text-muted-foreground"
          >
            <SectionTitle>8. Intellectual Property and License</SectionTitle>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                The Service, software, trademarks, and documentation are owned by
                or licensed to the Company.
              </li>
              <li>
                Subject to these Terms, we grant a limited, revocable,
                non-exclusive, non-transferable license to use the Service.
              </li>
              <li>
                You retain rights to your submitted content and data. You grant
                us rights required to process and deliver the Service.
              </li>
            </ul>
          </section>

          <section
            id="customer-data"
            className="mt-10 scroll-mt-28 space-y-4 text-sm text-muted-foreground"
          >
            <SectionTitle>
              9. Customer Data & Processing Responsibilities (Added)
            </SectionTitle>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Customer retains ownership of Customer Data submitted to the
                Service.
              </li>
              <li>
                Customer warrants that it has all rights, permissions, and legal
                bases required to submit URLs, content, and related materials for
                analysis.
              </li>
              <li>
                For analysis workflows performed on Customer instruction, the
                Company processes Customer Data as a processor/service provider
                to deliver requested features.
              </li>
              <li>The Company does not claim ownership of Customer Data.</li>
              <li>
                The Company may use anonymized and aggregated usage data that
                does not identify Customer or individuals for service security,
                reliability, capacity planning, and product improvement.
              </li>
            </ul>
          </section>

          <section
            id="billing-terms"
            className="mt-10 scroll-mt-28 space-y-4 text-sm text-muted-foreground"
          >
            <SectionTitle>10. Subscription and Billing Terms (Updated)</SectionTitle>
            <ul className="list-disc space-y-1 pl-5">
              <li>No free trials are offered unless explicitly stated in writing.</li>
              <li>
                Plans may include one-time purchases and recurring subscriptions.
              </li>
              <li>
                Recurring plans auto-renew by billing cycle unless cancelled
                before renewal.
              </li>
              <li>
                Billing is processed by LemonSqueezy and may be subject to
                additional processor terms.
              </li>
              <li>
                Customer authorizes recurring charges for subscription plans
                until cancellation takes effect.
              </li>
              <li>
                Failed payments may result in restricted features, temporary
                suspension, or cancellation after reasonable retry attempts.
              </li>
              <li>
                The Company may recover overdue amounts and reasonable
                collection-related costs where permitted by law.
              </li>
              <li>
                Customer remains responsible for chargebacks initiated without
                valid basis; disputed access may be suspended during
                investigation.
              </li>
              <li>
                Prices, taxes, and applicable fees may change prospectively with
                prior notice.
              </li>
              <li>
                Customer is responsible for applicable taxes, duties, and
                similar charges, excluding taxes on the Company&apos;s net income.
              </li>
              <li>
                One-time purchases provide the entitlement scope stated at
                purchase and do not include automatic renewal.
              </li>
              <li>
                Cancellation requests for recurring plans must be made before the
                next renewal timestamp to avoid the next billing charge.
              </li>
              <li>
                We may change pricing prospectively with reasonable advance
                notice.
              </li>
            </ul>
          </section>

          <section
            id="refunds"
            className="mt-10 scroll-mt-28 space-y-4 text-sm text-muted-foreground"
          >
            <SectionTitle>11. Refunds and Cancellations</SectionTitle>
            <p>
              Refund and cancellation handling is governed by our Refund &
              Cancellation Policy, including EU consumer-rights treatment where
              applicable. See{" "}
              <Link href="/contact" className="text-primary hover:underline">
                Contact
              </Link>{" "}
              for operational support.
            </p>
          </section>

          <section
            id="warranty"
            className="mt-10 scroll-mt-28 space-y-4 text-sm text-muted-foreground"
          >
            <SectionTitle>12. Warranty Disclaimer (Added)</SectionTitle>
            <p>
              The Service is provided on an &quot;as is&quot; and &quot;as
              available&quot; basis. To the maximum extent permitted by law, the
              Company disclaims warranties of merchantability, fitness for a
              particular purpose, non-infringement, and uninterrupted
              availability. The Company does not warrant that AI outputs are
              complete, accurate, or suitable for Customer&apos;s specific
              commercial decisions, and does not warrant that website extraction
              captures the full or current state of third-party websites.
              Nothing in these Terms excludes mandatory rights that cannot be
              limited under applicable EU consumer law.
            </p>
          </section>

          <section
            id="security-enforcement"
            className="mt-10 scroll-mt-28 space-y-4 text-sm text-muted-foreground"
          >
            <SectionTitle>
              13. Suspension, Security, and Abuse Enforcement (Updated)
            </SectionTitle>
            <p>
              We may suspend or terminate access for material breach, non-payment,
              fraud risk, security risk, legal compliance, or abuse. You may
              stop using the Service at any time.
            </p>
            <p>
              Where feasible, we provide notice before suspension. For urgent
              security, fraud, or abuse events, suspension may be immediate.
              Customer agrees to reasonably cooperate with security and abuse
              investigations, including provision of relevant account context.
            </p>
          </section>

          <section
            id="post-termination"
            className="mt-10 scroll-mt-28 space-y-4 text-sm text-muted-foreground"
          >
            <SectionTitle>
              14. Data Retention and Post-Termination Handling (Added)
            </SectionTitle>
            <p>
              Customer Data is retained and deleted according to our Data
              Retention Policy and applicable legal obligations. Upon termination
              or account closure, access to the Service may be removed
              immediately, and stored reports may be deleted after the
              applicable retention window. Data subject to legal hold,
              regulatory requirements, fraud prevention, or dispute resolution
              may be retained for the required period.
            </p>
          </section>

          <section
            id="availability"
            className="mt-10 scroll-mt-28 space-y-4 text-sm text-muted-foreground"
          >
            <SectionTitle>15. Service Availability</SectionTitle>
            <p>
              We aim for reliable service but do not warrant uninterrupted,
              error-free, or always-available operation. Planned maintenance,
              third-party outages, and force majeure events may affect
              availability.
            </p>
          </section>

          <section
            id="liability"
            className="mt-10 scroll-mt-28 space-y-4 text-sm text-muted-foreground"
          >
            <SectionTitle>16. Limitation of Liability (Updated)</SectionTitle>
            <p>
              To the maximum extent permitted by applicable law, the Company is
              not liable for indirect, incidental, consequential, punitive, or
              special damages, including loss of profit, revenue, business
              opportunity, or goodwill.
            </p>
            <p>
              The Company is not liable for: (a) inaccuracies or omissions in AI
              outputs; (b) incomplete, blocked, changed, or inaccurate
              third-party website content; or (c) business, legal, or commercial
              decisions made using Service outputs.
            </p>
            <p>
              Our total aggregate liability under these Terms is limited to
              amounts paid by Customer for the Service during the 12 months
              preceding the event giving rise to the claim. This limitation does
              not exclude liability that cannot be limited by law, including
              liability for intent, gross negligence, fraud, or personal injury
              where applicable.
            </p>
          </section>

          <section
            id="indemnification"
            className="mt-10 scroll-mt-28 space-y-4 text-sm text-muted-foreground"
          >
            <SectionTitle>17. Indemnification</SectionTitle>
            <p>
              You agree to indemnify and hold harmless the Company and its
              affiliates, officers, and employees from claims arising from your
              misuse of the Service, violation of law, or breach of these Terms.
            </p>
          </section>

          <section
            id="force-majeure"
            className="mt-10 scroll-mt-28 space-y-4 text-sm text-muted-foreground"
          >
            <SectionTitle>18. Force Majeure</SectionTitle>
            <p>
              Neither party is liable for delay or failure caused by events
              outside reasonable control, including natural disasters, internet
              failures, power outages, acts of government, war, terrorism, labor
              disputes, and major third-party service disruptions.
            </p>
          </section>

          <section
            id="governing-law"
            className="mt-10 scroll-mt-28 space-y-4 text-sm text-muted-foreground"
          >
            <SectionTitle>19. Governing Law and Dispute Resolution</SectionTitle>
            <p>
              These Terms are governed by the laws of [EU MEMBER STATE]. Courts
              in [CITY, COUNTRY] have jurisdiction unless mandatory
              consumer-protection law requires otherwise.
            </p>
          </section>

          <section
            id="changes"
            className="mt-10 scroll-mt-28 space-y-4 text-sm text-muted-foreground"
          >
            <SectionTitle>20. Changes to Terms</SectionTitle>
            <p>
              We may update these Terms from time to time. Material changes are
              posted with a revised effective date. Continued use after changes
              take effect constitutes acceptance of updated Terms.
            </p>
          </section>

          <section
            id="additional-terms"
            className="mt-10 scroll-mt-28 space-y-4 text-sm text-muted-foreground"
          >
            <SectionTitle>21. Additional Legal Terms (Added)</SectionTitle>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <span className="font-medium text-foreground">No Waiver:</span>{" "}
                a party&apos;s failure to enforce any provision is not a waiver of
                future enforcement.
              </li>
              <li>
                <span className="font-medium text-foreground">Severability:</span>{" "}
                if any provision is unenforceable, remaining provisions remain in
                full force.
              </li>
              <li>
                <span className="font-medium text-foreground">Assignment:</span>{" "}
                Customer may not assign rights or obligations without prior
                written consent. The Company may assign in connection with
                merger, reorganization, or asset transfer.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Entire Agreement:
                </span>{" "}
                these Terms and referenced policies constitute the entire
                agreement regarding the Service.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Export Compliance:
                </span>{" "}
                Customer must comply with applicable export control and sanctions
                laws and may not use the Service in prohibited jurisdictions or
                for prohibited end uses.
              </li>
            </ul>
          </section>

          <section
            id="contact"
            className="mt-10 scroll-mt-28 space-y-4 text-sm text-muted-foreground"
          >
            <SectionTitle>22. Contact</SectionTitle>
            <ul className="list-disc space-y-1 pl-5">
              <li>Legal: [legal@yourdomain.com]</li>
              <li>Privacy: [privacy@yourdomain.com]</li>
              <li>Billing support: [billing@yourdomain.com]</li>
              <li>General: [support@yourdomain.com]</li>
            </ul>
            <p>Current version: Terms of Service v2.0 (EU Launch Hardened).</p>
          </section>
        </article>
      </div>
    </section>
  );
}

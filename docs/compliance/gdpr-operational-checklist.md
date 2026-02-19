# GDPR Operational Compliance Checklist (EU SaaS)

Version: `1.0`  
Owner: `[DPO / Privacy Lead Name]`  
Effective date: `[YYYY-MM-DD]`  
Review cadence: `Quarterly operational review + annual policy review`

## 1. Data Mapping and Inventory

- Maintain a living data inventory by system and table.
- Map each personal-data field to:
  - source
  - processing purpose
  - legal basis
  - retention period
  - processor/sub-processor
  - transfer location
- Include all operational paths:
  - authentication
  - billing (LemonSqueezy)
  - AI analysis
  - support/contact forms
  - audit and security logs

## 2. Record of Processing Activities (ROPA)

- Maintain Article 30 ROPA entries for each processing activity.
- Required ROPA fields:
  - controller identity
  - processing purpose
  - categories of data subjects and data
  - recipients/processors
  - transfer mechanism
  - retention period
  - security controls summary
- Assign an owner for each activity and update on architecture changes.

## 3. Processor Contracts and DPAs

- Execute DPAs with all processors that handle personal data.
- Validate each DPA includes:
  - confidentiality obligations
  - security commitments
  - sub-processor disclosure process
  - breach-notification duties
  - deletion/return commitments on termination
- Keep signed copies in a compliance evidence repository.

## 4. International Transfer Controls (SCC / Adequacy)

- For non-EEA processing, confirm a lawful transfer mechanism:
  - adequacy decision, or
  - SCCs + transfer impact assessment (TIA).
- Track processor transfer status with expiry/review dates.
- Reassess transfers on processor architecture changes.

## 5. Cookie and Tracking Consent

- Separate essential vs non-essential cookies.
- Implement consent collection before non-essential tracking starts (where required).
- Provide clear cookie controls and withdrawal path.
- Log consent state and update privacy/cookie disclosures accordingly.

## 6. Data Subject Request Workflow (DSR)

- Maintain a formal workflow for:
  - access
  - rectification
  - erasure
  - restriction
  - portability
  - objection
  - consent withdrawal
- Identity verification controls:
  - verify requester identity before disclosure/deletion.
- SLA targets:
  - acknowledge within 5 business days
  - complete within 30 calendar days (with lawful extension process).
- Keep request audit trail and closure evidence.

## 7. Right-to-Erasure Operations

- Define erase scope:
  - production data
  - derived profile fields
  - support artifacts
  - queued work items
- Define exclusions:
  - legal/finance retention obligations
  - fraud/security evidence under legal basis
- Use deletion playbook with required approvals and logging.

## 8. Breach Detection and Incident Response

- Maintain incident runbook with severity classification.
- Ensure detection inputs:
  - auth anomalies
  - RLS violations
  - failed integrity checks
  - suspicious traffic/rate-limit bursts
- Notification workflow:
  - regulator notification within 72 hours where required
  - data-subject communication where high risk applies.
- Keep postmortem and corrective-action evidence.

## 9. Access Control and Least Privilege

- Enforce role-based access controls for production and admin tools.
- Minimize service-role usage; use user-scoped credentials by default.
- Require MFA for privileged accounts.
- Perform quarterly access reviews and immediate revocation for leavers.

## 10. Data Minimization and Purpose Limitation

- Collect only data required for service operation, billing, security, and support.
- Prohibit collection of sensitive personal data unless explicitly needed and documented.
- Enforce schema-level constraints to prevent ad hoc data capture.

## 11. Logging and Audit Retention

- Keep audit logs for security-relevant operations (auth, billing, privileged actions).
- Define immutable retention for security events.
- Restrict log access and redact payloads that contain unnecessary personal data.

## 12. AI and DPIA Assessment

- Assess whether AI processing requires a DPIA based on risk profile.
- Document:
  - categories of data used in prompts/outputs
  - safeguards against harmful outcomes
  - human oversight and escalation path
  - model/provider boundaries
- Review DPIA on major model, feature, or processing changes.

## 13. Security Baseline Controls

- Encryption in transit for all networked components.
- Secret management with rotation policy.
- Authenticated API boundaries and request validation.
- RLS enforcement for customer data tables.
- Rate limiting and abuse controls on public endpoints.
- Backup and restore drills with evidence.

## 14. Annual Governance Review

- Complete annual review package:
  - ROPA review
  - DPA/SCC inventory refresh
  - policy updates
  - DSR metrics
  - incident metrics
  - control effectiveness
- Obtain management sign-off and archive records.


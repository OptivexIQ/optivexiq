# Data Retention Policy

Version: `1.0`  
Policy owner: `[Security/Privacy Owner]`  
Effective date: `[YYYY-MM-DD]`  
Review cadence: `Quarterly`

## External-Facing Summary

We retain personal and operational data only for as long as needed to deliver the service, meet legal obligations, maintain security, and resolve disputes. Retention periods depend on data category. Where legally possible, data is deleted or irreversibly anonymized once no longer required.

## Retention Matrix (Internal Operating Policy)

| Data category | Examples | Purpose | Retention period | Deletion/anonymization rule |
|---|---|---|---|---|
| Account data | user profile, auth identifiers, organization info | account access and service delivery | Active account + 24 months after closure | Delete or anonymize unless legal hold applies |
| Subscription and billing records | plan, invoices, transactions, tax evidence | contractual performance and finance compliance | 10 years (or local statutory minimum, whichever is longer) | Archive with restricted access; delete after legal period |
| Usage logs | request logs, rate-limit outcomes, API usage metrics | security, fraud prevention, operations | 12 months | Remove identifiers or delete |
| Security logs | auth events, policy denials, privileged actions | incident response and audit | 24 months | Delete or archive according to security policy |
| AI inputs | submitted URLs, optional analysis context, prompt payload fragments | generate analysis outputs | 90 days standard operational retention | Delete from active stores; preserve only minimal audit metadata |
| AI outputs | generated reports/snapshots | customer deliverables | While account active + 24 months | Delete with account closure workflow unless legal hold |
| Scraped webpage content | extracted public page text | analysis pipeline execution | 30 days | Purge raw extracted content; keep derived report artifacts only |
| Free snapshot records | snapshot metadata, unlock status, download/email events | lead-magnet operations and abuse control | 12 months | Delete or anonymize personal fields thereafter |
| Contact/support requests | message content, request metadata | support operations and legal traceability | 36 months | Delete or anonymize requester data unless dispute/legal hold |
| Product feedback | feedback body, request ref, user/account linkage | roadmap triage and issue remediation | 36 months | Delete or anonymize user identifiers when no longer needed |
| Backups | encrypted database and storage backups | business continuity and disaster recovery | 35 days rolling retention | Automatic expiry and secure overwrite |

## Inactive Account Deletion Timeline

- Account marked inactive after `[X]` months without login or active subscription.
- Notification sent before deletion where required by law or contract.
- Deletion execution target: within 30 days of scheduled deletion date.
- Finance/tax records remain under statutory retention even after account deletion.

## Legal Hold and Exception Handling

- Legal hold overrides normal deletion for relevant records.
- Holds may be triggered by:
  - litigation
  - regulatory inquiry
  - unresolved fraud/security investigation
  - contractual dispute
- Legal hold decisions must be documented with:
  - scope
  - owner
  - start date
  - release criteria

## Deletion Controls

- Deletion jobs must be idempotent and auditable.
- Deletion actions are logged with object count and completion status.
- Soft-delete windows, if used, must be time-bound and documented.
- Backup restoration procedures must not reintroduce deleted records into production without reapplying deletion rules.

## Data Subject Rights Alignment

Retention policy supports GDPR rights workflows:

- Access and portability: data export available within statutory timelines.
- Erasure: applied unless legal basis exists for continued retention.
- Restriction/objection: processing controls enforced case-by-case.

## Governance

- Quarterly retention audit:
  - sample records per category
  - verify retention rule compliance
  - evidence archive
- Annual policy review and board/management sign-off.


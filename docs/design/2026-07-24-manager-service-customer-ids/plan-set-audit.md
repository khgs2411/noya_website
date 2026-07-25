# Manager Service Customer Identity Migration Plan-Set Audit

## Audit Mode: Full

Rationale: The plan set is a two-chunk, AI-executed migration spanning a shared
customer-directory state boundary, independent authorization latches,
membership and attendance service identities, asynchronous presentation
reconciliation, localization, responsive UI, and a pinned external SDK.

## Plan Overview

Objective: Migrate manager membership and attendance workflows from linked-user
identity to canonical ClassKit customer identity so linked and ghost customers
receive the same supported membership, ledger, and walk-in behavior.

Scope: A reusable opaque-cursor customer picker, effective customer-read
recovery, customer-first membership set/list/ledger calls, customer walk-ins,
customer-first registration and participant labels, exact linked-user display
fallbacks, live capability propagation, localization, and responsive
presentation. Customer lifecycle UI, manager registration controls, ghost
merge, new entitlement or attendance policy, access-role migration, backend
work, new dependencies, and global state are excluded.

Target Audience: Human developers and AI agents executing through Symphony.

Readiness Level: Ready for Development.

Key Technical Decisions:

- Chunk 01 establishes one reusable customer picker over the existing
  `useCustomerDirectory` state owner and makes forbidden recovery an effective
  authority latch that clears only after a successful explicit retry.
- Chunk 02 performs one compilable customer-identity cutover across membership,
  attendance, labels, live capability propagation, and localization.
- Customer-read, membership-read, and membership-manage authority remain
  independent. Customer and membership forbidden responses invalidate only
  their own protected domains.
- Membership recipient calls and attendance walk-ins use `customerId`;
  grant-ID stock/revoke methods, attendance lifecycle methods, trial
  participants, and access-role behavior retain their current identities.
- Attendance labels reconcile customer summaries, exact customer details, and
  exact linked-user display data under one generation guard; raw IDs are never
  display fallbacks.

## File Path Verification

Verified using local repository inspection:

| Referenced Path | Status | Notes |
| --- | --- | --- |
| `.symphony/assignment.md` | Exists | Authoritative outcome, scope, exclusions, acceptance criteria, prerequisite branch, and SDK requirement. |
| `docs/design/2026-07-24-manager-service-customer-ids/spec.md` | Exists | Final design source for identity, authority, failure, and presentation behavior. |
| `docs/design/2026-07-24-manager-service-customer-ids/agenda.md` | Exists | Records the closed authority, recovery, pagination, and fallback decisions. |
| `docs/design/2026-07-24-manager-service-customer-ids/spec-audit.md` | Exists | Design audit ends ready for development. |
| `docs/design/2026-07-24-manager-service-customer-ids/plan.md` | Exists | Root plan, dependency order, coverage map, verification strategy, and stop rules. |
| `docs/design/2026-07-24-manager-service-customer-ids/plans/01-shared-customer-picker.md` | Exists | Owns the reusable picker and additive customer-directory/helper changes. |
| `docs/design/2026-07-24-manager-service-customer-ids/plans/02-customer-first-service-workflows.md` | Exists | Owns the service cutover, capability propagation, labels, and localization. |
| `DESIGN_GUIDE.md` | Exists | Governs mobile-first, RTL-safe, theme-consistent manager surfaces. |
| `package.json` | Exists | Pins the exact ClassKit commit and defines `build` and `lint`. |
| `bun.lock` | Exists | Resolves the same ClassKit commit and supports the frozen-lockfile preflight. |
| `src/features/manager/customers/customer-picker.tsx` | Not Found — expected new path | Created exclusively by Chunk 01. |
| `src/features/manager/customers/use-customer-directory.ts` | Exists | Current cursor page, filter, retry, refresh, stale-request, and forbidden state owner. |
| `src/features/manager/customers/customer-management-tab.tsx` | Exists | Existing compatibility consumer of the directory hook. |
| `src/features/customers/customer-labels.ts` | Exists | Current ID-safe label/contact seam; `customerOrigin` is presently required. |
| `src/features/users/user-labels.ts` | Exists | Generic display fallback currently reaches `user_id`/`id`, matching the plan's privacy warning. |
| `src/features/manager/memberships/membership-management-tab.tsx` | Exists | Current broad-user selector and deprecated user-first membership workflow. |
| `src/features/manager/attendance/class-attendance-form.tsx` | Exists | Current broad-user list, deprecated user walk-in, and user-first participant labels. |
| `src/features/manager/registrations/pending-registrations-panel.tsx` | Exists | Current nullable-user-first registration presentation. |
| `src/features/manager/classes/class-management-tab.tsx` | Exists | Owns standalone and class-detail attendance integration. |
| `src/features/manager/classes/class-detail-panel.tsx` | Exists | Pass-through seam for embedded attendance. |
| `src/features/manager/manager-page.tsx` | Exists | Already derives the three live read signals named by the plan. |
| `src/i18n.ts` | Exists | Owns parallel English, Russian, and Hebrew locale trees. |

All plan-relative links resolve from their containing files. Chunk 01 owns one
new file and two existing files. Chunk 02 owns seven existing files. No mutable
file is assigned to both chunks.

The worktree is based at prerequisite commit `793cba3`, as the root plan
claims. `package.json` and `bun.lock` both pin
`a158bc588f5ec3421788475ccab2c5c2cb47ce9f`. The locally cached declarations
at that exact commit confirm:

- `Customer.userId`, `MembershipGrant.user_id`, and
  `MembershipLedgerEntry.user_id` have the documented nullability;
- `ManagementRegistrationSummary.customer` and
  `ClassParticipant.customer_id` exist;
- `management.users.get(userId)`, `setForCustomer`,
  `listCustomerGrants`, `listLedger({ customerId })`, and
  `addCustomerWalkIn` have the planned signatures; and
- `setForUser`, `listUserGrants`, and `addWalkIn` are deprecated in favor of
  the planned customer-first calls.

## Scope And Acceptance Coverage

| Requirement / Acceptance Criterion | Plan Coverage | Assessment |
| --- | --- | --- |
| Replace broad user selection with the customer directory | Chunks 01–02 create the reusable picker, instantiate independent hook state, remove local user search, and retain opaque pagination/filtering | Complete |
| Support linked and ghost membership set/list/ledger | Chunk 02 names `setForCustomer`, `listCustomerGrants`, and customer-filtered ledger calls plus selection and reconciliation rules | Complete |
| Preserve customer-first grant/upgrade actions where present | Root coverage states that the current UI retains only set/replace and does not invent unused grant/upgrade actions | Complete |
| Preserve type administration, stock adjustment, and revoke | Chunk 02 retains type methods and the existing grant-ID methods under the independent authority matrix | Complete |
| Add existing customers as walk-ins without login identity | Chunk 02 uses the compact picker and exact `addCustomerWalkIn` signature for linked and ghost customers | Complete |
| Preserve attendance lifecycle and trial behavior | Chunk 02 explicitly retains start, update, complete, trial, busy state, optimistic update, and silent reconciliation | Complete |
| Key labels by customer and tolerate nullable users | Chunk 01 widens the customer presentation input; Chunk 02 defines summary/detail, exact-user, and unknown fallback order | Complete |
| Prevent stale cross-class or cross-refresh presentation | Chunk 02 requires one generation across attendance, registrations, customer details, and exact-user fallbacks | Complete |
| Keep customer, membership-read, and membership-manage authority independent | Root plan and Chunk 02 repeat the complete four-row matrix, independent latches, domain-specific clearing, and explicit recovery probes | Complete |
| Remove obsolete user-identity service paths | Chunk 02 owns all current occurrences and supplies positive and negative source checks | Complete |
| Preserve responsive EN/RU/HE behavior | Both chunks assign picker density, safe wrapping, touch/RTL behavior, and three-locale copy with existing-server acceptance | Complete |
| Preserve project boundaries and exclusions | Root stop rules and both non-goal sections forbid backend calls, global state, dependencies, policy changes, and out-of-scope lifecycle work | Complete |

## Sequencing And Dependencies

The order is coherent and follows the strongest shared boundary:

1. Chunk 01 first stabilizes the customer-directory recovery contract,
   presentational prop shape, and full/compact picker over existing repository
   state.
2. Chunk 02 then consumes that exact seam in membership and attendance while
   changing live capabilities, service calls, presentation reconciliation, and
   locales in one compilable integration slice.

Chunk 02 cannot safely precede Chunk 01 because both workflows depend on the
picker and effective customer-authority contract. Within Chunk 02, membership
and attendance internals can proceed independently, but capability props,
localization, obsolete-call checks, and final evidence correctly remain one
integration milestone.

The chunks have no conflicting write ownership. Chunk 01 has a meaningful
compile/lint/static checkpoint before the higher-risk service cutover begins.
Rollback is file-local and requires no data migration or backend recovery.

## Repository-Native Command Verification

| Command / Check | Status | Notes |
| --- | --- | --- |
| `bun install --frozen-lockfile` | Valid and conditional | Matches the sole committed lockfile and is run only when dependencies are unavailable. |
| `bun run lint` | Valid | Resolves to the repository's `eslint .` script. |
| `bun run build` | Valid and justified | Resolves to `tsc -b && vite build`; the cross-component prop changes, SDK signatures, nullable identities, and broad manager integration justify the heavier check. |
| Customer-picker `rg` checks | Valid | Target an existing hook and the expected-new picker after Chunk 01, and require semantic inspection rather than treating raw identifier presence as a failure. |
| Customer-first positive `rg` check | Valid | Targets the two service owners and the exact replacement method/identity names. |
| Obsolete-path no-match `rg` check | Valid with a precision caveat | Exit 1 is the expected success signal. The multiline ledger branch is coarse without `-U`, so execution should supplement it with direct ledger-call inspection or a multiline-aware scan. |
| Capability propagation `rg` check | Valid as an inventory | The plan also requires semantic matrix/latch review; identifier presence alone is not claimed as authorization proof. |
| Generic user-helper no-match check | Valid | Targets the only two customer-first presentation owners and documents the guarded-call exception. |
| `git diff --check` | Valid | Provides the repository-neutral whitespace/error gate. |
| `lsof -nP -iTCP:5173 -sTCP:LISTEN` | Valid and repository-compliant | Checks for an existing server without starting one; unavailable principals or states must be reported as gaps. |

The root strategy scans the manager feature tree where all current obsolete
service paths exist. The final consistency check additionally requires no
deprecated service method to remain. A source-wide multiline-aware scan would
make the negative evidence more mechanically complete, but the existing
commands plus required diff/call inspection are sufficient to begin
development.

No build, lint, dependency install, test, or browser command was executed
during this audit.

## Strengths

### 1. Authorization Is Modeled As Independent Effective State

The plan does not collapse customer read, membership read, and membership
manage into one manager boolean. It defines exact call/UI outcomes, keeps
customer and membership forbidden latches independent, preserves authorized
state owned by the unaffected domain, and requires successful explicit probes
before restoring work.

### 2. Identity Ownership Matches The SDK

Every service-recipient operation moves to `customerId`, while grant identity,
attendance lifecycle identity, trial participants, and linked-user
compatibility remain on their canonical contracts. The plan removes deprecated
paths without broadening the migration into access-role behavior.

### 3. Shared Pagination Has One Owner

The reusable picker consumes the existing cursor hook rather than duplicating
pagination or pretending a page-local filter is a global search. Independent
hook instances preserve workflow isolation, and filter/page/refresh selection
rules prevent stale details from being attributed to another page.

### 4. Optional Presentation Failure Is Properly Isolated

Customer-detail and exact-user label lookups cannot fail the base attendance
load or lifecycle controls. One reconciliation generation prevents records and
labels from different classes or refreshes from mixing, while ordinary silent
failures and forbidden failures have distinct retention rules.

### 5. Acceptance Evidence Is Honest About Live Constraints

Static checks, exact SDK compilation, lint, and diff inspection cover
deterministic contracts. Browser evidence is conditional on an already-running
approved server and suitable principals, and the plan requires unavailable
rows to be disclosed rather than inferred.

## Critical Issues

None. The plan set contains no unresolved product, architecture, data,
permission, path, dependency, sequencing, ownership, or acceptance blocker.

## Questions for Plan Author

None. The assignment, final design, closed agenda, current repository, and exact
v0.1.23 declarations determine the material implementation choices.

## Recommendations

### Verification Precision

- Make the obsolete ledger check multiline-aware, or inspect every
  `listLedger` call after the no-match scan. The current `rg` command does not
  independently match a line break between `listLedger({` and `userId`.
- Treat exit 1 with empty output as the explicit pass signal for both no-match
  checks.
- Report each linked/ghost, capability, locale, viewport, and theme browser row
  separately when only part of the required live state is available.

### Execution Evidence

- Record the four membership authority rows and the two forbidden-recovery
  probes in the implementation report. This makes the highest-risk boundary
  reviewable without relying on component shape.
- Preserve a short attendance reconciliation inventory showing that customer
  and user lookups are deduplicated and guarded by the same generation as the
  base participant load.

These are non-blocking execution refinements; the governing tasks, consistency
checks, and stop rules already constrain the required behavior.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| A forbidden retry restores effective access before success | Medium | High | Chunk 01 keeps the latch set during retry and clears it only on a successful current-generation list response. |
| Membership manage is mistaken for read authority | Low | High | Chunk 02 receives the independent live read signal and enforces the complete four-row matrix. |
| Customer and membership forbidden handling clear each other's data | Medium | High | Separate latches and domain-owned clearing rules are repeated in root and chunk contracts. |
| Late participant labels cross class or refresh generations | Medium | High | One attendance generation guards base and optional presentation work. |
| Generic linked-user fallback exposes an ID | Low | High | Customer-first precedence, exact display/email extraction, helper no-match scan, and localized unknown fallback. |
| Existing Customers workspace regresses | Medium | High | Chunk 01 changes the hook additively and compiles the unchanged compatibility consumer before integration. |
| A deprecated multiline ledger filter evades the coarse scan | Low | High | Required full-call/diff inspection plus the recommended multiline-aware source scan. |
| Browser principals or permission states are unavailable | High | Medium | Preserve deterministic evidence and report each unverified live row explicitly. |

Highest Risk: Independent authority invalidation and recovery. A still-true
dashboard capability after API `forbidden` could otherwise expose stale
protected state or permit unsafe mutations. The plan mitigates this with
domain-specific latches, explicit recovery probes, in-flight latching, exact
state clearing, and a closed call matrix.

## Pre-Development Checklist

- [x] Assignment requirements and final design decisions map to explicit chunks.
- [x] Chunk order and the shared picker dependency are coherent.
- [x] Mutable file ownership is exact and non-overlapping.
- [x] Existing paths and expected-new paths are classified.
- [x] The worktree base and exact SDK dependency resolve as claimed.
- [x] Customer-first methods and nullable fields are verified against the pinned SDK.
- [x] Acceptance criteria cover linked and ghost identities, preserved lifecycles, permissions, privacy, recovery, locales, and responsiveness.
- [x] Repository-native install, lint, build, diff, source, and existing-server checks are named.
- [x] Rollback, non-goals, stop conditions, and forbidden expansions are explicit.
- [x] AI execution boundaries require honest browser gaps and prohibit unapproved server startup.

## Next Steps

1. Execute Chunk 01 and verify the additive directory latch, narrow picker
   contract, privacy-safe presentation input, and unchanged Customers consumer.
2. Execute Chunk 02 only after that shared boundary compiles, enforcing the
   four-row membership matrix before exposing customer mutations.
3. Complete source-wide obsolete-call inspection, lint/build/diff verification,
   then run only the browser rows supported by an existing approved server and
   available principals.

## Evaluation Matrix

| Dimension | Weight | Raw Score | Weighted Score | Notes |
| --- | --- | --- | --- | --- |
| Completeness | x3 | 5/5 | 15/15 | Every requirement, edge state, dependency, target file, exclusion, and done condition is assigned. |
| Feasibility | x3 | 5/5 | 15/15 | Current repository seams, package scripts, pinned SDK declarations, and existing state patterns support the plan. |
| Clarity | x2 | 5/5 | 10/10 | Identity ownership, authority matrices, latch recovery, presentation ordering, and file responsibilities are explicit. |
| Logical Flow | x2 | 5/5 | 10/10 | The shared directory/picker contract precedes its two consumers, followed by one coherent integration gate. |
| Scope & Risk | x2 | 5/5 | 10/10 | Scope is surgical; permission, privacy, async, compatibility, and live-evidence risks have bounded mitigations. |
| Developer Experience | x1 | 5/5 | 5/5 | Each chunk has exact ownership, observable milestones, rollback, and repository-native checks. |
| AI Readiness | x1 | 4/5 | 4/5 | Stop rules, paths, contracts, and evidence are strong; the multiline negative scan merits execution-time supplementation. |

Overall: 69/70 -> Ready for Development

Critical Dimension Check: Pass; Completeness and Feasibility both score 5, and
no critical issue remains.

## Handoff

PLAN APPROVED FOR IMPLEMENTATION

Key constraints:

- Use customer identity for membership recipients, ledger filters, attendance
  walk-ins, and customer-first presentation. Keep linked user identity only for
  exact display compatibility and existing access-role behavior.
- Treat live customer read, live membership read, and membership manage as
  independent authorities. Preserve forbidden latches until their documented
  explicit probes succeed.
- Reuse one customer-directory owner with independent hook instances; do not
  add false global search, global customer state, direct backend calls, or raw
  ID fallbacks.
- Preserve grant-ID accounting methods, membership type administration under
  its authorized matrix rows, trial participants, and the complete attendance
  lifecycle.

Suggested starting point: Implement the additive effective-authority behavior
in `src/features/manager/customers/use-customer-directory.ts`, then create the
narrow full/compact picker over that stable contract.

First milestone: Chunk 01 compiles with the forbidden latch preserved through
retry, existing Customers behavior unchanged, deterministic selection reset,
and ID-safe customer presentation.

Verdict: Ready for Development

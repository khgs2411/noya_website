# Manager Service Customer Identity Migration Design Audit

## Audit Mode: Standard

Rationale: This is a permission-sensitive, cross-component migration spanning
membership identity, attendance identity and presentation, shared customer
directory state, localization, and an external SDK contract.

## Plan Overview

Objective: Move manager membership and attendance workflows from linked
`userId` identity to canonical ClassKit `customerId` identity so linked and
ghost customers receive the same supported behavior.

Scope: Customer-backed membership selection, grants, ledger reads, set/replace
mutations, customer walk-ins, customer-first registration and participant
labels, capability-aware recovery, localization, and responsive picker
behavior. Customer lifecycle UI, manager registration controls, ghost merge,
new policy, access-role migration, and backend changes are excluded.

Target Audience: Human developers and the AI-assisted Symphony planning and
execution workflow.

Readiness Level: Ready for Development.

Key Technical Decisions:

- `customerId` becomes canonical for membership recipients, ledger filtering,
  attendance walk-ins, and non-trial participant presentation.
- The existing opaque-cursor customer-directory hook remains the sole list-state
  owner, with independent hook instances for membership and attendance.
- Customer summaries/details precede exact linked-user fallbacks, and no raw
  customer or user ID may be rendered.
- Attendance lifecycle and trial behavior remain independent from optional
  customer and linked-user presentation lookups.

## File Path Verification

Verified using local repository inspection and the exact SDK commit pinned by
`package.json` and `bun.lock`:

| Referenced Path | Status | Notes |
| --- | --- | --- |
| `docs/design/2026-07-24-manager-service-customer-ids/spec.md` | Exists | Complete design under audit. |
| `docs/design/2026-07-24-manager-service-customer-ids/agenda.md` | Exists | Decisions agree with the spec, including the closed membership authority and recovery matrix. |
| `src/features/manager/customers/use-customer-directory.ts` | Exists | Owns opaque cursor pages, filters, refresh/retry, stale-request rejection, and forbidden clearing. |
| `src/features/customers/customer-labels.ts` | Exists | Provides customer-safe label/contact helpers; `customerOrigin` is currently required by its input type. |
| `src/features/users/user-labels.ts` | Exists | Generic display-name fallback can expose `user_id`/`id`, as the spec records. |
| `src/features/manager/memberships/membership-management-tab.tsx` | Exists | Still uses the broad user directory and deprecated user-first membership calls. |
| `src/features/manager/attendance/class-attendance-form.tsx` | Exists | Still uses the broad user directory and deprecated `addWalkIn({ userId })`. |
| `src/features/manager/registrations/pending-registrations-panel.tsx` | Exists | Currently labels registrations through nullable linked users. |
| `src/features/manager/classes/class-management-tab.tsx` | Exists | Owns both attendance-surface integrations and their capability props. |
| `src/features/manager/classes/class-detail-panel.tsx` | Exists | Embeds pending registrations and attendance. |
| `src/features/manager/manager-page.tsx` | Exists | Already derives live `canReadCustomers`, `canReadMemberships`, and `canReadUsers`; only Customers currently receives `canReadMemberships`. |
| `src/features/manager/access/role-permission-presentation.ts` | Exists | Makes `customers.read`, `memberships.read`, and `memberships.manage` independently grantable. |
| `src/i18n.ts` | Exists | Contains parallel English, Russian, and Hebrew manager copy. |
| `src/features/manager/customers/[customer-picker component]` | Planned creation | The design gives the domain folder and ownership boundary but intentionally leaves the filename to planning. |
| `package.json` | Exists | Pins `@class-kit/react` to `a158bc588f5ec3421788475ccab2c5c2cb47ce9f`. |
| `bun.lock` | Exists | Resolves the same exact SDK commit. |

The cached SDK at that commit confirms `Customer.userId`,
`MembershipGrant.user_id`, and `MembershipLedgerEntry.user_id` are nullable;
`ManagementRegistrationSummary.customer` and
`ClassParticipant.customer_id` exist; and `setForCustomer`,
`listCustomerGrants`, `listLedger({ customerId })`, and
`addCustomerWalkIn` have the signatures recorded in the design.

## Strengths

### 1. Identity Ownership Is Correct

The design consistently separates service identity from optional login
identity. Membership mutations, grants, ledger reads, and walk-ins use
`customerId`, while exact `userId` reads remain presentation-only
compatibility fallbacks.

### 2. Pagination And Selection Semantics Are Concrete

Reusing the existing customer-directory hook avoids a second cursor contract.
Filter/page changes, refresh reconciliation, stale requests, forbidden
clearing, and false page-local search are all addressed explicitly.

### 3. Attendance Partial Failure Is Well Bounded

One generation guard covers participants, registration summaries, customer
details, and exact user fallbacks. Optional presentation failures do not erase
attendance lifecycle state or block status updates, trial participants, or
completion.

### 4. Privacy And Presentation Rules Are Executable

Customer summary/detail ordering, exact-user fallback constraints, localized
unknown labels, and prohibition of generic ID-falling user helpers close the
nullable-linkage presentation gap without inventing local identity.

## Critical Issues

None. The amended design closes the independent membership-read authorization
gap and leaves no product, architecture, data, permission, or public-contract
decision unresolved before implementation planning.

## Questions for Plan Author

None. The explicit customer-read, membership-read, and membership-manage matrix
plus the successful-`listTypes` recovery rule resolve the prior questions.

## Recommendations

### Implementation Precision

- Implement customer and membership forbidden latches as separate state
  machines. Preserve each invalidation while its explicit recovery request is
  in flight and clear it only after the specified successful response.
- Name the reusable customer-picker component and the customer presentation
  state seam in the implementation plan.
- Keep inactive customers available for inspection where authorized, but make
  the server-owned `customer_inactive` mutation outcome explicit in localized
  membership and walk-in recovery behavior.

### Verification

- Retain the specified static checks for accidental `memberships.read`
  inference and protected read calls while the live capability or effective
  latch is false.
- Exercise independent customer-read, membership-read, and membership-manage
  loss in addition to the linked/ghost identity matrix.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Membership reads run without live `memberships.read` authority | Low | High | Pass the live capability independently and enforce the closed call matrix plus forbidden latch. |
| A customer forbidden retry re-enables work before it succeeds | Medium | High | Keep invalidation latched through the retry request and clear it only on success. |
| Late attendance labels cross class or refresh generations | Medium | High | Use the specified shared generation guard for base and optional results. |
| Generic linked-user fallback exposes an ID | Low | High | Use explicit display name/email extraction only. |
| Inactive customer mutations surface as generic failures | Medium | Medium | Preserve ClassKit policy and map `customer_inactive` to localized recovery copy. |
| Browser principals are unavailable for the full matrix | Medium | Medium | Report those rows as unverified and retain static/type evidence. |

Highest Risk: Correctly implementing two independent forbidden/recovery latches.
The amended design mitigates it with a closed authority matrix, domain-specific
clearing, in-flight latching, and explicit successful recovery responses.

## Pre-Development Checklist

- [x] Canonical customer identity and nullable linked-user behavior are explicit.
- [x] Customer directory, attendance generation, privacy, and failure seams are defined.
- [x] Referenced repository paths and exact SDK method/type claims are verified.
- [x] Scope exclusions and objective identity-migration checks are present.
- [x] Independent `memberships.read` capability and forbidden recovery are defined.
- [x] Customer-read, membership-read, and membership-manage UI/call combinations are closed.
- [x] Capability loss and recovery have objective static and browser acceptance evidence.
- [ ] In the implementation plan, name concrete files and focused checkpoints for both authority latches.

## Next Steps

1. Approve the design and translate it into a dependency-aware implementation
   plan.
2. Begin with live capability propagation and separate customer/membership
   effective-authority latches.
3. Build the shared picker and identity migrations, then complete localization
   and focused static/browser verification.

## Evaluation Matrix

| Dimension | Weight | Raw Score | Weighted Score | Notes |
| --- | --- | --- | --- | --- |
| Completeness | x3 | 5/5 | 15/15 | Identity, authority combinations, failure recovery, dependencies, and acceptance evidence are explicit. |
| Feasibility | x3 | 5/5 | 15/15 | Current repository seams and exact v0.1.23 types/methods support every material decision. |
| Clarity | x2 | 5/5 | 10/10 | Customer, membership, and user authorities plus their independent invalidation rules are unambiguous. |
| Logical Flow | x2 | 4/5 | 8/10 | Capability and shared-state prerequisites are clear; exact work sequencing belongs in the implementation plan. |
| Scope & Risk | x2 | 5/5 | 10/10 | Scope remains surgical while authorization, stale work, privacy, and partial failure are explicitly mitigated. |
| Developer Experience | x1 | 4/5 | 4/5 | Concrete seams and done signals are strong; exact new filenames remain for planning. |
| AI Readiness | x1 | 4/5 | 4/5 | Closed matrices, forbidden paths, and objective checks support autonomous execution; file-level work units remain for planning. |

Overall: 66/70 -> Ready for Development

Critical Dimension Check: Pass; neither Completeness nor Feasibility scores 1.

## Handoff

PLAN APPROVED FOR IMPLEMENTATION

Key constraints:

- Use `customerId` for service-recipient membership and attendance behavior;
  linked `userId` is presentation compatibility only.
- Treat live customer read, live membership read, and membership manage as
  independent authorities. Never infer a read capability from another signal,
  role name, or cached shell.
- Keep customer and membership forbidden latches independent and restore them
  only after their specified successful explicit probes.
- Preserve attendance lifecycle and trial behavior while customer and exact
  linked-user presentation lookups remain optional and generation-guarded.

Suggested starting point: Pass `canReadCustomers`, `canReadMemberships`, and
`canReadUsers` through their documented surfaces and establish the two
effective-authority latches before migrating calls or picker presentation.

First milestone: The membership surface enforces all four matrix outcomes,
clears only membership-owned protected state on membership `forbidden`, and
restores membership reads only after a successful explicit `listTypes` retry.

Verdict: Ready for Development

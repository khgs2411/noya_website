# Manager Service Customer Identity Migration Implementation Plan Set

**Approved Source:** Assignment requirements plus `docs/design/2026-07-24-manager-service-customer-ids/spec.md`
**Agenda:** `docs/design/2026-07-24-manager-service-customer-ids/agenda.md`
**Pseudocode:** Absent
**Context:** `version/1.1.5` at prerequisite Customers merge `793cba3`
**ADRs:** None
**Status:** Ready for Review

## Goal

Migrate manager membership and attendance service workflows from linked-user
identity to canonical customer identity, preserving linked and ghost customer
behavior, independent read/manage authorization, accounting and attendance
lifecycle ownership, privacy-safe labels, localization, and responsive manager
presentation.

## Source Artifacts And Repository Evidence

- Assignment contract: `.symphony/assignment.md`.
- Design:
  `docs/design/2026-07-24-manager-service-customer-ids/spec.md`.
- Closed decisions:
  `docs/design/2026-07-24-manager-service-customer-ids/agenda.md`.
- Ready design audit:
  `docs/design/2026-07-24-manager-service-customer-ids/spec-audit.md`.
- Existing customer list state:
  `src/features/manager/customers/use-customer-directory.ts`.
- Existing customer-safe presentation:
  `src/features/customers/customer-labels.ts`.
- Legacy membership workflow:
  `src/features/manager/memberships/membership-management-tab.tsx`.
- Legacy attendance workflow:
  `src/features/manager/attendance/class-attendance-form.tsx`.
- Registration presentation:
  `src/features/manager/registrations/pending-registrations-panel.tsx`.
- Attendance integration:
  `src/features/manager/classes/class-management-tab.tsx` and
  `src/features/manager/classes/class-detail-panel.tsx`.
- Live capability derivation:
  `src/features/manager/manager-page.tsx`.
- Localization and visual contract: `src/i18n.ts` and `DESIGN_GUIDE.md`.
- `package.json` and `bun.lock` already pin the exact required v0.1.23 SDK
  commit `a158bc588f5ec3421788475ccab2c5c2cb47ce9f`.
- The locally cached package at that exact commit verifies nullable customer,
  grant, ledger, registration, and participant identity fields plus
  `setForCustomer`, `listCustomerGrants`,
  `listLedger({ customerId })`, `addCustomerWalkIn`, and
  `users.get(userId)`.
- Repository scripts provide `bun run lint` and `bun run build`; there is no
  automated interaction-test script.

Missing artifact: approved pseudocode. Impact: none; the audited spec fixes the
identity, capability, pagination, recovery, and presentation contracts.

## Design Readiness

- Approved source verified: Yes; the Plan Required assignment explicitly
  supplies the implementation requirements and one-pass planning authority.
- Artifact paths verified: Yes.
- Pseudocode status: Absent and not required.
- Design consistency: Yes; spec, agenda, ready audit, current code, and exact
  SDK types agree.
- Repository reconciliation: the branch starts at the required prerequisite
  merge `793cba3`; no dependency update or history rewrite is needed.
- Remaining non-blocking risks: customer picker density in the attendance
  drawer and availability of linked/ghost/permission browser principals.
- Blockers: None.

## Reconciliations And Decision Ownership

| Item | Evidence / Decision Rule | Owning Chunk | Must Resolve Before |
| --- | --- | --- | --- |
| Existing directory retry clears `accessChanged` before success | Keep forbidden invalidation latched through the explicit retry and clear it only after a successful list response | Chunk 01 | Any embedded picker recovery |
| Customer presentation input currently requires `customerOrigin` | Make that field optional for label/contact helpers; origin rendering still consumes full customer data | Chunk 01 | Registration customer summaries use the helper |
| Membership read and manage are independent | Enforce the four-row audited matrix and separate customer/membership forbidden latches | Chunk 02 | Any membership read or mutation |
| Participant label fallback can expose IDs through the generic helper | Customer summary/detail first; exact `users.get` display name/email only; otherwise localized unknown | Chunk 02 | Attendance presentation |
| Browser principals may be unavailable | Use an existing approved server only and report each missing matrix row honestly | Chunk 02 | Final evidence |

## Plan Chunks

| Chunk | Deliverable | Depends On | Enables | Verification Focus | Status |
| --- | --- | --- | --- | --- | --- |
| [01 — Shared customer picker and effective directory authority](plans/01-shared-customer-picker.md) | Additive customer-directory recovery contract plus reusable, ID-safe, opaque-cursor manager picker | None | Both service workflow migrations | Forbidden latch, selection reset, cursor behavior, label privacy | Ready for Review |
| [02 — Customer-first membership, attendance, and labels](plans/02-customer-first-service-workflows.md) | Atomic service-identity cutover, capability propagation, customer-first presentation, localization, and final verification | Chunk 01 | Complete assignment | Authorization matrix, obsolete-call removal, lifecycle regressions, nullable labels, lint/build/browser matrix | Ready for Review |

## Dependency And Parallelism Order

1. Complete Chunk 01 and verify the shared picker/hook contract without
   changing existing Customers workspace behavior.
2. Complete Chunk 02 as one integration slice because
   `manager-page.tsx`, class surfaces, localization, and the required props
   must agree in the same compilable cutover.

Within Chunk 02, the membership and attendance internals may be implemented
independently after the shared picker exists. Capability propagation,
localization, obsolete-call checks, and final verification integrate them
together.

## Shared Contracts And Integration Points

- `useCustomerDirectory` remains the sole owner of
  `management.customers.list`, opaque cursor pages, filters, refresh/retry, and
  effective customer-read invalidation.
- `CustomerPicker` is a reusable presentational/controller seam over one hook
  instance. It receives selection state and callbacks, uses existing localized
  customer directory copy, clears selection on context changes, and performs no
  service mutation.
- Membership and attendance instantiate independent directory hooks; neither
  shares selected customer or pages through global state.
- `ManagerPage` passes live `canReadCustomers` to membership and class
  management, live `canReadMemberships` to membership, and live
  `canReadUsers` through the class/attendance boundary.
- Cached `ManagerAccessSnapshot` may keep the shell visible but never
  positively authorizes any read.
- Membership uses separate effective customer-read and membership-read
  latches. `memberships.manage` never substitutes for either.
- Membership customer calls use `selectedCustomerId`; stock adjustment and
  revoke continue to use `membershipGrantId`.
- Attendance walk-in calls use `selectedCustomerId`. Participant status,
  start, complete, and trial methods remain unchanged.
- Registration/participant presentation order is customer summary, exact
  customer detail, exact linked-user display name/email, then localized
  unknown. Raw IDs are never labels.
- One attendance generation invalidates base attendance, registration,
  customer-detail, and exact-user fallback results together.

## Approved-Source Coverage

| Requirement / Acceptance Criterion | Covered By | Notes |
| --- | --- | --- |
| Customer directory replaces user selection | Chunks 01–02 | Opaque pagination and lifecycle filters; no false global search |
| Linked and ghost membership set/list/ledger | Chunk 02 | `setForCustomer`, `listCustomerGrants`, customer ledger filter |
| Customer-first grant/upgrade methods where actions remain | Chunk 02 | Current UI retains set/replace only; no unused action is invented |
| Existing customer attendance walk-in | Chunk 02 | `addCustomerWalkIn({ customerId })` |
| Nullable linked-user labels | Chunks 01–02 | Customer-first registration, participant, membership presentation |
| Stock correction and revoke preserved | Chunk 02 | Grant-ID methods remain unchanged |
| Trial participant and attendance lifecycle preserved | Chunk 02 | Existing methods and busy/reconciliation states retained |
| Independent customer/read/manage permissions | Chunk 02 | Four-row matrix plus independent forbidden recovery |
| Deprecated user service paths removed | Chunk 02 | Focused no-match checks |
| Customer directory/lifecycle UI remains out of scope | Chunks 01–02 | Picker reuses list/filter only; no lifecycle mutation |
| Access-role operations stay user-based | Chunk 02 | Exact user reads are presentation-only; role code is untouched |
| Responsive EN/RU/HE behavior | Chunk 02 | Localized customer copy, mobile drawer density, Hebrew RTL |

## Verification Strategy

- Run `rtk bun install --frozen-lockfile` only if dependencies are unavailable;
  expect exit 0 and no `package.json`/`bun.lock` drift.
- Run focused source checks for exact customer-first SDK methods, independent
  capability props/latches, and absence of deprecated membership/attendance
  user paths.
- Run `rtk bun run lint`; expect exit 0.
- Run `rtk bun run build`; the heavy check is justified by new cross-component
  props, SDK types, nullable identities, and broad manager integration.
- Run `rtk git diff --check`; expect exit 0.
- Before browser verification, check whether an approved localhost server is
  already listening. If available, exercise the assignment matrix. If absent,
  do not start one and report the browser gap.

## Risks And Sequencing

- A customer or membership capability can remain true after the API returns
  forbidden. Each protected domain needs a latched invalidation and successful
  explicit recovery probe.
- Membership mutations against stale or absent type/grant context are unsafe;
  the UI requires both live read and manage authority.
- Optional customer/user presentation work can race with class changes and
  attendance refresh. A shared generation is required.
- `CustomerPicker` appears in both a full membership workspace and a compact
  attendance drawer; shared behavior must not force identical layout density.
- There is no automated UI harness, so responsive, RTL, and principal-specific
  acceptance may remain partially manual.

## Execution Handoff

The executor loads the assignment, spec, agenda, both audits, this roadmap, and
both chunk files. Execute Chunks 01–02 in order. Stop if:

- the installed SDK does not resolve to the pinned v0.1.23 commit;
- required customer-first methods or nullable identity fields are unavailable;
- the current customer directory cannot be extended additively without
  breaking the Customers workspace;
- implementation would infer read authority, expose raw IDs, introduce global
  customer state, call a raw backend, or change an out-of-scope policy; or
- overlapping user work cannot be preserved.

This plan remains `Ready for Review`; Symphony's validated planning marker
governs delegated execution authorization.

## User Approval

- Roadmap approved by: One-pass generation authorized by the 2026-07-24 Plan
  Required assignment.
- Plan set approved for execution by: Pending Symphony planning validation and
  delegated implementation.

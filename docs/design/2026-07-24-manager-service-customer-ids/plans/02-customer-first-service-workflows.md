# Chunk 02: Customer-First Membership, Attendance, And Labels

**Plan Set:** `../plan.md`
**Approved Source:** Assignment requirements plus `../spec.md`
**Status:** Ready for Review
**Depends on:** Chunk 01
**Enables:** Complete assignment

## Goal

Complete one compilable customer-identity cutover across membership,
attendance, participant/registration presentation, live capability
propagation, localization, and final verification while preserving ClassKit
stock/accounting and attendance lifecycle ownership.

## Source Artifacts And Constraints

- `../spec.md`: complete membership authority matrix, identity calls,
  attendance generation, label precedence, failures, localization, and
  exclusions.
- `../agenda.md`: settled independent authority and recovery decisions.
- `../spec-audit.md`: exact ready verdict and high-risk constraints.
- `../plan.md` and `01-shared-customer-picker.md`: shared picker/hook contracts.
- Current membership, attendance, registration, class integration, manager
  capability, and locale files named below.
- Exact SDK v0.1.23 commit already pinned in `package.json` and `bun.lock`.
- Preserve direct ClassKit ownership; no Supabase, raw Edge Function, new
  dependency, router, global state, or policy change.

## Relationships

- Consumes independent `CustomerPicker` instances for membership and
  attendance.
- Propagates live capabilities from `ManagerPage`; no child infers authority.
- Keeps Customers workspace membership context and access-role behavior
  unchanged.
- Completes all assignment acceptance criteria; no later production chunk may
  repair an incomplete identity cutover.

## File Responsibility Map

**Create:**

- None.

**Modify:**

- `src/features/manager/memberships/membership-management-tab.tsx` —
  independent authority matrix/latches, customer selection/state, customer
  membership methods, and customer-oriented presentation.
- `src/features/manager/attendance/class-attendance-form.tsx` — customer
  picker/walk-in, customer-first participant labels, exact-user fallback, and
  shared reconciliation generation.
- `src/features/manager/registrations/pending-registrations-panel.tsx` —
  customer-first registration label/contact with ID-safe linked fallback.
- `src/features/manager/classes/class-management-tab.tsx` — pass customer/user
  read capabilities to both attendance surfaces.
- `src/features/manager/classes/class-detail-panel.tsx` — pass customer/user
  read capabilities into embedded attendance.
- `src/features/manager/manager-page.tsx` — pass live customer, membership, and
  user read signals into membership and class/attendance boundaries.
- `src/i18n.ts` — replace user-oriented membership/walk-in copy and add
  independent membership/customer unavailable, recovery, inactive-customer,
  and nullable-label copy in English, Russian, and Hebrew.

**Test:**

- No automated UI test suite exists. Use focused source checks, lint, full
  TypeScript/Vite build, and an existing-server browser matrix when available.

## Behavioral And Contract Changes

Membership enforces:

| Customer read | Membership read | Membership manage | Behavior |
| --- | --- | --- | --- |
| Any | Any | No | Existing no-management state; no membership API calls |
| Any | No/effectively invalid | Yes | Membership-read unavailable; no reads or mutations |
| No/effectively invalid | Yes | Yes | Type list/admin only; no customer-specific calls |
| Yes | Yes | Yes | Full customer membership workflow |

Membership-read forbidden clears types, grants, ledger, and mutation forms but
preserves the independent customer page. While live read remains true, only an
explicit successful `listTypes` retry clears that latch. Customer forbidden
clears directory/selection/customer membership state but preserves authorized
type administration.

Membership selection and calls become:

```ts
selectedCustomerId
listCustomerGrants(selectedCustomerId)
listLedger({ customerId: selectedCustomerId, limit })
setForCustomer({ customerId: selectedCustomerId, ...grantFields })
```

`revoke(membershipGrantId)` and
`adjustStock({ membershipGrantId, stockDelta })` remain unchanged.

Attendance uses `addCustomerWalkIn(classId, { customerId,
attendanceStatus: "present" })`. Start, update participant, complete, trial,
optimistic reconciliation, and error codes remain intact. Customer picker/get
calls require effective customer read; exact `users.get` fallback calls require
live user read. Optional label failures do not fail the attendance lifecycle.

Registration and participant labels never use generic user helpers that can
fall through to an ID. They prefer embedded registration customer, exact
customer detail, explicit linked-user display name/email, then localized
unknown.

## Implementation Tasks

- [ ] In `manager-page.tsx`, pass live `canReadCustomers` and
      `canReadMemberships` into Membership, and live `canReadCustomers` plus
      `canReadUsers` through Class management. Do not add read signals to the
      cached manager snapshot or infer them from manage permissions.
- [ ] Migrate Membership state and UI from `ProductUserListItem`/
      `selectedUserId` to `Customer`/`selectedCustomerId` using the full picker.
      Remove page-local user search and use localized customer lifecycle,
      linkage, empty, and selection copy.
- [ ] Implement the four-row membership matrix and independent effective
      membership/customer forbidden latches. Gate every read and mutation,
      clear only domain-owned protected state, keep latches set during retries,
      and ignore late customer-specific responses after selection/capability
      changes.
- [ ] Replace membership grant/list/ledger calls with the exact customer-first
      methods. Preserve type create/edit/deactivate, grant-ID stock adjustment,
      revoke, busy states, optimistic reconciliation, and server-owned
      `customer_inactive` outcomes.
- [ ] Propagate customer/user read props through both class detail and
      standalone attendance surfaces without changing class-management
      authority.
- [ ] Replace the attendance user dropdown and deprecated walk-in call with the
      compact customer picker and `addCustomerWalkIn`. Customer loss disables
      only customer selection/walk-in; lifecycle, participant updates,
      completion, and trial controls remain governed by attendance authority.
- [ ] Rework attendance reconciliation around one generation for base
      participants, registered summaries, deduplicated customer gets, and only
      unresolved non-null exact user gets. Preserve known optional labels on
      ordinary silent failures, clear protected derived labels on forbidden,
      and prevent cross-class/refresh commits.
- [ ] Update pending registration and attendance label derivation to customer
      summary/detail first and explicit display-name/email fallback only.
      Never render raw customer/user IDs for malformed or unavailable identity.
- [ ] Update all affected membership, attendance, and error strings in
      `src/i18n.ts` with parallel English, Russian, and Hebrew keys. Keep Hebrew
      RTL-safe and replace “user” semantics with “customer” where the service
      recipient is meant.
- [ ] Inspect the complete diff for unrelated formatting or behavior changes,
      then run the exact static, lint, build, and available browser checks.

## Verification

- `rg -n "setForCustomer|listCustomerGrants|customerId|addCustomerWalkIn" src/features/manager/memberships/membership-management-tab.tsx src/features/manager/attendance/class-attendance-form.tsx`
  — finds the expected customer-first service paths.
- `rg -n "management\\.users\\.list\\(|listUserGrants\\(|setForUser\\(|attendance\\.addWalkIn\\(|listLedger\\(\\{[[:space:]]*userId" src/features/manager`
  — expected exit 1; no obsolete selector or service path remains.
- `rg -n "canReadMemberships|canReadCustomers|canReadUsers" src/features/manager/manager-page.tsx src/features/manager/memberships/membership-management-tab.tsx src/features/manager/classes/class-management-tab.tsx src/features/manager/classes/class-detail-panel.tsx src/features/manager/attendance/class-attendance-form.tsx`
  — every independent live capability reaches its owned calls.
- `rg -n "getUserDisplayName|getUserSupportingEmail" src/features/manager/attendance/class-attendance-form.tsx src/features/manager/registrations/pending-registrations-panel.tsx`
  — expected exit 1 unless a call is demonstrably guarded from ID fallback;
  preferred result is complete removal from these customer-first labels.
- `rtk bun run lint` — exits 0.
- `rtk bun run build` — exits 0 and verifies cross-component props, exact SDK
  methods, and nullable identity types.
- `rtk git diff --check` — exits 0.
- Check for an existing server with
  `rtk lsof -nP -iTCP:5173 -sTCP:LISTEN`; do not start one. If present, exercise:
  linked/ghost membership selection, set/change/list/ledger, stock correction,
  revoke, linked/ghost walk-in, trial, nullable-user labels, independent
  customer-read/membership-read/manage loss and recovery, refresh, mobile and
  desktop, light/dark, English/Russian/Hebrew RTL. Record unavailable
  principals or states as explicit gaps.

## Acceptance Criteria Covered

- Linked and ghost customers receive and inspect supported memberships.
- Existing linked and ghost customers can be attendance walk-ins without login
  identity.
- Membership ledger, registration, and participant presentation key by
  customer identity and tolerate `userId: null`.
- Stock/accounting, revoke, type administration, trial participants, and the
  full attendance lifecycle remain ClassKit-owned.
- Deprecated user-id service paths made obsolete by v0.1.23 are removed.
- Independent capability denial, forbidden clearing, explicit recovery, and
  responsive locales are verified or honestly reported.

## Risks, Rollback, And Isolation

- Authorization regression: review each matrix row and both forbidden latches
  before browser work.
- Async label mixing: use one explicit generation rather than independent
  effects that can commit across classes.
- Large integration slice: keep changes limited to the seven owned production
  files and shared Chunk 01 contracts; do not clean adjacent code.
- Rollback is file-local: reverting Chunk 02 restores the prior user-first
  service UI while leaving the additive picker unused and Customers workspace
  intact.

## Non-Goals

- Customer creation/edit/lifecycle changes, manager register/deregister,
  customer merge, new entitlement or attendance policy, access-role migration,
  SDK/backend changes, global customer state, or a new test framework.

## Consistency Check

- Exact SDK method and field names match v0.1.23.
- Every changed prop is passed through all current attendance render paths.
- No two capability signals are inferred or collapsed.
- All visible keys exist in English, Russian, and Hebrew.
- No customer/user ID or raw metadata becomes a display fallback.
- No deprecated service method, direct backend call, or out-of-scope mutation
  remains.

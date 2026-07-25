# Chunk 03: Customers Workspace Integration And Acceptance

**Plan Set:** `../plan.md`
**Approved Source:** `../spec.md`
**Status:** Ready for Review
**Depends on:** Chunks 01–02
**Enables:** Feature completion

## Goal

Expose merge only for eligible source customers and integrate dialog outcomes
into one parent-owned source-retirement/survivor-selection flow, preserving all
existing customer lifecycle, context, role, membership, registration, and
attendance behavior.

## Source Artifacts And Constraints

- `../spec.md`: entry eligibility, parent ownership, denial, success, redirect,
  and final evidence contract.
- `../agenda.md`: one convergence path and separate read/write denial.
- `../spec-audit.md`: verified current owners and risks.
- Chunk 01: eligibility, directory removal, hook, and picker contracts.
- Chunk 02: `CustomerMergeDialog` and complete locale copy.
- `src/features/manager/customers/customer-management-tab.tsx`: selected
  customer, request guards, mutation latch, detail context, and directory.
- `src/features/manager/customers/customer-detail-panel.tsx`: existing action
  surface and responsive detail overlay.
- Do not move ClassKit merge types/calls into the detail panel, duplicate
  reconciliation in the dialog/hook, or weaken current mutation/read guards.

## Relationships

- Consumes all prior chunk exports.
- Owns the only production entry point and local completion/redirect
  reconciliation.
- Preserves existing `ManagerPage` capability integration; no manager-tab or
  navigation file changes are required.
- Final verification covers prior chunks and existing shared picker consumers.

## File Responsibility Map

**Create:**

- None.

**Modify:**

- `src/features/manager/customers/customer-detail-panel.tsx` — render the
  localized merge action only from parent-supplied eligibility and emit
  `onMerge`; preserve lifecycle/role/context ownership.
- `src/features/manager/customers/customer-management-tab.tsx` — own merge
  surface state, denial callbacks, typed merged-source redirect from detail
  load, convergent source retirement/survivor selection, context reload,
  directory refresh, and success notice.

**Test:**

- No automated test file exists. Perform final static checks and conditional
  browser acceptance on an already-running server only.

## Behavioral And Contract Changes

- `CustomerManagementTab` computes source eligibility through the Chunk 01 pure
  predicate and passes only `canMerge` plus `onMerge` to the detail panel.
- Merge entry is absent for inactive, signup-origin, linked, or contradictory
  customers. It is disabled/absent after authoritative customer mutation
  denial and while another customer mutation/surface is active.
- Opening merge hides/suspends ordinary detail/form/lifecycle surfaces and
  anchors source identity to the current selected customer.
- User-driven source changes and ordinary close remain blocked during active or
  unknown completion. Authoritative customer-read denial or live capability
  loss takes precedence and must close/clear protected merge and customer state
  even though an unknown completion's in-memory retry identity is abandoned.
- One parent helper handles:
  - successful merge with authoritative returned survivor; and
  - typed `customer_merged` with survivor ID from merge or later source detail
    loading.
- Before reconciliation, increment detail, membership, linked-user, and merge
  request generations; close competing surfaces; remove the source from every
  cached page; and ensure no source action can fire.
- When a survivor record is returned, set it directly as selected,
  authoritative detail state. When only an ID is known, call
  `management.customers.get(survivorId)` and expose actions only after that
  authoritative record succeeds.
- Existing selected-customer effects reload membership and linked-user context
  for the survivor under current independent capabilities.
- Refresh the current directory page after selection. Do not require the
  survivor to appear on that page and do not insert it into a page whose cursor
  position is unknown.
- Typed `customer_merged` from `loadCustomer(sourceId)` uses
  `isCustomerMergeApiError`, then the same helper. Other current error handling
  remains intact.
- Survivor-picker customer-read forbidden invokes `directory.clearForForbidden`
  and `closeDetail`; preview/merge forbidden closes merge and sets
  `mutationAccessDenied` without discarding read-authorized customer data.
- Successful completion closes merge, selects survivor, announces success,
  refreshes the current page, and leaves the source absent/actionless.

## Implementation Tasks

- [ ] Extend `customer-detail-panel.tsx` with the parent-supplied eligibility
      boolean and `onMerge` callback. Place the destructive/irreversible entry
      with lifecycle actions using clear localized copy, but render it only
      when eligible and permitted.
- [ ] Add merge-surface state to `customer-management-tab.tsx`. Ensure form,
      lifecycle, detail, role, and merge mutations cannot overlap; anchor merge
      to the selected source. Block user-driven source/close changes during
      active/unknown completion, but force mandatory close and protected-state
      clearing on customer-read/capability loss.
- [ ] Implement one merged-source reconciliation helper. Invalidate outstanding
      requests, remove source records, close competing surfaces, resolve the
      authoritative survivor from returned data or `customers.get`, select it,
      and let existing context effects reload under current capabilities.
- [ ] Route normal merge completion and dialog already-merged output through
      the helper. Extend `loadCustomer` to recognize typed
      `customer_merged` and use the same helper without recursion or a generic
      missing-detail notice.
- [ ] Wire survivor-read forbidden to the current protected read-clear path and
      preview/merge forbidden to the mutation latch. Preserve authorized
      read-only customer state after mutation denial.
- [ ] Reconcile directory and notices: remove source immediately, refresh the
      current page, reconcile returned survivor only where it already exists,
      and keep authoritative survivor detail selected even when outside the
      current page.
- [ ] Inspect every existing customer action/context path for a stale source
      reference after success, redirect, close, capability change, and late
      response. Ensure request tokens prevent all late commits.
- [ ] Run final static verification, then check for an existing localhost
      server. If available with suitable principals/fixtures, execute the full
      browser matrix; otherwise record exact unavailable cases without starting
      a server.

## Verification

- `rg -n 'isEligibleMergeSource|CustomerMergeDialog|isCustomerMergeApiError|remove\\(' src/features/manager/customers/{customer-management-tab.tsx,customer-detail-panel.tsx,use-customer-directory.ts}`
  — eligibility, dialog, typed redirect, and source retirement have their
  intended owners.
- `rg -n 'management\\.customers\\.(previewMerge|merge)' src`
  — expected matches only in the merge hook.
- `rg -n 'supabase|functions\\.invoke|fetch\\(' src/features/manager/customers`
  — expected exit 1 with empty output; that is success because there is no raw
  backend path.
- `rg -n 'localStorage|sessionStorage|console\\.' src/features/manager/customers/merge`
  — expected exit 1 with empty output; that is success.
- `rg -n '<CustomerPicker' src/features/manager/{memberships,attendance,registrations,customers}`
  — all existing consumers remain present; inspect that only merge supplies
  record availability.
- `npm run lint`
  — no lint errors.
- `npm run build`
  — TypeScript and Vite compile the complete integration.
- `git diff --check`
  — no whitespace errors.
- `lsof -nP -iTCP -sTCP:LISTEN | rg ':(5173|4173)\\b'`
  — discover an existing supported dev/preview server; a no-match means browser
  acceptance is unavailable and no server is started.

When a server and fixtures exist, browser acceptance records each row:

1. eligible versus ineligible source matrix;
2. distinct linked active/inactive survivor selection across pages/filters;
3. no-conflict and conflict-heavy previews;
4. all scalar choices plus null and JSON metadata replacement;
5. membership outcomes, registration/participant collisions, stock restoration,
   sample truncation, and movement totals;
6. local expiry and typed expired/state-changed;
7. generic preview bad request/not found/conflict and unknown/transport preview
   retry, proving neither enters completion unknown;
8. concurrent activity, idempotency reuse, payload too large, missing recipient
   strategy, already-merged redirect, unknown outcome, and exact replay;
9. authoritative customer-read/capability loss during active and unknown
   completion, proving security teardown wins over dismissal suppression;
10. success source retirement, survivor selection, context refresh, and no
   further source action;
11. mutation forbidden versus customer-read forbidden; and
12. mobile/desktop, light/dark, English/Russian/Hebrew RTL layouts and keyboard
    focus/dismissal behavior.

## Acceptance Criteria Covered

- Eligible manager entry and no ineligible source action.
- Successful merge selects survivor and prevents further source actions.
- Already-merged detail/merge redirects safely.
- Generic and unknown/transport preview failures recover without completion
  ambiguity.
- Read/mutation authority transitions clear only their owned state.
- Authoritative customer-read/capability loss clears protected state even
  during unknown completion.
- Existing Customers and downstream picker workflows remain compatible.
- Complete repository-native verification and responsive locale evidence, or
  explicit evidence gaps.

## Risks, Rollback, And Isolation

- The parent already has several request refs and customer mutations. Merge
  integration must reuse/invalidate them coherently instead of introducing a
  parallel selected-customer owner.
- A redirect fetch failure must leave the source retired and show a recoverable
  directory-level notice; it must not restore source actions.
- Removing the source before refresh is intentionally fail-safe. If refresh
  fails, local source remains unavailable while ClassKit detail reads remain
  authoritative.
- Reverting the UI cannot undo a completed merge. Rollback is code-only; no
  unmerge behavior may be offered.

## Non-Goals

- Manager navigation/capability redesign, backend/SDK/database changes, new
  tests or dependencies, lifecycle/service reconciliation rules, matching,
  unmerge, hard deletion, or starting a server.

## Consistency Check

- Confirm `CustomerDetailPanel` imports no merge SDK types/client.
- Confirm parent helper owns every completion/redirect source-retirement path.
- Confirm source removal precedes any action-capable survivor transition.
- Confirm survivor selection does not depend on current directory page.
- Confirm mutation denial does not clear authorized reads and read denial does.
- Confirm all ordinary lifecycle, role, membership, registration, and
  attendance flows compile and retain their existing gates.

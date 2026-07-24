# Chunk 01: Shared Customer Picker And Effective Directory Authority

**Plan Set:** `../plan.md`
**Approved Source:** Assignment requirements plus `../spec.md`
**Status:** Ready for Review
**Depends on:** None
**Enables:** Chunk 02

## Goal

Provide one reusable manager customer picker over the existing
opaque-cursor directory state, with privacy-safe labels, deterministic
selection reset, and effective customer-read invalidation that survives a
retry until access is actually restored.

## Source Artifacts And Constraints

- `../spec.md`: customer directory reuse, selection, forbidden recovery,
  presentation, and responsive constraints.
- `../agenda.md`: customer identity and effective-authority decisions.
- `../spec-audit.md`: ready verdict and retry-latch warning.
- `src/features/manager/customers/use-customer-directory.ts`: existing state
  owner and Customers workspace consumer.
- `src/features/customers/customer-labels.ts`: existing safe label/contact
  seam.
- `src/features/manager/customers/customer-management-tab.tsx`: compatibility
  consumer whose list/detail behavior must remain unchanged.
- `src/i18n.ts`: existing `manager.customers` filter, state, retry, refresh,
  previous, next, lifecycle, linkage, and unnamed strings are reused.
- `DESIGN_GUIDE.md`: mobile-first, RTL-safe, branded manager surfaces.

## Relationships

- Supplies the independent picker instances used by membership and attendance
  in Chunk 02.
- Preserves the full Customers workspace and does not own membership,
  attendance, capability derivation, or service mutations.
- The picker receives a directory state object and selected ID callbacks; it
  does not persist or globally share state.

## File Responsibility Map

**Create:**

- `src/features/manager/customers/customer-picker.tsx` — reusable customer
  cards/list controls, lifecycle filters, refresh/retry, pagination, selection,
  and compact/full layout variants over caller-owned hook state.

**Modify:**

- `src/features/manager/customers/use-customer-directory.ts` — keep
  authoritative forbidden state latched through explicit retry and expose the
  minimal stable state/actions required by embedded picker consumers.
- `src/features/customers/customer-labels.ts` — allow label/contact inputs that
  omit irrelevant origin data while preserving origin rendering for full
  customer records.

**Test:**

- No automated test directory exists. Use focused type/build verification and
  state-contract inspection; do not add a test framework.

## Behavioral And Contract Changes

The hook continues to own committed pages shaped as:

```ts
type CustomerPage = {
  requestCursor: string | null;
  records: Customer[];
  nextCursor: string | null;
};
```

Its `accessChanged` state becomes an effective-authority latch. A forbidden
response clears records and sets the latch. An explicit retry may call the list
API only while the live capability input is still true, but starting the
request does not clear the latch. Only a successful current-generation response
clears it. Filter/capability/unmount transitions still invalidate stale work.

`CustomerPicker`:

- renders customer-safe name/contact/linkage/lifecycle information;
- supports All/Active/Inactive, Previous/Next, refresh, retry, empty, loading,
  ordinary error, and access-changed states from the hook;
- calls the caller's clear-selection callback before filter/page transitions;
- after successful refresh, clears selection when the selected ID is absent
  from the committed page;
- never displays cursors, customer IDs, user IDs, raw origin strings, or
  metadata; and
- supports a full membership layout and a compact attendance layout without
  changing behavior.

## Implementation Tasks

- [ ] Extend `use-customer-directory.ts` additively so forbidden invalidation
      remains true while an explicit retry is pending and clears only on a
      successful current request. Preserve existing page caching, refresh
      forward-page invalidation, error handling, and Customers workspace
      behavior.
- [ ] Export a narrow directory result type or equivalent stable prop contract
      for presentational consumers without exposing raw cursors or mutation
      authority.
- [ ] Create `customer-picker.tsx` using existing customer directory
      translations and shared label/contact/initial helpers. Implement
      caller-owned selection plus deterministic selection reset for filter,
      page, and refresh reconciliation.
- [ ] Provide bounded `full` and `compact` layout variants using the same
      controls and state semantics. Keep safe wrapping, touch targets, RTL
      alignment, and mobile overflow behavior consistent with the design guide.
- [ ] Relax only the irrelevant `customerOrigin` requirement in the shared
      presentation input. Keep all current customer card/detail callers
      type-compatible and preserve ID-free fallback behavior.

## Verification

- `rtk bun run build` — exits 0 and verifies the additive hook/picker/helper types
  against existing Customers consumers.
- `rtk bun run lint` — exits 0 with valid hook dependencies and JSX.
- `rg -n "accessChanged|forbidden|retry" src/features/manager/customers/use-customer-directory.ts src/features/manager/customers/customer-picker.tsx`
  — inspect that retry start does not restore effective access and success does.
- `rg -n "customerId|userId|metadata|nextCursor|requestCursor" src/features/manager/customers/customer-picker.tsx`
  — expected no rendered raw identity/metadata/cursor values; any identity
  occurrence is limited to selection comparison/callback plumbing.
- `rtk git diff --check` — exits 0.

## Acceptance Criteria Covered

- Every customer is reachable through opaque pagination and lifecycle filters.
- Linked and ghost customers share one selector contract.
- Customer labels tolerate nullable linked user IDs and never expose IDs.
- Permission loss clears protected directory state and explicit successful
  retry is required for recovery.
- Shared picker behavior supports membership and attendance layouts.

## Risks, Rollback, And Isolation

- Existing Customers workspace regression: keep hook changes additive and
  verify its current consumer compiles unchanged.
- Picker over-generalization: support only the two required density variants
  and caller-owned selection; do not add global state or speculative search.
- Reverting the new component and bounded hook/helper changes restores the
  previous Customers workspace without touching service workflows.

## Non-Goals

- Membership or attendance calls, manager capability propagation,
  localization additions, customer lifecycle mutations, registration
  controls, and browser principal testing.

## Consistency Check

- Existing customer card/detail and directory consumers remain valid.
- No raw cursor or service mutation escapes the hook/picker boundary.
- Picker copy exists in all three locales through reused keys.
- No new dependency, backend call, or global state is introduced.

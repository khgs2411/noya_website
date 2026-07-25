# Chunk 02: Customer Workspace And Context

**Plan Set:** `../plan.md`
**Approved Source:** `../spec.md`
**Status:** Ready for Review
**Depends on:** Chunk 01
**Enables:** Chunk 03

## Goal

Deliver the complete Customers list/detail workspace with customer-first
selection, independent membership and linked-access context, ghost-safe role
behavior, authoritative forbidden cleanup, and accessible mobile/wide overlays.

## Source Artifacts And Constraints

- `../spec.md`: all user-facing behavior, capability matrix, state, failures,
  privacy, localization/layout requirements, and exclusions.
- `../spec-audit.md`: authorization, ghost, cursor, and responsive risks.
- Chunk 01 customer label and directory contracts.
- `src/features/manager/users/user-role-management-tab.tsx`: source behavior
  for active role filtering, assignment/revocation reconciliation, and
  effective summary only; not a data or layout template.
- `src/features/manager/access/role-permission-presentation.ts`: existing pure
  permission summary helper.
- `DESIGN_GUIDE.md`: bottom drawer, wide dialog, theme, wrapping, and RTL.
- No customer, membership, registration, or attendance mutation.

## Relationships

- Consumes Chunk 01's installed SDK, label helper, and directory hook.
- Exports `CustomerManagementTab` for Chunk 03.
- Receives independent capabilities from `ManagerPage`; does not read cached
  access or decide navigation.
- Preserves Permissions as the only role-definition owner.

## File Responsibility Map

**Create:**

- `src/features/manager/customers/customer-card.tsx` — safe scannable customer
  row/card with lifecycle, linkage, origin, and selection affordance.
- `src/features/manager/customers/customer-detail-panel.tsx` — accessible
  drawer/dialog identity, membership, and linked-access sections.
- `src/features/manager/customers/customer-management-tab.tsx` — workspace
  composition, selection/detail loads, capability-specific context, catalog
  cache, role mutations, and section recovery.

**Test:**

- No automated interaction harness exists. Use build/static inspection and
  browser smoke in Chunk 03 when an approved server is available.

## Behavioral And Contract Changes

`CustomerManagementTab` accepts:

```ts
type CustomerManagementTabProps = {
  canReadCustomers: boolean;
  canReadMemberships: boolean;
  canReadUsers: boolean;
  canManageUsers: boolean;
};
```

It never starts a customer call unless `canReadCustomers` and a client are
present. Selecting a card stores only `customerId`, loads
`management.customers.get(customerId)`, and guards every completion with the
selection token.

For consistent linked customers:

- `canReadUsers` permits `management.users.get(userId)` and read-only access
  context;
- `canReadUsers && canManageUsers` permits
  `management.users.roles.listAssignable()` plus assign/revoke controls;
- `canReadUsers && !canManageUsers` is read-only;
- `!canReadUsers` explains that linked identity is unavailable and makes no
  user call; and
- contradictory `identityStatus`/`userId` fails closed with no access call.

For ghosts, no user, catalog, assignment, or revoke call is permitted.

Membership type catalog may be cached within the mounted workspace.
Grants/ledger remain keyed by selected `customerId`; filter/page changes close
selection and invalidate their requests.

## Implementation Tasks

- [ ] Build `CustomerCard` from the pure customer presentation helper. Render
      localized lifecycle/linkage/origin labels and contacts without IDs,
      metadata, raw permissions, or unknown origin strings.
- [ ] Compose the Customers header, All/Active/Inactive controls, directory
      states, refresh, next/previous controls, and responsive card/list surface
      around the Chunk 01 hook. Do not add page numbers, totals, or search.
- [ ] Implement selected-customer get state and a focus-managed detail overlay:
      bottom drawer on mobile and compact dialog on wider screens. Support
      Escape, backdrop close, internal click isolation, body scroll handling,
      and focus return.
- [ ] Validate linkage consistency before any access call. Use `userId` as the
      call discriminator and show a localized data-error state for contradictory
      `identityStatus`.
- [ ] Add independent membership type/grant/ledger loading under
      `canReadMemberships`, keyed by the selection token. Render localized
      grant lifecycle, validity, stock, and bounded event history without IDs or
      metadata.
- [ ] Add independent linked-user get state under `canReadUsers`. Render access
      status, scope, active assigned role labels, and the pure grouped
      effective-permission summary.
- [ ] Load/cache `listAssignable()` only for a consistently linked selection
      when linked identity is readable and role mutation is authorized. Port
      active-assignment filtering and local reconcile-plus-silent-refresh from
      the current Users workspace.
- [ ] Keep one role mutation lock for assign/revoke. Preserve selection and
      current assignments on ordinary failure; after success reconcile the
      returned assignment and refresh `users.get`.
- [ ] Classify `ClassKitManagerApiError.code === "forbidden"` separately for
      customer, membership, linked identity/catalog, and mutation calls.
      Customer forbidden clears the entire directory/selection; other forbidden
      responses clear only their protected section and controls.
- [ ] Invalidate all detail-context requests when selection closes, page/filter
      changes, linkage changes, relevant capability disappears, or the
      component unmounts.

## Verification

- `npm run build` — exits 0 with all v0.1.23 customer, membership, user, role,
  and error types.
- `rg -n 'management\\.roles|roles\\.(create|update|grantPermission|revokePermission)' src/features/manager/customers`
  — returns no Customers role-definition calls.
- `rg -n 'management\\.customers\\.(create|update|deactivate|reactivate|merge|previewMerge)|memberships\\.(grant|grantToCustomer|setForCustomer|upgradeForCustomer|revoke|adjustStock)|registrations\\.|attendance\\.' src/features/manager/customers`
  — returns no out-of-scope mutation calls.
- `rg -n 'listAssignable|users\\.get|users\\.roles\\.(assign|revoke)' src/features/manager/customers`
  — only linked-access code paths contain the allowed user-role facade.
- Focused source review proves every user/role call follows a non-null,
  consistency-checked `userId`, and every membership request uses
  `customerId`.
- Focused source review proves each forbidden branch clears its section's
  protected data and disables further controls.

## Acceptance Criteria Covered

- Linked and ghost customers coexist in one paginated directory.
- Selection/detail and membership context key by `customerId`.
- Ghosts receive no login or role affordance.
- Linked access read/mutation combinations are explicit.
- Role assignment/revocation remains functional without role-definition UI.
- Customer identity, origin, lifecycle, membership, and access context avoid
  raw internal fields.
- Loading, empty, error, refresh, selection, mobile, desktop, and RTL-ready
  component behavior.

## Risks, Rollback, And Isolation

- Protected data retention after forbidden is the highest risk. Clear section
  data before rendering access-changed copy.
- Selection races can cross customer identities; all detail loads and mutation
  reconciliation must verify the current customer/user token.
- Reverting this chunk removes only new feature files and the optional pure
  helper extension; it does not change ClassKit data.

## Non-Goals

- Manager navigation exposure, locale registry edits, removal of the old Users
  workspace, or any service/lifecycle mutation.

## Consistency Check

- All calls and fields exist in v0.1.23.
- `CustomerManagementTab` prop names match the plan's manager integration
  contract.
- Detail sections agree on customer/user identity and independent authority.
- Permissions remains the only role-definition/permission-mutation surface.

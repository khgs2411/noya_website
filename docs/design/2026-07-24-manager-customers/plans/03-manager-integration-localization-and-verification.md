# Chunk 03: Manager Integration, Localization, And Verification

**Plan Set:** `../plan.md`
**Approved Source:** `../spec.md` and latest `.symphony/assignment.md`
**Status:** Ready for Review
**Depends on:** Chunks 01–02
**Enables:** Complete assignment

## Goal

Replace the manager Users entry with the live-gated Customers workspace,
preserve Permissions ownership, complete English/Russian/Hebrew copy and
responsive semantics, remove superseded artifacts, and produce final static and
available browser acceptance evidence.

## Source Artifacts And Constraints

- `../spec.md`: navigation/access, localization, accessibility, testing, and
  implementation constraints.
- `../spec-audit.md`: live/cached authority and RTL/browser risks.
- Chunks 01–02 public props and paths.
- Current `src/features/manager/manager-page.tsx`,
  `src/features/manager/manager-tabs.tsx`, `src/App.tsx`, and `src/i18n.ts`.
- Merged Permissions files and `manager.permissions` copy remain authoritative.
- Never add the new read booleans to cached `ManagerAccessSnapshot`.
- Never start a dev server without approval.

## Relationships

- Integrates the stable Customer workspace from Chunk 02.
- Retires the superseded Users workspace after Customers mounts successfully.
- Does not modify ClassKit data, backend contracts, or manager route topology.

## File Responsibility Map

**Create:**

- None.

**Modify:**

- `src/features/manager/manager-page.tsx` — lazy Customers import, live
  capability derivation, safe active-tab repair, and four independent props.
- `src/features/manager/manager-tabs.tsx` — replace primary Users with
  capability-filtered Customers while preserving Permissions in More.
- `src/i18n.ts` — replace obsolete `manager.users`/tab copy with complete
  `manager.customers` and `manager.tabs.customers` keys in English, Russian,
  and Hebrew; preserve Permissions keys.

**Delete:**

- `src/features/manager/users/user-role-management-tab.tsx` — superseded user
  directory/assignment composition after accepted behavior moves into
  Customers.

**Inspect without modification unless required by compilation:**

- `src/App.tsx` — prove cached manager snapshot remains unchanged and cannot
  authorize Customers or membership context.
- `src/features/manager/permissions/permission-management-tab.tsx` — prove
  role-definition ownership remains intact.

**Test:**

- Repository static/build commands, focused source checks, locale parity, and
  existing-server browser smoke when available.

## Behavioral And Contract Changes

`ManagerTab` replaces `"users"` with `"customers"`. `ManagerPage` derives:

```ts
const canReadCustomers =
  accessSnapshot === null && capabilities.dashboard.can_read_customers;
const canReadMemberships =
  accessSnapshot === null && capabilities.dashboard.can_read_memberships;
const canReadUsers =
  accessSnapshot === null && capabilities.permissions.includes("users.read");
const canManageUsers =
  accessSnapshot === null &&
  capabilities.dashboard.can_manage_users &&
  capabilities.permissions.includes("product_user_roles.manage");
```

Equivalent live-only derivation is acceptable if loading defaults already prove
that a cached snapshot cannot make any value true. Do not read these authorities
from `managerAccess`.

Customers is visible/mounted only with `canReadCustomers`. Membership,
linked-user, and role controls remain independently gated inside the mounted
workspace. If customer-read authority becomes false while active, derive
`classes` before render and repair stored state afterward.

## Implementation Tasks

- [ ] Replace the Users lazy import and render branch with
      `CustomerManagementTab`. Pass the four live-only capability booleans and
      guard the mount with `canReadCustomers`.
- [ ] Replace the `"users"` manager tab ID, icon, and localized key with
      `"customers"`. Filter it by `canReadCustomers`; preserve primary placement
      and Permissions in More.
- [ ] Extend safe active-tab derivation so capability loss never mounts
      Customers for an intermediate render. Preserve existing Requests,
      Permissions, and settings repair behavior.
- [ ] Keep `ManagerAccessSnapshot` and `src/App.tsx` free of
      `can_read_customers` and `can_read_memberships`; cached data may preserve
      only the shell and previously accepted non-sensitive behavior.
- [ ] Add a complete `manager.customers` tree and tab key in English, Russian,
      and Hebrew. Include filters, pagination, states, customer labels,
      lifecycle/linkage/origin, membership/access context, forbidden recovery,
      role actions, overlay labels, and announcements.
- [ ] Remove the now-unused `manager.users` copy and delete the superseded Users
      component. Remove only imports/symbols made unused by this replacement.
- [ ] Review narrow/wide markup and logical utilities for themes and Hebrew RTL.
      Directional pagination and close/back icons must account for RTL; long
      contact/role values must wrap.
- [ ] Run focused ownership, privacy, capability, locale, lint, build, and diff
      checks independently. If an approved localhost server exists, exercise
      the browser matrix; otherwise record the exact unverified rows.

## Verification

- `bun install --frozen-lockfile` — exits 0 with no dependency drift.
- `npm run lint` — exits 0.
- `npm run build` — exits 0.
- `git diff --check` — exits 0.
- `rg -n 'can_read_customers|can_read_memberships' src/features/manager/manager-page.tsx`
  — both live dashboard fields are present.
- `rg -n 'can_read_customers|can_read_memberships' src/App.tsx` — returns no
  cached snapshot/storage use.
- `rg -n '\"users\"|manager\\.tabs\\.users|UserRoleManagementTab' src/features/manager src/i18n.ts`
  — returns no superseded manager Users workspace/navigation references.
- `rg -n 'manager\\.tabs\\.customers|manager\\.customers' src/features/manager src/i18n.ts`
  — confirms the new navigation and workspace copy references.
- Focused locale parity inspection confirms every consumed Customers key exists
  in English, Russian, and Hebrew.
- `rg -n 'management\\.roles\\.(list|listPermissions|create|update|grantPermission|revokePermission)' src/features/manager`
  — role-definition calls remain under Permissions only.
- Before browser checks, probe for an existing approved localhost server. If
  present, verify:
  - all/active/inactive pages, next/previous, refresh, empty, and failures;
  - linked/ghost and active/inactive combinations;
  - customer read with and without membership read;
  - linked identity unreadable, read-only, and assignable;
  - role assign/revoke without Permissions authority;
  - authoritative forbidden cleanup and capability loss;
  - mobile drawer, wide dialog, focus/Escape/backdrop;
  - light/dark themes and Hebrew RTL.

## Acceptance Criteria Covered

- Customers replaces Users while Permissions remains separate.
- Live customer and membership read gates match ClassKit v0.1.23.
- Capability combinations are visible and fail closed.
- All copy exists in English, Russian, and Hebrew.
- Mobile, desktop, theme, RTL, loading, refresh, selection, and error behavior
  receive the strongest available verification.
- No obsolete mixed Users/role-management composition remains.

## Risks, Rollback, And Isolation

- Safe tab repair must happen in render before state repair; otherwise a denied
  workspace may mount for one frame.
- Removing `manager.users` copy is safe only after all manager Users references
  are gone; other user-oriented features retain `src/features/users`.
- Reverting this chunk restores the old navigation/import without reverting
  Chunk 01's dependency or Chunk 02's unexposed files. No persisted data or
  migration is involved.

## Non-Goals

- New routes, cached customer capabilities, role-definition changes, lifecycle
  or service mutations, backend/SDK source work, and starting a dev server.

## Consistency Check

- Manager tab IDs, imports, props, and locale keys agree.
- Cached versus live capability ownership matches the spec.
- Removed files/keys have no remaining consumers.
- Verification commands match current repository scripts and server policy.

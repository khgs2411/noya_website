# Chunk 02: Users And Permissions Workspaces

**Plan Set:** `../plan.md`
**Approved Source:** `../spec.md`
**Status:** Ready for Review
**Depends on:** Chunk 01
**Enables:** Final integration and review

## Goal

Atomically integrate the live capability gates and deliver independently
stateful, localized Users and Permissions workspaces: Users owns directory and
role assignment; Permissions owns role definitions and grouped permission
mutation.

## Source Artifacts And Constraints

- `../spec.md`, especially User-Facing Behavior, Page Ownership, Data And State,
  Failure And Recovery, and Localization.
- `../agenda.md` operation split and responsive-navigation decisions.
- Chunk 01 shared presentation seam and ClassKit v0.1.22 contract.
- Existing UI conventions in `DESIGN_GUIDE.md` and manager feature components.

## Relationships

- Consumes Chunk 01 shared presentation helpers and released SDK contract.
- Users and Permissions share no live React state or mutation lock.
- Each workspace retains a defensive denied state even though `ManagerPage`
  owns normal mounting.

## File Responsibility Map

**Create:**

- `src/features/manager/permissions/permission-management-tab.tsx` — complete
  role-definition and grouped-permission workspace.

**Modify:**

- `src/features/manager/manager-page.tsx` — derive live authorization, repair
  denied active tabs before rendering, lazy-load and mount both workspaces.
- `src/features/manager/manager-tabs.tsx` — conditionally expose Users in the
  primary row and Permissions in the More menu.
- `src/features/manager/users/user-role-management-tab.tsx` — remove
  role-definition ownership while retaining directory, assignment, responsive
  details, and effective-permission summary.
- `src/i18n.ts` — matching English, Russian, and Hebrew Users, Permissions, and
  navigation copy.

**Test:**

- No automated behavior-test harness exists; verify API-family ownership,
  locale parity, lint/build, and available responsive structure by inspection.

## Behavioral And Contract Changes

- Users access is `can_manage_users && permissions.includes("users.read")`;
  Permissions access is `can_manage_roles`. Neither gate uses cached manager
  access positively, and denied active tabs resolve safely before mount.
- Users loads `management.users.list()` and
  `management.users.roles.listAssignable()` only when both Users gates hold.
  It mutates assignments only through `assign()` and `revoke()`.
- Users calculates the selected user's read-only effective summary from
  assigned role IDs and permission keys already returned by `listAssignable`.
- Permissions loads `management.roles.list()` and `listPermissions()` and owns
  create, supported update, grant, and revoke calls behind `canManageRoles`.
- Protected roles remain visible with unavailable edit/mutation controls.
- Permissions uses a single local mutation lock; Users uses its own assignment
  mutation lock.
- Initial failures, operation failures, refresh, empty, loading, and unavailable
  states remain localized and workspace-local.

## Implementation Tasks

- [x] Reduce `UserRoleManagementTab` to directory search/selection, identity and
  scope/status details, assign/revoke controls, refresh behavior, and read-only
  effective-permission summaries using the user-management facade only.
- [x] Build `PermissionManagementTab` with role listing, level presets and
  validation, generated keys, create/update flows, protected-role behavior, and
  grouped permission grant/revoke semantics.
- [x] Preserve immediate local reconciliation plus silent authoritative refresh
  after fully successful mutations. On a partial multi-call failure, preserve
  relevant form context and use a later refresh to recover server-authoritative
  state.
- [x] Integrate both workspaces atomically with their import targets: derive
  live-only gates, repair denied active tabs before mount, and place Users in
  primary navigation and Permissions in the More menu.
- [x] Add matching Users, Permissions, and navigation copy across English,
  Russian, and Hebrew using logical-direction responsive layouts.
- [x] Confirm both workspaces defend their capability boundaries and retain
  independent load and mutation state.

## Verification

- `npm run lint` — exits zero.
- `npm run build` — exits zero across workspace props, lazy imports, locale
  references, and ClassKit types.
- `git diff --check` — exits zero.
- Focused API inspection — Users contains
  `management.users.roles.listAssignable/assign/revoke` and no
  `management.roles` definition calls; Permissions contains role-definition
  calls and no user-role calls.
- Locale parity inspection — every consumed Users, Permissions, and
  Permissions-tab key exists in `en`, `ru`, and `he`.
- Focused role-state inspection — none/partial/all groups select the required
  grant or revoke keys, protected-role controls are unavailable, and create,
  update, grant, and revoke share one Permissions mutation lock.
- Browser capability-matrix smoke — run only when an approved server and
  suitable principals already exist; otherwise record the gap.

## Acceptance Criteria Covered

- Users directory, selected-user details, assignment/revocation, refresh, and
  effective-permissions summary.
- Permissions role creation, supported editing, protected roles, grouped
  grant/revoke, and mutation recovery.
- No role-definition authority or permission-catalog fetch in Users.
- Independent workspace state and fail-closed defensive gates.
- English, Russian, and Hebrew mobile-first, RTL-safe presentation.

## Risks, Rollback, And Isolation

Multi-call role mutations may partially succeed remotely. Fully successful
commands reconcile locally and refresh silently; partial failures preserve
context and require a later refresh for server-authoritative recovery. The
workspace split isolates failures and locks; rollback must treat the
Users/Permissions operation boundary as one coherent feature.

## Non-Goals

- A customer-first workspace, new router, shared live access store, or backend
  change.
- Inferring permissions or bypassing ClassKit.
- Browser server lifecycle changes.

## Consistency Check

Workspace paths, component names, ClassKit operation families, locale
namespaces, mutation ownership, protected-role behavior, and verification
commands match Chunk 01 and the approved specification.

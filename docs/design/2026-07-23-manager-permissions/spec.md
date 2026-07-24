# Manager Users And Permissions Split Design

Status: Approved — eligible for implementation planning.
Design directory: `docs/design/2026-07-23-manager-permissions/`

## Goal And Success Criteria

Split the current mixed manager Users surface into two independently authorized
workspaces:

- **Users** owns customer search and selection, linked-user identity details,
  scope and status, role assignment and revocation, and the read-only effective
  permissions summary.
- **Permissions** owns managed-role listing, role creation, supported role
  name/level edits, and grouped permission grants and revocations.

The result succeeds when users-only, roles-only, both-capability, and
neither-capability managers see and can use only the appropriate navigation and
operations; no role-definition mutation remains in Users; current role and
permission behavior remains ClassKit-owned; and all new or revised copy is
localized in English, Hebrew, and Russian with mobile-first, RTL-safe layouts.

ClassKit v0.1.22 resolves the earlier users-only blocker through
`management.users.roles.listAssignable()`, which is authorized at the
user-role-management boundary and returns the complete assignable role catalog
with permission keys.

## Pre-Change Repository Context

- The Symphony assignment ledger scopes this feature independently from the
  later customer-first workspace; this split is an information-architecture
  prerequisite inferred from that boundary.
- `src/features/manager/users/user-role-management-tab.tsx` currently owns both
  user-role assignment and all role-definition behavior in one component. It
  calls `client.management.roles.*` for definitions and permissions, and
  `client.management.users.roles.*` for assignments.
- `src/features/manager/manager-page.tsx` derives
  `dashboard.can_manage_roles` and `dashboard.can_manage_users`, lazy-loads the
  current Users tab, and currently passes both capabilities into it.
- `src/features/manager/manager-tabs.tsx` keeps Users in the primary responsive
  row and lower-frequency manager workspaces in the More menu.
- `src/i18n.ts` contains matching English, Russian, and Hebrew `manager.users`
  trees. Role-definition copy is currently mixed into those trees.
- This card establishes `@class-kit/react` v0.1.22 as Noya's SDK baseline.
  The released facade adds
  `management.users.roles.listAssignable(): Promise<{ roles:
  AssignableProductRole[] }>` alongside assignment and revocation. Each
  assignable role includes identity, level, protected/built-in flags, and its
  permission keys.
- The user directory remains separately authorized by `users.read`;
  `dashboard.can_manage_users` continues to represent
  `product_user_roles.manage` assignment authority and does not imply directory
  read access.
- The repository has no automated test script. `npm run lint` is the focused
  static check; `npm run build` is justified for this change because the split
  changes lazy imports, component props, and ClassKit-backed TypeScript
  boundaries.

## User-Facing Behavior

### Responsive Manager Navigation

- Show **Users** only when live `dashboard.can_manage_users` is true and the
  live permission set includes `users.read`.
- Show **Permissions** only when the live `dashboard.can_manage_roles` value is
  true.
- Keep Users in the primary navigation row because it is an operational
  workspace. Put Permissions in the More menu with the other lower-frequency
  configuration workspaces.
- If a capability disappears while its tab is active, derive a safe effective
  tab before rendering and repair local active state afterward. The denied
  workspace must not mount for an intermediate render.
- A cached manager-access snapshot may preserve the surrounding manager shell
  while live context loads, but it must not positively authorize, expose, or
  mount Users or Permissions. This follows the live-only mount boundary already
  used by the manager Change Requests workspace.
- Managers with neither capability see neither entry. Other manager workspaces
  and their existing authorization behavior remain unchanged.

### Users Workspace

- Load users with `client.management.users.list()` only when `users.read` is
  present and `can_manage_users` is true.
- Load the complete assignable role catalog and permission keys with
  `client.management.users.roles.listAssignable()` under
  `can_manage_users`. Users must not call `management.roles.list()`.
- Preserve customer search, selected-customer behavior, display identity,
  supporting email and phone, product scope, status, assigned roles, role
  assignment, role revocation, refresh, loading, empty, and error behavior.
- Preserve the read-only effective-permissions summary. It is calculated from
  the selected user's assigned role IDs and the `permissions` already returned
  on managed roles.
- Do not call `roles.listPermissions()` or any role-definition mutation from
  Users. A users-only manager must not require `can_manage_roles`.
- Remove the role panel, creation form, edit form, grouped mutation controls,
  role-management persistence key, and role-mutation states from Users.
- Keep assignment operations exclusively under
  `client.management.users.roles.assign()` and `.revoke()`; do not route them
  through the role-definition facade.
- Keep role assignment and revocation locked while an assignment mutation is
  active. Reconcile the returned assignment locally and request the existing
  silent authoritative refresh.

### Permissions Workspace

- Load managed roles with `client.management.roles.list()` and the available
  permission catalog with `client.management.roles.listPermissions()` only
  when `can_manage_roles` is true.
- Present a branded, mobile-first role-definition workspace with refresh,
  loading, empty, unavailable, error, retry, and operation-error states.
- Preserve the existing level presets (coach 20, supervisor 40, manager 75)
  and integer custom levels from 0 through 100.
- Preserve generated role keys and creation through
  `client.management.roles.create()`, followed by grants for each selected
  available grouped permission.
- Preserve supported role updates through
  `client.management.roles.update({ roleId, name, level })`.
- Preserve grouped permission state:
  - no keys granted means unselected;
  - every available key granted means selected;
  - some keys granted means partial;
  - selecting a none/partial group grants only missing keys;
  - selecting a complete group revokes every group key.
- Protected roles remain visible but their edit and permission mutation
  controls remain unavailable.
- Use one mutation lock across create, update, grant, and revoke operations so
  overlapping role mutations cannot start.
- After a successful mutation, reconcile the returned/local result immediately
  and trigger a silent authoritative refresh, matching the current interaction
  contract. On failure, preserve the relevant form/edit context and show a
  retryable operation error.

## Technical Design And Boundaries

### Shared Role-Permission Presentation Model

Extract a small, neutral manager access-role presentation module outside either
page's directory. It owns only the stable curated permission-group definitions,
group icon selection, and pure helpers needed by both surfaces to summarize
permission keys.

This module is the shared seam between Users and Permissions:

- Permissions filters curated groups against the ClassKit permission catalog
  before exposing mutation controls.
- Users maps the selected user's effective keys into the same curated display
  groups. It does not fetch the role-management permission catalog.

The shared module contains no React state, ClassKit types or client access,
capability decisions, mutation orchestration, page state, or localized strings.
Label and description keys remain data references resolved by each surface
through `i18n`.

Role-level presets and validation, generated role keys, catalog filtering, and
group mutation-state calculation are used only by Permissions and remain owned
by that feature. They must not be placed in the shared module merely because
they are extracted from the current combined component.

### Page Ownership

- `UserRoleManagementTab` becomes a users-only workspace with explicit
  `canManageUsers` and `canReadUsers` boundaries.
- A new `PermissionManagementTab` owns the role-definition state and ClassKit
  role/permission operations behind a `canManageRoles` boundary.
- `ManagerPage` remains the sole owner of capability derivation, safe active-tab
  selection, lazy loading, and mounting.
- `ManagerTabs` remains the sole owner of responsive navigation placement and
  receives live-derived booleans instead of reading ClassKit context.
- No new route, global state, persistence model, backend API, production
  dependency family, or direct Supabase/Edge Function call is introduced.
  Noya upgrades its existing `@class-kit/react` dependency from v0.1.21 to
  v0.1.22 and updates the lockfile.

### Authorization Boundary

Capability checks apply to navigation, lazy workspace mounting, loading, and
mutation controls. Each workspace also retains a defensive denied state so it
cannot initiate ClassKit operations if mounted incorrectly.

For Users and Permissions, `ManagerPage` derives positive authorization only
from live `capabilities`, never `accessSnapshot`. The cached snapshot remains
an optimization for the surrounding manager shell, not an authorization source
for mounting these two workspaces. Backend authorization remains authoritative
if a capability changes after a request begins.

The operation split is:

| Workspace | ClassKit operation family | Purpose |
| --- | --- | --- |
| Users | `management.users.list` | User directory and current assignments; requires `users.read` |
| Users | `management.users.roles.listAssignable` | Assignable roles and permission keys for the read-only effective summary |
| Users | `management.users.roles.assign/revoke` | User-role mutations |
| Permissions | `management.roles.list/listPermissions` | Role definitions and available permission catalog |
| Permissions | `management.roles.create/update` | Supported role-definition mutations |
| Permissions | `management.roles.grantPermission/revokePermission` | Grouped permission mutations |

## Data And State

- ClassKit remains authoritative for users, roles, assignments, permission
  catalogs, protected-role flags, and mutation results.
- Users owns only user list, role list, selected user, search query,
  per-user pending assignment choice, load state, and assignment mutation state.
- Permissions owns only role list, permission catalog, create/edit form state,
  load state, and role mutation state.
- The two workspaces do not share live React state. A role definition changed
  in Permissions becomes visible in Users on its next load or refresh.
- Each workspace has its own mutation lock. Splitting the current component must
  not create a cross-page lock or shared request state.
- Selection remains ID-based so refreshes resolve current records instead of
  retaining stale object references.

## Failure And Recovery Behavior

- A missing ClassKit client produces an unavailable/idle surface and no
  operation.
- Initial load failures replace the affected workspace content with its
  localized error and retry action.
- Refresh reloads only the active workspace's required resources.
- Mutation failures preserve forms, edit selection, selected user, and current
  lists while exposing a localized operation error.
- Multi-call grouped grants/revokes and role creation plus grants remain
  server-authoritative. A later refresh is the recovery path if only part of a
  multi-call sequence succeeds.
- Capability loss unmounts the affected workspace before it can make another
  call and returns the manager to the safe default tab.
- A cached positive capability never starts a Users or Permissions load.
- A missing `users.read` permission fails closed before the Users workspace
  mounts; the UI must not attempt directory access or present an incomplete
  assignment surface.

## Localization, Layout, And Accessibility

- Add `manager.tabs.permissions` and a dedicated
  `manager.permissions` locale tree in English, Russian, and Hebrew.
- Retain only user-facing assignment and summary copy in `manager.users`;
  move/reuse role-definition copy through the new Permissions namespace.
- Avoid hard-coded document direction. Use logical Tailwind properties and the
  application's active locale direction.
- Preserve safe wrapping for identity and role values.
- Keep button labels, pressed/expanded state, disabled mutation controls, form
  labels, and loading/error announcements accessible.
- Follow the existing branded shell: blush borders, rounded warm surfaces,
  serif headings, compact controls, and responsive stacked-to-grid layouts.

## Testing And Acceptance Evidence

Static verification:

- `npm run lint` passes.
- `npm run build` passes and confirms the new lazy import, props, shared module,
  and ClassKit types.
- Focused source inspection confirms Users contains no calls to
  `management.roles.create`, `update`, `grantPermission`,
  `revokePermission`, or `listPermissions`.
- Focused source inspection confirms role-definition operations exist only in
  the Permissions feature and assignment operations remain only in Users.
- Locale-key inspection confirms all consumed Users, Permissions, and tab keys
  exist in English, Russian, and Hebrew.
- Focused source inspection confirms cached access never positively authorizes
  the Users or Permissions navigation entries or mounts.

Browser smoke verification, only if an already-running approved local server is
available and suitable test principals already exist:

- users-only: Users visible and usable, Permissions absent, assignment and
  effective summary work;
- roles-only: Permissions visible and usable, Users absent;
- both: both entries work independently and refresh their own data;
- neither: neither entry or workspace mounts;
- protected roles cannot be edited or mutated;
- create/update/group grant/revoke flows lock controls and reconcile;
- narrow and wide layouts work in English/Russian and Hebrew RTL.

If no approved server is already running, report browser interaction coverage as
unverified rather than starting one. If the four capability principals are not
available, report the missing matrix rows explicitly; source inspection is not
evidence that ClassKit authorizes the required runtime operations.

## Implementation Constraints And Seams

- Production implementation must preserve the existing ClassKit-first boundary
  and use only `@class-kit/react`.
- Upgrade the existing SDK pin and lockfile to the released v0.1.22 tag before
  compiling against `AssignableProductRole` and `listAssignable()`.
- Do not implement a website fallback that infers an assignable role catalog,
  calls raw Edge Functions, broadens Users to `can_manage_roles`, or silently
  drops assignment/effective-summary behavior.
- Shared logic is limited to the stable role/permission presentation model;
  page-specific state and mutation orchestration stay with their owning page.
- The change may split the current large component across files as needed to
  establish the correct boundary. Unrelated manager UI cleanup is excluded.
- Existing manager tab authorization behavior outside Users and Permissions is
  not part of this change.

## Assumptions And Provenance

- The outcome, scope, exclusions, capability matrix, ClassKit methods, and
  localization/verification requirements come directly from
  `.symphony/assignment.md`.
- Navigation placement, overlay/layout conventions, and RTL requirements come
  from `DESIGN_GUIDE.md` and current manager components.
- The shared presentation module and separate state ownership are
  repository-grounded design inferences chosen to avoid coupling the two pages
  while satisfying the explicit no-duplication requirement.
- The live-only navigation/mount rule is an agent inference from the existing
  cached-access behavior and the requirement that denied workspaces never
  mount.
- The previous v0.1.21 blocker and the v0.1.22 resolution come from the current
  rework feedback and were verified against the released SDK tag
  `bae7d746397e1ff473477ca9337b90e5a69e1d6d`.

## Open Questions

None. The v0.1.22 user-role-management catalog resolves the prior
cross-repository blocker without changing the accepted product boundary.

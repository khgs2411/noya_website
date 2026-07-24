# Manager Users And Permissions Split Design Agenda

## Status

- Spec: `docs/design/2026-07-23-manager-permissions/spec.md`
- State: Approved
- Approval: Approved by explicit rework assignment on 2026-07-24

## Documented Decisions

- The tracker contract is the approved product direction: role creation,
  supported role editing, and grouped permission mutation move to a dedicated
  Permissions page; user role assignment/revocation and the read-only effective
  summary stay in Users.
- Users is independently authorized by live `dashboard.can_manage_users` plus
  the explicit live `users.read` directory permission.
- Permissions is independently authorized by `dashboard.can_manage_roles`.
- Users remains a primary operational tab. Permissions is a lower-frequency
  configuration entry in the existing responsive More menu.
- Live capability gating covers navigation, safe effective-tab selection,
  mounting, loading, and controls. Cached manager access may preserve the shell
  but cannot positively authorize either workspace.
- ClassKit remains the only data and authorization boundary through
  `@class-kit/react`; the website must not call a backend directly.
- This card upgrades Noya to `@class-kit/react` v0.1.22. Users loads the
  complete assignable role catalog and permission keys through
  `management.users.roles.listAssignable()` and does not call the
  role-definition facade.
- Users does not load the role-management permission catalog or perform
  role-definition mutations.
- A neutral shared role/permission presentation module supplies only curated
  group definitions, icons, and pure summary helpers used by both workspaces.
  Permissions alone owns role presets, level validation, role-key generation,
  catalog filtering, and mutation-state calculation.
- Permissions preserves protected-role behavior, grouped grant/revoke
  semantics, mutation locking, refresh, loading, error, and form context.
- Users and Permissions own independent load state and mutation locks; no live
  state is shared across pages.
- All visible copy is localized in English, Russian, and Hebrew; layouts use
  logical direction and remain mobile-first and RTL-safe.

## Resolved Dependency

- ClassKit v0.1.22 tag and master both resolve to
  `bae7d746397e1ff473477ca9337b90e5a69e1d6d`.
- The released `AssignableProductRole` contains the complete role identity,
  protected/built-in flags, level, and permission-key set.
- `management.users.roles.listAssignable()` calls the deployed
  `list_assignable` user-role-management action, resolving the v0.1.21 catalog
  blocker without granting role-definition authority.
- `users.read` remains an explicit, separate prerequisite for
  `management.users.list()`.

## Questions

No material questions remain. The repository, assignment, and released
v0.1.22 contract determine the product and integration behavior.

## Pressure-Test Result

- Status: Complete
- Categories checked: authorization transitions; independent capability matrix;
  cached-versus-live mount authority; ClassKit operation ownership; multi-call
  mutation recovery; protected roles; shared-logic ownership; localization;
  responsive LTR/RTL navigation; verification feasibility.
- New questions added: None.
- Remaining non-blocking risks:
  - The repository has no automated behavior-test harness.
  - Full capability-matrix interaction evidence depends on an already-running
    approved server and four suitable test principals.
  - `npm run build` is warranted for the lazy-import and TypeScript boundary
    change, but browser behavior remains separately unverified if no approved
    server or principals are available.

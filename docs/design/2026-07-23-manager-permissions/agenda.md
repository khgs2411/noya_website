# Manager Users And Permissions Split Design Agenda

## Status

- Spec: `docs/design/2026-07-23-manager-permissions/spec.md`
- State: Working Draft
- Approval: Not Approved

## Documented Decisions

- The tracker contract is the approved product direction: role creation,
  supported role editing, and grouped permission mutation move to a dedicated
  Permissions page; user role assignment/revocation and the read-only effective
  summary stay in Users.
- Users is independently authorized by `dashboard.can_manage_users`.
- Permissions is independently authorized by `dashboard.can_manage_roles`.
- Users remains a primary operational tab. Permissions is a lower-frequency
  configuration entry in the existing responsive More menu.
- Live capability gating covers navigation, safe effective-tab selection,
  mounting, loading, and controls. Cached manager access may preserve the shell
  but cannot positively authorize either workspace.
- ClassKit remains the only data and authorization boundary through
  `@class-kit/react`; the website must not call a backend directly. Resolving
  the users-only blocker may require a ClassKit facade/authorization contract
  change.
- Users does not load the role-management permission catalog or perform
  role-definition mutations. It still requires a ClassKit-authorized read of
  the complete assignable role catalog and each role's permissions.
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

## Blocking Contract Conflict

- The pinned SDK exposes `management.users.roles.assign/revoke`, but no
  user-authorized role-catalog read.
- `ProductUserListItem` carries current assignment identity, not the complete
  assignable role set or role permission sets.
- `management.roles.list()` is the only current SDK operation that supplies the
  missing data, while current ClassKit backend source protects it with
  role-management authority.
- Therefore the users-only acceptance row cannot be implemented by this website
  without a ClassKit authorization/facade correction. Broadening Users to
  `can_manage_roles`, using a raw Edge Function, or rendering a partial Users
  workspace would violate the assignment.

## Questions

No material questions remain. The repository and assignment contract determine
the product behavior. The ClassKit conflict above is an integration blocker,
not a product question.

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

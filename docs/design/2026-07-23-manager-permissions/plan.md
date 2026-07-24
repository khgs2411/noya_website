# Manager Users And Permissions Split Implementation Plan Set

**Approved Source:** `docs/design/2026-07-23-manager-permissions/spec.md`
**Agenda:** `docs/design/2026-07-23-manager-permissions/agenda.md`
**Pseudocode:** Absent
**Context:** Repository source and the current Symphony assignment ledger
**ADRs:** None
**Status:** Ready for Review

> This plan set records the durable execution contract for the preserved
> workspace after ClassKit v0.1.22 resolved the dependency blocker. It does not
> claim a new approval or restart completed implementation work.

## Goal

Split the mixed manager access surface into independently authorized Users and
Permissions workspaces. Users retains directory and assignment operations
through the user-management facade; Permissions exclusively owns role
definition and permission mutation. Navigation, mounts, copy, and responsive
behavior follow the approved capability matrix and ClassKit boundary.

## Source Artifacts And Repository Evidence

- Approved product contract:
  `docs/design/2026-07-23-manager-permissions/spec.md`.
- Closed decision record:
  `docs/design/2026-07-23-manager-permissions/agenda.md`.
- Integration owners:
  `src/features/manager/manager-page.tsx` and
  `src/features/manager/manager-tabs.tsx`.
- Workspace owners:
  `src/features/manager/users/user-role-management-tab.tsx` and
  `src/features/manager/permissions/permission-management-tab.tsx`.
- Shared presentation seam:
  `src/features/manager/access/role-permission-presentation.ts`.
- Dependency and localization surfaces: `package.json`, `bun.lock`, and
  `src/i18n.ts`.
- Repository-native verification: `bun install --frozen-lockfile`,
  `npm run lint`, `npm run build`, `git diff --check`, focused API-ownership
  inspection, and locale-key parity inspection.
- Missing artifact: approved pseudocode. Impact: none; the approved spec
  defines the operation ownership and authorization contracts directly.
- Verification gap: no approved running server or suitable account matrix was
  available for browser smoke checks.

## Design Readiness

- Approved source verified: Yes.
- Agenda alignment verified: Yes; no open product or architecture decision
  remains.
- Pseudocode status: Absent and not required to resolve implementation shape.
- Repository constraints reconciled: the existing ClassKit dependency advances
  to canonical tag `v0.1.22`; the website continues to use only
  `@class-kit/react`.
- Remaining non-blocking risks: browser interaction evidence still requires an
  already-running approved server and users representing all four capability
  combinations.
- Blockers: None.

## Reconciliations And Decision Ownership

| Item | Evidence / Decision Rule | Owning Chunk | Must Resolve Before |
| --- | --- | --- | --- |
| Released SDK replaces the earlier catalog blocker | Use `management.users.roles.listAssignable()` from canonical ClassKit v0.1.22; never substitute role-definition authority in Users | Chunk 01 | Users integration |
| Browser verification unavailable | Preserve the gap explicitly; do not start a server without approval | Chunk 02 | Terminal evidence |

## Plan Chunks

| Chunk | Deliverable | Depends On | Enables | Verification Focus | Status |
| --- | --- | --- | --- | --- | --- |
| [01](plans/01-sdk-and-manager-access-boundary.md) | SDK baseline and neutral shared presentation seam | None | Workspace split and manager integration | Frozen install and shared-boundary source inspection | Ready for Review |
| [02](plans/02-users-and-permissions-workspaces.md) | Live-gated manager integration, Users-only assignment workspace, Permissions role-definition workspace, and locale-complete responsive UI | Chunk 01 | Final integration | Capability matrix, API ownership, locale parity, lint/build, responsive structure | Ready for Review |

The first chunk establishes the released SDK and shared presentation contract
consumed by both workspaces. The second chunk atomically creates the
Permissions import target, integrates both live capability gates, and owns the
two observable feature surfaces and their localized interaction behavior.

## Dependency And Parallelism Order

1. Complete Chunk 01.
2. Complete Chunk 02 against the established ClassKit and capability boundary.

The workspace components within Chunk 02 may be implemented in parallel once
Chunk 01 is stable, but their localization and manager-page integration must be
verified together.

## Shared Contracts And Integration Points

- `ManagerPage` derives positive Users authorization only from live
  `dashboard.can_manage_users` plus live `users.read`.
- `ManagerPage` derives positive Permissions authorization only from live
  `dashboard.can_manage_roles`.
- `ManagerTabs` receives booleans and owns responsive placement; it does not
  read ClassKit context.
- Users uses only `management.users.list` and
  `management.users.roles.listAssignable/assign/revoke`.
- Permissions uses only the `management.roles` definition and permission
  mutation facade.
- `role-permission-presentation.ts` contains presentation data and pure summary
  helpers only; it owns no ClassKit access, capability decision, or live state.
- English, Russian, and Hebrew locale trees expose matching Users, Permissions,
  and navigation keys.

## Approved-Source Coverage

| Requirement / Acceptance Criterion | Covered By | Notes |
| --- | --- | --- |
| Four-way Users/Permissions capability matrix and safe tab repair | Chunk 02 | Live context only; cached access never authorizes either workspace |
| Canonical ClassKit v0.1.22 baseline and `listAssignable` contract | Chunk 01 | Lockfile resolves the released tag commit |
| Users directory, assignment/revocation, and effective summary | Chunk 02 | No role-definition operation is permitted |
| Permissions role creation and supported editing, protected roles, grouped permission mutation | Chunk 02 | One workspace-local mutation lock; deletion is out of scope |
| Independent load and mutation state | Chunk 02 | No live state shared between workspaces |
| EN/RU/HE localization and mobile-first RTL-safe layout | Chunk 02 | Includes primary Users and More-menu Permissions navigation |
| Static and focused acceptance evidence | Chunks 01 and 02 | Browser matrix remains an explicit environment gap |

## Verification Strategy

- Confirm the canonical dependency graph with
  `bun install --frozen-lockfile`.
- Run `npm run lint` for repository static checks.
- Run `npm run build` because lazy imports, component props, and SDK types
  changed.
- Run `git diff --check` for patch integrity.
- Inspect source ownership so Users contains only user-management calls and
  Permissions contains only role-definition calls.
- Compare consumed locale keys across English, Russian, and Hebrew.
- Inspect none/partial/all permission-group transitions, protected-role control
  guards, and the single Permissions mutation lock.
- Use browser smoke checks only if an approved server and suitable principals
  already exist.

## Risks And Sequencing

- A stale or inferred role catalog would weaken authorization; Chunk 01 must
  establish `listAssignable` before Users work proceeds.
- Cached capability data must not cause an intermediate denied workspace mount.
- Fully successful role mutations reconcile locally and refresh silently.
  Partial multi-call failures preserve context and require a later refresh for
  server-authoritative recovery.
- Browser verification is environment-dependent and must remain disclosed if
  unavailable.

## Execution Handoff

Load the approved spec, agenda, this index, and both chunk files. Execute Chunk
01 before Chunk 02. Stop if the released `listAssignable` contract, explicit
`users.read` prerequisite, live-only capability source, or ClassKit-only
boundary cannot be preserved. This plan is evidence for the preserved work and
does not itself grant new execution approval.

## User Approval

- Roadmap approved by: Pending.
- Plan set approved for execution by: Pending.

# Manager Customers Workspace Implementation Plan Set

**Approved Source:** `docs/design/2026-07-24-manager-customers/spec.md`
**Agenda:** `docs/design/2026-07-24-manager-customers/agenda.md`
**Pseudocode:** Absent
**Context:** Current `version/1.1.5` at merged Permissions commit `77727b9`
**ADRs:** None
**Status:** Ready for Review

## Goal

Replace the manager Users directory with a localized customer-first workspace
that pages and selects service recipients by `customerId`, supports ghosts,
shows independently authorized read-only membership and linked-access context,
and preserves role assignment/revocation without moving role-definition
behavior out of Permissions.

## Source Artifacts And Repository Evidence

- Design: `docs/design/2026-07-24-manager-customers/spec.md`.
- Closed decision ledger:
  `docs/design/2026-07-24-manager-customers/agenda.md`.
- Ready design audit:
  `docs/design/2026-07-24-manager-customers/spec-audit.md`.
- Manager integration:
  `src/features/manager/manager-page.tsx` and
  `src/features/manager/manager-tabs.tsx`.
- Replaced workspace:
  `src/features/manager/users/user-role-management-tab.tsx`.
- Preserved role-definition owner:
  `src/features/manager/permissions/permission-management-tab.tsx`.
- Preserved pure access presentation:
  `src/features/manager/access/role-permission-presentation.ts`.
- Existing user labels:
  `src/features/users/user-labels.ts`; these remain for user-oriented
  consumers and are not reused as the customer label contract.
- Capability cache owner: `src/App.tsx`; new read booleans remain live-only and
  are not added to `ManagerAccessSnapshot` or local storage.
- Localization and visual contract: `src/i18n.ts` and `DESIGN_GUIDE.md`.
- Current dependency state: `package.json` and `bun.lock` pin v0.1.22.
- Required released dependency state: `@class-kit/react` v0.1.23 at
  `a158bc588f5ec3421788475ccab2c5c2cb47ce9f`.
- v0.1.23 verified exports:
  `dashboard.can_read_customers`,
  `dashboard.can_read_memberships`, customer-first list/get and membership
  reads, `ClassKitManagerApiError`, and
  `management.users.roles.listAssignable()`.
- Repository scripts: `npm run lint` and `npm run build`. There is no automated
  interaction-test script.

Missing artifact: approved pseudocode. Impact: none; the spec fixes the state,
capability, facade, and failure boundaries directly.

## Design Readiness

- Approved source verified: Yes; the latest tracker feedback explicitly
  authorizes Plan Only rework against v0.1.23.
- Artifact paths verified: Yes.
- Pseudocode status: Absent and not required.
- Design consistency: Yes; the spec and agenda use the released capability and
  role-catalog contracts and preserve the merged Permissions boundary.
- Repository reconciliation: the preserved branch already descends from
  `version/1.1.5` commit `77727b9`; no rebase or history rewrite is required.
- Remaining non-blocking risks: browser behavior requires an approved running
  server and suitable customer/capability fixtures.
- Blockers: None.

## Reconciliations And Decision Ownership

| Item | Evidence / Decision Rule | Owning Chunk | Must Resolve Before |
| --- | --- | --- | --- |
| Current dependency is v0.1.22 | Update only `package.json` and `bun.lock` to v0.1.23 and verify commit `a158bc5`; do not change production dependency families | Chunk 01 | Customer code compiles |
| Customer read and membership read are independent | Consume the two live dashboard booleans directly; never infer from permissions, role names, levels, or `can_manage_users` | Chunks 02–03 | Any protected call or mount |
| Linked read and role mutation differ | `users.read` permits `users.get`; `can_manage_users` plus explicit `product_user_roles.manage` permits catalog/assign/revoke; role controls require both | Chunk 02 | Linked access controls |
| Browser fixtures may be unavailable | Use an existing approved server only; otherwise preserve the exact matrix gap | Chunk 03 | Final evidence |

## Plan Chunks

| Chunk | Deliverable | Depends On | Enables | Verification Focus | Status |
| --- | --- | --- | --- | --- | --- |
| [01 — SDK baseline and customer foundations](plans/01-sdk-baseline-and-customer-foundations.md) | v0.1.23 dependency contract, safe reusable customer labels, and race-safe opaque-cursor directory state | None | Customer list/detail implementation | Lock resolution, exported types, label privacy, cursor transitions | Ready for Review |
| [02 — Customer detail and service/access context](plans/02-customer-workspace-and-context.md) | Branded customer list/detail workspace with independent membership and linked-access states plus role mutations | Chunk 01 | Manager exposure | Ghost boundary, capability matrix, forbidden cleanup, overlay behavior | Ready for Review |
| [03 — Manager integration, permission grantability, localization, and acceptance](plans/03-manager-integration-localization-and-verification.md) | Customers replaces Users in live-gated navigation; both customer read keys become independently grantable in Permissions; obsolete user workspace/copy removed; EN/RU/HE and final checks complete | Chunks 01–02 | Complete assignment | Safe tab repair, grant/revoke independence, cached/live boundary, locale parity, lint/build/browser matrix | Ready for Review |

## Dependency And Parallelism Order

1. Complete Chunk 01.
2. Complete Chunk 02 against the installed v0.1.23 and foundation contracts.
3. Complete Chunk 03 after the Customers import target is stable.

Within Chunk 02, membership and linked-access detail sections may be developed
in parallel after the selected-customer contract exists. Their authorization,
forbidden cleanup, and selection token behavior must be reviewed together.

## Shared Contracts And Integration Points

- `ManagerPage` reads `can_read_customers` and `can_read_memberships` only from
  live `capabilities.dashboard`.
- `ManagerPage` reads `users.read` from live `capabilities.permissions` and
  role mutation authority from live `dashboard.can_manage_users` plus the
  matching explicit `product_user_roles.manage` permission.
- New read booleans are not written to or read from the cached
  `ManagerAccessSnapshot`.
- `ManagerTabs` receives `canAccessCustomers`; it does not read ClassKit.
- `CustomerManagementTab` receives four independent booleans:
  `canReadCustomers`, `canReadMemberships`, `canReadUsers`, and
  `canManageUsers`.
- Customer directory and every service read use `customerId`.
- `userId` is used only after a consistent linked customer response and only
  for `management.users.get` and `management.users.roles.*`.
- `management.users.roles.listAssignable()` supplies assignment choices and
  effective permission data. Customers never calls `management.roles`.
- `ClassKitManagerApiError.code === "forbidden"` clears protected data for the
  affected section and disables further section calls until live capability or
  explicit retry state changes.
- `src/features/customers/customer-labels.ts` owns pure, ID-free customer label
  and contact presentation. It owns no SDK client, capability, or UI state.
- `src/features/manager/access/role-permission-presentation.ts` remains the
  pure effective-permission grouping seam shared with Permissions. Chunk 03
  adds separate one-permission `customers.read` and `memberships.read` groups;
  their presence makes the keys grantable but never substitutes for Customers'
  live runtime gates.

## Approved-Source Coverage

| Requirement / Acceptance Criterion | Covered By | Notes |
| --- | --- | --- |
| Customers navigation replaces mixed Users composition | Chunk 03 | Permissions remains in More and retains role definitions |
| Active/inactive list with opaque cursor pagination | Chunks 01–02 | All/Active/Inactive server filters; no total/search inference |
| Selected customer detail from ClassKit | Chunk 02 | Selection and refresh keyed by `customerId` |
| Linked and ghost coexist | Chunks 01–02 | Ghosts never reach user/role APIs |
| Display/contact, linkage, origin, lifecycle without raw fields | Chunks 01–02 | Safe helper and localized origin fallback |
| Read-only membership context | Chunk 02 | Independently gated by `can_read_memberships` |
| Linked access and role assignment/revocation | Chunk 02 | `users.read` plus user-role facade; no role-definition calls |
| Capability combinations and stale authorization | Chunks 02–03 | Exact live gates and authoritative forbidden cleanup |
| Future custom roles can receive customer and membership read independently | Chunk 03 | Two localized one-permission groups survive filtering and use existing Permissions grant/revoke flow |
| Reusable customer selection/label seam | Chunk 01 | Pure shared feature module |
| Loading, empty, error, refresh, selection | Chunks 01–02 | Includes stale response and partial-section failures |
| Mobile, desktop, themes, and Hebrew RTL | Chunks 02–03 | Drawer/dialog and browser matrix |
| v0.1.23 baseline | Chunk 01 | Package and lockfile only; no SDK source changes |
| Out-of-scope mutations remain absent | Chunks 02–03 | Focused facade ownership inspection |

## Verification Strategy

- After dependency reconciliation, run `bun install --frozen-lockfile`; expect
  exit 0 and no manifest/lock drift.
- Confirm `package.json` names v0.1.23 and `bun.lock` resolves
  `a158bc588f5ec3421788475ccab2c5c2cb47ce9f`.
- Run `npm run lint`; expect exit 0 with no new errors.
- Run `npm run build`; justified because the feature adds new SDK capability
  fields, exported types, lazy imports, and cross-component props.
- Run `git diff --check`; expect exit 0.
- Use focused `rg` checks for facade ownership, live-only gates, forbidden
  handling, ID privacy, ghost guards, removed Users symbols, and locale parity.
- Before browser verification, check for an already-running approved localhost
  server. If available, exercise pagination, selection, capability, linked/ghost,
  lifecycle, theme, responsive, and RTL scenarios. Otherwise report the
  interaction gap and do not start a server.

## Risks And Sequencing

- v0.1.22 cannot type-check the new dashboard fields; dependency reconciliation
  must precede production code.
- Cursor requests can race with filter, refresh, page, selection, and
  capability transitions; the state contract must reject stale commits.
- A capability can be stale even when live context still says true; server
  `forbidden` responses must remove protected data rather than preserve it as a
  refresh failure.
- A linked customer may be readable while role mutation is unavailable, or vice
  versa. The UI must explain each combination and never collapse it into one
  boolean.
- The current Users file contains useful assignment behavior but is not the new
  data owner. Port only the accepted role behavior, then delete the superseded
  workspace.
- Browser coverage remains environment-dependent because the repository has no
  automated interaction harness.

## Execution Handoff

The executor loads the spec, agenda, both audits, this plan, and all three chunk
files. Execute Chunks 01–03 in order. Stop if:

- the installed SDK does not resolve to v0.1.23 commit `a158bc5`;
- the two dashboard read booleans or `listAssignable()` are unavailable;
- current repository changes overlap an owned file and cannot be preserved;
- implementation would require inferred authorization, a raw backend call,
  global customer state, a new dependency family, or any out-of-scope mutation;
  or
- role-definition behavior would move out of Permissions.

This plan remains `Ready for Review`; Symphony's validated planning marker
governs downstream execution authorization.

## User Approval

- Roadmap approved by: One-pass plan generation explicitly authorized by the
  2026-07-24 rework assignment.
- Plan set approved for execution by: Pending Symphony planning review and
  implementation-card promotion.

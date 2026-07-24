# Chunk 01: SDK And Shared Presentation Boundary

**Plan Set:** `../plan.md`
**Approved Source:** `../spec.md`
**Status:** Ready for Review
**Depends on:** None
**Enables:** Chunk 02

## Goal

Establish the released ClassKit contract and neutral shared presentation seam
required by the independently mounted Users and Permissions workspaces.

## Source Artifacts And Constraints

- `../spec.md`, especially Technical Design, Authorization Boundary, and
  Testing And Acceptance Evidence.
- `../agenda.md`, including the resolved v0.1.22 dependency.
- Repository instructions prohibit direct Supabase or raw Edge Function calls.
- Existing dependency surfaces: `package.json` and `bun.lock`.

## Relationships

- Supplies pure permission-group presentation helpers used by both workspaces.
- Does not own manager integration or either workspace's request, mutation, or
  form state.

## File Responsibility Map

**Create:**

- `src/features/manager/access/role-permission-presentation.ts` — curated
  permission groups, icons, and pure summary helpers.

**Modify:**

- `package.json` — advance the existing ClassKit dependency to canonical tag
  `v0.1.22`.
- `bun.lock` — resolve and freeze the released dependency.

**Test:**

- No automated behavior-test harness exists; use frozen install, lint/build,
  and focused source inspection.

## Behavioral And Contract Changes

- The SDK exposes the user-management `listAssignable` facade required by
  Chunk 02 without granting role-definition authority to Users.
- The shared presentation module remains independent of React state, ClassKit
  clients/types, and localized text.

## Implementation Tasks

- [x] Pin `@class-kit/react` to canonical `v0.1.22` and refresh the Bun lockfile
  without introducing a new dependency family.
- [x] Extract only neutral curated permission presentation data and pure
  effective-summary helpers into the shared manager-access seam.

## Verification

- `bun install --frozen-lockfile` — exits zero without modifying dependency
  files.
- `npm run lint` — exits zero.
- Focused source inspection — confirms the shared module owns no client access,
  capability decision, React state, or localized strings.

## Acceptance Criteria Covered

- Canonical ClassKit v0.1.22 integration.
- Neutral shared role/permission presentation ownership.

## Risks, Rollback, And Isolation

Dependency rollback would remove the required `listAssignable` contract and
therefore cannot preserve the approved feature. The shared seam remains
isolated by excluding client, state, and localization ownership.

## Non-Goals

- Manager navigation/mount integration and workspace request/mutation
  implementations.
- New routes, global state, persistence, backend APIs, or raw service calls.
- Starting or hosting a development server.

## Consistency Check

The dependency tag and shared module ownership match the approved spec and
current repository surfaces. No file in this chunk depends on the Chunk 02
Permissions import target.

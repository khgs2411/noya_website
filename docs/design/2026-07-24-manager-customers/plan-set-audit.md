# Manager Customers Workspace Plan-Set Audit

## Audit Mode: Full

Rationale: The plan spans a dependency baseline, authorization-sensitive async
state, a new customer workspace, manager-shell integration, localization, and
responsive acceptance for AI-assisted execution.

## Plan Overview

Objective: Execute the approved customer-first manager redesign against
ClassKit v0.1.23 and the merged Permissions boundary.

Scope: Three ordered chunks covering SDK/foundation contracts, customer
list/detail and context behavior, then manager integration/localization/final
verification. Backend/SDK source work, new dependency families, lifecycle and
service mutations, unrelated service-screen migrations, and dev-server startup
are excluded.

Target Audience: Human developers and AI implementation agents.

Readiness Level: Ready for Development.

Key Technical Decisions:

- Establish v0.1.23 before compiling any new capability or facade use.
- Separate cursor state from presentational UI and reject stale async commits.
- Keep membership reads, linked-user reads, and role mutations independently
  authorized and independently recoverable.
- Replace Users only after the new import target is stable; preserve
  Permissions and cached/live authority boundaries.

## File Path Verification

Verified using local codebase inspection:

| Referenced Path | Status | Notes |
| --- | --- | --- |
| `package.json` | Exists | Current v0.1.22 manifest; Chunk 01 owns bounded update. |
| `bun.lock` | Exists | Current v0.1.22 resolution; Chunk 01 owns bounded refresh. |
| `src/features/users/user-labels.ts` | Exists | Preserved user-oriented helper. |
| `src/features/manager/manager-page.tsx` | Exists | Chunk 03 integration owner. |
| `src/features/manager/manager-tabs.tsx` | Exists | Chunk 03 navigation owner. |
| `src/features/manager/users/user-role-management-tab.tsx` | Exists | Superseded file deleted in Chunk 03 after behavior transfer. |
| `src/features/manager/permissions/permission-management-tab.tsx` | Exists | Preserved role-definition owner. |
| `src/features/manager/access/role-permission-presentation.ts` | Exists | Pure shared permission presentation seam. |
| `src/features/manager/memberships/membership-management-tab.tsx` | Exists | Explicit adjacent non-goal. |
| `src/App.tsx` | Exists | Inspection-only cached snapshot owner. |
| `src/i18n.ts` | Exists | Chunk 03 locale owner. |
| `DESIGN_GUIDE.md` | Exists | Responsive/theme/RTL contract. |
| `src/features/customers/customer-labels.ts` | Planned creation | Chunk 01 pure customer presentation seam. |
| `src/features/manager/customers/use-customer-directory.ts` | Planned creation | Chunk 01 async page state. |
| `src/features/manager/customers/customer-card.tsx` | Planned creation | Chunk 02 list presentation. |
| `src/features/manager/customers/customer-detail-panel.tsx` | Planned creation | Chunk 02 detail overlay. |
| `src/features/manager/customers/customer-management-tab.tsx` | Planned creation | Chunk 02 workspace composition/export. |

All design, audit, roadmap, and chunk-plan paths exist.

## Strengths

### 1. Dependency-Aware Vertical Sequencing

The plan correctly makes v0.1.23 and foundational state contracts the first
chunk, builds the complete unexposed Customers workspace second, and changes
manager navigation only after a stable import target exists.

### 2. Exact Ownership Map

Every created, modified, deleted, and inspection-only file has one owning chunk.
No two chunks claim the same mutable surface, and Permissions remains outside
the replacement boundary.

### 3. Authorization And Data-Integrity Coverage

The chunks carry the exact dashboard/user capability matrix, forbid authority
inference, clear protected data on authoritative forbidden responses, and
guard customer/detail commits with identity tokens.

### 4. Objective Acceptance Mapping

Every assignment requirement maps to one or more chunks, with exact commands
for dependency resolution, type/build, lint, source ownership, locale parity,
and conditional browser evidence.

## Critical Issues

None.

## Questions for Plan Author

None. The plan assigns all non-blocking implementation choices with bounded
rules and contains no unresolved product or architecture decision.

## Recommendations

### Execution Discipline

- Review the `package.json`/`bun.lock` diff immediately after dependency
  regeneration and stop on unrelated drift.
- Keep async tokens explicit in hook/workspace state rather than relying on
  closure timing.
- Treat expected no-match `rg` checks as explicit pass conditions in the
  implementation report.

### Review Evidence

- Report browser matrix rows individually if only some suitable principals
  exist.
- Preserve the exact forbidden-response evidence separately for customer,
  membership, and linked access.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| SDK lock drift | Low | High | Bounded ownership and exact commit check in Chunk 01. |
| Stale page/detail commits | Medium | High | Generation and selection-token contracts in Chunks 01–02. |
| Protected data survives forbidden | Medium | High | Section-specific clearing and focused inspection in Chunk 02. |
| Navigation briefly mounts denied Customers | Medium | High | Render-time effective tab before state repair in Chunk 03. |
| Role configuration leaks into Customers | Low | High | Facade ownership checks and preserved Permissions owner. |
| RTL/overlay defect lacks automation | Medium | Medium | Conditional existing-server matrix with disclosed gaps. |

Highest Risk: Cross-section authorization drift under stale context. The plan
addresses it before final integration and verifies each protected surface
independently.

## Pre-Development Checklist

- [x] Explicit approved rework source and v0.1.23 release named.
- [x] Design and design audit are ready.
- [x] Every existing path verified and every planned path has one owner.
- [x] Dependencies and parallelism are coherent.
- [x] Acceptance criteria map completely to chunks.
- [x] Verification commands and expected signals are concrete.
- [x] AI stop conditions and forbidden actions are explicit.

## Next Steps

1. Execute Chunk 01 and verify the exact SDK commit before customer code.
2. Execute Chunk 02 and inspect ghost/forbidden/race boundaries.
3. Execute Chunk 03, then run final static and available browser acceptance.

## Evaluation Matrix

| Dimension | Weight | Raw Score | Weighted Score | Notes |
| --- | --- | --- | --- | --- |
| Completeness | x3 | 5/5 | 15/15 | Every requirement, failure state, file, and verification layer is assigned. |
| Feasibility | x3 | 5/5 | 15/15 | Released SDK and current merged repository provide all required contracts. |
| Clarity | x2 | 5/5 | 10/10 | Tasks, decision rules, ownership, and expected signals are explicit. |
| Logical Flow | x2 | 5/5 | 10/10 | Dependency, domain, then integration ordering avoids broken intermediate exposure. |
| Scope & Risk | x2 | 5/5 | 10/10 | Exclusions and high-risk authorization/race boundaries are controlled. |
| Developer Experience | x1 | 5/5 | 5/5 | Each chunk has an observable milestone, file map, and stop conditions. |
| AI Readiness | x1 | 5/5 | 5/5 | Autonomous actions, forbidden expansions, verification, and rollback are concrete. |

Overall: 70/70 -> Ready for Development.

Critical Dimension Check: Pass; no x3 dimension scores 1.

## Handoff

PLAN APPROVED FOR IMPLEMENTATION

Key constraints:

- Resolve and verify v0.1.23 before new SDK use.
- Use only exact live capability sources and ClassKit facades.
- Reject stale async commits and clear protected data on forbidden.
- Keep role definition and permission mutation exclusively in Permissions.
- Do not add service/lifecycle mutations or start a server.

Suggested starting point: Chunk 01 dependency and customer foundation files.

First milestone: the repository compiles against v0.1.23 with a safe,
race-resistant customer directory state contract.

Verdict: Ready for Development

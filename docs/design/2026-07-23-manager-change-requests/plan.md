# Manager Change-Request Workspace Implementation Plan Set

**Approved Source:** `.symphony/assignment.md` accepted task requirements
**Design:** `spec.md` (Ready for Review)
**Agenda:** `agenda.md`
**Pseudocode:** Absent
**Context:** `ROADMAP.md` and `DESIGN_GUIDE.md`
**ADRs:** None
**Status:** Ready for Review

## Goal

Deliver a manager-only, localized Requests workspace that uses the pinned
ClassKit change-request manager API to list, create, revise, soft-delete, and
attach files while preserving append-only history and keeping status, context,
and attachment metadata read-only.

## Source Artifacts And Repository Evidence

- `.symphony/assignment.md` is the explicit approved requirement source and
  fixes the supported operations, permission, request types, statuses,
  acceptance criteria, and exclusions.
- `spec.md` and `agenda.md` ground those requirements in the current manager
  shell and resolve the SDK hook mismatch, context preservation, cached-access
  boundary, revision ordering, and upload reconciliation.
- `spec-audit.md` independently verifies the design and ends with
  `Verdict: Ready for Development`.
- `src/features/manager/manager-page.tsx` owns capability derivation,
  lazy-loaded workspaces, and active manager-tab state.
- `src/features/manager/manager-tabs.tsx` owns the manager tab definitions and
  overflow navigation.
- `src/App.tsx` distinguishes live capabilities from a cached
  `ManagerAccessSnapshot`.
- Existing manager domain files establish local loading/mutation state and
  branded drawer/dialog patterns.
- `src/i18n.ts` owns English, Russian, and Hebrew copy.
- `package.json` and `bun.lock` pin `@class-kit/react@v0.1.21` and define
  `npm run lint` and `npm run build`; no automated test script exists.
- No pseudocode, glossary, or ADR is required. Their absence does not leave a
  product, architecture, or contract choice unresolved.

## Design Readiness

- Approved source verified: Yes — the accepted Symphony assignment supplies
  explicit requirements and execution authorization.
- Artifact paths verified: Yes.
- Pseudocode status and alignment: Absent; the SDK and component boundaries are
  sufficiently concrete without it.
- Source consistency: The spec and agenda agree with the assignment after one
  repository-backed correction: the pinned SDK exposes
  `useProductContext().client.management.changeRequests`, not a `useClassKit`
  hook.
- Repository constraints reconciled: live capabilities, not cached manager
  access, positively authorize the workspace; exact SDK response/input types
  remain compile-time conformance.
- Remaining non-blocking risks: dependencies are initially absent; no approved
  local dev server is running; the repository has no automated UI test layer.
- Blockers: None.

## Reconciliations And Decision Ownership

| Item | Evidence / Decision Rule | Owning Chunk | Must Resolve Before |
| --- | --- | --- | --- |
| Installed SDK resolution | Install from the existing lockfile and confirm exported v0.1.21 types match `bun.lock` commit; stop on mismatch rather than adding an adapter | 01 | Writing SDK-backed code |
| Summary distinguisher | Show localized current title fallback plus `created_at`; show `version_number` within history | 01 | Completing list/detail presentation |
| Temporarily null client | Follow existing manager features: localized unavailable/error state with retry, never a direct fallback client | 01 | Loading requests |
| No browser server | Use a server only if already running; otherwise record the manual-flow gap | 02 | Final verification report |

## Approved Chunks

| Chunk | Deliverable | Depends On | Enables | Verification Focus | Status |
| --- | --- | --- | --- | --- | --- |
| [01](plans/01-change-request-workspace.md) | A self-contained permission-defensive ClassKit request workspace with list/detail and all supported mutations | None | Manager-shell exposure | SDK type conformance, authorization short-circuit, authoritative reconciliation, overlay behavior | Ready for Review |
| [02](plans/02-manager-integration-and-localization.md) | Live-capability navigation/mount integration and complete English/Russian/Hebrew copy | 01 | Complete accepted feature | cached-vs-live authorization, active-tab repair, locale parity, lint/build and available smoke evidence | Ready for Review |

The first boundary isolates the domain controller and form/detail interactions
from the existing manager shell. The second owns all existing-file integration
and localization, so no two chunks claim the same file.

## Dependency And Parallelism Order

1. Execute Chunk 01.
2. Execute Chunk 02 after Chunk 01 compiles against the installed SDK.

The chunks are intentionally sequential. Chunk 02 imports the completed
workspace and exposes it through the manager shell. No chunk is safely parallel
because integration depends on the exact exported component contract.

## Shared Contracts And Integration Points

- Chunk 01 exports:

  ```ts
  ChangeRequestManagementTab({
    canManageChangeRequests,
  }: {
    canManageChangeRequests: boolean;
  }): JSX.Element
  ```

- The component must return a data-free denied state and must not call
  `management.changeRequests` when its permission prop is false.
- Chunk 02 derives the prop only from current live
  `capabilities.permissions`; `accessSnapshot !== null` forces it false.
- Chunk 02 supplies the `manager.changeRequests.*` and
  `manager.tabs.changeRequests` translation contract used by Chunk 01.
- The only external data integration is the pinned SDK client's
  `management.changeRequests` namespace.

## Approved-Source Coverage

| Requirement / Acceptance Criterion | Covered By | Notes |
| --- | --- | --- |
| Add manager navigation entry and workspace | 01, 02 | Domain workspace then shell exposure |
| Hide and protect without `product_change_requests.manage` | 01, 02 | Component short-circuit plus live-capability navigation/mount guard |
| List title, type, status, context, revisions, attachments | 01 | Internal storage identifiers and download behavior excluded |
| Create issue and feature-request threads | 01 | Required description; optional title; no editable status/context |
| Append revisions and preserve visible history | 01 | Current context passed unchanged; history sorted by `version_number` |
| Soft-delete threads | 01 | Explicit confirmation; close/remove after authoritative success |
| Upload attachments through SDK | 01 | `{ file }` input and post-upload `list()` reconciliation |
| Status and context read-only | 01 | No mutation controls |
| English, Hebrew, Russian and responsive layout | 01, 02 | Layout in domain; all copy in localization integration |
| No Supabase/raw Edge Function/admin/status/download work | 01, 02 | Source inspection and import/call audit |
| Permission, CRUD/upload, history, locales, responsive verification | 01, 02 | Static checks plus existing-server smoke only if available |

## Verification Strategy

- Install dependencies from the existing lockfile only if absent, without
  changing dependency manifests or lockfiles.
- Run `npm run lint` after the complete change; expect exit 0 with no new error
  or warning attributable to the feature.
- Run `npm run build` because this feature adds a new pinned-SDK surface and
  cross-component TypeScript contracts; expect `tsc -b` and Vite to exit 0.
- Use focused `rg` inspection to prove the permission guard and absence of
  direct Supabase, raw Edge Function, download, admin, or status-mutation calls.
- Compare `manager.changeRequests` keys across all three locale trees.
- Before any browser smoke check, test whether an approved localhost server is
  already running. Exercise the full acceptance flow only when it exists;
  otherwise report the unverified interaction/layout gap and do not start a
  server.

## Risks And Sequencing

- Authorization is the highest-risk integration: the cached snapshot may render
  the manager shell but cannot expose, import, mount, load, or mutate Requests.
  Chunk 02 must derive an effective active tab before rendering and then repair
  stored state.
- A successful upload followed by list-refresh failure creates a partial UI
  result. Preserve the selected thread and current list, report refresh
  failure, and allow retry rather than fabricating metadata.
- The feature is form- and overlay-heavy but has no automated interaction test
  harness. Focus management, Escape, backdrop close, body scroll, RTL, and
  narrow/wide layouts require browser evidence when an approved server exists.
- Reverting Chunk 02 removes exposure without changing domain data. Reverting
  Chunk 01 removes only new feature files; there is no migration or persistent
  website-owned state.

## Execution Handoff

The executor must load `.symphony/assignment.md`, `spec.md`, `agenda.md`,
`spec-audit.md`, this plan, and each chunk plan. Execute 01 then 02 in the
current worktree. Stop and report if the installed dependency does not match the
pinned change-request contract, if existing unrelated changes overlap owned
files, or if repository evidence would require new product behavior,
persistence, a public API, or a production dependency.

The plan set is internally ready but remains `Ready for Review`; Symphony's
validated planning marker governs delegated execution for this mission.

## User Approval

- Roadmap approved by: One-pass generation authorized by the Symphony lead
  assignment on 2026-07-23
- Plan set approved for execution by: Pending planning audits and Symphony
  planning marker

# Manager Change-Request Workspace Plan-Set Audit

## Audit Mode: Full

Rationale: The plan set spans a permission-sensitive SDK integration, four new
domain files, three shared manager-shell/localization files, two sequential
chunks, and AI-assisted execution.

## Plan Overview

Objective: Deliver a manager-only Requests workspace that lists, creates,
revises, soft-deletes, and attaches files to ClassKit product change-request
threads while preserving append-only history and read-only ClassKit-owned
fields.

Scope: The plan includes a self-contained change-request domain workspace,
live-capability navigation and mount guards, authoritative SDK reconciliation,
responsive overlay interactions, and English, Russian, and Hebrew localization.
It explicitly excludes new routes, persistence, status mutation, downloads,
direct Supabase or raw Edge Function access, admin APIs, new ClassKit work, and
new production dependencies.

Target Audience: Both human developers and the AI-assisted Symphony execution
workflow.

Readiness Level: Ready for Development.

Key Technical Decisions:

- Chunk 01 isolates request state and all five SDK operations in a new manager
  domain folder; Chunk 02 alone integrates that export into existing manager
  navigation and localization.
- `ManagerPage` derives positive authorization only from current live
  capabilities. A cached `ManagerAccessSnapshot` may preserve the enclosing
  shell but cannot expose, import, mount, load, or mutate Requests.
- The website uses the repository-supported
  `useProductContext().client.management.changeRequests` boundary and the
  pinned SDK's exported types; it does not add an adapter for the assignment's
  nonexistent `useClassKit` hook.
- ClassKit remains authoritative. Selection is ID-based, revisions are rendered
  from copied SDK records, update passes current context through unchanged, and
  upload refreshes `list()` before showing authoritative metadata.

## File Path Verification

Verified using local repository inspection. Builds and tests were not run.

| Referenced Path | Status | Notes |
| --- | --- | --- |
| `.symphony/assignment.md` | Exists | Authoritative task requirements and acceptance criteria. |
| `docs/design/2026-07-23-manager-change-requests/spec.md` | Exists | Accepted design source for the plan set. |
| `docs/design/2026-07-23-manager-change-requests/agenda.md` | Exists | Records resolved permission, SDK, context, revision-order, and upload decisions. |
| `docs/design/2026-07-23-manager-change-requests/spec-audit.md` | Exists | Design audit ends with the required ready verdict. |
| `docs/design/2026-07-23-manager-change-requests/plan.md` | Exists | Plan-set index, contracts, coverage, and execution order. |
| `docs/design/2026-07-23-manager-change-requests/plans/01-change-request-workspace.md` | Exists | Owns the isolated feature domain. |
| `docs/design/2026-07-23-manager-change-requests/plans/02-manager-integration-and-localization.md` | Exists | Owns existing-file integration and localization. |
| `ROADMAP.md` | Exists | Confirms permission, append-only history, and read-only status boundaries. |
| `DESIGN_GUIDE.md` | Exists | Confirms mobile-first, RTL-safe, drawer/dialog, and branded UI requirements. |
| `package.json` | Exists | Defines `npm run lint` and `npm run build`; no automated test script exists. |
| `bun.lock` | Exists | Sole dependency lockfile; pins the ClassKit SDK commit cited by the design. |
| `src/App.tsx` | Exists | Supplies the cached-versus-live `ManagerPage` rendering context; correctly remains unmodified. |
| `src/features/manager/manager-page.tsx` | Exists | Owns capability derivation, active-tab state, lazy imports, and workspace rendering. |
| `src/features/manager/manager-tabs.tsx` | Exists | Owns the typed primary/overflow manager navigation model. |
| `src/i18n.ts` | Exists | Owns all three locale trees. |
| `src/components/ui/button.tsx` | Exists | Existing control primitive. |
| `src/components/ui/toast.tsx` | Exists | Existing operation-feedback primitive. |
| `src/lib/focus.ts` | Exists | Existing focus capture/restore helpers. |
| `src/features/manager/change-requests/change-request-management-tab.tsx` | Not Found — expected creation | Assigned only to Chunk 01. |
| `src/features/manager/change-requests/use-change-requests.ts` | Not Found — expected creation | Assigned only to Chunk 01. |
| `src/features/manager/change-requests/change-request-detail-panel.tsx` | Not Found — expected creation | Assigned only to Chunk 01. |
| `src/features/manager/change-requests/change-request-form-dialog.tsx` | Not Found — expected creation | Assigned only to Chunk 01. |

All plan-relative links resolve from their containing documents. No file is
owned by both chunks.

## Scope And Acceptance Coverage

| Requirement / Acceptance Criterion | Plan Coverage | Assessment |
| --- | --- | --- |
| Hide and protect Requests without `product_change_requests.manage` | Plan shared contract; Chunk 01 component short-circuit; Chunk 02 live-only tab/import/mount guard and same-render active-tab fallback | Complete |
| List current title, type, status, context, revisions, and attachment metadata | Chunk 01 controller, list/detail tasks, presentation exclusions, and acceptance criteria | Complete |
| Create `issue` and `feature_request` threads | Chunk 01 create form and SDK-operation contract | Complete |
| Append revisions while preserving history and context | Chunk 01 revision form, unchanged context pass-through, SDK-result/list reconciliation, and ordered copied revisions | Complete |
| Soft-delete with explicit confirmation | Chunk 01 detail-panel task and deletion reconciliation | Complete |
| Upload through `uploadAttachment(requestId, { file })` | Chunk 01 controller and post-upload authoritative `list()` refresh | Complete |
| Keep status and context read-only | Chunk 01 behavior, form boundaries, and non-goals | Complete |
| Show metadata without downloads or internal storage fields | Chunk 01 attachment presentation boundary and forbidden-call inspection | Complete |
| Preserve mutation drafts/selection and expose retryable failures | Chunk 01 controller, form, management-tab, and upload-refresh risk handling | Complete |
| English, Hebrew, Russian, RTL, mobile, and desktop behavior | Chunk 01 responsive surfaces; Chunk 02 complete locale trees and available browser smoke | Complete, with browser evidence conditional on an already-approved server |
| No direct Supabase, raw Edge Function, admin, status-mutation, or new backend work | Both chunks' constraints, non-goals, and focused source inspection | Complete |

The accepted design's safe textual fallback for an unknown SDK status or
request type is not repeated verbatim in Chunk 01. The plan's localized
status/type presentation and requirement to follow `spec.md` keep the behavior
derivable, so this is a non-blocking clarity improvement rather than an
unresolved product decision.

## Sequencing And Dependencies

The two-chunk order is coherent:

1. Chunk 01 confirms the installed SDK contract, establishes the single
   operation owner, and exports the permission-defensive workspace.
2. Chunk 02 imports that exact export, adds the conditional manager tab,
   repairs active state, and supplies every translation consumed by Chunk 01.

The write sets are disjoint, and Chunk 02 depends on Chunk 01's named export and
prop contract. Keeping the chunks sequential avoids integration against a
speculative component boundary. Chunk 01 can compile before localization
definitions because the repository's `t` calls are not resource-key typed;
full locale completeness is correctly owned and verified in Chunk 02.

## Repository-Native Command Verification

| Command / Check | Status | Notes |
| --- | --- | --- |
| `npm run lint` | Valid | Resolves to the repository's `eslint .` script. |
| `npm run build` | Valid and justified | Resolves to `tsc -b && vite build`; the new pinned-SDK types and cross-component contracts create the TypeScript risk that repository guidance requires for a full build. |
| `rg -n "management\\.changeRequests" src/features/manager/change-requests` | Valid | Provides a focused operation-owner inventory after Chunk 01. |
| Forbidden-surface `rg` checks | Valid with an exit-code caveat | No match is the expected content signal, but `rg` exits 1 when no match exists; execution reporting must treat that as expected rather than a failed verification. |
| Authorization `rg` check across `manager-page.tsx` and `manager-tabs.tsx` | Valid | Can demonstrate that the permission key remains at the page boundary and the tab consumes only the derived boolean. |
| `rg -n "changeRequests:" src/i18n.ts` | Valid but coarse | Confirms three feature trees exist; the plan's separate consistency check must still compare every consumed nested key across all locales. |
| Existing-server browser smoke | Repository-compliant | The plan first checks for an already-running server and forbids starting one without approval. |
| Dependency installation | Direction is correct but command is implicit | With dependencies absent and `bun.lock` as the sole lockfile, execution should use the lockfile-preserving Bun install mode rather than an unconstrained npm install. |

No builds, tests, dependency installation, or browser checks were run during
this audit.

## Strengths

### 1. Authorization Is A Mount And Data Boundary

The plan protects tab visibility, lazy import activation, component mounting,
loading, and mutations. Its effective-active-tab rule prevents an effect-only
permission repair from mounting denied content for one render.

### 2. Chunk Ownership Is Clean

Chunk 01 creates only isolated domain files; Chunk 02 modifies only the three
existing integration files. The dependency contract is explicit, rollback is
local, and there is no shared-file collision between chunks.

### 3. SDK Reconciliation Preserves Server Authority

The plan prevents synthesized revisions, attachments, statuses, or contexts.
It preserves current context on revision, orders a copied history, resolves
selection from the latest list, and handles the upload-success/refresh-failure
split without fabricating metadata.

### 4. Acceptance And Recovery Behavior Are Executable

Loading, empty, denied, error, retry, mutation-busy, confirmation, and success
states are assigned to concrete components. Create/revise drafts and selected
threads survive failure, while permission loss unmounts the feature.

### 5. Scope Matches The Product Boundary

The plan adds no route, backend, persistence, global state, adapter,
download behavior, status mutation, admin API, or production dependency. Every
planned file and task traces to the accepted manager change-request outcome.

## Critical Issues

None. No unresolved issue would force an executor to choose new product
behavior, change an architecture or data boundary, or use an unverified
repository path.

## Questions For Plan Author

None. The accepted design, spec audit, shared contracts, and chunk decision
rules resolve all material implementation choices.

## Recommendations

### Command Precision

- Record `bun install --frozen-lockfile` as the dependency-install command when
  dependencies are absent. The repository has `bun.lock` and no npm lockfile,
  and the plan already forbids lockfile or manifest changes.
- Annotate no-match `rg` checks with “exit 1 and empty output expected,” or wrap
  them in an explicit inspection procedure, so an AI executor does not mistake
  a successful absence check for command failure.
- Supplement the coarse `changeRequests:` count with an objective nested-key
  parity comparison across the three locale trees.

### Implementation Clarity

- Make the denied-state wrapper and authorized hook-owning child explicit when
  implementing `ChangeRequestManagementTab`. This preserves the “no client
  access while denied” invariant without conditionally calling
  `useProductContext`.
- Repeat the design's unknown status/request-type textual fallback in Chunk 01's
  detail/list task so forward-compatible display behavior is immediately
  visible to the executor.

These are non-blocking refinements; the governing spec and existing verification
gates already constrain the correct outcome.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Cached or revoked permission exposes the workspace for one render | Low | High | Derive a live-only boolean, compute a safe effective tab before render, guard the lazy workspace mount, and retain the component-level denial boundary. |
| Conditional permission short-circuit leads to a conditional React hook | Medium | High | Use a hook-free outer guard and a mounted authorized child that owns `useProductContext`; lint verifies hook rules. |
| Installed SDK differs from the reviewed lockfile contract | Low | High | Frozen-lockfile install, inspect exported types first, and stop rather than add a compatibility layer. |
| Upload succeeds but authoritative refresh fails | Medium | Medium | Preserve current list and selection, disclose refresh failure, and permit retry without synthesizing attachment metadata. |
| Locale tree exists but one nested key is absent or semantically divergent | Medium | Medium | Compare every consumed key across English, Russian, and Hebrew, then inspect responsive RTL rendering when a server is available. |
| Full interaction evidence is unavailable | Medium | Medium | Use only an already-approved server and report the exact denied/authorized, mutation, overlay, locale, or viewport checks not exercised. |

Highest Risk: Permission-transition rendering. The plan supplies both a
same-render shell guard and a defense-in-depth component guard, which is
sufficient if the authorized hook owner is kept below the outer denial
boundary.

## Pre-Development Checklist

- [x] Assignment requirements and accepted design behavior map to concrete
      chunks and tasks.
- [x] Chunk order, dependency, export contract, and disjoint file ownership are
      explicit.
- [x] Existing referenced paths and package scripts are verified.
- [x] New paths are clearly identified as creations.
- [x] Acceptance criteria are objective, including permission loss,
      authoritative reconciliation, locale coverage, and responsive behavior.
- [x] AI autonomy boundaries forbid contract invention, new dependencies,
      direct storage/network access, and unapproved server startup.
- [x] Rollback is defined and requires no migration or website-owned data
      recovery.
- [ ] At execution start, install from `bun.lock` without mutation and confirm
      the installed SDK declarations match the pinned contract.
- [ ] During implementation, preserve the React hook invariant with a hook-free
      denial wrapper and an authorized child.
- [ ] At final verification, report browser gaps exactly if no approved server
      or usable manager state exists.

## Next Steps

1. Execute Chunk 01, beginning with frozen dependency resolution and SDK type
   confirmation.
2. Execute Chunk 02 only after the workspace export compiles, then verify
   live-only authorization and locale-key parity.
3. Run repository lint/build and focused source checks, followed by the full
   acceptance smoke only when an approved server and usable manager state are
   available.

## Evaluation Matrix

| Dimension | Weight | Raw Score | Weighted Score | Notes |
| --- | --- | --- | --- | --- |
| Completeness | x3 | 4/5 | 12/15 | All accepted behavior and failure boundaries are covered; the unknown-enum fallback and exact install command could be repeated more explicitly. |
| Feasibility | x3 | 5/5 | 15/15 | Current repository paths, scripts, manager patterns, lockfile, and audited SDK contract support the planned implementation. |
| Clarity | x2 | 5/5 | 10/10 | Component ownership, SDK calls, state authority, permission rules, and non-goals are concrete. |
| Logical Flow | x2 | 5/5 | 10/10 | The domain export precedes its sole shell consumer, and each chunk has a distinct verification milestone. |
| Scope & Risk | x2 | 5/5 | 10/10 | Scope is surgical; permission, upload-refresh, localization, and interaction risks have bounded mitigations and rollback. |
| Developer Experience | x1 | 4/5 | 4/5 | File-level tasks and done signals are strong; dependency and no-match command semantics should be more explicit. |
| AI Readiness | x1 | 4/5 | 4/5 | Stop rules, forbidden actions, checkpoints, paths, and acceptance signals are strong; hook-boundary and locale-parity checks merit one more line of precision. |

Overall: 65/70 -> Ready for Development

Critical Dimension Check: Pass; neither Completeness nor Feasibility scores 1,
and no critical issue remains.

## Handoff

PLAN APPROVED FOR IMPLEMENTATION

Key constraints:

- Only current live `product_change_requests.manage` authorization may expose,
  import, mount, load, or mutate the workspace; cached access is never positive
  authorization.
- Keep every data operation under the pinned client's
  `management.changeRequests` namespace, with no direct Supabase, raw Edge
  Function, storage, download, status-mutation, admin, or local adapter path.
- Preserve context unchanged on revision, keep history append-only, and
  reconcile server-owned records only from SDK results or `list()`.

Suggested starting point: Resolve dependencies from the existing Bun lockfile,
confirm the SDK declarations, then build the hook-safe permission-defensive
workspace boundary.

First milestone: Chunk 01 compiles as an isolated workspace whose denied wrapper
cannot access the ClassKit client and whose authorized controller owns all five
allowed SDK operations.

Verdict: Ready for Development

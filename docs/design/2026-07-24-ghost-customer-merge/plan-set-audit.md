# Ghost Customer Merge Implementation Plan-Set Audit

## Audit Mode: Full

Rationale: This is a three-chunk, AI-executed irreversible workflow spanning a
pinned SDK contract, shared customer-directory and picker seams, a finite state
machine, typed failure recovery, parent-owned reconciliation, localization,
accessibility, responsive presentation, and conditional live acceptance.

## Plan Overview

Objective: Let a manager deliberately preview, resolve, confirm, and complete a
ClassKit-owned merge from one eligible manager-created ghost customer into a
distinct linked survivor without losing service history or moving
reconciliation rules into Noya.

Scope: Exact source and survivor eligibility, preview consequence presentation,
explicit scalar and metadata resolution, one frozen idempotent completion
request, typed recovery, source retirement, survivor selection, directory
refresh, English/Hebrew/Russian localization, responsive/RTL behavior, and
static plus conditional browser evidence. Automatic matching, ghost-to-ghost
or cross-product merge, unmerge, hard deletion, direct backend access,
client-side reconciliation, SDK/backend changes, persistence, new
dependencies, and a new test framework are excluded.

Target Audience: Human developers and AI agents executing through Symphony.

Readiness Level: Ready for Development.

Key Technical Decisions:

- `useCustomerMerge` owns only the in-memory preview/resolution/completion state
  and calls the two pinned ClassKit merge methods.
- `CustomerManagementTab` remains the sole owner of selected-customer and
  directory reconciliation for normal completion and typed merged-source
  redirects.
- Unknown completion retains one exact `MergeCustomersInput` and UUID and
  permits only an explicit same-request retry.
- `CustomerPicker` and `useCustomerDirectory` receive additive, bounded seams;
  merge eligibility remains caller-owned.
- Server authorization remains authoritative because current frontend
  capabilities do not positively expose product-level-75 merge authority.

## File Path Verification

Verified using local repository inspection at `f4d5a32`:

| Referenced Path | Status | Notes |
| --- | --- | --- |
| `.symphony/assignment.md` | Exists | Authoritative plan-only assignment and acceptance contract. |
| `docs/design/2026-07-24-ghost-customer-merge/spec.md` | Exists | Approved implementation-planning source. |
| `docs/design/2026-07-24-ghost-customer-merge/agenda.md` | Exists | Approved decision ledger with no open product question. |
| `docs/design/2026-07-24-ghost-customer-merge/spec-audit.md` | Exists | Design audit ends ready for implementation planning. |
| `docs/design/2026-07-24-ghost-customer-merge/plan.md` | Exists | Root plan, chunk order, coverage map, verification strategy, and stop rules. |
| `docs/design/2026-07-24-ghost-customer-merge/plans/01-merge-state-and-customer-seams.md` | Exists | Owns workflow state and shared seam changes. |
| `docs/design/2026-07-24-ghost-customer-merge/plans/02-localized-merge-dialog.md` | Exists | Owns the dialog and all locale copy. |
| `docs/design/2026-07-24-ghost-customer-merge/plans/03-customers-integration-and-acceptance.md` | Exists | Owns existing workspace integration and final evidence. |
| `src/features/manager/customers/customer-management-tab.tsx` | Exists | Current selected-customer, request-guard, mutation-latch, context, and directory owner. |
| `src/features/manager/customers/customer-detail-panel.tsx` | Exists | Current responsive customer action/detail overlay. |
| `src/features/manager/customers/use-customer-directory.ts` | Exists | Current opaque-page directory with reconcile, refresh, and forbidden clearing. |
| `src/features/manager/customers/customer-picker.tsx` | Exists | Current shared picker used by memberships, attendance, and registrations. |
| `src/features/customers/customer-labels.ts` | Exists | Current ID-safe label/contact seam. |
| `src/features/manager/customers/merge/` | Not Found — expected new path | Created by Chunks 01–02. |
| `src/features/manager/customers/merge/customer-merge-presentation.ts` | Not Found — expected new path | Created by Chunk 01. |
| `src/features/manager/customers/merge/use-customer-merge.ts` | Not Found — expected new path | Created by Chunk 01. |
| `src/features/manager/customers/merge/customer-merge-dialog.tsx` | Not Found — expected new path | Created by Chunk 02. |
| `src/i18n.ts` | Exists | Owns parallel English, Hebrew, and Russian locale trees. |
| `src/components/ui` | Exists | Current shadcn-compatible primitive location. |
| `src/components/site` | Exists | Current shared branded primitive location. |
| `DESIGN_GUIDE.md` | Exists | Governs mobile-first overlays, focus, wrapping, theme, and RTL behavior. |
| `package.json` | Exists | Pins the exact SDK commit and defines `lint` and `build`. |
| `bun.lock` | Exists | Resolves the same exact SDK commit. |

All plan-relative links resolve from their containing files. File ownership is
non-overlapping: Chunk 01 owns the two state/presentation files and the shared
directory/picker modifications, Chunk 02 owns the dialog and locale registry,
and Chunk 03 alone modifies the current detail/workspace integration.

The locally cached declarations for pinned commit
`a158bc588f5ec3421788475ccab2c5c2cb47ce9f` report package version `0.1.23` and
confirm:

- root exports for `CustomerMergePreview`, `MergeCustomersInput`,
  `CustomerMergeFieldResolutionsInput`, `CustomerMergeJsonValue`,
  `ClassKitManagerApiError`, and `isCustomerMergeApiError`;
- `management.customers.previewMerge(...)` and
  `management.customers.merge(...)`;
- required display-name, contact-email, and phone resolutions plus the metadata
  conflict record;
- camelCase preview, membership, collision, movement, expiry, and completion
  projections; and
- the exact stale, already-merged, conflict, and missing-recipient typed detail
  variants used by the approved design.

## Scope And Acceptance Coverage

| Requirement / Acceptance Criterion | Plan Coverage | Assessment |
| --- | --- | --- |
| Exact active manager-created unlinked source gate | Chunks 01 and 03 define the pure predicate and detail action gate | Complete |
| Distinct same-product linked survivor, active or inactive | Chunks 01–02 use the independent paginated picker and caller-owned availability | Complete |
| Preview before completion and complete explicit resolutions | Chunks 01–02 define the state order, allowed selections, no defaults, and current-preview completeness | Complete |
| Field, metadata, membership, collision, movement, sample, truncation, and expiry presentation | Chunk 02 assigns every preview projection to the dialog | Complete |
| Irreversible confirmation and one fresh/frozen UUID request | Chunks 01–02 define confirmation-only creation and exact replay | Complete |
| Stale, concurrent, idempotency reuse, payload, recipient, and merged-source recovery | Chunks 01–03 assign hook, dialog, and parent outcomes | Complete |
| Generic and unknown preview failure recovery | Root and all three chunks distinguish classified pair reset from dismissible pair-retaining preview retry and final evidence | Complete |
| Completion-unknown dismissal and authority-loss behavior | Root and Chunks 01–03 distinguish blocked user teardown from higher-priority authoritative security teardown | Complete |
| Success source retirement and survivor selection | Chunks 01 and 03 define bounded removal and one parent convergence helper | Complete |
| Read denial versus mutation denial | Root and Chunk 03 preserve independent parent paths | Complete except for the completion-unknown precedence conflict |
| No direct backend, reconciliation logic, secrets, IDs, storage, or logging | All chunks repeat the project boundary and focused source inspections | Complete |
| English, Hebrew, Russian, mobile, desktop, and RTL | Chunks 02–03 own locale copy and conditional browser evidence | Complete |
| No automatic matching, unmerge, hard deletion, cross-product, or ghost survivor | Root coverage and chunk non-goals preserve every exclusion | Complete |

## Sequencing And Dependencies

The high-level order is coherent:

1. Chunk 01 establishes pure eligibility/presentation helpers, the workflow
   hook, directory removal, and optional picker availability.
2. Chunk 02 consumes those stable contracts to build the complete dialog and
   locale tree.
3. Chunk 03 integrates the completed dialog into the existing customer action
   and reconciliation owner.

No mutable file appears in two chunk responsibility maps, and later chunks
depend on named outputs from earlier chunks. The state boundary correctly
precedes dense UI, and parent reconciliation correctly lands after callback
contracts stabilize.

Chunk 01 now establishes the full phase-aware preview error contract before
Chunk 02 consumes it. The root plan and all affected chunks also apply one
event-precedence rule: user-driven teardown is blocked during active or unknown
completion, while authoritative customer-read denial or live capability loss
must clear protected state. No sequencing ambiguity remains.

## Repository-Native Command Verification

| Command / Check | Status | Notes |
| --- | --- | --- |
| `test -d node_modules` | Valid conditional preflight | Exit 0 skips installation; exit 1 routes to the separate frozen Bun install. |
| `bun install --frozen-lockfile` | Valid and conditional | The current worktree has no `node_modules`; the plan now uses the sole committed lockfile without changing dependency intent or creating another lockfile. |
| `npm run lint` | Valid after dependency preflight | Maps to `eslint .`; focused lint runs after Chunks 01–02 and repository-wide lint runs after integration. |
| `npm run build` | Valid, singular, and justified | Maps to `tsc -b && vite build`; the plan now runs one full build after the complete typed SDK/state/workspace integration. |
| SDK-pin `rg` check | Valid | The exact expression matches both `package.json` and `bun.lock`. |
| Merge owner/privacy `rg` checks | Valid after planned files exist | Paths are created before the checks, and every intended no-match scan now states that exit 1 with empty output is success. |
| Shared picker inventory `rg` checks | Valid | Current consumers exist under memberships, attendance, registrations, and customers. |
| Raw backend `rg` check | Valid | The current customer feature tree has no matches; final inspection can identify any introduced boundary breach. |
| Locale inventory and consumed-key parity | Valid | Chunk 02 inventories all three trees and separately requires the consumed merge-key set to be identical in English, Hebrew, and Russian. |
| `git diff --check` | Valid | Repository-neutral whitespace/error gate. |
| `lsof -nP -iTCP -sTCP:LISTEN \| rg ':(5173\|4173)\b'` | Valid and repository-compliant | Detects an existing server without starting one; no server was present during this audit. |

No build, lint, dependency installation, test, or browser command was executed
during this audit.

## Strengths

### 1. Reconciliation Ownership Is Strong

The plan keeps merge validity, collisions, stock restoration, tombstones,
atomicity, and idempotency in ClassKit. The hook owns request lifecycle, while
the current management tab remains the only local directory and selection
owner.

### 2. The Irreversible Request Identity Is Explicit

The plan creates one complete input immediately before confirmed completion,
stores it before awaiting the SDK, and reuses the exact object only after an
unknown outcome. Pair, preview, resolution, and deterministic recovery paths
cannot manufacture an alternate retry identity.

### 3. Shared Seams Are Bounded And Backward-Compatible

Directory removal performs no network or cursor synthesis. Picker availability
is optional, keeps merge policy in the caller, and preserves the three existing
service consumers when omitted.

### 4. Dense Consequence Presentation Is Traceable

Every SDK preview section has a named presentation owner, including presence
semantics, JSON null, grants, collision samples, truncation, stock restoration,
movement totals, and advisory expiry. Internal identifiers and open backend
strings have explicit privacy-safe presentation rules.

### 5. Completion Reconciliation Converges

Normal success, merge-time `customer_merged`, and later source-detail
`customer_merged` all route to one parent helper that retires the source and
loads or applies the authoritative survivor before exposing actions.

## Critical Issues

None. The repaired plan set contains no unresolved product, architecture, data,
permission, path, dependency, sequencing, ownership, recovery, or acceptance
blocker.

## Questions For Plan Author

None. The approved specification, agenda, pinned SDK declarations, and current
repository now determine every material implementation choice.

## Recommendations

### Execution Evidence

- Record the phase at which every exercised error occurred so a preview failure
  cannot be mistaken for completion-unknown evidence.
- Preserve the locale parity comparison output alongside lint/build evidence,
  not only the coarser locale-tree inventory.
- Record unavailable browser rows individually when the server, principal, or
  fixture is missing.

These are non-blocking reporting refinements. The plan already assigns the
required implementation behavior, command semantics, and acceptance owners.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| A pre-preview error is misclassified as completion unknown | Low | High | Chunk 01 defines phase-aware classification; Chunk 02 gives preview errors distinct dismissible UI; Chunk 03 exercises both paths. |
| Read authority disappears during completion unknown | Low | High | All affected chunks make authoritative security teardown higher priority than user-dismissal suppression and require later server-authoritative recovery. |
| Frozen input or UUID changes on retry | Low | High | Retain the existing one-object completion-attempt contract and inspect exact replay. |
| A stale async response restores source or preview state | Medium | High | Keep generation guards across pair, source, preview, authority, parent selection, and context requests. |
| Dynamic metadata conflict keys or JSON null are mishandled | Medium | High | Derive completeness from the current preview and separate parse success from value truthiness. |
| Shared picker behavior regresses existing consumers | Medium | High | Keep availability optional, compile all consumers, and inspect selection behavior. |
| Dependencies are absent in the isolated worktree | High | Medium | The conditional directory check now routes to `bun install --frozen-lockfile` before scripts or SDK-facing edits. |
| Browser fixtures or principals are unavailable | High | Medium | Preserve deterministic evidence and report each unexercised live row. |

Highest Risk: Conflating failures before a preview exists with failures after a
completion request may have committed. The repaired phase-aware state contract,
distinct dialog behavior, and explicit browser rows now mitigate that risk.

## Pre-Development Checklist

- [x] Assignment, approved spec, agenda, and design audit are present and
  consistent with the branch.
- [x] Existing and expected-new paths are verified.
- [x] SDK version, commit, methods, public types, and typed details are verified.
- [x] Chunk ownership is exhaustive and non-overlapping.
- [x] Source/survivor, resolution, completion, reconciliation, locale, privacy,
  and exclusion requirements are mapped.
- [x] Generic and unknown/transport preview failure transitions, UI, locale
  copy, and acceptance rows are explicit.
- [x] Authority-loss precedence during active and unknown completion is
  consistent across the root and all affected chunks.
- [x] The current dependency-absent worktree has a frozen Bun preflight.
- [x] Safe pair-summary fields are assigned before preview.
- [x] Expected no-match exit semantics and three-locale consumed-key parity are
  explicit.
- [x] Intermediate lint and one final build follow repository guidance.

## Next Steps

1. Execute Chunk 01 after the conditional frozen dependency preflight and exact
   SDK-pin check.
2. Execute Chunk 02 against the stable phase-aware hook and picker contracts,
   including safe pair summary and locale parity.
3. Execute Chunk 03, then run repository-wide lint, the single final build,
   focused ownership/privacy checks, and all available browser rows.

## Evaluation Matrix

| Dimension | Weight | Raw Score | Weighted Score | Notes |
| --- | --- | --- | --- | --- |
| Completeness | x3 | 5/5 | 15/15 | Every approved behavior, failure phase, authority transition, target file, exclusion, locale, and evidence row has an explicit owner. |
| Feasibility | x3 | 5/5 | Current repository seams, conditional frozen setup, scripts, and exact v0.1.23 declarations support the plan without a new dependency or backend change. |
| Clarity | x2 | 5/5 | Phase-aware errors, dismissal/security precedence, pair summaries, callback ownership, and command outcomes are explicit. |
| Logical Flow | x2 | 5/5 | The complete state/shared seam lands before UI, and the completed dialog lands before parent integration and one final build. |
| Scope & Risk | x2 | 5/5 | ClassKit/UI ownership, security precedence, irreversible retry safety, rollback limits, and exclusions are concrete. |
| Developer Experience | x1 | 5/5 | Paths, milestones, setup preflight, expected exit codes, focused lint, one final build, and unavailable-live-evidence reporting are executable. |
| AI Readiness | x1 | 5/5 | Autonomy boundaries, stop rules, state transitions, event precedence, verification checkpoints, and objective acceptance are complete. |

Overall: 70/70 -> Ready for Development

Critical Dimension Check: Pass; Completeness and Feasibility both score 5/5,
and no critical issue remains.

## Handoff

PLAN APPROVED FOR IMPLEMENTATION

Key constraints:

- Keep preview failures phase-aware; only an unknown failure after issuing the
  frozen merge request may enter `completion_unknown`.
- Preserve one exact frozen request identity for same-request retry, while
  authoritative customer-read/capability loss still clears protected state.
- Keep source retirement and survivor selection parent-owned and convergent
  across normal completion and typed redirects.
- Preserve the ClassKit ownership boundary, privacy rules, locale parity, and
  existing-server-only browser policy.

Suggested starting point: Run the conditional frozen dependency preflight,
verify the exact SDK pin, then implement Chunk 01's pure presentation and
phase-aware workflow contracts.

First milestone: Chunk 01 lint/source/diff evidence confirms exact eligibility,
resolution completeness, preview-versus-completion error separation, frozen
retry identity, directory removal, and optional picker behavior.

Verdict: Ready for Development

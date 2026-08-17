# Health Declaration Gate Recovery Implementation Plan Set

**Approved Source:** `docs/design/2026-08-17-health-declaration-gate/spec.md`
**Agenda:** `docs/design/2026-08-17-health-declaration-gate/agenda.md`
**Pseudocode:** Absent
**Context:** Not available
**ADRs:** None
**Status:** Ready for Review

## Goal

Make the existing mandatory health declaration gate usable on narrow and short
viewports, safe against repeated or stale submits, keyboard-contained, and
honest about localized persistence failures. Preserve the current ClassKit,
route, document-loading, and version-marker boundaries.

## Source Artifacts And Repository Evidence

- Assignment contract: `.symphony/assignment.md`.
- Approved design:
  `docs/design/2026-08-17-health-declaration-gate/spec.md`.
- Approved decisions:
  `docs/design/2026-08-17-health-declaration-gate/agenda.md`.
- Ready design audit:
  `docs/design/2026-08-17-health-declaration-gate/spec-audit.md`.
- Global mount and route preservation: `src/App.tsx`.
- Gate state, ClassKit calls, focus loop, and modal layout:
  `src/features/documents/health-declaration-gate.tsx`.
- Exact marker and version comparison:
  `src/features/documents/health-declaration-acceptance.ts`.
- Shared ClassKit acceptance boundary:
  `src/features/documents/product-document-acceptance.ts`.
- English, Russian, and Hebrew locale trees: `src/i18n.ts`.
- Visual and responsive constraints: `DESIGN_GUIDE.md`.
- `package.json` and `bun.lock` pin `@class-kit/react` commit
  `a158bc588f5ec3421788475ccab2c5c2cb47ce9f`.
- The pinned SDK returns `acceptance.document_version` and forwards profile
  metadata updates. The ClassKit profile API shallow-merges that patch.
- Repository scripts expose full lint and build commands. Focused ESLint and
  `tsconfig.app.json` TypeScript validation are sufficient for this two-file
  correction. There is no automated interaction-test script.

Missing artifact: approved pseudocode. Impact: none. The approved spec and
audit define the attempt lifecycle, exact SDK order, focus behavior, layout
boundary, and failure semantics without leaving an implementation-shape choice
that requires pseudocode.

## Design Readiness

- Approved source verified: Yes. The spec has status `Approved — eligible for
  implementation planning.`
- Artifact paths verified: Yes.
- Pseudocode status: Absent and not required.
- Source consistency: Yes. The assignment, spec, agenda, design audit, current
  repository, pinned SDK, and ClassKit API contract agree.
- Repository reconciliation: the current gate intentionally keeps initial load
  failures non-blocking. This plan changes only behavior after `required` is
  known.
- Remaining non-blocking risks: an approved running server and an authenticated
  active-user fixture might be unavailable for browser evidence.
- Blockers: None.

## Reconciliations And Decision Ownership

| Item | Evidence / Decision Rule | Owning Chunk | Must Resolve Before |
| --- | --- | --- | --- |
| Latest submit context shape | Snapshot the starting `client`, user ID, and active-user applicability; compare against a latest-context ref after acceptance and again after the profile write | Chunk 01 | Profile write and local accepted transition |
| Focusable reading region | Add the declaration region to the focusable selector and handle initial dialog-container focus in both Tab directions | Chunk 01 | Focus containment verification |
| Short-viewport fallback | Prefer a viewport-bounded flex/grid card with the declaration as the shrinking scroll region; retain vertical overlay/dialog overflow for viewports shorter than fixed content | Chunk 01 | Responsive browser evidence |
| Browser fixture availability | Use only an already-running approved server and a suitable active principal; otherwise report the exact browser-only gaps | Chunk 01 | Final verification report |

## Plan Chunks

| Chunk | Deliverable | Depends On | Enables | Verification Focus | Status |
| --- | --- | --- | --- | --- | --- |
| [01 — Recover the health declaration gate](plans/01-recover-health-declaration-gate.md) | One coherent gate correction covering attempt identity, single-flight persistence, viewport layout, keyboard focus/scroll, and localized submit retry | None | Complete assignment | ClassKit call order, stale-attempt checks, focus containment, translation parity, TypeScript, focused lint, and conditional browser smoke | Ready for Review |

One chunk is the smallest coherent boundary. The component state and layout must
consume the same busy, error, and focus behavior, while the locale entries are
required by that component. Splitting them would create an intermediate state
that is not independently complete or useful.

## Dependency And Parallelism Order

1. Execute Chunk 01 as one vertical implementation and verification slice.

No parallel implementation chunk exists. Within the chunk, translation entries
can be prepared independently, but final validation depends on the completed
gate behavior.

## Shared Contracts And Integration Points

There is no cross-chunk contract. The implementation preserves these existing
integration points:

- `HealthDeclarationGate` remains mounted globally through `src/App.tsx`.
- `acceptProductDocument(...)` remains the only website helper for the
  declaration acceptance call.
- `healthDeclarationAcceptanceVersionKey` remains the only marker-key owner.
- The gate continues to use current locale, English fallback, document type
  `health_declaration`, and context `health_declaration_gate`.
- The public `/health-declaration` route and class-registration acceptance flow
  remain unchanged.

## Approved-Source Coverage

| Requirement / Acceptance Criterion | Covered By | Notes |
| --- | --- | --- |
| Narrow mobile and short viewport usability | Chunk 01 | Bounded card, shrinking document region, and vertical overflow fallback |
| Checkbox enables a clear action | Chunk 01 | Existing disabled-state contract remains; fixed action stays reachable |
| Record acceptance and accepted version | Chunk 01 | Preserve two ClassKit writes and use returned acceptance version |
| Close immediately without refresh or route loss | Chunk 01 | Local `accepted` state only after both same-user writes succeed |
| Same version stays closed; new version reopens | Chunk 01 | Preserve exact metadata marker comparison and loading behavior |
| Failed submit stays visibly failed and retryable | Chunk 01 | Localized website-owned error; no gate close on either write failure |
| Repeated activation cannot create concurrent requests | Chunk 01 | Synchronous ref guard before the first await |
| Changed user cannot receive stale write or close | Chunk 01 | Latest-context checks before profile write and before accepted state |
| Keyboard access and focus containment | Chunk 01 | Named scroll tab stop, two-direction entry/wrap, Escape suppression |
| Mandatory gate has no close or skip | Chunk 01 | Preserve modal and backdrop behavior after `required` is known |
| Keep ClassKit and storage boundaries | Chunk 01 | No direct Supabase, Edge Function, global state, or local persistence |
| Preserve public route and registration flow | Chunk 01 | No changes to their owning files |
| English, Hebrew, and Russian copy | Chunk 01 | One matching submit-failure key in each locale tree |

## Verification Strategy

- Install the frozen dependency graph only if this isolated worktree still has
  no installed dependencies. Expect no `package.json` or `bun.lock` drift.
- Run focused ESLint on the two changed source files.
- Run TypeScript validation against `tsconfig.app.json`; this is warranted by
  new refs, asynchronous attempt state, DOM focus selection, and SDK result
  handling. Do not run the default full build.
- Inspect translation parity, ClassKit call order, synchronous lock placement,
  same-user checks, focusable-selector coverage, and forbidden boundary calls.
- Run `git diff --check` and review the complete assignment diff.
- Probe for an existing localhost server before browser work. Do not start or
  host a server. If a suitable server and fixture exist, exercise responsive,
  persistence, failure, retry, repeated-input, and keyboard paths. Otherwise
  report each unavailable browser-only case.
- Do not add or run a unit-test suite for this correction.

## Risks And Sequencing

- A context change between document acceptance and profile update could write a
  marker or close the gate for stale UI state. Snapshot and latest-context
  checks are required at both audited points.
- A `tabIndex` on the reading region without changing the custom selector would
  leave the focus loop incomplete. The selector and container-focus branches
  must change in the same edit.
- A fixed document `vh` cap alone cannot guarantee short-viewport access. The
  card needs a complete height contract and an overflow fallback.
- ClassKit acceptance can succeed before the profile marker fails. The retry is
  allowed to repeat the same context acceptance because ClassKit treats it as a
  repeat-safe upsert. The UI remains failed until the marker succeeds.
- Browser verification depends on runtime identity and backend fixtures that
  may not exist in this isolated worktree.

## Execution Handoff

The executor loads the assignment, approved spec, approved agenda, ready design
audit, this roadmap, and the single chunk plan. Execute Chunk 01. Stop if:

- the installed SDK does not resolve to the pinned commit or lacks the audited
  acceptance/profile shapes;
- the current gate or locale paths materially differ from the reviewed files;
- implementation would make unknown initial load state blocking, add a close or
  skip path, change the public route or registration flow, add persistence,
  bypass the public ClassKit client, or introduce a dependency; or
- overlapping user work cannot be preserved.

This plan remains `Ready for Review`; Symphony planning validation governs
delegated execution authorization.

## User Approval

- Roadmap approved by: One-pass generation authorized by the 2026-08-17 Plan
  Required Symphony assignment.
- Plan set approved for execution by: Pending Symphony planning validation and
  delegated implementation.

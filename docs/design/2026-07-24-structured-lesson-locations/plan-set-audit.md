# Structured Lesson Locations Plan-Set Audit

## Audit Mode: Full

Rationale: This is a two-chunk, AI-executed, cross-surface feature plan spanning
an external SDK contract, asynchronous form behavior, mutation presence
semantics, shared presentation, permissions, localization, accessibility,
security, and repository-wide verification.

## Plan Overview

Objective: Implement Noya's ClassKit-backed structured location workflow across
class and template entry, coherent text/snapshot persistence, manual and
schedule-generated inheritance, manager/customer display, navigation,
attribution, localization, and degraded autocomplete behavior.

Scope: One shared location domain followed by integration into the existing
manager capability boundary, class/template forms, manager/customer
list/calendar/detail surfaces, and the three-locale translation registry.
Provider SDKs or credentials, direct network or Supabase calls, local
geocoding/persistence, catalogues, schedule payload changes, static marketing
addresses, new routes, new dependencies, and a new test framework are excluded.

Target Audience: Both human developers and AI agents executing through the
Symphony workflow.

Readiness Level: Ready for Development.

Key Technical Decisions:

- Chunk 01 centralizes the complete location draft, mutation-pair matrix,
  autocomplete lifecycle, navigation-helper use, and attribution URL policy in
  three new files before any existing consumer is changed.
- Chunk 02 exclusively owns all existing-file integration, including the live
  permission derivation, both mutation forms, stored snapshot projection,
  compact/detailed surfaces, and `src/i18n.ts`.
- Manual class creation from a template materializes both default values
  because the pinned create facade cannot express omitted-pair inheritance;
  schedule-generated inheritance remains wholly ClassKit-owned.
- Autocomplete is authorized only by the exact live
  `locations.autocomplete` permission and remains advisory under missing
  permission, latency, empty results, temporary unavailability, or thrown
  errors.
- Detailed navigation comes only from ClassKit helpers, and attribution links
  require successful absolute URL parsing with the exact `https:` protocol.

## File Path Verification

Verified using local repository inspection:

| Referenced Path | Status | Notes |
| --- | --- | --- |
| `.symphony/assignment.md` | Exists | Accepted Symphony task contract. |
| `docs/design/2026-07-24-structured-lesson-locations/spec.md` | Exists | Complete design source. |
| `docs/design/2026-07-24-structured-lesson-locations/agenda.md` | Exists | Decisions agree with the plan set. |
| `docs/design/2026-07-24-structured-lesson-locations/spec-audit.md` | Exists | Design audit ends ready for development. |
| `DESIGN_GUIDE.md` | Exists | Supplies the responsive, touch, and RTL constraints used by both chunks. |
| `package.json` | Exists | Pins `@class-kit/react` to `v0.1.21`; defines `lint` and `build`; defines no test script. |
| `bun.lock` | Exists | Lockfile used by the dependency-resolution preflight. |
| `src/features/locations/location-draft.ts` | Not Found — expected new path | Created and exclusively owned by Chunk 01. |
| `src/features/locations/location-autocomplete-field.tsx` | Not Found — expected new path | Created and exclusively owned by Chunk 01. |
| `src/features/locations/location-display.tsx` | Not Found — expected new path | Created and exclusively owned by Chunk 01. |
| `src/features/manager/manager-page.tsx` | Exists | Current live-versus-cached capability seam. |
| `src/features/manager/classes/class-management-tab.tsx` | Exists | Current manager record mapping, client ownership, and class form integration. |
| `src/features/manager/templates/template-management-tab.tsx` | Exists | Current client ownership and template form/detail integration. |
| `src/features/manager/classes/class-form-dialog.tsx` | Exists | Current text-only class location state and serialization. |
| `src/features/manager/templates/template-form-dialog.tsx` | Exists | Current text-only template location state and serialization. |
| `src/features/classes/class-types.ts` | Exists | Shared `ClassViewItem` currently has text but no snapshot. |
| `src/features/classes/class-card.tsx` | Exists | Compact list location is currently rendered inside the selection button. |
| `src/features/classes/class-calendar-view.tsx` | Exists | Desktop calendar item currently omits location. |
| `src/features/manager/classes/class-detail-panel.tsx` | Exists | Current manager location detail accepts string content only. |
| `src/features/manager/templates/template-card.tsx` | Exists | Current compact template location consumer. |
| `src/features/manager/templates/template-detail-panel.tsx` | Exists | Current template location detail accepts string content only. |
| `src/features/lessons/lessons-page.tsx` | Exists | Current customer mapping drops the snapshot and detail facts are string-only. |
| `src/i18n.ts` | Exists | Current English, Russian, and Hebrew translation registry. |

All relative plan links resolve from their containing files. Chunk 01 owns only
the three expected-new paths under `src/features/locations/`; Chunk 02 owns only
existing files, and no file appears in both responsibility maps.

The repository-native commands are valid for the current tree:

- `bun install --frozen-lockfile` matches the committed Bun lockfile preflight.
- `npm run lint` maps to `eslint .`.
- `npm run build` maps to `tsc -b && vite build`.
- The focused `rg` commands reference directories that either exist now or are
  explicitly created before those commands run.
- The conditional trailing-whitespace `rg` command directly inspects all three
  expected-new Chunk 01 files even while they remain untracked.
- The bounded `curl` probe targets `http://127.0.0.1:5173/`, uses a two-second
  timeout, and branches explicitly on success versus no existing server.
- No verification command starts a development server.

No build, lint, install, test, or browser command was executed during this
audit.

## Strengths

### 1. Acceptance Coverage Is Complete And Traceable

The root plan maps every assignment criterion to one or both chunks, including
structured/free-text/clear/absent round-trip, prepopulation, manual template
materialization, schedule-generated inheritance, degraded provider behavior,
manager/customer display, navigation, attribution, localization,
responsiveness, and every exclusion. Each chunk repeats only the acceptance
criteria it can materially establish.

### 2. Sequencing Follows The Highest-Risk Boundary

The pure presence-sensitive mutation matrix and shared async/presentation
primitives are established before forms or surfaces consume them. Chunk 02
then integrates those completed contracts as one vertical slice. This puts the
highest-risk semantic dependency first and avoids parallel work against an
unstable interface.

### 3. File Ownership Is Exact And Non-Overlapping

Chunk 01 creates three isolated files and modifies none. Chunk 02 creates
nothing and lists every existing consumer it changes. Shared list behavior
flows through `class-card.tsx`, while desktop calendar behavior is explicitly
owned by `class-calendar-view.tsx`; no unnecessary ownership of
`class-list-view.tsx` is introduced.

### 4. Permission And SDK Failure Boundaries Are Executable

The plan provides the exact live capability expression, forbids cached access
or role inference, retains backend rejection as a recoverable case, and has a
stop rule for an installed SDK mismatch. It does not authorize an adapter,
direct provider call, or server-contract duplication.

### 5. Verification Distinguishes Deterministic And Live Evidence

Compilation, lint, source inspection, locale-shape inspection, and forbidden
call scans cover deterministic contracts. Browser checks use only an existing
approved server, and the plan explicitly forbids claiming live evidence for
provider, ordering, or unsafe-URL states that cannot be reproduced.

## Critical Issues

None. The plan set contains no unresolved product, architecture, data,
permission, sequencing, ownership, dependency, or acceptance blocker.

## Questions for Plan Author

None. The accepted assignment, design artifacts, current repository, and
audited pinned SDK contract resolve the material implementation choices.

## Recommendations

### Execution Evidence

- Preserve a compact payload matrix in the implementation report showing
  property presence for class create/update and template create/update. This
  makes the most failure-prone invariant reviewable without relying on prose.
- When browser fixture coverage is partial, list each unreproduced state beside
  its source-inspection evidence rather than collapsing all degraded-state
  verification into one claim.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| A serializer collapses omitted, null, free-text, and structured pairs | Medium | High | Chunk 01 centralizes the closed matrix; Chunk 02 prohibits form-local pair conditionals and inspects every mutation input. |
| A stale response replaces a selection or reseeded template pair | Medium | High | Form-scoped request identity is invalidated on every query, locale, eligibility, seed, selection, and unmount transition. |
| Cached access positively authorizes autocomplete | Medium | High | Derive only from live capabilities while `accessSnapshot === null`; rejected calls remain advisory. |
| Snapshot casing is dropped at a manager or customer projection | Medium | High | Extend the shared view model and inspect both snake_case and camelCase mapping boundaries. |
| Navigation or attribution creates unsafe or nested interaction | Low | High | Central detailed component, helper-only URLs, exact HTTPS attribution parsing, and text-only compact cards. |
| Interactive, RTL, or degraded-state evidence is unavailable | High | Medium | Use source evidence and only an already-running approved server; report unreproduced states explicitly. |
| Installed SDK differs from the audited lockfile contract | Low | High | Frozen-lockfile install and explicit stop-before-edit decision rule; no compatibility adapter. |

Highest Risk: Location-pair serialization. Incorrect property presence could
silently clear a stored snapshot or break template materialization. The
dependency order, single pure helper boundary, closed matrix, and mutation-call
inspection adequately mitigate it.

## Pre-Development Checklist

- [x] Accepted assignment requirements map to explicit plan tasks and checks.
- [x] Chunk dependencies and the critical path are explicit.
- [x] File responsibility is exhaustive and non-overlapping.
- [x] All referenced existing paths and expected-new paths are classified.
- [x] Repository scripts and focused inspection commands match the current tree.
- [x] Structured, free-text, cleared, absent, untouched, and inherited pair criteria are objectively testable.
- [x] Capability, degraded-state, navigation, attribution, localization, accessibility, responsive, and RTL criteria are covered.
- [x] Rollback and isolation are defined for both chunks.
- [x] AI stop conditions and forbidden implementation boundaries are explicit.
- [x] Dependency absence is handled by a frozen-lockfile preflight and SDK mismatch stop rule.

## Next Steps

1. Execute Chunk 01 and verify the shared pair, autocomplete, and display
   contracts against the installed pinned SDK.
2. Execute Chunk 02 only after the shared domain compiles, preserving its
   exclusive ownership of all existing-file integration.
3. Report deterministic and live verification separately, including any
   unavailable browser-only evidence.

## Evaluation Matrix

| Dimension | Weight | Raw Score | Weighted Score | Notes |
| --- | --- | --- | --- | --- |
| Completeness | x3 | 5/5 | 15/15 | Every requirement, edge state, dependency, target file, exclusion, and done condition is covered. |
| Feasibility | x3 | 5/5 | 15/15 | Current seams, scripts, and audited pinned SDK contract support the proposed work without a new dependency or server change. |
| Clarity | x2 | 5/5 | 10/10 | Pair matrices, permission rules, file ownership, async invalidation, and evidence rules are explicit. |
| Logical Flow | x2 | 5/5 | 10/10 | The shared high-risk contract precedes all dependent integration, with no overlapping work. |
| Scope & Risk | x2 | 5/5 | 10/10 | Scope is surgical, exclusions are concrete, rollback is reversible, and highest risks have specific mitigations. |
| Developer Experience | x1 | 5/5 | 5/5 | Milestones, stop rules, tracked and untracked whitespace checks, and exact static/build/browser gates are explicit. |
| AI Readiness | x1 | 5/5 | 5/5 | Paths, autonomy boundaries, verification, rollback, ambiguity stops, and the existing-server decision command are exact. |

Overall: 70/70 -> Ready for Development

Critical Dimension Check: Pass; Completeness and Feasibility both score 5.

## Handoff

PLAN APPROVED FOR IMPLEMENTATION

Key constraints:

- Preserve the complete display-text/snapshot pair and update property-presence
  semantics exclusively through the shared pure helpers.
- Use only the pinned ClassKit client, public types, live capability permission,
  stored snapshots, and pure navigation helpers.
- Keep autocomplete advisory, free-text persistence permanent, detailed links
  outside selection controls, and every attribution visible as escaped text.
- Do not introduce provider calls, credentials, local geocoding or persistence,
  schedule payload changes, new dependencies, or a compatibility adapter.

Suggested starting point: Resolve the frozen lockfile dependency and implement
`src/features/locations/location-draft.ts` against the exact v0.1.21 mutation
inputs.

First milestone: The shared domain compiles and its source evidence covers the
complete pair matrix, request invalidation lifecycle, helper-only navigation,
and attribution safety before existing forms are changed.

Verdict: Ready for Development

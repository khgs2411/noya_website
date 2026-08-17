# Health Declaration Gate Recovery Plan-Set Audit

## Audit Mode: Full

Rationale: The plan changes a mandatory global modal, an authenticated two-write
workflow, session-sensitive asynchronous state, responsive layout, and keyboard
focus containment. The implementation surface is small, but an error can block
an active user or persist data for stale user context.

## Plan Overview

Objective: Restore the health declaration gate so an applicable active user can
read, accept, persist, and leave the gate without a refresh, while repeated or
stale submits remain safe.

Scope: One implementation chunk changes the gate component and the three locale
entries. It preserves ClassKit ownership, exact-version comparison, initial-load
policy, the current route, the public document route, and the separate
registration flow.

Target Audience: Both human developers and AI agents in the Symphony execution
workflow.

Readiness Level: Ready for Development.

Key Technical Decisions:

- Keep one coherent vertical slice because the attempt state, localized error,
  focus loop, and layout depend on the same component state.
- Acquire a synchronous ref lock before the first asynchronous call.
- Compare a starting attempt snapshot with latest ClassKit context before the
  profile write and before the local accepted transition.
- Keep the declaration as the shrinking, named, focusable scroll region. Keep
  the agreement, alert, and action reachable below it.
- Preserve the two-write ClassKit boundary and use the version returned by the
  acceptance result.

## Repository Verification

Search Boundary: The complete Noya website repository, the installed SDK
snapshot in the primary checkout whose `.bun-tag` matches the locked commit,
and the local ClassKit API source used by the approved design. Commands were
inspected only. No build, test, install, or browser check was run.

| Material Claim | Status | Evidence and Notes |
| --- | --- | --- |
| `.symphony/assignment.md` | Verified | The refined request requires responsive access, two successful writes before close, exact-version behavior, localized retry, single-flight submit, ClassKit ownership, route preservation, and keyboard containment. |
| `docs/design/2026-08-17-health-declaration-gate/spec.md` | Verified | The approved spec defines the entry policy, ordered submit lifecycle, stale-attempt checks, partial failure, focus behavior, scope, and evidence contract used by both plans. |
| `docs/design/2026-08-17-health-declaration-gate/agenda.md` | Verified | Its approved decisions agree with the plan set. It leaves no material design question open. |
| `docs/design/2026-08-17-health-declaration-gate/spec-audit.md` | Verified | The ready design audit specifically requires focus-selector coverage, checks before the profile write and local close, localized submit feedback, and exact reporting of unavailable browser evidence. The chunk includes each item. |
| `docs/design/2026-08-17-health-declaration-gate/plan.md` | Verified | The roadmap contains one linked chunk, dependency order, shared boundaries, complete approved-source coverage, verification policy, stop conditions, and execution handoff. |
| `docs/design/2026-08-17-health-declaration-gate/plans/01-recover-health-declaration-gate.md` | Verified | The chunk defines file ownership, ordered work, attempt and focus invariants, acceptance mapping, risks, rollback, and objective checks. |
| `src/App.tsx` | Verified | `renderPage` mounts `HealthDeclarationGate` after the requested page for every route branch. The `/health-declaration` branch remains a `ProductDocumentPage`. |
| `src/features/documents/health-declaration-gate.tsx` | Verified | This component owns gate load and submit state, the current two-write flow, modal layout, focus loop, and visible errors. Its unconstrained card, `42vh` content cap, render-delayed busy state, incomplete container-focus handling, non-focusable reading region, and raw submit errors match the planned corrections. |
| `src/features/documents/health-declaration-acceptance.ts` | Verified | It is the sole owner of `health_declaration_accepted_version` and uses exact numeric equality. The plan keeps it unchanged. |
| `src/features/documents/product-document-acceptance.ts` | Verified | It is the shared public-client acceptance boundary and forwards locale, English fallback, and caller context. The plan keeps it unchanged. |
| `src/features/documents/product-document-types.ts` | Verified | It defines `health_declaration` and the `en` fallback that the plan preserves. |
| `src/features/lessons/lessons-page.tsx` | Verified | Registration uses its separate `registration_health_declaration` context and the shared marker helper. The plan correctly excludes this flow from edits. |
| `src/i18n.ts` | Verified | English, Russian, and Hebrew each contain a matching `documents.healthGate` object. One `submitError` entry in each tree fits the current shape. |
| `DESIGN_GUIDE.md` | Verified | The planned Tailwind layout, token use, dark-theme support, mobile-first behavior, and RTL-safe spacing follow the repository design rules. |
| `package.json` and `bun.lock` | Verified | Both pin `@class-kit/react` commit `a158bc588f5ec3421788475ccab2c5c2cb47ce9f`. The repository exposes lint and build scripts and has no interaction-test script. |
| Pinned SDK acceptance and profile shapes | Verified | The matching installed SDK snapshot accepts locale, fallback locale, and context; returns `acceptance.document_version`; and exposes `profile.update({ metadata })`. |
| ClassKit repeat and merge behavior | Verified | The local product-documents API upserts on product, user, document type, locale, version, and context. The profile API shallow-merges the metadata patch. This supports retry after partial persistence without website-owned recovery state. |
| `tsconfig.app.json` | Verified | It includes `src`, uses strict TypeScript and DOM libraries, and supports the planned `bunx tsc --noEmit -p tsconfig.app.json` check. |
| Repository-native commands | Verified | `bun`, `bunx`, `rg`, `curl`, and `git` are available. The focused ESLint, TypeScript, search, diff, and localhost-probe commands match current paths and policy. `bun install --frozen-lockfile` is correctly conditional because this isolated worktree has no installed dependencies. |

No referenced path, command, symbol, SDK shape, workflow, or ownership claim was
contradicted.

## Strengths

### Complete acceptance traceability

The roadmap maps every approved criterion to Chunk 01. The chunk then maps each
criterion to a concrete edit and an observable static or conditional browser
check. Preserved behavior also has explicit inspection conditions.

### Correct dependency order

The submit contract establishes the lock and attempt identity before any write
uses them. It checks current context before the marker write and again before
local close. Focus selector work and the new reading tab stop stay in the same
edit. Final validation follows the complete gate and locale changes.

### Strong ownership and scope boundaries

The plan changes only the website presentation and mounted attempt state. It
keeps identity, permissions, documents, acceptance, profile data, and metadata
merge behavior in ClassKit. It also names stop conditions for any boundary
drift.

### Honest verification strategy

The plan uses focused lint, strict TypeScript, source inspection, translation
parity, and diff checks. It permits browser evidence only with an existing
approved server and suitable fixture. It requires exact reporting when a
browser-only case cannot be reproduced.

## Critical Issues

No critical issues. The plan set resolves the scope, sequence, dependencies,
acceptance coverage, repository paths, commands, and material risk decisions
needed for safe development.

## Questions for Plan Author

No open material questions.

## Recommendations

No plan change is required before development. During execution, preserve the
chunk stop conditions and report unavailable browser-only evidence exactly as
specified.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Authenticated context changes during the two-write attempt | Low | High | Use the planned latest-context ref and compare client, user ID, and active applicability before the profile write and before local close. |
| Acceptance succeeds but marker persistence fails | Medium | Medium | Keep the gate open, show localized retry guidance, and repeat the ClassKit upsert on a later attempt. |
| Fixed dialog regions exceed a very short viewport | Medium | High | Use the complete dynamic-viewport shrink chain and retain modal vertical overflow as a fallback. |
| Focus escapes because the reading region is omitted from the custom sequence | Medium | High | Add the reading region to the selector and implement both container-focus entry directions in the same edit. |
| Runtime fixtures are unavailable | Medium | Medium | Complete static checks and report each unavailable browser-only case without claiming it as verified. |

Highest Risk: A stale authenticated attempt could otherwise write the marker or
close the gate for the wrong context. The plan makes both required comparison
points explicit and places them before the affected operations.

## Evaluation Matrix

| Dimension | Weight | Raw Score | Weighted Score | Notes |
| --- | --- | --- | --- | --- |
| Completeness | x3 | 5/5 | 15/15 | Every approved requirement traces to an implementation task and objective evidence or an explicit conditional browser report. |
| Feasibility | x3 | 5/5 | 15/15 | Current component ownership, helpers, SDK types, API merge and upsert behavior, and toolchain support the plan. |
| Clarity | x2 | 5/5 | 10/10 | Attempt order, stale behavior, focus behavior, layout contract, exclusions, and stop conditions are explicit. |
| Logical Flow | x2 | 5/5 | 10/10 | One vertical chunk avoids unsafe intermediate states and orders prerequisites before their consumers. |
| Scope & Risk | x2 | 5/5 | 10/10 | The plan is limited to two source files and directly controls the material blocking, stale-write, partial-persistence, layout, and focus risks. |
| Developer Experience | x1 | 5/5 | 5/5 | File ownership, milestones, exact commands, expected results, fixture conditions, and stop conditions let an executor detect completion or a blocker. |
| AI Readiness | x1 | 5/5 | 5/5 | The plan plus repository instructions resolves material product and architecture choices and requires objective evidence. |

Overall: 70/70 -> Ready for Development

## Readiness Gate Check

| Gate | Result | Evidence |
| --- | --- | --- |
| Weighted score is in Ready range | Pass | 70/70 is within the 56-70 Ready range. |
| Every applicable dimension is at least 3 | Pass | The lowest applicable score is 5. |
| Completeness is at least 4 | Pass | Completeness is 5/5. |
| Feasibility is at least 4 | Pass | Feasibility is 5/5. |
| No unresolved critical issue | Pass | No critical issue remains. |
| AI Readiness is at least 4 when applicable | Pass | AI Readiness is 5/5. |

## Handoff

PLAN APPROVED FOR IMPLEMENTATION

Key constraints:

- Keep initial unknown or failed load state non-blocking. Once `required` is
  known, do not add a close, Escape, backdrop, skip, or persistence bypass.
- Acquire the synchronous lock before the first await. Use the returned
  acceptance version and close only after the same current active user has both
  successful writes.
- Keep the focusable reading region in the focus loop and keep all fixed
  controls reachable on narrow and short viewports.
- Preserve the public document route, registration flow, shared helpers,
  locale and context values, ClassKit boundary, and exact marker comparison.

Suggested starting point: Add the in-flight and latest-context refs plus the
attempt snapshot in `src/features/documents/health-declaration-gate.tsx`.

First milestone: One same-context submit performs the existing acceptance and
marker writes in order, while concurrent or stale attempts cannot write the
later marker or close the gate.

Verdict: Ready for Development

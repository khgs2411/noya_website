# Health Declaration Gate Recovery Design Audit

## Audit Mode: Full

Rationale: The design changes a mandatory global modal, an authenticated
two-write workflow, session-sensitive asynchronous state, and keyboard focus
containment. The change is local to one website feature, but failure can block
an active user or record acceptance for stale user context.

## Plan Overview

Objective: Restore a usable health declaration gate that records ClassKit
acceptance and the accepted version marker, then closes without navigation or a
page refresh.

Scope: Responsive modal layout, keyboard scrolling and focus containment,
single-flight submit behavior, stale-user protection, localized submit failure,
and focused verification. Document loading policy, the public document route,
class registration acceptance, backend ownership, new dependencies, global
state, and local persistence are excluded.

Target Audience: Both human developers and AI agents in the Symphony planning
and execution workflow.

Readiness Level: Ready for Development.

Key Technical Decisions:

- Keep the existing availability policy. The modal blocks only after the
  application has loaded enough state to prove acceptance is required.
- Keep the current two-write ClassKit boundary. Document acceptance is the
  authoritative record, while profile metadata is the exact-version marker
  used to decide whether the website shows the gate.
- Close the gate only after both writes succeed for the same current active
  user that started the attempt.
- Use a synchronous component ref for the in-flight lock. React busy state
  remains presentation state.
- Keep the declaration body as the flexible, named, keyboard-focusable scroll
  region. Keep agreement, error, and action controls reachable below it.

## Repository Verification

Search Boundary: The Noya website repository, its local Git history, the exact
ClassKit SDK commit pinned by `package.json` and `bun.lock`, and the local
ClassKit API source snapshot referenced by the design.

| Material Claim | Status | Evidence and Notes |
| --- | --- | --- |
| `docs/design/2026-08-17-health-declaration-gate/spec.md` | Verified | The design defines entry, submit, partial-failure, accessibility, ownership, scope, and verification contracts. |
| `docs/design/2026-08-17-health-declaration-gate/agenda.md` | Verified | Its approved decisions and pressure-test result agree with the spec. |
| `src/App.tsx` global gate mount | Verified | `renderPage` mounts `HealthDeclarationGate` after the requested page, and every route branch uses `renderPage`. The public `/health-declaration` branch still renders `ProductDocumentPage`. |
| `src/features/documents/health-declaration-gate.tsx` ownership and eligibility | Verified | The component reads `client`, `productUser`, and `session`; loads document and profile in parallel; and blocks only for an active signed-in user with `status === "required"` and a loaded document. |
| Current two-write submit and immediate close | Verified | The component calls the shared acceptance boundary, writes `acceptance.document_version` through `client.profile.update`, and sets local status to `accepted` only after both calls report success. |
| Current viewport defect | Verified | The overlay centers an unconstrained card. Only the Markdown region has `max-h-[42vh]`, so the full dialog can exceed a short viewport. |
| Current repeated-submit defect | Verified | `submitting` is React state, but `acceptDeclaration` has no synchronous guard before its first asynchronous call. |
| Current focus and keyboard-scroll defects | Verified | Initial focus goes to the dialog container. The Tab handler wraps only at the first and last queried controls, and its selector excludes a focusable scroll region. The Markdown scroll container has no tab stop or accessible name. |
| Current raw submit-error behavior | Verified | Acceptance errors, profile errors, and thrown `Error` messages are rendered directly. The existing locale trees do not yet contain a dedicated submit-failure key. |
| `src/features/documents/health-declaration-acceptance.ts` | Verified | It owns `health_declaration_accepted_version` and uses exact numeric version equality. |
| `src/features/documents/product-document-acceptance.ts` | Verified | It is the shared `client.productDocuments.accept` boundary and forwards current locale, English fallback, and caller context. |
| `src/i18n.ts` locale ownership | Verified | English, Russian, and Hebrew each contain `documents.healthGate`; adding one matching key preserves the established translation shape. |
| `src/features/lessons/lessons-page.tsx` separate registration flow | Verified | Registration has its own health declaration acceptance context and profile-marker write. The design does not require changes to this consumer. |
| Exact `@class-kit/react` dependency | Verified | `package.json` and `bun.lock` both pin commit `a158bc588f5ec3421788475ccab2c5c2cb47ce9f`. |
| Pinned SDK acceptance response | Verified | The pinned SDK declares `productDocuments.accept(...)`, forwards locale, fallback locale, and context, and returns an acceptance with numeric `document_version`. |
| Pinned SDK profile update | Verified | `profile.update(...)` forwards a metadata-only request through the public profile function boundary. |
| ClassKit profile metadata merge | Verified | The local API source builds the stored metadata as existing profile metadata shallow-merged with the supplied patch. |
| Repeat acceptance after partial success | Verified | The ClassKit document endpoint uses an upsert with the acceptance uniqueness key. A retry with the same gate context can repeat acceptance before retrying the profile update. |
| `DESIGN_GUIDE.md` and `AGENTS.md` constraints | Verified | They require mobile-first, RTL-safe, localized Tailwind UI and the public ClassKit client boundary. The design follows these constraints. |

No referenced path, symbol, SDK shape, or backend behavior was contradicted.

## Strengths

### 1. It preserves the correct ownership boundary

The website changes only presentation, local attempt state, and localized
feedback. ClassKit remains authoritative for identity, active-user state,
published content, acceptance, and profile data. The design adds no direct
Supabase or Edge Function access.

### 2. It treats the two writes as one visible outcome

The design does not close the modal after document acceptance alone. It keeps
the gate open after a profile-marker failure and uses the backend's repeat-safe
acceptance behavior for retry. This matches the stated later-visit behavior
without inventing website persistence.

### 3. It resolves both forms of concurrent-submit risk

The synchronous ref closes the same-render repeated-click window that React
state alone cannot close. The attempt identity checks separately prevent a
completed request from writing the marker or closing the gate for a changed
authenticated active user.

### 4. Accessibility requirements are observable

The design specifies the focus entry behavior in both Tab directions, the
zero-enabled-control case, a named focusable reading region, supported scroll
keys, alert semantics, Escape suppression, focus restoration, and browser smoke
steps that start from programmatic dialog focus.

### 5. Verification matches repository policy

The design requires source inspection, focused lint, TypeScript validation, and
conditional browser checks. It does not add tests, run a default build, or start
a server without approval.

## Critical Issues

No critical issues. The design resolves the product, state, accessibility,
ClassKit-contract, and verification decisions needed before implementation
planning.

## Questions for Plan Author

No open material questions.

## Recommendations

### Implementation-plan precision

- Make the new scroll region part of the focus loop's focusable set. Adding
  `tabIndex={0}` without updating the current selector would leave the custom
  first/last calculations incomplete.
- Name the attempt snapshot and latest-context ref checks in the implementation
  plan. Require one check after acceptance and before the profile write, and a
  second check before the local accepted state transition.
- Keep the localized submit failure separate from the existing initial-load
  error copy. The two states have different visibility and retry behavior.

### Verification reporting

- If no approved server or authenticated failure fixture exists, report the
  browser-only cases as unverified. Do not weaken the source, lint, translation,
  or TypeScript evidence to compensate.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| A session or active-user change occurs between the two writes | Low | High | Snapshot the starting user, compare it with latest context before the profile write and before closing, and end stale attempts through `finally`. |
| Acceptance succeeds but the profile marker fails | Medium | Medium | Keep the gate open, show localized retry guidance, and repeat the idempotent ClassKit acceptance before retrying the marker. |
| The dialog still clips controls on a short viewport | Medium | High | Use a viewport-bounded flex/grid layout with the declaration as the flexible scroll region and an overlay/dialog overflow fallback. |
| A focusable reading region is omitted from the custom focus loop | Medium | High | Include all enabled focusable descendants in first/last calculations and run the specified link-free keyboard scroll check. |
| Browser evidence is unavailable in the isolated worktree | Medium | Medium | Use an existing approved server and suitable fixture when available; otherwise report the exact unverified cases. |

Highest Risk: A stale authenticated context during the two-write submit could
write or close for the wrong user. The design makes this a required attempt
invariant and gives the executor an objective source-inspection check.

## Pre-Development Checklist

- [x] Product behavior and the deliberate non-blocking load policy are explicit.
- [x] ClassKit and website ownership boundaries are explicit.
- [x] The pinned SDK request and response shapes are verified.
- [x] Profile metadata merge and repeat-acceptance behavior are verified.
- [x] Responsive, focus, retry, stale-session, and localization behavior is testable.
- [x] All referenced repository paths and affected consumers are verified.
- [x] No material product, architecture, data, security, or public-contract decision remains open.

## Next Steps

1. Produce a focused implementation plan for the gate component and the three
   locale entries.
2. Implement the synchronous attempt boundary and stale-context checks before
   the layout and accessibility changes consume the new busy/error states.
3. Apply the repository's focused verification policy and record unavailable
   browser-only evidence exactly.

## Evaluation Matrix

| Dimension | Weight | Raw Score | Weighted Score | Notes |
| --- | --- | --- | --- | --- |
| Completeness | x3 | 5/5 | 15/15 | Requirements trace to state, UI, failure, accessibility, and objective verification behavior. |
| Feasibility | x3 | 5/5 | 15/15 | Current owners, pinned SDK types, profile merge, and repeat acceptance all support the design. |
| Clarity | x2 | 5/5 | 10/10 | Entry, submit order, stale-attempt behavior, retry, focus, and exclusions are explicit. |
| Logical Flow | x2 | 4/5 | 8/10 | Contract and dependencies are clear; exact file-level sequencing belongs to the implementation plan. |
| Scope & Risk | x2 | 5/5 | 10/10 | The design is surgical and addresses the high-impact blocking, concurrency, and accessibility risks. |
| Developer Experience | x1 | 4/5 | 4/5 | Seams and proof conditions are strong; exact implementation work units remain for planning. |
| AI Readiness | x1 | 5/5 | 5/5 | An agent can implement the design without inventing product, architecture, data, or public-contract decisions. |

Overall: 67/70 -> Ready for Development

## Readiness Gate Check

| Gate | Result | Evidence |
| --- | --- | --- |
| Weighted score is in Ready range | Pass | 67/70 is within the 56-70 Ready range. |
| Every applicable dimension is at least 3 | Pass | The lowest applicable score is 4. |
| Completeness is at least 4 | Pass | Completeness is 5/5. |
| Feasibility is at least 4 | Pass | Feasibility is 5/5. |
| No unresolved critical issue | Pass | No critical issue remains. |
| AI Readiness is at least 4 when applicable | Pass | AI Readiness is 5/5. |

## Handoff

PLAN APPROVED FOR IMPLEMENTATION

Key constraints:

- Keep the gate mandatory only after `required` is known. Do not add a close,
  Escape, backdrop, skip, local-storage, or navigation bypass.
- Keep both writes on the public ClassKit client. Use the returned accepted
  version and close only after the profile marker succeeds for the same current
  active user.
- Keep the declaration focusable and scrollable, include it in focus
  containment, and keep agreement, alert, and action controls reachable at
  narrow widths and short heights.
- Preserve the public health declaration route and the separate registration
  acceptance flow.

Suggested starting point: Define the attempt snapshot, latest-context refs, and
synchronous in-flight guard in
`src/features/documents/health-declaration-gate.tsx`.

First milestone: One accepted document response can update the exact profile
marker and close the gate only for the unchanged active user, while every
failure or stale attempt keeps the route mounted and does not report success.

Verdict: Ready for Development

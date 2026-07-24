# Structured Lesson Locations Design Audit

## Audit Mode: Standard

Rationale: This is a cross-surface feature design spanning shared form state,
manager and customer presentation, an external SDK contract, asynchronous
interaction, localization, accessibility, and responsive behavior.

## Plan Overview

Objective: Replace Noya's text-only class and template location workflow with a
ClassKit-backed structured location pair while preserving permanent free-text
entry and stable stored display behavior.

Scope: Manager class/template entry and mutation serialization, template
inheritance, customer and manager display, ClassKit navigation helpers,
attribution safety, localization, accessibility, and degraded autocomplete
behavior. Provider calls, credentials, local geocoding/persistence, catalogues,
schedule payload changes, static marketing locations, and new dependencies are
excluded.

Target Audience: Both human developers and the AI-assisted Symphony planning and
execution workflow.

Readiness Level: Ready for Development.

Key Technical Decisions:

- Location is an explicit display-text/snapshot pair with a form-session dirty
  boundary; update omission, explicit clearing, free text, and structured
  selection remain distinguishable.
- Autocomplete is capability-gated and advisory. Its loading, empty,
  unavailable, rejected, and stale-response states never block free-text save.
- Manual class creation from a template materializes the complete default pair
  because the pinned create facade converts omitted text to wire-level `null`;
  ClassKit keeps ownership of schedule-generated inheritance.
- Shared presentation has compact and detailed variants. Navigation comes only
  from ClassKit helpers, and every attribution remains visible while only
  absolute HTTPS URLs become links.

## File Path Verification

Verified using local repository inspection and the exact ClassKit commit pinned
by `bun.lock`:

| Referenced Path | Status | Notes |
| --- | --- | --- |
| `docs/design/2026-07-24-structured-lesson-locations/spec.md` | Exists | Complete design under audit. |
| `docs/design/2026-07-24-structured-lesson-locations/agenda.md` | Exists | Decisions and pressure-test result agree with the spec. |
| `src/features/locations/` | Not Found — expected new path | The spec explicitly creates this shared location domain. |
| `src/features/manager/classes/class-form-dialog.tsx` | Exists | Currently stores one location string, sends text/null on every mutation, and copies only template text. |
| `src/features/manager/templates/template-form-dialog.tsx` | Exists | Currently stores one default-location string and always serializes it. |
| `src/features/manager/classes/class-management-tab.tsx` | Exists | Owns the ClassKit client, class/template form integration, and manager `ClassViewItem` mapping. |
| `src/features/manager/templates/template-management-tab.tsx` | Exists | Owns the ClassKit client and template form/detail integration. |
| `src/features/classes/class-types.ts` | Exists | `ClassViewItem` currently retains location text but no snapshot. |
| `src/features/classes/class-card.tsx` | Exists | Location text is currently inside the class-selection button. |
| `src/features/classes/class-calendar-view.tsx` | Exists | Desktop calendar cards currently omit location entirely. |
| `src/features/manager/classes/class-detail-panel.tsx` | Exists | Manager detail currently renders location as a string-only row. |
| `src/features/manager/templates/template-card.tsx` | Exists | Template card currently renders default text inside its selection button. |
| `src/features/manager/templates/template-detail-panel.tsx` | Exists | Template detail currently renders default location as a string-only row. |
| `src/features/lessons/lessons-page.tsx` | Exists | Customer mapping drops `locationSnapshot`; selected-detail facts currently accept string values. |
| `src/i18n.ts` | Exists | Contains parallel English, Russian, and Hebrew translation trees. |
| `DESIGN_GUIDE.md` | Exists | Confirms mobile-first, touch-friendly, branded, wrapping, and RTL-safe constraints. |
| `package.json` | Exists | Pins `@class-kit/react` to `v0.1.21`; exposes `lint` and `build` but no automated test script. |
| `bun.lock` | Exists | Resolves the SDK to `c0d1fc7a0f7eff77a17b3fbccc3944d19c74711d`. |

The matching SDK checkout is at that exact commit and confirms:

- `management.locations.autocomplete` accepts the recorded query, limit,
  language, country-code, and proximity inputs;
- the result vocabulary, complete snapshot shape, manager/customer/template
  field casing, and optional mutation inputs match the design;
- class and template updates preserve property presence, while class/template
  creates normalize omitted text to wire-level `null`;
- `ProductEffectiveCapabilities.permissions` exposes the exact
  `locations.autocomplete` permission key; and
- the Google Maps and Waze helpers are pure, prefer valid coordinates, encode
  free-text fallback, and return `null` without a destination.

The ClassKit API source additionally confirms the 2–200 Unicode-code-point
query bound, built-in-manager permission grant, custom-role explicit grant,
atomic location-pair rules, attribution normalization, and schedule-generation
copy into newly inserted lessons.

## Strengths

### 1. The Pair Contract Is Closed And Executable

The serialization matrix covers every meaningful transition: untouched edit,
template materialization, structured replacement, free-text replacement,
explicit clear, and untouched create. It aligns with the SDK facade and backend
property-presence behavior instead of treating the snapshot as incidental UI
metadata.

### 2. Failure Does Not Weaken The Product Boundary

The design keeps autocomplete advisory across latency, empty results,
provider degradation, thrown authorization/validation/transport errors, and
missing permission. It neither bypasses ClassKit nor makes provider health a
prerequisite for the permanent free-text workflow.

### 3. Shared Presentation Preserves Safety And Attribution

Compact versus detailed rendering gives dense cards a usable shape while
retaining snapshots through the view model. The URL policy, React text
rendering, original attribution order, helper-only navigation, and separation
of links from selection buttons establish concrete safety and interaction
invariants.

### 4. Async And Accessible Interaction Is Explicit

The debounce threshold, request identity invalidation conditions, locale
changes, selection behavior, editable-combobox semantics, keyboard commands,
live status region, focus visibility, and non-blocking submit behavior are
sufficiently specific for implementation and review.

## Critical Issues

None. No product, architecture, data, permission, or public-contract decision
remains unresolved before implementation planning.

## Questions for Plan Author

None. Repository inspection and the exact pinned ClassKit source resolve the
material behavioral and integration claims.

## Recommendations

### Implementation Planning

- Name the concrete files to create under `src/features/locations/` and list
  each touched consumer, especially `class-types.ts`,
  `class-calendar-view.tsx`, both detail panels, and the customer detail-fact
  rendering seam.
- Derive autocomplete permission from the live
  `useProductContext().capabilities.permissions` array at the class/template
  surfaces. Do not reuse the potentially cached manager-access snapshot as
  positive authorization for the advisory call.
- Give the customer and manager detail rows a deliberate React-node seam (or a
  dedicated location row) rather than forcing the detailed presentation back
  into their current string-only value contracts.

### Verification

- Make desktop calendar location rendering an explicit checkpoint; the current
  calendar card does not display location, unlike the current list card.
- Verify stale completion after close, locale change, template replacement, and
  structured selection with source-level request-identity inspection even when
  the live backend cannot reproduce out-of-order responses.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| A stale autocomplete completion reopens or replaces newer state | Medium | High | Use a form-scoped monotonic request identity and invalidate it on every transition named by the spec. |
| Cached manager access is mistaken for live autocomplete permission | Medium | High | Read the exact permission from live product-context capabilities; retain backend rejection as a safe fallback. |
| A form serializer collapses omitted, null, and snapshot states | Medium | High | Centralize the closed matrix in pure helpers and inspect every create/update payload path. |
| Detailed links are nested inside selection controls | Low | High | Keep compact text inside selection buttons and detailed navigation/attribution in sibling or detail-only content. |
| Installed SDK differs from the lockfile commit | Medium | High | Install from `bun.lock`, confirm resolution, and compile against exported v0.1.21 types before browser work. |
| Keyboard, degraded-state, RTL, or layout behavior lacks automated coverage | High | Medium | Use source inspection plus an existing approved server when available, and report any browser-only evidence gap. |

Highest Risk: Location-pair serialization. A single accidental property collapse
can silently clear a stored snapshot or break template inheritance, but the
design's centralized draft helper and closed matrix provide a sufficient
mitigation.

## Pre-Development Checklist

- [x] Product behavior, persistence semantics, permissions, failures, and exclusions are explicit.
- [x] Current repository paths and all material class/template/customer consumers are verified.
- [x] The exact pinned SDK commit, exported types, facade serialization, helpers, and permission key are verified.
- [x] Acceptance conditions are objective across structured, free-text, clear, absent, inherited, degraded, localized, and responsive states.
- [x] AI autonomy boundaries forbid direct provider/Supabase/Edge Function calls, new dependencies, and server-contract duplication.
- [ ] At implementation start, confirm installed dependencies resolve to the lockfile commit; this worktree currently has no installed `@class-kit/react`.
- [ ] In the implementation plan, name concrete new files, consumer edits, and focused verification checkpoints.

## Next Steps

1. Approve the design and translate it into a dependency-aware implementation
   plan.
2. Start with the shared draft model and serialization matrix, then integrate
   class/template forms and live capability input.
3. Extend stored-pair presentation through the shared view model and detail
   surfaces, then complete localization and focused verification.

## Evaluation Matrix

| Dimension | Weight | Raw Score | Weighted Score | Notes |
| --- | --- | --- | --- | --- |
| Completeness | x3 | 4/5 | 12/15 | All required behavior, edge cases, dependencies, and acceptance evidence are covered; concrete new filenames remain for planning. |
| Feasibility | x3 | 5/5 | 15/15 | Current repository consumers and exact pinned ClassKit source support every material technical claim. |
| Clarity | x2 | 5/5 | 10/10 | Pair semantics, ownership, async transitions, display variants, security rules, and exclusions are explicit. |
| Logical Flow | x2 | 4/5 | 8/10 | Contract and state prerequisites are clear; exact implementation ordering belongs in the next plan artifact. |
| Scope & Risk | x2 | 5/5 | 10/10 | The slice is coherent, excludes server/provider expansion, and directly mitigates its highest-risk states. |
| Developer Experience | x1 | 4/5 | 4/5 | Strong seams and done signals; file-level milestones remain to be named in planning. |
| AI Readiness | x1 | 4/5 | 4/5 | Objective matrices, forbidden paths, and verification rules are strong; concrete work units and rollback notes remain for the plan. |

Overall: 63/70 -> Ready for Development

Critical Dimension Check: Pass; neither Completeness nor Feasibility scores 1.

## Handoff

PLAN APPROVED FOR IMPLEMENTATION

Key constraints:

- Preserve the complete display-text/snapshot pair and update property-presence
  semantics through shared pure draft helpers.
- Use only the pinned ClassKit client, public types, live capability permission,
  and pure navigation helpers; no direct provider, Supabase, raw Edge Function,
  local geocoder, catalogue, or compatibility adapter.
- Keep free-text saving independent of autocomplete availability, and keep all
  detailed navigation/attribution interactions outside selection buttons.

Suggested starting point: Define the shared `LocationDraft` initialization and
serialization helpers against the exact v0.1.21 mutation inputs.

First milestone: Class and template forms can round-trip untouched, cleared,
free-text, structured, and template-copied pairs with payload presence matching
the closed matrix.

Verdict: Ready for Development

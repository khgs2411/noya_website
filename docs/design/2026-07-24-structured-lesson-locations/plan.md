# Structured Lesson Locations Implementation Plan Set

**Approved Source:** `.symphony/assignment.md` accepted task requirements
**Design:** `spec.md` (Ready for Review)
**Agenda:** `agenda.md`
**Pseudocode:** Absent
**Context:** `DESIGN_GUIDE.md`
**ADRs:** None
**Status:** Ready for Review

## Goal

Deliver a ClassKit-backed structured location workflow for Noya's class and
template forms, preserve the full display-text/snapshot pair through manual and
schedule-backed class lifecycles, and expose safe localized location display,
navigation, and attribution on manager and customer surfaces without making
autocomplete a prerequisite for free-text saving.

## Source Artifacts And Repository Evidence

- `.symphony/assignment.md` is the explicit approved requirement source and
  fixes structured/free-text/clear/absent semantics, template inheritance,
  provider degradation, display, navigation, attribution, localization,
  responsiveness, and ownership exclusions.
- `spec.md` and `agenda.md` ground the requirements in current forms and
  presentation consumers and define the location-pair draft, closed mutation
  matrix, live permission boundary, async combobox behavior, display variants,
  and URL safety rule.
- `spec-audit.md` independently verifies the design and ends with
  `Verdict: Ready for Development`.
- `src/features/manager/classes/class-form-dialog.tsx` and
  `src/features/manager/templates/template-form-dialog.tsx` own the two
  editable text-only location fields and mutation serialization.
- `src/features/manager/manager-page.tsx` is the correct live-versus-cached
  capability boundary and already applies the same rule to the change-request
  feature.
- `src/features/manager/classes/class-management-tab.tsx` and
  `src/features/manager/templates/template-management-tab.tsx` own the
  ClassKit client and form integration.
- `src/features/classes/class-types.ts`, `class-card.tsx`, and
  `class-calendar-view.tsx` form the shared manager/customer compact
  presentation boundary.
- `src/features/manager/classes/class-detail-panel.tsx`,
  `src/features/manager/templates/template-card.tsx`,
  `src/features/manager/templates/template-detail-panel.tsx`, and
  `src/features/lessons/lessons-page.tsx` are the remaining manager/customer
  stored-location consumers.
- `src/i18n.ts` owns all English, Russian, and Hebrew copy.
- `package.json` and `bun.lock` pin `@class-kit/react@v0.1.21` and define
  `npm run lint` and `npm run build`; there is no automated test script.
- No pseudocode, glossary, ADR, migration, or new dependency is required.

## Design Readiness

- Approved source verified: Yes — the accepted Symphony assignment supplies
  explicit requirements and autonomous planning/execution authorization.
- Artifact paths verified: Yes.
- Pseudocode status and alignment: Absent; the closed mutation matrix, exact
  SDK types, component consumers, and audit findings make it unnecessary.
- Source consistency: The assignment, spec, agenda, design audit, current code,
  and exact ClassKit v0.1.21 contracts agree.
- Repository constraints reconciled:
  - class/template creation must explicitly materialize a selected template's
    pair because the public create facade normalizes omitted text to wire-level
    `null`;
  - update omission remains distinct from explicit null;
  - autocomplete authorization comes only from live capabilities, not the
    cached manager-access snapshot;
  - detailed React content needs a dedicated location row/component rather
    than being forced into existing string-only detail helpers.
- Remaining non-blocking risks: dependencies are initially absent; no automated
  interaction test layer exists; backend degradation, out-of-order completion,
  and unsafe attribution fixtures may not be reproducible in a live account.
- Blockers: None.

## Reconciliations And Decision Ownership

| Item | Evidence / Decision Rule | Owning Chunk | Must Resolve Before |
| --- | --- | --- | --- |
| Installed SDK resolution | Install from `bun.lock`; confirm `@class-kit/react` exposes `LocationSnapshot`, `management.locations.autocomplete`, snapshot record/input fields, and both navigation helpers. Stop on mismatch; do not add an adapter. | 01 | Editing SDK-backed types |
| Locale normalization | Map the current i18n language prefix to exactly `he`, `ru`, or fallback `en`; do not forward region suffixes or unsupported values. | 01 | Autocomplete call |
| Detail content seam | Use a dedicated detailed location component/row that accepts React content; do not broaden every existing string-only detail row without need. | 02 | Detail integration |
| Browser fixture availability | Use only an already-running approved server and only claim states actually reproduced; otherwise retain source-level evidence and report the gap. | 02 | Final verification report |

## Approved Chunks

| Chunk | Deliverable | Depends On | Enables | Verification Focus | Status |
| --- | --- | --- | --- | --- | --- |
| [01](plans/01-location-entry-and-pair-semantics.md) | A shared location domain with pure pair semantics, advisory accessible autocomplete, and safe compact/detailed presentation primitives | None | All existing-form and surface integration | SDK resolution, omission/null/structured matrix, stale request and combobox behavior, helper-only navigation, safe attribution | Ready for Review |
| [02](plans/02-location-display-localization-and-verification.md) | Complete integration across live capability, class/template forms, manager/customer list/calendar/detail surfaces, and all locale copy | 01 | Complete accepted feature | Template copy, snapshot propagation, non-nested interaction, locale parity, lint/build, available browser smoke | Ready for Review |

Chunk 01 establishes the independently necessary shared product boundary
without touching existing consumers. Chunk 02 owns every existing-file
integration and the single localization file, preventing overlapping file
ownership while verifying the complete vertical outcome.

## Dependency And Parallelism Order

1. Execute Chunk 01.
2. Execute Chunk 02 after the shared domain compiles.

The chunks are sequential. Chunk 02 imports all three shared primitives and
connects them to existing ClassKit records and capabilities. No files are
jointly owned.

## Shared Contracts And Integration Points

Chunk 01 establishes:

```ts
type LocationDraft = {
  text: string;
  snapshot: LocationSnapshot | null;
  dirty: boolean;
};
```

- Pure initialization/update/serialization helpers implement the approved
  matrix for class and template public mutation inputs.
- `LocationAutocompleteField` is controlled by its parent form and receives:
  ClassKit client, exact live `canAutocompleteLocations` capability, current
  normalized locale, current draft, and `onChange`.
- `LocationDisplay` owns the shared presentation contract:

```ts
LocationDisplay({
  text,
  snapshot,
  variant: "compact" | "detailed",
})
```

It alone owns display fallback, ClassKit navigation helper calls, attribution
ordering, HTTPS link eligibility, and detailed action styling.

Chunk 02 derives `canAutocompleteLocations` only when
`accessSnapshot === null` and live capabilities include
`locations.autocomplete`; passes it and the current client through both form
surfaces; and consumes stored pairs directly from exported SDK record types:
`ManagedClass.location_snapshot`, `ClassSummary.locationSnapshot`, and
`ClassTemplate.default_location_snapshot`.

## Approved-Source Coverage

| Requirement / Acceptance Criterion | Covered By | Notes |
| --- | --- | --- |
| Manager autocomplete through ClassKit | 01, 02 | Shared exact request behavior plus live capability/form integration |
| Deliberate structured selection or permanent free text | 01, 02 | Controlled editable combobox; submit never waits for provider |
| Structured/free-text/cleared/absent round-trip | 01, 02 | Central closed serializer matrix integrated into both forms |
| Prepopulate existing text or snapshot | 01, 02 | Shared initializer used at both record boundaries |
| Manual template pair inheritance | 02 | Copy and materialize both fields together |
| Schedule-generated template inheritance | 02 | No schedule payload changes; newly generated records display stored pair |
| Temporary provider failure never blocks persistence | 01, 02 | Advisory shared states connected to non-blocking form submit |
| Stable manager and customer display | 01, 02 | Shared component integrated into list/calendar/detail consumers |
| Google Maps and Waze links through SDK helpers | 01, 02 | Shared helper-only component and detailed-surface integration |
| Every attribution escaped and only safe HTTPS URLs linked | 01, 02 | Shared policy used at every detailed surface |
| English, Hebrew, Russian; responsive and RTL-safe | 01, 02 | Accessible structure plus all copy/integration in Chunk 02 |
| No catalogue, direct provider, credentials, local geocoding/persistence, or static-address migration | 01, 02 | Import/call inspection and explicit non-goals |
| Full assignment verification matrix | 01, 02 | Deterministic static/build gates plus available-server smoke |

## Verification Strategy

- If dependencies are absent, run `bun install --frozen-lockfile`; expect exit
  0 and no manifest/lockfile changes.
- Confirm the installed package resolves the pinned v0.1.21 location exports
  before editing SDK-backed surfaces.
- Use focused `rg` and source inspection after Chunk 01 to verify the closed
  serializer matrix, ClassKit-only autocomplete/navigation boundaries, stale
  response invalidation, and safe attribution policy.
- Run `npm run lint` after the complete change; expect exit 0 with no
  feature-attributable errors or warnings.
- Run `npm run build` because the feature adds SDK types, shared controlled
  state, new React-node presentation seams, and cross-surface view-model
  changes; expect `tsc -b` and Vite to exit 0.
- Use focused `rg`/inspection to verify full locale-key parity, snapshot
  propagation, navigation helper use, safe attribution protocol checks, and
  absence of direct provider/Supabase/raw Edge Function calls.
- Before browser smoke testing, run
  `curl --fail --silent --show-error --max-time 2 http://127.0.0.1:5173/ >/dev/null`.
  On exit 0, use that already-running server for supported reproducible
  structured/free-text/clear, inheritance, display, navigation, locale, RTL,
  responsive, and provider-state flows. On nonzero exit, report the browser
  gap; do not start a server or overstate unreproducible
  degradation/stale/unsafe-URL evidence.

## Risks And Sequencing

- Pair serialization is the highest risk. Centralize it before form integration
  and do not duplicate conditional object spreading between forms.
- A stale autocomplete result can corrupt a newer draft. The entry component
  must invalidate request identity on every transition named in the design, not
  only compare the latest query string.
- Cached manager access is not positive autocomplete authorization. Derive and
  pass the live permission during Chunk 02 integration before any advisory
  request can run.
- Navigation links inside selection buttons would create invalid interaction.
  Chunk 02 keeps compact text non-interactive and detailed links in sibling or
  detail-only content.
- Reverting Chunk 02 disconnects the otherwise inert shared domain and restores
  existing text-only behavior. Reverting Chunk 01 then removes only the three
  unconsumed shared files; neither chunk owns a migration or website
  persistence.

## Execution Handoff

The executor must load `.symphony/assignment.md`, `spec.md`, `agenda.md`,
`spec-audit.md`, this plan, and both chunk plans. Execute 01 then 02 in the
current worktree. Stop and report if the installed SDK differs from the pinned
contract, unrelated changes overlap an owned file, or repository reality would
require a new product choice, public API, persistence model, direct provider
path, production dependency, or schedule payload change.

The plan set is internally ready but remains `Ready for Review`; Symphony's
validated planning marker governs delegated execution.

## User Approval

- Roadmap approved by: One-pass generation authorized by the Symphony lead
  assignment on 2026-07-24
- Plan set approved for execution by: Pending independent plan audit and
  Symphony planning marker

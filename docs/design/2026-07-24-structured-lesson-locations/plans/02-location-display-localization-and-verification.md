# Chunk 02: Product Integration, Localization, And Verification

**Plan Set:** `../plan.md`
**Approved Source:** `../spec.md`
**Status:** Ready for Review
**Depends on:** Chunk 01
**Enables:** Complete accepted feature

## Goal

Connect the shared location domain to live ClassKit capability, class/template
create and edit forms, and manager/customer list, calendar, and detail surfaces;
complete all locale copy and verify the full accepted workflow.

## Source Artifacts And Constraints

- `.symphony/assignment.md`: complete manager entry, pair round-trip,
  inheritance, degradation, display, navigation, attribution, localization,
  responsiveness, and verification outcome.
- `../spec.md`: all user-facing behavior, exact pair serialization, stored
  projections, permissions, security, and acceptance evidence.
- `../agenda.md`: template materialization/detach, live autocomplete
  capability, compact/detailed coverage, and non-nested interaction.
- `../spec-audit.md`: live-versus-cached permission, React-node detail seam,
  desktop calendar, and deterministic-source versus live-fixture evidence.
- Chunk 01's `location-draft.ts`, `location-autocomplete-field.tsx`, and
  `location-display.tsx`.
- Existing application consumers named below.
- No new dependency, route, persistence, provider call, static-address
  migration, or schedule mutation.

## Relationships

- Depends on the three shared primitives from Chunk 01.
- Owns every existing file touched by this feature, including `src/i18n.ts`.
- Produces the complete vertical product outcome; no later chunk remains.

## File Responsibility Map

**Create:**

- None.

**Modify:**

- `src/features/manager/manager-page.tsx` — derive exact autocomplete
  permission from live capabilities only and pass it to class/template tabs.
- `src/features/manager/classes/class-management-tab.tsx` — accept/pass live
  capability and client to the class form; retain manager
  `location_snapshot` in `ClassViewItem`.
- `src/features/manager/templates/template-management-tab.tsx` — accept/pass
  live capability and client to the template form.
- `src/features/manager/classes/class-form-dialog.tsx` — use shared draft and
  autocomplete field, prepopulate stored pairs, copy/detach/replace complete
  template pairs, and merge closed-matrix class properties.
- `src/features/manager/templates/template-form-dialog.tsx` — use shared draft
  and field, prepopulate default pairs, and merge closed-matrix template
  properties.
- `src/features/classes/class-types.ts` — add nullable `LocationSnapshot` to
  `ClassViewItem`.
- `src/features/classes/class-card.tsx` — render compact stored location while
  preserving valid selection/action interaction.
- `src/features/classes/class-calendar-view.tsx` — render compact accepted
  location text in desktop calendar records.
- `src/features/manager/classes/class-detail-panel.tsx` — use a dedicated
  detailed location row/component instead of the string-only detail value.
- `src/features/manager/templates/template-card.tsx` — render compact default
  pair with no nested links.
- `src/features/manager/templates/template-detail-panel.tsx` — render detailed
  default pair with navigation and all attributions.
- `src/features/lessons/lessons-page.tsx` — retain customer
  `locationSnapshot`, adapt only the location detail seam for React content,
  and render detailed customer location.
- `src/i18n.ts` — equivalent English, Russian, and Hebrew entry/status/action/
  accessibility/attribution/navigation copy.

**Test:**

- No automated test file: use focused source inspection, repository lint/build,
  and an existing-server browser smoke check if available.

## Behavioral And Contract Changes

`ManagerPage` derives:

```ts
const canAutocompleteLocations =
  accessSnapshot === null &&
  capabilities.permissions.includes("locations.autocomplete");
```

It passes that boolean through both management tabs. Cached permissions,
`canManageClasses`, and role names never positively authorize autocomplete.

Both forms initialize the shared draft from stored text plus snapshot. Class
template selection copies and marks the whole pair dirty; detaching “No
template” preserves copied values; selecting another template replaces them.
Form serializers spread only shared helper output:

- untouched edit omits both pair properties;
- clear sends both null;
- free text sends trimmed text plus null snapshot;
- structured selection sends exact snapshot label plus complete snapshot;
- untouched empty create invents no pair; and
- template-backed class create materializes both default values together.

`ClassViewItem` adds `locationSnapshot: LocationSnapshot | null`. Manager and
customer mappings populate it from `location_snapshot` and `locationSnapshot`
respectively. Class list and desktop calendar cards and template cards use
compact `LocationDisplay`; selected manager/customer class and template
details use detailed `LocationDisplay`. Detailed content uses a dedicated
React-node location seam and never nests links inside a selection button.

All new shared-component translation keys exist with equivalent meaning in
English, Russian, and Hebrew. Logical Tailwind utilities, wrapping, touch
targets, live regions, and combobox semantics preserve narrow/wide LTR/RTL
behavior.

## Implementation Tasks

- [ ] In `manager-page.tsx`, derive the exact live-only capability and extend
      class/template tab props. In the two management tabs, pass the existing
      ClassKit client and boolean into forms without moving client ownership or
      reading cached access as authorization.
- [ ] Integrate the shared draft/autocomplete field into both forms. Preserve
      all non-location fields, validation, submission, mutation-error, and
      template-detach behavior. Use only shared transition/serialization
      helpers so complete snapshot objects and omitted/null presence cannot
      diverge between forms.
- [ ] Extend `ClassViewItem` and manager/customer mappings with the nullable
      snapshot. Use compact display in list/calendar/template cards and a
      dedicated detailed location seam in manager/customer/template details.
      Preserve selection, manager action, registration, loading, and focus
      behavior; keep all navigation links outside selection buttons.
- [ ] Add complete English, Russian, and Hebrew copy for field labels,
      loading, empty, advisory unavailable, free-text guidance, selection,
      navigation destinations, attributions, and accessibility labels. Avoid
      raw provider-error or provider-specific recovery language.
- [ ] Inspect every class/template create/update input against the matrix,
      snapshot propagation at both SDK casing boundaries, all detailed
      attribution/navigation surfaces, desktop calendar display, and the
      absence of schedule payload/static marketing changes.
- [ ] Run lint/build and available browser smoke verification. Exercise
      structured selection, free text, clear, untouched edit, template
      inheritance, newly generated lesson display, reproducible provider
      states, manager/customer list/calendar/detail, navigation, attribution,
      all locales, RTL, and narrow/wide layouts. Separate live evidence from
      nondeterministic states verified only by source inspection.

## Verification

- `git diff --check`
  — expect exit 0 for tracked-file changes.
- `if rg -n '[[:blank:]]+$' src/features/locations/location-draft.ts src/features/locations/location-autocomplete-field.tsx src/features/locations/location-display.tsx; then exit 1; fi`
  — expect exit 0 with no trailing-whitespace matches in the new untracked
  shared-domain files.
- `npm run lint`
  — expect exit 0 with no feature-attributable errors or warnings.
- `npm run build`
  — expect TypeScript project build and Vite bundle exit 0.
- `rg -n "locations\\.autocomplete|locationSnapshot|defaultLocationSnapshot|location_snapshot|default_location_snapshot|canAutocompleteLocations|LocationDisplay" src/features/locations src/features/classes src/features/manager src/features/lessons`
  — inspect exact capability, mutation pairs, and stored snapshot propagation.
- `rg -n "getGoogleMapsNavigationLink|getWazeNavigationLink|protocol.*https|noopener noreferrer" src/features/locations src/features/classes src/features/manager src/features/lessons`
  — confirm ClassKit-helper navigation and safe external-link policy.
- `rg -n "fetch\\(|supabase|functions\\.invoke|geoapify|GEOAPIFY|navigator\\.geolocation" src/features/locations src/features/classes src/features/manager/classes src/features/manager/templates src/features/lessons`
  — expect no direct provider, credential, geolocation, Supabase, or raw
  function path attributable to this feature.
- Focused inspection of the new location translation subtree in `src/i18n.ts`
  — confirm identical key shape for English, Russian, and Hebrew.
- `curl --fail --silent --show-error --max-time 2 http://127.0.0.1:5173/ >/dev/null`
  — on exit 0, use that already-running server for browser work; on nonzero
  exit, record the interaction/layout gap and do not start a server.

## Acceptance Criteria Covered

- Managers can choose structured suggestions or keep permanent free text.
- Structured, free-text, cleared, absent, and untouched pairs round-trip.
- Existing pairs prepopulate and manual template pairs materialize coherently.
- Newly schedule-generated lessons retain and display the template pair without
  schedule payload changes.
- Provider latency, unavailable/empty/error states, and missing permission do
  not block persistence.
- Manager and customer list/calendar/detail surfaces show stable display text.
- Selected details provide safe Google Maps/Waze links and every attribution.
- All new behavior is equivalent across English, Hebrew, and Russian and
  remains responsive/RTL-safe.
- No direct provider, credentials, local geocoding/persistence, catalogue, or
  static-address migration is introduced.

## Risks, Rollback, And Isolation

- Pair integration risk: a form-local object spread can bypass the shared
  helper. Inspect every mutation call and prohibit duplicated location
  conditionals.
- Capability risk: cached manager access can outlive permission changes. Only
  the live boolean may enable the advisory call; backend rejection remains
  safely recoverable.
- View-model risk: either casing boundary can drop snapshots. Populate both and
  compile the required `ClassViewItem` property.
- Interaction/security risk: links inside selection buttons or unsafe
  attribution promotion. Keep compact cards text-only and use the centralized
  detailed component outside record selection controls.
- Layout/evidence risk: long RTL text and nondeterministic backend states. Use
  an existing server when available and report unreproduced states precisely.
- Rollback disconnects and removes the integration while preserving server
  records and schema; no website migration or persistence exists.

## Non-Goals

- Marketing/contact addresses or the hard-coded readonly marketing schedule.
- Embedded maps, provider-specific controls, local navigation URL
  construction, browser geolocation, or location caching.
- Regeneration or mutation of existing schedule-generated conflicts.
- A test framework, screenshot harness, or development-server startup.

## Consistency Check

- Every touched existing path and both SDK record casings were verified.
- This chunk solely owns all existing files; Chunk 01 owns only three new
  shared-domain files.
- SDK mutation inputs use camelCase; manager/template records use snake_case;
  customer summaries use camelCase.
- Exact repository scripts are `npm run lint` and `npm run build`; the build is
  warranted by SDK and cross-surface TypeScript changes.
- Browser verification obeys the existing-server-only repository rule.

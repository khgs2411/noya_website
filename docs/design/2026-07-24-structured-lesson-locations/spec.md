# Structured Lesson Locations Design

Status: Ready for Review — not approved for implementation planning.
Design directory: `docs/design/2026-07-24-structured-lesson-locations/`

## Goal And Success Criteria

Upgrade Noya's class and class-template location workflow from a single
free-text field to ClassKit's structured location contract without making the
provider a prerequisite for saving.

The feature succeeds when:

- managers can type a location, choose a ClassKit autocomplete suggestion, or
  deliberately keep the typed free text;
- class and template mutations preserve a coherent display-text/snapshot pair,
  including the distinction between an unchanged omitted pair, an explicit
  snapshot clear, and a selected structured snapshot;
- class creation from a template carries both the template's default display
  text and default snapshot through the pinned create facade, while ClassKit-
  owned schedule generation continues to inherit the stored template pair for
  newly generated lessons;
- temporary unavailability, quota exhaustion, slow or failed requests, and no
  suggestions never disable free-text saving;
- manager template/class surfaces and customer class surfaces show stable
  stored location text, safe Google Maps and Waze links, and every required
  attribution supplied by a structured snapshot;
- all new interaction, validation, degraded-state, and navigation copy exists
  in English, Hebrew, and Russian and remains usable on narrow, wide, LTR, and
  RTL layouts; and
- Noya calls only `@class-kit/react` for autocomplete, mutations, stored
  snapshots, and navigation helpers.

## Current Repository Context

- `package.json` already pins `@class-kit/react` to `v0.1.21`; `bun.lock`
  resolves it to commit `c0d1fc7a0f7eff77a17b3fbccc3944d19c74711d`.
- `src/features/manager/classes/class-form-dialog.tsx` and
  `src/features/manager/templates/template-form-dialog.tsx` currently model
  location as a string and always serialize the current string as text or
  `null`. Neither preserves snapshots or unchanged update omission.
- Class creation may seed form fields from a selected `ClassTemplate`, but it
  currently copies only `default_location`, not
  `default_location_snapshot`.
- `src/features/manager/classes/class-management-tab.tsx` maps manager records
  into the shared `ClassViewItem`, and `src/features/lessons/lessons-page.tsx`
  maps customer `ClassSummary` records into the same view model. The view model
  currently drops both manager `location_snapshot` and customer
  `locationSnapshot`.
- `src/features/classes/class-card.tsx` renders the stored location text inside
  its class-selection button. Navigation links cannot be added inside that
  button without invalid nested interaction.
- Manager class and template detail surfaces display only the current text.
  Template cards also display text only.
- `src/i18n.ts` is the single English, Russian, and Hebrew copy registry.
- `DESIGN_GUIDE.md` requires mobile-first branded surfaces, touch-friendly
  controls, wrapping content, and RTL-safe logical layout.
- The repository has no automated test script. `npm run lint` and
  `npm run build` are the available static/compile gates; the SDK-wide type
  changes and shared class view model justify the build gate for this feature.

## Verified ClassKit v0.1.21 Contract

The exact tag pinned by the repository exports:

- `management.locations.autocomplete(input)`, accepting `query`, optional
  `limit`, `language`, `countryCodes`, and `proximity`;
- `LocationSnapshot`, whose stable fields are `label`,
  `formatted_address`, coordinates, provider reference, and an attribution
  array of `{ text, url: string | null }`;
- `LocationAutocompleteResult`, with availability `"available"` or
  `"temporarily_unavailable"` and a suggestions array;
- manager class `location` and `location_snapshot`, customer class `location`
  and `locationSnapshot`, and template `default_location` and
  `default_location_snapshot`;
- optional mutation inputs `location` / `locationSnapshot` and
  `defaultLocation` / `defaultLocationSnapshot`; and
- pure `getGoogleMapsNavigationLink` and `getWazeNavigationLink` helpers.

For updates, omitting the snapshot leaves the backend pair unchanged. Supplying
`null` clears the structured snapshot while preserving the supplied free text.
Supplying a snapshot makes its label authoritative. The website must preserve
those presence semantics instead of collapsing all form states to a string.

## User-Facing Behavior

### Manager Location Entry

- Replace the plain location input in class and template forms with one shared
  manager-domain location field.
- The text input always remains directly editable. Saving is never contingent
  on autocomplete completing or returning a suggestion.
- When the trimmed query contains 2–200 Unicode code points, debounce
  autocomplete by 300 ms and call
  `client.management.locations.autocomplete` with the current UI language
  normalized to `en`, `he`, or `ru` and `limit: 5`. Shorter or longer text
  remains in the ordinary free-text path but does not trigger autocomplete;
  ClassKit remains authoritative for mutation validation. Do not add a country
  restriction or browser geolocation: Noya can host classes outside Israel,
  and neither behavior is required.
- Ignore stale results when the query, language, form instance, or selected
  value has changed before a response arrives. Invalidate the active request
  identity when input becomes ineligible, a suggestion is selected, the locale
  changes, the form closes, or a different template seeds the field; an older
  response may never reopen or replace newer UI state.
- While the latest request is pending, show a localized loading state without
  blocking input or submit.
- For an available response:
  - render all returned suggestions with their stable label and formatted
    address where those differ;
  - selecting a suggestion replaces the visible text with its label and stores
    the complete returned snapshot;
  - an empty result renders a localized no-suggestions state and leaves the
    current text saveable.
- For `"temporarily_unavailable"` or any thrown autocomplete error, including
  validation, authentication, or authorization failure, render a localized
  advisory-unavailable state and keep the current text saveable. Do not present
  thrown errors as provider degradation, expose raw error messages, or display
  provider credentials, response bodies, or provider-specific recovery
  controls.
- Editing the text after selecting or preloading a structured snapshot
  deliberately converts the draft to free text by clearing the draft snapshot.
  A manager can reselect a suggestion to restore a structured pair.
- Clearing the input marks the location pair for explicit clearing on update.
  Leaving a preloaded value untouched marks the pair unchanged.
- A selected snapshot summary includes the provider attributions so the
  manager can see the attribution that will travel with the stored snapshot.

### Class And Template Forms

- Edit forms prepopulate both stored display text and stored snapshot.
- Draft initialization uses stored display text when present and otherwise the
  snapshot label, so a valid snapshot is never presented as an empty input.
- Create forms begin without a location pair. A manually typed value saves as
  free text with an explicit `null` snapshot. A selected suggestion saves its
  label and complete snapshot. An untouched empty field creates no structured
  snapshot and no product-owned fallback data.
- Selecting a class template copies both `default_location` and
  `default_location_snapshot` into the class draft and marks the pair dirty. If
  the manager leaves the pair untouched, Noya sends both values together so
  the manual class retains the coherent pair. This explicit materialization is
  required by the pinned v0.1.21 facade: class create normalizes an omitted
  `location` input to wire-level `null`, so Noya cannot express backend omitted-
  pair inheritance through this public method. If the manager edits the text,
  the copied snapshot is cleared and the result is sent as free text. Selecting
  a structured replacement sends the replacement pair.
- Preserve the form's existing “No template” behavior: detaching a previously
  selected template keeps the values already filled into the form. For the
  location pair specifically, the already-dirty copied text and snapshot remain
  materialized so a standalone class does not lose the displayed location on
  save. Selecting a different template replaces the whole pair and keeps it
  dirty for create serialization.
- On edit, an untouched pair is omitted from the update input. A cleared pair
  sends display text `null` and snapshot `null`. A free-text replacement sends
  trimmed text and snapshot `null`. A structured replacement sends the
  selected label and snapshot.
- Other class/template fields and their current create/edit semantics remain
  unchanged.

### Stable Display, Navigation, And Attribution

- Add one shared presentation component for a stored location pair with two
  explicit variants:
  - compact presentation renders the accepted stored display text, falling back
    to the snapshot label only when text is absent, and is used in dense list
    and calendar cards;
  - detailed presentation renders the same accepted text, Google Maps and Waze
    navigation actions generated only by ClassKit's pure helpers, and every
    snapshot attribution in original order.
- Navigation helpers receive both the stored snapshot and display-text
  fallback. Free-text locations therefore still receive URL-encoded navigation
  links, while structured locations use stable coordinates.
- Attribution text is rendered as ordinary React text. An attribution becomes
  a link only when parsing it as an absolute URL succeeds and its protocol is
  exactly `https:`. Null, malformed, relative, HTTP, or otherwise unsafe URLs
  remain non-interactive text. Safe links open in a new tab with
  `noopener noreferrer`.
- Any card that renders detailed navigation, including the shared class card or
  template card, keeps the location presentation outside its selection button
  so links are sibling interactions rather than nested controls. Compact
  text-only presentation may remain inside the selection button. Selecting the
  record, navigating, and manager actions remain distinct keyboard and touch
  targets.
- Customer class cards/details receive `ClassSummary.locationSnapshot`;
  manager class cards/details receive `ManagedClass.location_snapshot`;
  template cards/details receive `default_location_snapshot`.
- Customer and manager list cards, desktop calendar cards, and selected detail
  surfaces all show the accepted display value. Selected customer, manager
  class, and template details use the detailed variant so navigation and every
  attribution are available on both sides of the product. Compact cards keep
  actions visually concise, but cannot discard the snapshot from their view
  model.
- Navigation actions are localized anchors with destination-specific accessible
  names. They open in a new tab with `noopener noreferrer`, matching safe
  attribution-link behavior. A helper returning `null` suppresses only its own
  action.
- The marketing contact address and hard-coded readonly marketing schedule are
  outside this data-backed workflow and remain unchanged.

## Technical Design And Boundaries

Create a focused `src/features/locations/` domain for cross-surface location
behavior:

- a manager entry component owns query, debounce, request lifecycle, stale
  response suppression, snapshot selection, and free-text fallback;
- small pure draft helpers own location-pair initialization and mutation
  serialization so class and template forms do not independently reimplement
  omission/null/snapshot rules; and
- a shared display component owns stable text, navigation helpers, attribution
  safety, and responsive presentation.

The entry component receives the existing ClassKit client, the explicit
`locations.autocomplete` capability result, and a controlled location draft
from its form. It does not call `useProductContext` itself. This keeps client
and capability ownership at the established class/template management surfaces
while making the component reusable across both forms.

The stored pair is represented explicitly:

```ts
type LocationDraft = {
  text: string;
  snapshot: LocationSnapshot | null;
  dirty: boolean;
};
```

`dirty` is form-session state, not persisted state. Initialization from an
existing class/template sets `dirty: false`; manager text edits, suggestion
selection, and clear actions set it true. Class template selection replaces the
whole draft with the template's pair and marks it dirty for the new class,
because the pinned create facade cannot preserve text omission and the pair
must be sent together.

Serialization applies this closed matrix:

| Form operation | Draft state | Text property | Snapshot property |
| --- | --- | --- | --- |
| Edit | untouched | omitted | omitted |
| Create with selected template | copied template pair | template display text | complete template snapshot |
| Create or edit | selected structured suggestion/pair | exact `snapshot.label` without independent trimming | complete snapshot |
| Create or edit | non-empty free text | trimmed text | `null` |
| Edit | explicit clear | `null` | `null` |
| Create | untouched empty | omitted where the public input permits; no snapshot | omitted |

The SDK currently normalizes an omitted create text value to backend `null`.
Noya still avoids inventing a value or snapshot; the meaningful
omission-versus-null preservation is required on update, where ClassKit retains
pair semantics.

ClassKit remains authoritative for normalization, persistence, authorization,
provider access, degraded availability, template schedule-generation
inheritance, and returned records. Schedule generation copies the pair only
into newly generated lessons; conflict-do-nothing generation does not refresh
existing lessons. Noya owns only transient form and request state, manual class
create serialization through the pinned facade, rendering, safe link decisions,
copy, and responsive interaction.

No local catalogue, geocoder, provider SDK, provider credential, direct fetch,
Supabase call, raw Edge Function call, route, global state, persistence,
migration, or production dependency is introduced.

## Data And State

The form-local location state contains only the text, complete ClassKit
snapshot or null, dirty flag, and autocomplete UI state:

- current trimmed query and its Unicode code-point eligibility;
- idle/loading/available/empty/advisory-unavailable state;
- latest suggestions;
- monotonically increasing request identity or equivalent stale-response
  guard; and
- dropdown/open-selection state.

Suggestions are ephemeral and never cached globally. Snapshot objects are
stored and returned without pruning, rebuilding, or translating provider
fields or attributions.

Changing locale reruns autocomplete for an eligible current free-text query and
invalidates an older-language response. It does not rewrite an already selected
or persisted snapshot label.

## Failure And Recovery Behavior

- Short or empty queries return the field to idle and clear suggestion UI.
- Slow responses leave typing and saving available; stale completion cannot
  replace newer results or a selection.
- `"temporarily_unavailable"` and thrown requests both become localized
  advisory-unavailable UI, but Noya does not label an authorization,
  authentication, transport, or validation error as provider degradation. The
  distinction never changes whether Noya may save free text.
- An empty successful response shows the localized empty state and keeps free
  text available.
- Form mutation failures preserve the location draft through the existing form
  error behavior.
- A malformed attribution URL degrades to text; it never removes the
  attribution.
- A navigation helper returning `null` suppresses only that navigation action.
  Display text and attributions remain.
- An installed SDK that does not match the pinned v0.1.21 types is an
  implementation blocker; Noya must not add a compatibility adapter or direct
  API fallback.

## Permissions, Security, And Privacy

- Existing class/template capability boundaries continue to control the
  enclosing forms and mutations. Autocomplete is independently guarded by
  ClassKit's product-scoped `locations.autocomplete` permission: built-in
  managers have it, while custom roles require an explicit grant. The enclosing
  manager surface reads the exact permission from ClassKit capabilities and
  passes the result to the entry component; Noya does not infer it from form
  access or role names. When absent, the component skips autocomplete and keeps
  free text available. A rejected request still degrades safely in case
  capability state changes between the check and the call.
- Only the ClassKit client may contact the provider-backed autocomplete
  boundary. Noya never receives or stores provider credentials.
- Do not log typed queries, suggestions, snapshots, coordinates, provider
  references, attributions, or raw errors.
- React text rendering supplies escaping. URL protocol validation occurs before
  any attribution anchor is created.
- Navigation URLs come exclusively from the pinned ClassKit pure helpers.

## Testing And Acceptance Evidence

Because the repository has no automated test runner, verification combines
compile/static evidence with an existing-server smoke check when available:

- install from `bun.lock` only when dependencies are absent and confirm the
  pinned SDK types compile;
- `npm run lint`;
- `npm run build`, justified by new SDK types, shared form state, and
  cross-surface view-model changes;
- focused source inspection for the mutation matrix, full snapshot pass-through,
  ClassKit-only autocomplete/navigation calls, safe attribution URL policy,
  and absence of direct provider/Supabase/Edge Function calls;
- localization key parity inspection across English, Russian, and Hebrew; and
- if an approved localhost server is already running, exercise the states that
  the available account and backend can produce:
  structured selection, free-text retention, explicit clear, untouched edit,
  class template inheritance, newly generated lesson display, no suggestions,
  Google Maps and Waze links, manager/customer list/calendar/detail display,
  all three locales, RTL, and narrow and wide layouts.

Provider unavailability, thrown/forbidden requests, out-of-order responses, and
null/malformed/unsafe attribution URLs are not deterministic live-backend
fixtures. Verify their state transitions and URL policy with focused source
inspection, and exercise them interactively only when browser request
interception or suitable fixture data is available. Do not claim live evidence
for a state that the approved environment could not produce.

Do not start a development server without explicit approval. If no server is
already running, report the browser-only interaction and layout gap.

## Implementation Constraints And Seams

- Preserve the existing class/template form ownership and mutation hooks.
- Extend `ClassViewItem` with the snapshot rather than creating separate
  manager/customer card models.
- Prefer the existing `Button`, card, overlay, typography, and logical Tailwind
  utilities.
- Implement the entry as an accessible editable combobox: the input exposes
  `aria-autocomplete="list"`, `aria-expanded`, `aria-controls`, and the active
  option; suggestions use listbox/option semantics; Arrow keys move the active
  option, Enter selects it, Escape closes the popup without clearing text, and
  typing preserves ordinary text-editing behavior. Loading, empty, and
  advisory-unavailable messages use a polite live status region, and every
  interactive state has visible focus.
- Keep attribution and navigation styling subordinate to the stored location
  text and touch-friendly on mobile.
- Do not add a test framework, autocomplete library, map SDK, URL sanitizer, or
  other production dependency for this slice.
- Do not modify schedule create/update payloads. Schedule generation inherits
  the authoritative template pair inside ClassKit.

## Assumptions And Provenance

| Statement | Provenance |
| --- | --- |
| Required structured/free-text/degraded/display/navigation/attribution behavior | Symphony assignment contract |
| Existing class/template forms, shared class view model, manager/customer surfaces, localization, and verification scripts | Current repository code |
| Mobile-first, branded, responsive, RTL-safe behavior | `DESIGN_GUIDE.md` and repository instructions |
| Exact snapshot types, field casing, availability vocabulary, update presence semantics, and navigation helpers | Pinned ClassKit v0.1.21 source and README |
| Two-to-200-code-point query bounds, limit range, and independent autocomplete permission | ClassKit location API contract |
| Debounce timing, `limit: 5`, language-only provider context, and shared domain components | Lead design inference chosen to make the accepted workflow responsive without narrowing global locations or adding browser location access |
| No automated UI test dependency | Current `package.json` and surgical scope |

## Open Questions

None. The assignment fixes the product behavior, and the current repository
plus pinned SDK resolve the data, security, and integration boundaries. The
interaction thresholds are reversible presentation details bounded above and
do not change persistence or public contracts.

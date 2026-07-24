# Chunk 01: Shared Location Domain

**Plan Set:** `../plan.md`
**Approved Source:** `../spec.md`
**Status:** Ready for Review
**Depends on:** None
**Enables:** Chunk 02

## Goal

Establish one compile-safe shared location domain containing the pure
display-text/snapshot draft contract, the accessible advisory ClassKit
autocomplete field, and safe compact/detailed stored-location presentation,
ready for existing forms and surfaces to integrate without duplicating
semantics.

## Source Artifacts And Constraints

- `.symphony/assignment.md`: structured/free-text/clear/absent semantics,
  permanent free-text fallback, ClassKit autocomplete/navigation, attribution
  safety, and ownership boundaries.
- `../spec.md`: Manager Location Entry; Stable Display, Navigation, And
  Attribution; Technical Design; Data And State; Failure; Security.
- `../agenda.md`: exact request bounds, stale-response invalidation, mutation
  matrix, editable-combobox behavior, and HTTPS-only attribution decision.
- `../spec-audit.md`: pure pair boundary, accessible async interaction, safe
  presentation, and SDK verification.
- Exact ClassKit v0.1.21 types, autocomplete method, capability vocabulary, and
  pure navigation helpers.
- No existing application consumers are modified in this chunk.
- No production dependency, persistence, route, provider SDK, direct network
  call, or local server-contract adapter.

## Relationships

- Provides `LocationDraft` helpers, `LocationAutocompleteField`, and
  `LocationDisplay` to Chunk 02.
- Has no runtime exposure until Chunk 02 connects existing ClassKit client,
  capabilities, forms, records, and translation keys.
- Does not own any existing repository file, preventing overlap with Chunk 02.

## File Responsibility Map

**Create:**

- `src/features/locations/location-draft.ts` — `LocationDraft`, stored-pair
  initialization/transitions, and class/template mutation property helpers.
- `src/features/locations/location-autocomplete-field.tsx` — controlled
  accessible combobox, debounced ClassKit autocomplete, stale-response
  suppression, suggestion selection, selected attribution summary, and
  non-blocking advisory states.
- `src/features/locations/location-display.tsx` — compact/detailed stored-pair
  rendering, display fallback, ClassKit navigation helpers, ordered
  attribution, and absolute-HTTPS link classification.

**Modify:**

- None.

**Test:**

- No automated test file: the repository has no test runner. Verify with
  focused source inspection and the repository compile gate because these new
  files are included by TypeScript even before they have consumers.

## Behavioral And Contract Changes

The pure draft boundary is:

```ts
type LocationDraft = {
  text: string;
  snapshot: LocationSnapshot | null;
  dirty: boolean;
};
```

It must produce this matrix without consumer-local conditional duplication:

| Context | Draft state | Emitted pair |
| --- | --- | --- |
| update | untouched | neither property |
| create/update | selected structured | exact untrimmed `snapshot.label` plus full snapshot |
| create/update | typed free text | trimmed text plus snapshot `null` |
| update | cleared | text `null` plus snapshot `null` |
| create | untouched empty | no invented snapshot or fallback; omit optional properties |
| class create from template | copied default pair | both template values materialized together |

Initialization prefers stored display text and otherwise uses the snapshot
label. An ordinary text edit clears the draft snapshot and marks the pair
dirty. Structured selection retains the complete snapshot object without
rebuilding provider or attribution fields.

`LocationAutocompleteField`:

- receives a ClassKit client, exact capability boolean, locale, controlled
  draft, and `onChange`;
- calls only `client.management.locations.autocomplete`;
- requires a trimmed query of 2–200 Unicode code points;
- uses `limit: 5`, 300 ms debounce, and normalized `en`/`he`/`ru`;
- supplies no country restriction, proximity, geolocation, or provider option;
- invalidates old results on query ineligibility/change, locale change,
  unmount, structured selection, and externally seeded draft replacement;
- never disables parent submit for loading, unavailable, empty, denied, or
  failed autocomplete; and
- implements listbox/option, Arrow key, Enter, Escape, active descendant,
  expanded/control, polite live status, and visible focus behavior.

`LocationDisplay` accepts stored text, nullable snapshot, and
`"compact" | "detailed"`:

- both variants use stored text then snapshot-label fallback;
- detailed mode calls only `getGoogleMapsNavigationLink` and
  `getWazeNavigationLink` with text fallback;
- a null helper result suppresses only that action;
- every attribution remains visible in source order as React text;
- an attribution is linked only when absolute URL parsing succeeds and the
  protocol is exactly `https:`; and
- safe external anchors use `target="_blank"` and
  `rel="noopener noreferrer"`.

## Implementation Tasks

- [ ] Resolve dependencies from `bun.lock` when absent and confirm the installed
      v0.1.21 exports required by all three files.
      Decision rule: continue only when `LocationSnapshot`,
      `management.locations.autocomplete`, mutation snapshot inputs, and both
      navigation helpers match the audited contract; otherwise stop without an
      adapter.
- [ ] Implement `location-draft.ts` as the single pure pair boundary. Use
      property presence rather than truthiness, preserve explicit null, retain
      complete snapshots, and expose narrowly named helpers that allow class
      and template consumers to map their different public input property
      names in Chunk 02.
- [ ] Implement `location-autocomplete-field.tsx` as a controlled component
      with the exact request/debounce/locale contract, form-scoped stale
      identity, external-seed invalidation, advisory states, structured
      selection, selected attribution summary, and complete combobox semantics.
      Reference translation keys without defining them in this chunk; Chunk 02
      owns `src/i18n.ts`.
- [ ] Implement `location-display.tsx` with compact and detailed variants.
      Centralize display fallback, helper-only navigation, safe attribution URL
      classification, ordered text rendering, and accessible external action
      labels. Ensure the component itself does not require being placed inside
      a selection control.
- [ ] Inspect the new domain for duplicated pair logic, raw network/provider
      access, local navigation URL construction, raw error leakage, skipped
      attributions, or unsafe URL truthiness. Repair before the compile gate.

## Verification

- `if rg -n '[[:blank:]]+$' src/features/locations/location-draft.ts src/features/locations/location-autocomplete-field.tsx src/features/locations/location-display.tsx; then exit 1; fi`
  — expect exit 0 with no trailing-whitespace matches in the new untracked
  files.
- `rg -n "locations\\.autocomplete|getGoogleMapsNavigationLink|getWazeNavigationLink|locationSnapshot|defaultLocationSnapshot|protocol.*https|noopener noreferrer" src/features/locations`
  — inspect exact SDK boundaries, pair properties, and link safety.
- `rg -n "fetch\\(|supabase|functions\\.invoke|geoapify|GEOAPIFY|navigator\\.geolocation" src/features/locations`
  — expect no direct provider, credential, browser-geolocation, Supabase, or
  raw Edge Function path.
- `npm run build`
  — justified at this foundational SDK/TypeScript boundary; expect `tsc -b`
  and Vite exit 0 before existing consumers integrate.
- Source-inspect the mutation matrix and invalidation transitions after input
  ineligibility, query/locale change, external reseed, selection, and unmount.
  Record as source evidence, not live-backend evidence.

## Acceptance Criteria Covered

- Shared semantics can distinguish structured, free-text, cleared, and absent
  locations.
- Autocomplete remains advisory and ClassKit-only.
- Async failure/latency/empty/denied states cannot block a parent form.
- Navigation comes only from ClassKit helpers.
- Every attribution is escaped text and only safe HTTPS URLs are linkable.
- The combobox and detailed actions have explicit accessible interaction
  contracts.

## Risks, Rollback, And Isolation

- Highest risk: pair presence collapse. Centralize every state transition and
  emitted property decision in the pure helper.
- Async risk: external template/form reseeding may retain a matching query
  string while changing snapshot meaning. Invalidate via a request identity
  tied to controlled-draft transitions, not query comparison alone.
- Security risk: URL truthiness is insufficient. Require successful absolute
  parsing plus exact HTTPS.
- Rollback deletes three unconsumed files. No existing behavior, server data,
  or website persistence changes in this chunk.

## Non-Goals

- Existing form, capability, record mapping, card, detail, or localization
  integration.
- Schedule payload changes or regeneration of existing lessons.
- A catalogue, provider SDK, browser location, cache, or global state.
- A new test framework.

## Consistency Check

- All paths are new under the approved `src/features/locations/` domain.
- SDK mutation inputs are camelCase while stored pair consumption remains a
  Chunk 02 concern.
- Chunk 02 exclusively owns every existing file and all translation keys.
- The compile gate is warranted by new SDK types and React controlled-state
  contracts, not routine UI polish.
- No verification command starts a server.

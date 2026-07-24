# Structured Lesson Locations Design Agenda

## Status

- Spec: `docs/design/2026-07-24-structured-lesson-locations/spec.md`
- State: Ready for Review
- Approval: Not Approved

## Documented Decisions

- The Symphony assignment is the accepted product contract. It requires one
  coherent structured-location enhancement across class/template entry,
  inheritance, manager/customer display, navigation, attribution,
  localization, and degraded provider behavior.
- Noya uses only the pinned `@class-kit/react@v0.1.21` location API, public
  types, stored fields, mutation inputs, and pure navigation helpers.
- Autocomplete remains advisory. Provider unavailability, errors, latency, and
  empty results never block free-text saving.
- A location is a coherent display-text/snapshot pair. Manager reads use
  `location_snapshot`, customer reads use `locationSnapshot`, and template
  reads use `default_location_snapshot`.
- Edit mutations omit an untouched pair, send explicit null for both fields
  when cleared, send text plus null snapshot for free text, and send the
  exact unmodified snapshot label plus complete snapshot for structured
  selection.
- Class template selection copies and sends both default values together. The
  pinned v0.1.21 create facade converts omitted text to wire-level null, so
  backend omitted-pair inheritance cannot be expressed through the public
  method. Editing the pair materializes an override; detaching “No template”
  preserves the form's already-filled pair. ClassKit owns schedule-generated
  inheritance for newly generated lessons, without refreshing existing
  generated conflicts.
- Typing after a selected or preloaded snapshot deliberately converts the
  draft to free text. Reselecting a suggestion restores a structured pair.
- Autocomplete runs only for 2–200 trimmed Unicode code points, uses `limit: 5`,
  is debounced by 300 ms, invalidates stale responses across
  query/locale/form/template changes, uses the normalized current UI language,
  and applies neither a country restriction nor browser geolocation.
- `locations.autocomplete` is a separate ClassKit permission. Noya does not
  infer it from class/template form access: the manager surface consumes the
  exact ClassKit capability and skips advisory calls when absent. Any rejected
  request still keeps free-text saving available without being mislabeled as
  provider degradation.
- One shared location presentation has compact text-only and detailed
  text/navigation/attribution variants. Manager and customer list and calendar
  surfaces retain the snapshot and show stable text; selected class/template
  details expose safe navigation and every attribution.
- Attribution is always escaped text. Only a successfully parsed absolute
  `https:` attribution URL becomes an external link; every other URL value
  remains text.
- Shared class-card location presentation moves outside the selection button so
  navigation links do not create nested interactive controls; the same rule
  applies to any template card that renders detailed navigation.
- The autocomplete control follows the editable-combobox keyboard and ARIA
  contract, with a live status region for loading, empty, and advisory-
  unavailable states.
- Static marketing/contact locations are outside the ClassKit-backed lesson
  workflow.
- No catalogue, direct provider call, credentials, local geocoding,
  persistence, route, global state, migration, or new dependency is added.

## Questions

No material open questions. The task contract fixes the user-visible outcome,
and exact v0.1.21 source inspection resolves snapshot presence, response field
casing, degraded availability, and navigation behavior.

## Pressure-Test Result

- Status: Complete
- Categories checked: input lifecycle and stale responses; update
  omission/null semantics; template and schedule inheritance; state ownership;
  permissions, privacy, and URL safety; provider failure and recovery;
  customer/manager presentation; accessibility; localization; responsive RTL
  behavior; verification evidence.
- Material corrections:
  - retained complete snapshot pairs instead of treating autocomplete as a text
    chooser;
  - added a dirty boundary so untouched updates do not accidentally clear or
    replace snapshots;
  - retained complete manual template-pair materialization because the pinned
    create facade collapses omitted text to wire-level null, while leaving
    schedule inheritance atomic inside ClassKit;
  - preserved the existing “No template” behavior by materializing the
    already-filled pair when a template is detached;
  - bounded autocomplete to the exact 2–200-code-point contract and treated its
    independent permission failures as recoverable advisory unavailability;
  - made compact/list/calendar versus detailed navigation/attribution coverage
    explicit on both manager and customer surfaces;
  - separated class selection from navigation links to avoid nested
    interactions;
  - required every attribution to remain visible even when its URL is absent or
    unsafe.
- New questions added: None.
- Remaining non-blocking risks:
  - Dependencies are not installed in this worktree, so implementation must
    still compile against the lockfile-pinned SDK. The Bun cache and local SDK
    checkout both resolve `v0.1.21` to
    `c0d1fc7a0f7eff77a17b3fbccc3944d19c74711d`.
  - The repository has no automated UI test layer; interactive keyboard,
    provider-degradation, RTL, and layout evidence depends on an already-running
    approved server.
  - Provider unavailability, authorization failure, stale-response ordering,
    and unsafe attribution values may not be reproducible against a live
    backend; source inspection is required unless browser interception or
    suitable fixture data is available.
  - ClassKit's create facade normalizes an omitted text value to backend null;
    exact omission remains observable and required for update semantics, while
    untouched empty create still avoids inventing a snapshot or fallback.

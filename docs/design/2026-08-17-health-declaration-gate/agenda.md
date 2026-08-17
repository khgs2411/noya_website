# Health Declaration Gate Recovery Design Agenda

## Status

- Spec: `docs/design/2026-08-17-health-declaration-gate/spec.md`
- State: Approved
- Approval: Approved by the accepted Symphony assignment on 2026-08-17

## Documented Decisions

- The Symphony refined request is the accepted product contract for this
  non-interactive planning mission.
- The declaration stays mandatory for signed-in active users who have not
  accepted the current version after the application has loaded enough state to
  know that acceptance is required. Existing initial-load failures remain
  non-blocking by deliberate repository policy.
- The gate closes only after ClassKit document acceptance and profile metadata
  version persistence both succeed.
- ClassKit remains the source of truth for the document, acceptance, profile,
  and active-user state.
- The current route stays mounted. Success closes the overlay without a reload
  or route change.
- The dialog must work on narrow screens and short viewports without adding a
  close, Escape, backdrop, or skip path.
- The declaration body is a named, focusable scroll region. Keyboard users can
  read long declarations even when the Markdown contains no links.
- The focus loop handles initial focus on the dialog container. Tab enters at
  the first enabled control, Shift+Tab enters at the last enabled control, and
  neither direction reaches the route behind the modal.
- Modal scrolling stays inside the fixed overlay and does not replace another
  overlay's body-scroll ownership.
- A synchronous in-flight guard prevents concurrent acceptance flows.
- A submit can close the gate and write the profile marker only while it still
  belongs to the same authenticated active user that started it.
- Submit failures keep the gate open and use website-owned localized feedback
  with retry.
- The public health declaration route and class-registration agreement flow are
  outside the implementation change.
- No new unit tests, test framework, global state, storage fallback, dependency,
  Supabase call, or raw Edge Function call is in scope.

## Questions

No material design questions remain. Repository evidence and the accepted
refined request resolve the behavior, ownership, retry, accessibility, and
verification boundaries.

## Pressure-Test Result

- Status: Complete
- Categories checked: responsive lifecycle, concurrent submit, two-step partial
  persistence, retry, version ownership, localization, focus containment,
  keyboard scrolling, session change during submit, mandatory access, route
  continuity, and ClassKit boundaries.
- New questions added: None.
- Remaining non-blocking risks: Browser smoke evidence depends on an existing
  approved server and an authenticated active-user fixture with a current
  unaccepted declaration. The preserved non-blocking initial-load policy means
  this feature does not provide fail-closed enforcement while ClassKit document
  or profile state is unavailable.

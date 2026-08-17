# Health Declaration Gate Recovery Design

Status: Approved — eligible for implementation planning.
Design directory: `docs/design/2026-08-17-health-declaration-gate/`

## Goal And Success Criteria

Restore the health declaration gate for signed-in active users whose loaded
profile does not contain the current declaration version. After the application
knows that acceptance is required, the user must read the current declaration,
confirm agreement, persist both ClassKit records, and continue to the requested
route without a page refresh.

The change succeeds when:

- the agreement and primary action remain reachable on narrow mobile screens
  and short viewports;
- the checkbox enables one clear accept-and-continue action;
- one submit records the ClassKit document acceptance and writes the accepted
  document version to profile metadata;
- the gate closes immediately only after both writes succeed;
- the same published version does not show again on a later visit;
- a newly published version shows the gate again;
- any submit failure keeps the gate open, shows localized retry guidance, and
  allows a new attempt; and
- repeated clicks cannot start concurrent acceptance flows.

## Current Repository Context

- `src/App.tsx` mounts `HealthDeclarationGate` once inside the shared app shell,
  so it overlays the route that the user requested.
- `src/features/documents/health-declaration-gate.tsx` loads the current
  localized ClassKit document and profile in parallel. It blocks only a
  signed-in active user when the current document version is not present in
  profile metadata.
- The gate calls `client.productDocuments.accept(...)` and then
  `client.profile.update(...)`. It closes by changing local gate status to
  `accepted` after both calls return without an error.
- `src/features/documents/health-declaration-acceptance.ts` owns the profile
  metadata key and exact version comparison.
- The SDK commit pinned by `package.json` and `bun.lock` is
  `a158bc588f5ec3421788475ccab2c5c2cb47ce9f`. Its public client returns the
  accepted document version from `productDocuments.accept(...)` and forwards a
  metadata-only update through `profile.update(...)`. The ClassKit profile API
  contract defines that metadata update as a shallow merge.
- The current dialog centers an unconstrained card in a fixed overlay. Only the
  declaration Markdown has a `42vh` scroll limit. The title, document frame,
  agreement, error, and action can together exceed a short viewport and put the
  action outside the visible area.
- The current `submitting` React state disables controls after a render, but the
  submit function has no synchronous in-flight guard.
- The dialog receives initial programmatic focus. Its current Tab handler wraps
  only from the first or last interactive control. `Shift+Tab` from the dialog
  container can therefore move focus behind the modal.
- The declaration Markdown is inside a scroll container that is not itself
  keyboard-focusable. A keyboard user cannot reliably scroll a long declaration
  when the Markdown has no interactive content.
- Submit errors currently render SDK messages directly. These messages are not
  guaranteed to match the active locale or to be useful to a website user.

## User-Facing Behavior

### Gate Entry

- Keep the current applicability rule: the gate renders only for a signed-in
  active product user when a loaded current declaration version is not recorded
  in profile metadata.
- Keep loading, unavailable, and initial-load error states non-blocking. This
  correction must not undo the existing repository decision that the global
  modal appears only when declaration acceptance is known to be required.
- Treat this as an explicit availability trade-off. The application does not
  claim fail-closed enforcement while document or profile state is unknown.
  Once `required` is known, persistence failure cannot become a bypass.
- Do not change the requested route when the gate opens or closes.

### Reading And Accepting

- Keep the declaration title, version, Markdown, agreement checkbox, and one
  accept-and-continue action in the blocking dialog.
- Give the dialog a viewport-bounded layout. The declaration content is the
  flexible scroll region. The agreement, submit error, and primary action stay
  reachable below it. If the viewport is too short for all fixed dialog
  content, the overlay or dialog must allow vertical scrolling instead of
  clipping controls.
- Make the declaration scroll region keyboard-focusable, give it an accessible
  name from the displayed document title, and retain a visible focus indicator.
  Arrow, Page Up, Page Down, Home, and End scrolling must work without requiring
  an anchor inside the Markdown.
- Keep scrolling inside the fixed modal overlay. Prevent scroll chaining to the
  route behind it without taking ownership of another overlay's body-scroll
  lock.
- Preserve the current branded card, touch-sized primary action, responsive
  spacing, dark theme support, and RTL-safe logical spacing.
- The primary action remains disabled until agreement is checked and while a
  submit is in progress.

### Successful Submit

1. Acquire a synchronous in-flight guard before the first asynchronous call.
2. Accept the health declaration through ClassKit with the current locale,
   English fallback locale, and context `health_declaration_gate`.
3. Read the authoritative accepted document version from the acceptance result.
4. Before the profile write, confirm that the mounted attempt still belongs to
   the same authenticated active user. If identity or applicability changed,
   stop the stale attempt and let the current context load determine gate state.
5. Patch profile metadata at `health_declaration_accepted_version` with that
   version through ClassKit.
6. Change local gate status to `accepted` only after both calls succeed and the
   attempt still belongs to the current authenticated active user. This
   removes the overlay immediately and leaves the current route mounted.
7. Release the in-flight guard when the attempt ends.

The profile metadata write is a version marker for gate presentation. ClassKit
document acceptance remains the authoritative acceptance record.

### Failed Submit And Retry

- If document acceptance returns an error or throws, do not update the profile
  marker and do not close the gate.
- If the profile metadata update fails after acceptance succeeds, do not close
  the gate. Show the same localized retry guidance. A later retry may repeat the
  ClassKit acceptance before it retries the metadata patch; the gate must not
  claim success from partial persistence.
- Use a website-owned localized submit-error message in English, Hebrew, and
  Russian. Do not expose raw SDK or backend messages as the primary visible
  feedback.
- Clear the visible submit error when the user changes the agreement state in
  either direction or starts a new attempt.
- Always release the synchronous in-flight guard and busy UI state after an
  unsuccessful attempt.

## Technical Design And Boundaries

Keep the correction in the existing health declaration feature:

- update `src/features/documents/health-declaration-gate.tsx` for the bounded
  responsive layout, synchronous submit guard, and localized submit failure;
- update `src/i18n.ts` with one submit-failure key in all three locale trees;
- retain `src/features/documents/health-declaration-acceptance.ts` as the only
  metadata-key and version-comparison owner; and
- retain `src/features/documents/product-document-acceptance.ts` as the shared
  ClassKit acceptance call boundary.

Do not add a new dialog dependency, global state, route state, local-storage
fallback, direct Supabase call, or raw ClassKit Edge Function call.

## Data And State

- ClassKit owns the published document, acceptance snapshot, profile, product
  user status, and authorization.
- React state owns only loaded presentation data, agreement state, gate status,
  busy state, and localized error visibility for the mounted component.
- Component refs own the synchronous in-flight lock and current attempt
  identity. They are not durable data. The lock must be cleared in the submit
  attempt's `finally` path.
- Store the version returned by the successful acceptance response. Do not
  derive it from the previously loaded document after the acceptance call.
- Keep exact version equality. A new version must fail the equality check and
  reopen the gate on a later load.

## Accessibility

- Keep `role="dialog"`, `aria-modal="true"`, the labelled heading, initial
  dialog focus, Escape suppression, and focus restoration.
- Correct the focus loop for the initial container-focus state: Tab moves to the
  first enabled control and Shift+Tab moves to the last enabled control. If no
  enabled control exists, focus stays on the dialog. Focus must not move behind
  the modal.
- The scroll correction must not create a general close, backdrop-close,
  Escape, or skip path.
- Mark submit feedback with alert semantics so assistive technology announces
  it when it appears.
- Keep the native checkbox and button keyboard-operable.
- Do not let scroll containment remove the visible focus ring or make focused
  controls unreachable.

## Permissions, Security, And Privacy

- Run acceptance only for the authenticated active product-user state already
  established by `useProductContext()`.
- Send no health content or user data to website-owned storage.
- Keep all reads and writes on the public `@class-kit/react` client.
- After `required` is known, preserve the mandatory gate. Submit failure must
  not become a bypass.

## Testing And Acceptance Evidence

Use the repository's focused verification policy:

- inspect the final diff and the exact ClassKit call order;
- run focused ESLint for the changed TypeScript/TSX files when the installed
  dependency state supports it;
- run TypeScript validation because the change affects asynchronous state and
  SDK result handling;
- check that the new translation key exists in English, Hebrew, and Russian;
- confirm through source inspection that a synchronous guard is acquired before
  the first await and released for every exit;
- confirm through source inspection that a stale submit cannot close the gate
  or write profile metadata after the authenticated active user changes;
- check for an already-running approved localhost server before any browser
  smoke check; do not start a server without approval;
- when a server and suitable active-user fixture exist, smoke-check narrow
  mobile and short desktop viewports, success without navigation or refresh,
  reload persistence, submit failure, retry, keyboard focus containment, and
  rapid repeated activation;
- in the keyboard smoke check, start from programmatic dialog focus, verify both
  Tab directions stay contained, and scroll a declaration with no links by
  keyboard; and
- report browser-only cases as unverified when the required authenticated
  fixture or failure simulation is unavailable.

No new unit tests or test framework are in scope.

## Implementation Constraints And Seams

- Preserve the public `/health-declaration` route and the separate class
  registration acceptance flow.
- Do not change document loading, gate eligibility, document type, acceptance
  context, or metadata key.
- Do not make initial load failures globally blocking in this correction.
- Do not add a close control or a generic dialog abstraction for this one gate.
- Keep every visible new string in `src/i18n.ts` for all three supported
  locales.

## Assumptions And Provenance

- The Symphony refined request is the accepted product contract for this
  non-interactive planning mission.
- Current repository code and history establish the existing non-blocking load
  policy and the two-step persistence boundary.
- The pinned local ClassKit SDK source establishes the acceptance response and
  profile update contracts.
- The ClassKit API source confirms that the profile endpoint shallow-merges the
  metadata patch, so this write does not replace unrelated profile metadata.

## Open Questions

None. The refined request, current repository, and pinned ClassKit contracts
resolve the material behavior and ownership choices.

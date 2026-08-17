# Chunk 01: Recover The Health Declaration Gate

**Plan Set:** `../plan.md`
**Approved Source:** `../spec.md`
**Status:** Ready for Review
**Depends on:** None
**Enables:** Complete assignment

## Goal

Deliver one reviewable health declaration gate that keeps its agreement and
action reachable, records both ClassKit writes once per active attempt, rejects
stale completion, closes immediately on full success, and gives keyboard and
localized retry access on failure.

## Source Artifacts And Constraints

- `../spec.md`: approved applicability, persistence, layout, focus, retry,
  localization, and scope contract.
- `../agenda.md`: approved availability trade-off and state ownership.
- `../spec-audit.md`: exact ready verdict plus focus-selector and stale-context
  recommendations.
- `src/features/documents/health-declaration-gate.tsx`: sole production
  component owner for this correction.
- `src/features/documents/health-declaration-acceptance.ts`: unchanged marker
  key and exact-version contract.
- `src/features/documents/product-document-acceptance.ts`: unchanged document
  acceptance call boundary.
- `src/App.tsx`: unchanged global mount and route-continuity evidence.
- `src/i18n.ts`: English, Russian, and Hebrew translation owner.
- `DESIGN_GUIDE.md`: mobile-first, branded, token-based, RTL-safe UI rules.
- Repository instructions: do not add tests, run the full build by default, or
  start a development server. Use focused static and conditional browser
  checks.

## Relationships

- Depends on no implementation chunk.
- Completes the assignment without changing a public route, registration flow,
  shared acceptance helper, metadata helper, or ClassKit contract.
- The component remains a consumer of `useProductContext()` and shared
  document helpers. It does not become an identity or persistence source.

## File Responsibility Map

**Create:**

- None.

**Modify:**

- `src/features/documents/health-declaration-gate.tsx` — add the synchronous
  attempt boundary, latest-context checks, viewport-bounded modal layout,
  keyboard-readable declaration region, complete focus containment, alert
  semantics, and localized submit failure use.
- `src/i18n.ts` — add one matching health-gate submit-failure message in the
  English, Russian, and Hebrew locale trees.

**Test:**

- None. The repository has no relevant interaction-test harness, and the
  assignment does not authorize new unit tests. Use focused static validation
  and conditional browser smoke checks.

## Behavioral And Contract Changes

### Submit attempt invariant

The component owns a synchronous in-flight ref and a latest-context ref. A
submit attempt snapshots the starting client, user ID, and active-user state.
After prerequisites pass, it acquires the in-flight lock before the first
await. A second call while locked returns without invoking ClassKit.

The ordered contract is:

```text
accept current health declaration
  -> verify the same client and authenticated active user still apply
  -> patch profile marker with acceptance.document_version
  -> verify the same client and authenticated active user still apply
  -> set local gate status to accepted
  -> release lock and presentation busy state
```

An SDK error, thrown error, profile error, or stale-context check keeps the gate
from reporting success. A current-user persistence error shows the localized
submit-failure message. A stale attempt ends quietly and lets the current
context effect determine gate state.

### Dialog and focus invariant

- The card is bounded by the dynamic viewport and uses a `min-h-0` flex or grid
  chain so the declaration frame can shrink.
- The title/header, agreement, alert, and action remain fixed-content regions.
  The declaration body is the primary internal scroll region.
- The modal overlay or card retains vertical overflow as a fallback when the
  fixed regions cannot fit. Overscroll stays within the modal boundary.
- The declaration body has `tabIndex={0}`, an accessible name derived from the
  displayed declaration title, and a visible focus state.
- The custom focus selector includes the reading region and all enabled native
  controls. When focus starts on the dialog container, Tab moves to the first
  enabled descendant and Shift+Tab moves to the last. Boundary Tab presses wrap
  in both directions. With no enabled descendant, focus stays on the dialog.
- Escape still does nothing, and unmount restores the prior focus when it still
  exists.

### Failure and copy invariant

- Submit errors never render raw SDK or backend messages as the primary user
  feedback.
- One website-owned retry message exists at the same
  `documents.healthGate` key in English, Russian, and Hebrew.
- The error uses alert semantics, clears when agreement changes in either
  direction, and clears when a new submit starts.
- Initial load behavior and its existing copy remain unchanged.

## Implementation Tasks

- [ ] In `health-declaration-gate.tsx`, add the synchronous in-flight ref,
      latest-context ref, and starting-attempt snapshot. Acquire the lock after
      synchronous prerequisites and before the first await. Preserve the
      acceptance helper, locale, fallback, context, returned version, metadata
      helper, and two-write order.
- [ ] In the same submit boundary, compare the starting snapshot with current
      client, user ID, and active-user applicability after acceptance and again
      after profile update. Do not write the profile marker after the first
      mismatch. Do not close or show a persistence error from a stale attempt.
      Release the lock and busy state through the attempt's `finally` path.
- [ ] Replace submit-path raw errors with the localized submit-failure key.
      Keep the gate open for acceptance errors, profile errors, and thrown
      failures. Clear the error for either checkbox transition and at retry
      start. Add alert semantics without changing initial-load behavior.
- [ ] Reshape the modal Tailwind layout as a complete dynamic-viewport height
      chain. Make the declaration the shrinking focusable scroll region, keep
      agreement/error/action reachable, add modal overscroll containment, and
      preserve theme tokens, responsive spacing, touch target size, and RTL
      logical spacing.
- [ ] Complete the focus loop in `health-declaration-gate.tsx`. Include the new
      reading tab stop, handle initial dialog-container focus for Tab and
      Shift+Tab, retain boundary wrapping and the no-enabled-control case, and
      keep Escape suppression and focus restoration.
- [ ] Add the matching submit-failure key to the English, Russian, and Hebrew
      `documents.healthGate` objects in `src/i18n.ts`. Use concise retry copy
      that does not claim success or expose a backend detail.
- [ ] Review the complete diff against `../spec.md`. Confirm that no route,
      registration, loading-policy, document type, context, metadata key,
      shared helper, storage, dependency, or backend boundary changed.

## Verification

Run each command separately so its exit status remains trustworthy.

- `bun install --frozen-lockfile` — run only if dependencies are absent. Expect
  exit 0, the pinned ClassKit package, and no `package.json` or `bun.lock`
  change.
- `bunx eslint src/features/documents/health-declaration-gate.tsx src/i18n.ts`
  — expect exit 0.
- `bunx tsc --noEmit -p tsconfig.app.json` — expect exit 0 and no type, unused,
  DOM, ref, or SDK-result errors.
- `rg -n "submitError:" src/i18n.ts` — expect exactly three matching locale
  entries.
- `rg -n "productDocuments|profile\.update|acceptProductDocument|healthDeclarationAcceptanceVersionKey" src/features/documents/health-declaration-gate.tsx`
  — inspect one ordered acceptance path and one marker update that still use the
  shared boundaries.
- `rg -n "tabIndex|aria-label|aria-labelledby|role=\"alert\"|keydown|overscroll|min-h-0|overflow-y-auto" src/features/documents/health-declaration-gate.tsx`
  — inspect the named reading region, alert, two-direction focus loop, and
  complete scroll chain.
- `git diff --check` — expect exit 0.
- `git diff -- src/features/documents/health-declaration-gate.tsx src/i18n.ts`
  — inspect that every source change traces to this chunk and no visible string
  or raw backend error escaped localization.
- `curl --silent --show-error --fail --max-time 2 http://127.0.0.1:5173/`
  — probe only for an existing approved server. A connection failure means no
  browser check is available; do not start a server.

If the probe succeeds and an active authenticated user with an unaccepted
current declaration is available, use that existing server to verify:

- agreement and action access at a narrow mobile viewport and a short desktop
  viewport;
- keyboard scrolling of link-free declaration Markdown plus Tab and Shift+Tab
  containment from initial dialog focus;
- one rapid repeated activation produces one in-flight acceptance flow;
- full persistence closes the gate without navigation or refresh, and reload
  keeps the same version closed;
- a newly published version reopens the gate when a suitable fixture exists;
- acceptance and profile-update failures keep the gate open, announce localized
  feedback, and permit retry when failure injection exists; and
- session or active-user change during submit cannot write the later marker or
  close from stale state when that transition can be reproduced.

Report each browser-only case that the available fixture cannot reproduce. Do
not claim it from source inspection alone.

## Acceptance Criteria Covered

- The complete declaration flow remains usable on narrow and short viewports.
- Agreement enables a clear accept-and-continue action.
- A successful same-user attempt records acceptance and the returned version,
  then closes the gate without refresh or route loss.
- Exact-version persistence suppresses the same declaration and allows a later
  version to reopen the gate.
- Either persistence failure stays visibly failed and retryable.
- Repeated activation cannot create concurrent acceptance requests.
- Keyboard users can read long declaration content and cannot move focus behind
  the blocking modal.
- The gate has no close, Escape, backdrop, skip, local persistence, or direct
  backend bypass.
- All new visible feedback exists in English, Hebrew, and Russian.

## Risks, Rollback, And Isolation

- Stale context: compare both identity and active applicability at the two
  audited boundaries. Do not rely on closed-over React values as latest state.
- Focus regression: treat the reading region as part of the same ordered
  focusable set as the native controls.
- Layout regression: verify the complete parent-to-scroll-region `min-h-0`
  chain. A local `max-height` change alone is insufficient.
- Partial persistence: keep the gate failed after marker failure. Do not add
  website recovery storage or claim a transaction that ClassKit does not
  provide.
- Isolation: only the gate and locale registry change. Reverting those bounded
  edits restores current behavior without data migration or dependency change.

## Non-Goals

- Initial document/profile load policy, public document route, registration
  acceptance, ClassKit document or profile APIs, acceptance helper, metadata
  helper, new tests, new dialog primitives, global state, storage, dependencies,
  deployment, or backend changes.

## Consistency Check

- Both target source paths exist and no new production file is required.
- `useProductContext()`, `acceptProductDocument(...)`,
  `healthDeclarationAcceptanceVersionKey`, and the current SDK result field
  names exist at the pinned dependency contract.
- The exact document type, fallback locale, context, metadata key, and version
  comparison remain unchanged.
- The focus selector includes the new tab stop, and the viewport layout has an
  unbroken shrink/overflow chain.
- Every new visible string uses one matching key in all three locale trees.
- Commands match `package.json`, `tsconfig.app.json`, and current repository
  paths. The full build and unit tests are intentionally omitted.

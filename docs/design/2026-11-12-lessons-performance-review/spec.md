# Lessons page review fixes

From a review on 2026-11-12. The root cause of "the tab resets after I switch
away" is in the ClassKit SDK. That fix is specified in ClassKit
`docs/design/2026-11-12-stable-auth-refresh/spec.md` and isn't part of this
change. The fixes below are the noya-side half, and they're worth doing
whatever the SDK does.

Profiled signed-out on the live `/lessons` page: 60 range changes and 15
lesson opens over 27 seconds gave zero long tasks, heap 5 → 7 MB and DOM
412 → 415 nodes. The signed-out flow is healthy. The freeze report is
signed-in and not yet reproduced.

## Fixes

1. **Terms state resets on every token refresh.** In
   `src/features/lessons/lessons-page.tsx`, the registration-agreement effect
   (around line 584) depends on `session`, so any new session object clears
   the user's "I agree" checkbox and refetches the terms and the profile. Key
   it on `session?.user.id` instead.
2. **Dropped.** The manager unmounting during a background reload is fixed at
   its source by the SDK change: `loading` then flips only when the signed-in
   identity changes, and unmounting is correct at that point. The noya-side
   workaround would also need `manager-page.tsx` to tell retained live access
   apart from stored access, which is complexity the SDK fix makes
   unnecessary.
3. **Toast timeouts are never pruned.** `toastTimeoutsRef` in
   `lessons-page.tsx` collects every timeout id for the page's lifetime.
   Remove each id when its timeout fires or its toast is dismissed.
4. **The lesson detail dialog is missing basic modal behavior.** It has no
   Escape-to-close, no body scroll lock and no focus containment, unlike the
   app's other dialogs (for example `customer-detail-panel.tsx`). Reuse
   whatever pattern those dialogs use; don't add a new modal library.
5. **Formatters are rebuilt on every render.** `class-calendar-view.tsx`
   builds three `Intl.DateTimeFormat` objects per render, and
   `renderClassFacts` builds one per call. Memoize them per `i18n.language`.

## Non-goals

- Request debouncing for range navigation. Each click already discards stale
  responses, and profiling showed one request per action with no pile-up.
- Restructuring `lessons-page.tsx`. It's large (1,356 lines), but a rewrite
  isn't needed for these fixes.

## Done when

- `npm run build` passes, and `node --test tests/*.test.mjs` passes.
- Fix 1 and fix 3 are covered by node tests if their logic can be pulled out
  into a pure helper. Otherwise the build is the proof.

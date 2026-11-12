# Pick up new deploys and fix the document fallback locale

Client report from 2026-11-12: a signed-in customer's lesson dialog still shows
the health-declaration requirement that was removed on 2026-11-03 (`64e7927`).
The deployed bundle no longer contains that UI, so the phone is running a build
from before Nov 3. A second problem turned up while tracing it: the published
documents exist only in Hebrew.

## 1. Detect a new deploy and reload

### Why the old build survives

GitHub Pages serves `index.html` with `max-age=600`, and
`public/service-worker.js` loads pages from the network first. Neither keeps a
9-day-old build alive. The installed home-screen app (`manifest.webmanifest`)
stays resident and never reloads, and nothing in the app checks for a newer
version.

### Rule

- The build writes `version.json` (`{ "version": "<package.json version>" }`)
  to `dist/` and compiles the same version into the bundle, for example with a
  small inline Vite plugin plus `define` in `vite.config.ts`. CI already bumps
  `package.json` before `bun run build`, so the two always match in a deploy.
- When the page becomes visible again (`visibilitychange` to `visible`, and
  `pageshow` with `persisted`), the app fetches
  `${import.meta.env.BASE_URL}version.json` with `cache: "no-store"`. If the
  version differs from the compiled one, it calls `location.reload()`.
- Reload at most once per remote version: remember the version it reloaded for
  in `sessionStorage` and skip a second reload for that version. This stops a
  reload loop if a cache still returns the old `index.html`. Wrap storage
  access in try/catch.
- A failed fetch, bad JSON or a missing field does nothing.
- Skip the check in dev (`import.meta.env.DEV`) and in the frontend preview
  (`isFrontendPreview`), the same way `register-service-worker.ts` does.
- Put the decision in a pure exported function, for example
  `shouldReload({ current, remote, alreadyReloadedFor })`, under `src/lib/`.
  Keep the browser wiring in a small module called from `src/main.tsx` next to
  `registerServiceWorker()`.
- The check runs only when the page returns to view, never on a timer.
  Returning to the app is the moment a stale build matters, and the user is
  not in the middle of typing then.

### Service worker

- Page loads use `fetch(event.request, { cache: "no-store" })` so the HTTP
  cache can't return an old `index.html`. The offline fallback to the cached
  shell stays.
- Bump `CACHE_NAME` to `noya-flow-shell-v2` so installed clients pick up the
  changed worker and drop the old shell cache.

## 2. Fall back to Hebrew for product documents

Production has the `terms` and `health_declaration` documents in `he` only. The
app asks for the UI language with fallback `en`, so a customer using English or
Russian gets `not_found` and sees "registration unavailable until the terms are
published". That blocks registration.

- Set `productDocumentFallbackLocale` in
  `src/features/documents/product-document-types.ts` to `"he"`, the studio's
  primary language and the i18n `fallbackLng`. All four call sites already read
  the constant, so nothing else changes.

## Done when

- Node tests cover `shouldReload`: same version, no reload; different version,
  reload; different version already reloaded for, no reload; missing remote
  version, no reload.
- `npm run build` produces `dist/version.json` whose version matches
  `package.json`, and the built bundle contains that version string.
- `productDocumentFallbackLocale` is `"he"`.
- `npm run build` and `node --test tests/*.test.mjs` pass.

# GitHub Pages frontend preview

Preview: **https://khgs2411.github.io/noya_website_staging/**

Source: `khgs2411/noya_website`, branch **`staging`**. Pushes to that branch run
`.github/workflows/deploy-staging-preview.yml`; manual runs are allowed only on
`staging`. The workflow builds the pinned Bun lockfile with the existing
read-only `CLASS_KIT_SDK_DEPLOY_KEY`, then publishes compiled files to **`gh-pages`
in `khgs2411/noya_website_staging`** with `STAGING_PAGES_DEPLOY_KEY`. The latter key
must have write access only to the artifact repository. Hosting Pages uses that
repository's `gh-pages` root. Neither the source token nor this workflow can
publish via the production Pages destination. The source token is contents-read
only; there is no source push or version bump.

## Selected frontend-preview exception — 2026-10-05

Liad selected **GitHub Pages frontend preview using existing ClassKit data**.
This is a scoped exception to the historical isolated staging design in
`design/2026-07-24-persistent-staging-deployment/`: it is not the Cloudflare
migration or a separate backend environment. Historical provisioning chunks
remain suspended and must not be executed to set up this preview.

**Writes from this preview affect the same existing/live ClassKit data as the
main site.** Existing browser authentication and site preferences are shared on
`khgs2411.github.io`; separate repository paths do not isolate browser storage.
The localized notice is visible on every preview page. There is no mock fallback
and no new product-key override. The preview URL must resolve to the existing
product through ClassKit's supported site-URL discovery. Product/site-URL and
auth configuration belong to the operator, not this publishing workflow.

The staging build sets `VITE_FRONTEND_PREVIEW=true` and uses the Vite CLI
`--base=/noya_website_staging/`. With that flag absent, the notice is omitted and
production service-worker behavior is unchanged. The preview does not register
a service worker and its published artifact omits `service-worker.js`, preventing
this preview from activating the existing origin-wide cache-deletion behavior.
Do not unregister production workers or clear origin-wide caches from preview
code. This does not remove the shared-session/data behavior selected above.

## Publishing and receipts

- Hosting activation is operator-owned. Confirm the artifact repository,
  `STAGING_PAGES_DEPLOY_KEY` source-repository secret, `gh-pages` Pages source,
  and existing-product routing before the first workflow-enabling source push.
- Source SHA is checked out exactly. The workflow reuses hosting Git history,
  replaces compiled output, adds `.nojekyll`, adds noindex metadata, and copies
  the target-base `index.html` to `404.html` for client-side route fallback.
  Pages may still return HTTP 404 on initial deep-link requests; this is not a
  server rewrite.
- `/noya_website_staging/deployment.json` records the source SHA, branch, run URL,
  run attempt, preview URL and live-data mode. Compiled output is also retained
  as a source-SHA-named Actions artifact. Hosting commits retain ordinary history;
  pushes are never forced. A concurrent hosting change rejects the push rather
  than overwriting it.
- A successful hosting push is not proof the Pages build has completed. Verify
  the served receipt matches the requested source SHA before handing over the
  review link. Check assets, public/deep routes, notice/localization and no worker
  registration; verify ClassKit discovery without mutating business data.
- Promotion to `master`/production is a separate action. Do not dispatch
  `.github/workflows/deploy-pages.yml` at `staging` or alter its production Pages
  environment. It remains the existing production workflow.

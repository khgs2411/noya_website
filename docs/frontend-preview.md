# Noya optional frontend-preview pipeline

Preview: **https://khgs2411.github.io/noya_website_staging/**

Source: `khgs2411/noya_website`, branch **`staging`**. This is an acknowledged,
**on-demand** project pipeline, not the default verification path. Ordinary
pushes do not deploy. `.github/workflows/deploy-staging-preview.yml` accepts only
explicit `workflow_dispatch` requests guarded to `staging`; there is no polling,
schedule, push trigger or Trello watcher. The workflow builds the pinned Bun
lockfile with the existing
read-only `CLASS_KIT_SDK_DEPLOY_KEY`, then publishes compiled files to **`gh-pages`
in `khgs2411/noya_website_staging`** with `STAGING_PAGES_DEPLOY_KEY`. The latter key
must have write access only to the artifact repository. Hosting Pages uses that
repository's `gh-pages` root. Neither the source token nor this workflow can
publish via the production Pages destination. The source token is contents-read
only; there is no source push or version bump.

## Normal checks versus an optional Staging Check

Routine, unlabeled work uses proportional local inspection and focused checks
under [AGENTS.md](../AGENTS.md), and reports what was checked/skipped. Do not
build or publish a preview for every test. Existing dev-server restrictions and
Git authorization requirements still apply.

The Symphony board's optional request label is:

- Name: **Staging Check**; color: **blue**.
- Label ID: **`6ac3b57bf50d86d22eb97766`**.
- Board ID: **`6a0190d7e33ef2ab6264f922`**.

This label means a deliberate optional preview-check request. It is **not** a
workflow type, execution status, human approval, acceptance or permission to
push. The label is configured but was not applied to any card during setup.
An explicitly invoked Dante/operator handles it; automatic tracker intake,
scheduled polling and task-lead/worker operation are deferred.

Before dispatch, Dante/operator must:

1. Reread the actual selected card, its relevant comments and current routing.
   Confirm the Noya route and the exact label ID/board above, not just a matching
   label name. A direct Liad request can qualify without a label/card.
2. Resolve conflicting scope, **No Push**, or missing publication authority.
   A label cannot override those restrictions. Preserve unrelated work; do not
   switch an analysis/planning task into implementation to create a preview.
3. Verify the exact reviewed source, its allowed staging commit/push, and the
   current remote `staging` SHA. Retain task/card identity, qualification reason,
   reviewed SHA and prior evidence before requesting a check.
4. Reuse completed check evidence for the same card/request and source SHA.
   A label left attached does not cause repeated builds. A newer source needs a
   fresh qualified check and review appropriate to its changes. Failed/unresolved
   runs require inspecting the existing run before any authorized retry; a repeat
   publication of the same SHA needs an explicit reason, not label persistence.

Do not automatically remove the label, move a card, or claim acceptance because
a build succeeded. No card/label mutations are part of this pipeline setup.

## Explicit exact-SHA dispatch

Workflow ID: **`375496501`**, registered/active in `khgs2411/noya_website`.
Required inputs: `request_reason` (nonblank) and `expected_sha` (exact reviewed
40-hex staging SHA). Optional `trello_card_url` is traceability data; leave it
blank for a direct/setup request rather than inventing a card request.
The first workflow step checks reason/SHA against `github.sha` before dependency
installation or build. Inputs enter scripts through environment values and JSON,
never by embedding them in shell source.

Use JSON on stdin, with values supplied as data. For example, after qualification
and review, fill in the exact reviewed SHA and actual reason/card below:

```python
import json
import subprocess

inputs = {
    "request_reason": "Describe the qualified optional check request",
    "expected_sha": "REPLACE_WITH_EXACT_REVIEWED_40_HEX_STAGING_SHA",
    "trello_card_url": "",  # actual selected card URL, or blank for direct request
}
subprocess.run(
    ["gh", "workflow", "run", "375496501", "--repo", "khgs2411/noya_website",
     "--ref", "staging", "--json"],
    input=json.dumps(inputs), text=True, check=True,
)
```

Equivalent exact CLI, with the same inputs stored in a JSON file:

```sh
gh workflow run 375496501 --repo khgs2411/noya_website --ref staging --json < qualified-preview-request.json
```

The workflow has already run and is registered, so API/CLI dispatch can target
`staging` even if GitHub's UI has no **Run workflow** button because the file is
absent from default `master`. See [GitHub's upstream workflow_dispatch reference](https://github.com/github/docs/blob/main/content/actions/reference/workflows-and-actions/events-that-trigger-workflows.md#workflow_dispatch).
Do not merge into `master`, change the default branch, or introduce tag/sentinel
triggers to create UI controls. If actual dispatch fails, retain its exact API/CLI
error and coordinate; do not silently broaden authority or triggers.

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

## Publishing, freshness and evidence

- Hosting activation is operator-owned. Confirm the artifact repository,
  `STAGING_PAGES_DEPLOY_KEY` source-repository secret, `gh-pages` Pages source,
  and existing-product routing before dispatch. Existing setup is verified;
  do not reprovision it or change credentials as routine check work.
- Source SHA is checked out exactly. The workflow reuses hosting Git history,
  replaces compiled output, adds `.nojekyll`, adds noindex metadata, and copies
  the target-base `index.html` to `404.html` for client-side route fallback.
  Pages may still return HTTP 404 on initial deep-link requests; this is not a
  server rewrite.
- `/noya_website_staging/deployment.json` records the source SHA, branch, run URL,
  run attempt, request reason, optional Trello card URL, preview URL and live-data
  mode. Compiled output is also retained
  as a source-SHA-named Actions artifact. Hosting commits retain ordinary history;
  pushes are never forced. A concurrent hosting change rejects the push rather
  than overwriting it.
- Immediately before publication, the workflow compares its source SHA with
  current remote `staging`; superseded runs skip publication. Such a run may
  conclude green without updating the hosted receipt: record **superseded/skipped**,
  not deployed. Do not automatically dispatch newer source; requalify the request
  and exact reviewed SHA first. The check is not an atomic source/publication lock.
- A successful hosting push is not proof the Pages build has completed. Verify
  the served receipt matches the requested source SHA before handing over the
  review link, and compare its reason/card/run identity with this request. Retain
  source CI URL/conclusion, hosting commit/Pages outcome, served receipt and HTTP
  checks, and any performed browser evidence with limits. Check assets,
  public/deep routes, notice/localization and no worker registration; verify
  ClassKit discovery without business-data mutations. Do not imply unperformed
  OAuth or write-action verification.
- This is **one shared preview link**, not a per-ticket immutable site. Another
  requested check may replace it with a different ticket's revision. Read
  `deployment.json` before review; a retained historical PASS can be reused for
  its exact SHA but does not prove the current shared link still shows that SHA.
- Promotion to `master`/production is a separate action. Do not dispatch
  `.github/workflows/deploy-pages.yml` at `staging` or alter its production Pages
  environment. It remains the existing production workflow.

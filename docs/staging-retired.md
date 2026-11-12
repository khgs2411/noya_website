# Staging preview: retired (temporary note)

**Status since 2026-11-12:** `https://khgs2411.github.io/noya_website_staging/`
no longer serves the app. The staging link was shared with clients by mistake,
so every staging URL now redirects to production,
`https://khgs2411.github.io/noya_website/`.

Delete this file once staging is back or the custom domain replaces it.

## What changed

- The `gh-pages` branch of `khgs2411/noya_website_staging` (the hosting repo)
  now holds only `.nojekyll`, `index.html` and `404.html`. Both HTML files are
  the same redirect page: a meta refresh plus `location.replace()` to production.
  Deep links like `/noya_website_staging/auth` hit `404.html`, so they redirect
  too.
- Redirect commit: `b107035`. The last real preview was `4eb93d0`, built from
  source `4f0d1d61c41d93ebc9381f0d6016e599902d01de`.
- Nothing else changed. The source repo, its `staging` branch, the workflow
  `.github/workflows/deploy-staging-preview.yml`, the secrets
  (`CLASS_KIT_SDK_DEPLOY_KEY`, `STAGING_PAGES_DEPLOY_KEY`) and the Pages setting
  (`gh-pages` / root) are still in place.

**Watch out:** running the staging workflow publishes the app over the
redirect. While the redirect should stay, don't dispatch it.

## Bringing staging back

### Option A: same URL (quickest)

This brings the preview back at `noya_website_staging/` and drops the redirect.
Only do it once the client links point somewhere else (for example the custom
domain), or the redirect disappears for anyone still using the old link.

1. Push the source you want to preview to `staging` in `khgs2411/noya_website`.
2. Dispatch the workflow exactly as described in
   [frontend-preview.md](frontend-preview.md#explicit-exact-sha-dispatch), with
   `expected_sha` set to the current `staging` SHA:

   ```sh
   gh workflow run 375496501 --repo khgs2411/noya_website --ref staging --json < request.json
   ```

   The workflow replaces the redirect files with the compiled app. It doesn't
   force-push, so the redirect commit stays in history.
3. Check that `https://khgs2411.github.io/noya_website_staging/deployment.json`
   shows the new SHA.

### Option B: new URL (keeps the redirect for old links)

Use this if the old staging link must keep redirecting to production.

1. Create a new hosting repo, for example `khgs2411/noya_website_preview`, with a
   `gh-pages` branch, and enable Pages on it (`gh-pages`, root).
2. Add a deploy key with write access on the new repo. Put its private key in
   the source repo's `STAGING_PAGES_DEPLOY_KEY` secret, replacing the old one,
   and remove the old deploy key from `noya_website_staging`.
3. In `deploy-staging-preview.yml`, change the hosting repo and the
   `--base=/noya_website_staging/` path to the new repo name. Update the URL in
   `frontend-preview.md`.
4. Make sure ClassKit's site-URL discovery and auth redirect settings allow the
   new preview URL. The operator owns this, not the workflow.
5. Dispatch as in option A and check the new `deployment.json`.

### Option C: preview on the custom domain

When the production domain is set up, a subdomain such as `staging.<domain>`
pointing at the hosting repo (`CNAME` file plus DNS) is a cleaner preview URL.
The build then needs `--base=/` instead of the repo path, and steps 4–5 of
option B apply.

## Reminder

The preview uses the same live ClassKit data and the same browser sign-in as
production. That's true for every option above.

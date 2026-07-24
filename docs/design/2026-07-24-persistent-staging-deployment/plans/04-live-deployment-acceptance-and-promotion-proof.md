# Chunk 04: Live Deployment, Acceptance, And Promotion Proof

**Plan Set:** `../plan.md`
**Canonical Source:** `../spec.md`, `../agenda.md`, and `../plan.md`; no
Symphony mission file is required
**Status:** Ready for Review
**Depends on:** Chunks 01, 02, and 03
**Enables:** Client review and a later approved production-promotion decision

## Goal

Deploy the reviewed staging revision, prove the stable Cloudflare/ClassKit
experience end to end, prove production remained unchanged, and validate the
repeatable merge-only promotion topology without promoting to production.

## Source Artifacts And Constraints

- Complete Chunk 01 external evidence.
- Complete Chunk 02 static/build evidence.
- Complete Chunk 03 staging-service and read-after-write evidence.
- `../spec.md`: full Testing And Acceptance Evidence and promotion contract.
- The live deployment may update only Cloudflare staging and staging-product
  data.
- This chunk does not merge or push to `master`.
- Test credentials and service tokens remain redacted.

## Relationships

- Consumes all prior contracts.
- Consumes Chunk 02's deterministic artifact-evidence tool and Chunk 03's
  exact service configuration.
- Produces the terminal implementation evidence for client review in the
  durable destination defined by the root plan.
- No repository file ownership; discovered documentation corrections return
  to Chunk 02 ownership before deployment is accepted.

## File Responsibility Map

**Create:** None.

**Modify:** None.

**Test:** Live GitHub, Cloudflare, website, ClassKit, and isolated local Git
history checks.

## Behavioral And Contract Changes

- The protected `staging` branch becomes the sole automatic source for the
  canonical staging URL.
- Staging auth and business behavior resolve to
  `noya_website_staging`.
- The minimum business fixture is created only after that live product context
  exists and is verified through supported SDK surfaces.
- The real production branch, version, deployment, URL, and artifact remain
  unchanged.
- The promotion contract is proven in a disposable local clone, not exercised
  against production.

## Implementation Tasks

- [ ] Require the implementation card's unexpired authorization for the exact
      reviewed SHA, `staging` ref creation, and resulting live deployment.
      Card/plan approval alone is insufficient.
- [ ] Confirm no production workflow is active, then open a bounded quiet
      window lasting from the before snapshot through the after snapshot.
      Snapshot the latest 100 production run IDs and statuses without a status
      filter; fail preflight if any is non-terminal. Repeat the same query
      after the window and require the run-ID set to be unchanged. If a new run
      ID appears, resolve its actor/ref/SHA through `gh run view` or the Actions
      API, mark the window inconclusive even if it already completed, and
      repeat later.
- [ ] Re-record the production baseline immediately before the staging run:
      master SHA, package version at that SHA, latest `github-pages`
      deployment ID/timestamp, production URL status, and artifact
      fingerprint over root, `manifest.webmanifest`, and
      `service-worker.js`.
- [ ] Have an authorized maintainer create `staging` once at the exact reviewed
      Chunk 02 commit after the master-only production environment and staging
      ruleset are effective. Record the source SHA before creation and confirm
      the created ref equals it. All later updates use reviewed pull requests.
- [ ] Observe the automatic staging workflow. Record workflow run ID, source
      SHA, local dist fingerprint, Cloudflare deployment ID, immutable
      deployment URL, canonical alias resolution, and final job result.
- [ ] Verify immutable and canonical Cloudflare URLs serve the same recorded
      artifact with `scripts/staging-artifact-evidence.mjs verify`. Require
      every local file's byte length and SHA-256 to match remotely and every
      route body to equal local `dist/index.html`. Stop if the canonical alias
      points elsewhere or the workflow deployed a non-staging SHA.
- [ ] At the live canonical origin, authenticate the explicitly authorized
      ClassKit fixture-administrator principal and require product context
      `noya_website_staging` plus `templates.manage` and `schedules.manage`.
      Through `@class-kit/react` management methods, create the minimum
      staging-only template and schedule needed to yield one visible upcoming
      class. This administrator is distinct from the two acceptance identities.
- [ ] Authenticate the staging test manager and require
      `noya_website_staging`, `dashboard.can_enter`, and
      `class_signup_links.manage`. Create the review signup link for the
      recorded class/range with `management.signupLinks.create(...)` and
      preserve its returned slug in redacted evidence. Do not grant this test
      manager template/schedule mutation solely for fixture setup, add fixture
      code to the website, or call a raw Edge Function.
- [ ] Read the fixture with `management.templates.list()`,
      `management.schedules.list()`, and `management.classes.list()`. Require
      an active template, its schedule, and one visible upcoming class in the
      staging product. Resolve the recorded slug with
      `signupLinks.resolve(recordedSlug)` and require that exact staging class
      or range. Record object IDs only as stable hashes and exact counts; never
      infer link existence from a list operation.
- [ ] Run direct-load and refresh checks on root plus `/lessons`, `/auth`,
      `/profile`, `/manager`, `/terms`, and `/health-declaration`, including
      the trailing-slash form of all six named routes. Confirm shell, assets,
      chunks, and manifest stay on the staging origin.
- [ ] Verify service-worker script URL and scope are staging-root, the manifest
      `start_url`/`scope` work, and an install/standalone launch returns to
      staging. Confirm production storage/service-worker state is not visible
      on the distinct origin.
- [ ] With the non-manager fixture identity, verify password sign-in/sign-out,
      Google round trip to the exact staging root, profile access, visible
      class discovery, signup-link resolution within staging, and manager
      denial.
- [ ] With the manager fixture identity, verify Google or password auth,
      profile access, `dashboard.can_enter`, and signup-link generation backed
      by `class_signup_links.manage`. Confirm the generated URL remains on
      staging and resolves the fixture class/range.
- [ ] Capture product-context evidence identifying
      `noya_website_staging` without exposing tokens, raw permission lists to
      users, credentials, or customer data.
- [ ] Repeat the production baseline observations before closing the quiet
      window. Require exact equality for
      master SHA, package version, production deployment ID/timestamp, and
      artifact fingerprint, plus continued production URL availability.
- [ ] In a `mktemp -d` disposable local clone, model:
      1. create refs `model-master` and `model-staging` at the accepted
         baseline;
      2. add `cycle-one-staging.txt` on `model-staging`;
      3. merge `model-staging` into `model-master` with `--no-ff`;
      4. add `cycle-one-version.txt` on `model-master`;
      5. merge `model-master` back into `model-staging` with `--no-ff`;
      6. add `cycle-two-staging.txt` on `model-staging`; and
      7. compare `model-master...model-staging`.
      Verify prior production merge/version commits are ancestors of staging
      and the second promotion diff contains only
      `cycle-two-staging.txt`. Use a disposable clone with local test identity;
      do not push, fetch secrets, or modify the working repository.
- [ ] Have the execution lead assemble the final evidence report as one PR
      comment titled `Persistent staging implementation evidence`,
      separated into static, external configuration, Cloudflare, ClassKit/Auth,
      browser/PWA, production non-mutation, and local history simulation.
      Link the workflow run and link this comment from the implementation card.

## Verification

- `gh run list --workflow deploy-staging.yml --branch staging --limit 1`
  and `gh run view <run-id>`
  — expect success and the intended source SHA.
- `gh run list --workflow deploy-pages.yml --limit 100 --json databaseId,status,createdAt,updatedAt,headBranch,headSha,event`
  immediately before and after the window
  — save canonical JSON snapshots; preflight requires no `queued`,
  `in_progress`, `waiting`, `requested`, or `pending` status, and after-window
  verification requires exact equality of the sorted `databaseId` set.
- `gh run view <new-run-id> --json databaseId,status,createdAt,updatedAt,headBranch,headSha,event` plus
  `gh api repos/khgs2411/noya_website/actions/runs/<new-run-id> --jq '{actor:.actor.login,head_branch,head_sha,status,event}'`
  for every new ID
  — record provenance and mark the window inconclusive regardless of terminal
  status; `actor` is intentionally obtained from the Actions API rather than
  unsupported `gh run list` output.
- Cloudflare
  `GET /accounts/{account_id}/pages/projects/noya-website-staging/deployments/{deployment_id}`
  — require the recorded ID, project name, branch `staging`, source SHA,
  success status, immutable URL, and alias containing the canonical URL.
- `node scripts/staging-artifact-evidence.mjs verify dist https://noya-website-staging.pages.dev/`
  — expect exact equality for every artifact and index-shell equality for root,
  all six routes, and all trailing-slash variants, without cross-origin
  redirects.
- Browser inspection on the existing live staging URL
  — expect route/refresh, signup, install/scope, password, Google, profile,
  manager-denied, and manager-allowed behaviors described above.
- Authenticated ClassKit SDK evidence at the live staging origin
  — expect `management.templates.list()`, `management.schedules.list()`, and
  `management.classes.list()` to return the recorded fixture and
  `signupLinks.resolve(recordedSlug)` to resolve its staging class or range.
- `git merge-base --is-ancestor model-master model-staging`
  after the reverse synchronization in the disposable clone
  — expect exit 0.
- `git diff --name-status model-master...model-staging`
  after `cycle-two-staging.txt`
  — expect exactly `A	cycle-two-staging.txt`.
- Production before/after evidence comparison
  — expect exact equality and continued availability; record run provenance
  and retry an inconclusive window.

Every command that verifies a distinct fact must be run separately so its exit
status is trustworthy. No command starts a server.

## Acceptance Criteria Covered

- Stable, distinct, simultaneously reachable staging and production.
- Automatic staging source-to-deployment mapping.
- Complete route, deep-link, trailing-slash, asset, signup, PWA, auth,
  profile, and manager behavior.
- Separate staging product assignments and data.
- Production branch, artifact, deployment, and version non-mutation.
- Reproducible repeat-promotion history.

## Risks, Rollback, And Isolation

- On a failed staging deploy, leave the last successful Cloudflare deployment
  live and fix through a reviewed `staging` change. Retry only the recorded run
  SHA.
- Roll back behavior through a reviewed revert PR into `staging`.
- If OAuth fails, inspect both ClassKit redirect and Supabase Auth Redirect URL;
  never add a wildcard or website bypass.
- If any production observation changes, stop and preserve evidence. The only
  autonomous containment is cancellation of the currently authorized staging
  run. Do not disable environments/rulesets, delete resources, revoke
  credentials, or attempt a production repair without new target-specific
  authority.

## Non-Goals

- Actual production promotion.
- Production version bump rehearsal on real branches.
- Production product-user assignment or fixture copying.
- Preview URL support, load/performance testing, or CI redesign.

## Consistency Check

- No source files are owned by this chunk.
- The live route list matches all six predicates in
  `src/content/site-content.ts`.
- The ClassKit fixture and OAuth checks match Chunk 01.
- Production comparison uses exact recorded values, not a general “looks
  unchanged” assertion.
- Temporary history work is isolated and unpushed.

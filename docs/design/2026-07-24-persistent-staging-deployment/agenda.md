# Persistent Staging Deployment Design Agenda

## Status

- Spec: `docs/design/2026-07-24-persistent-staging-deployment/spec.md`
- State: Approved
- Approval: Original repository-grounding rework approved on 2026-07-27.
  Cloudflare production-and-staging consolidation explicitly approved by the
  user on 2026-07-27. Revised implementation planning remains pending.

## Architecture Amendment — 2026-07-27

The user replaced the original split-hosting decision with one Cloudflare
Pages control plane for both frontend environments. This is an approved design
decision and an implementation-plan invalidation event.

Resulting decisions:

- One Cloudflare Pages project owns production and staging.
- `master` is the production branch.
- `staging` is the only automatically deployed preview branch.
- Production uses its final custom domain; staging uses the stable branch
  alias and may use a proxied `staging.<production-domain>` custom domain.
- GitHub remains the source repository. ClassKit/Supabase remains the backend.
- The solution must remain on Cloudflare's Free plan and use static hosting
  only; no Pages Functions, Workers, R2, paid analytics, or usage-billed
  service is authorized.
- Cloudflare Git integration is preferred, but the existing private Git+SSH
  ClassKit SDK dependency must pass a disposable authenticated-build proof
  before DNS or production changes.
- If the Git integration proof fails, GitHub Actions plus Wrangler Direct
  Upload is the fallback only after the user separately accepts the
  account-scoped Pages Edit token risk.
- Both Cloudflare environments build at `/`; the existing
  `/noya_website/` behavior remains temporarily available only for the
  parallel GitHub Pages rollback surface.
- Cloudflare production must be accepted before DNS cutover. GitHub Pages is
  disabled only after a successful rollback window and explicit user
  acceptance.
- The original four-chunk implementation plan and its audits are historical
  evidence, not execution authority. They must be replaced and re-audited.

## Documented Decisions

- The 2026-07-27 architecture amendment above supersedes the original
  production-on-GitHub-Pages topology wherever the two conflict.
- This is a Plan Only assignment; implementation belongs to a future approved
  implementation card.
- GitHub Pages remains only as the migration rollback surface until the
  Cloudflare production cutover is explicitly accepted.
- Staging must have a distinct stable HTTPS URL, isolated deployment artifact,
  isolated ClassKit product data and permissions, reproducible promotion flow,
  and complete route/auth/signup/PWA verification.
- A staging subpath in the production Pages artifact is excluded by the
  canonical design because it cannot isolate deployment replacement.
- The website continues to use `@class-kit/react`; product identity, origin
  validation, auth policy, redirects, permissions, and data remain
  ClassKit-owned.
- Material choices below were resolved against the repository, pinned SDK, and
  primary hosting documentation, then challenged by the recorded design and
  review gates. This agenda and `spec.md` preserve those decisions without
  requiring mission-ledger context.
- Revalidation at resolved `master` baseline `c451452` preserves `/pricing`
  and all ten canonical manager tab paths, and adds the production
  `/noya_website/` base, `%BASE_URL%` HTML links, `getSitePath`, and
  `navigateTo` as protected seams.
- The current production workflow injects `VITE_SUPABASE_TARGET`, remote
  URL/key, and `VITE_AUTH_REDIRECT_URL`; pinned SDK commit `a158bc5` does not
  consume them on the website's current client path. Production remains
  unchanged, while staging does not copy those legacy inputs.
- Pinned SDK commit `a158bc5` does explicitly consume
  `VITE_CLASS_KIT_TARGET`: only exact value `local` selects local transport.
  Staging therefore sets exact value `remote` as an explicit invariant even
  though omission also defaults to remote.
- The staging product remains `invite_only`. `/auth?mode=signup` preserves the
  query-bearing URL but, after product policy loads, renders sign-in and does
  not expose open signup.

## Questions

### Question 1: Which hosting topology provides both artifact and browser-origin isolation?

- Status: Answered
- Why it matters: A distinct URL is insufficient if staging can overwrite the
  production artifact or shares production's authentication storage, manager
  cache, service-worker scope, and same-origin script authority.
- Scenario: A client opens staging while production is live, authenticates,
  and exercises manager behavior. The deployment and ClassKit product must be
  independently identifiable and recoverable.
- Options:
  - A. Combined GitHub Pages artifact under a staging subpath — keeps one host
    but replaces the sole production artifact and is explicitly excluded.
  - B. Separate repository under `khgs2411.github.io` — isolates artifacts and
    can route ClassKit by path, but retains the same browser origin. The
    hard-coded ClassKit auth key and manager cache remain shared, and either
    same-origin app can supply the other's pathful site URL.
  - C. Dedicated Cloudflare Pages Direct Upload project — isolates both
    artifact and browser origin while keeping builds in the current GitHub
    repository.
  - D. Separate GitHub identity solely for another Pages origin — isolates the
    origin but creates unnecessary account and ownership complexity.
- Recommendation: C. It is the simplest topology satisfying both deployment
  and ClassKit security boundaries.
- Answer: Use a dedicated Cloudflare Pages Direct Upload project named
  `noya-website-staging`.
- Resulting decision: The canonical staging URL is
  `https://noya-website-staging.pages.dev/`. Provision the Direct Upload
  project explicitly with production branch `staging`, then verify Cloudflare
  returned that exact production URL. Cloudflare may add random suffix
  characters when a hostname is unavailable; any suffixed or alternate
  hostname requires design review before upload or ClassKit configuration.
- Spec changes: Hosting Topology; ClassKit Staging Product And Authentication.

### Question 2: What branch and promotion flow owns staging?

- Status: Answered
- Why it matters: Staging must be reproducible without allowing its workflow to
  mutate or accidentally deploy production.
- Scenario: Several reviewed commits are deployed for client testing, then the
  accepted state is promoted without recreating changes manually.
- Options:
  - A. Long-lived `staging` branch, feature PRs into `staging`, then a reviewed
    PR from `staging` into `master` — preserves a clear review and deployment
    boundary.
  - B. Deploy every feature branch — provides previews rather than one stable
    client-review state.
  - C. Deploy `master` to both hosts — makes staging a mirror after production,
    not a pre-production gate.
- Recommendation: A. It maps the stable environment to one stable branch and
  promotes the reviewed commits through ordinary Git history.
- Answer: Use the long-lived `staging` branch and promote by pull request into
  `master`.
- Resulting decision: Only `staging` triggers staging; only `master` triggers
  production. Protect `staging` with required pull-request review and no force
  push, deletion, or deployment-workflow bypass. Before `staging` exists,
  restrict the existing `github-pages` environment to deployments from
  `master` only so the production workflow's manual dispatch cannot deploy the
  staging ref. Promotion and the subsequent `master` to `staging` sync use
  merge commits only; squash, rebase, reset, force-push, and cherry-pick
  realignment are excluded. The second cycle must prove prior production
  history is ancestral and absent from the next promotion diff.
- Spec changes: Source Branch And Promotion Flow.

### Question 3: Does staging share the production ClassKit product or use an isolated one?

- Status: Answered
- Why it matters: Client and manager testing can create or mutate customer,
  class, registration, document, role, and membership data.
- Scenario: A reviewer creates a class and tests manager permissions. No
  production customer or schedule may change.
- Options:
  - A. Share the production product — fastest setup but violates data and
    permission isolation.
  - B. Create a separate staging product on the existing ClassKit remote
    platform — isolates product-user assignments, product data, roles, auth
    policy, and permissions while retaining the supported SDK transport and
    shared platform Auth identities.
  - C. Create a separate ClassKit/Supabase platform backend — stronger platform
    isolation but outside the website task and unsupported by the current
    remote SDK configuration.
- Recommendation: B. It gives the required product boundary without changing
  ClassKit platform topology.
- Answer: Create a separate ClassKit staging product on the ClassKit remote
  platform.
- Resulting decision: The staging origin is allowed only on the staging product
  and test identities receive assignments only on staging. Supabase Auth
  identities remain platform-wide rather than product-owned. Provision
  `noya_website_staging`, display name `Noya's Website (Staging)`, ClassKit
  environment `production`, active, `invite_only`, with email/password and
  Google enabled. `production` is the ClassKit enum for stable remote HTTPS
  origins; `staging` remains the website, branch, GitHub environment, and
  Cloudflare deployment label.
  Create non-manager and manager staging assignments plus the minimum
  class/schedule/signup fixture in the spec; the manager assignment includes
  exact permission `class_signup_links.manage`.
- Spec changes: ClassKit Staging Product And Authentication.

### Question 4: What origin and OAuth URLs are registered?

- Status: Answered
- Why it matters: Remote product discovery and Google OAuth redirect validation
  use exact browser URLs; wildcard preview origins would weaken the product
  boundary.
- Scenario: Google auth leaves staging and must return to the same stable
  environment without becoming authorized for generated preview deployments.
- Options:
  - A. Exact stable origin and root redirect only — least privileged and
    sufficient for the current SDK.
  - B. Wildcard `*.pages.dev` origins — accommodates previews but authorizes
    unrelated or generated origins.
  - C. Production and staging origins on both products — defeats environment
    separation.
- Recommendation: A.
- Answer: Allow `https://noya-website-staging.pages.dev` and configure
  `https://noya-website-staging.pages.dev/` as the staging product's default
  Google redirect.
- Resulting decision: Preview deployment origins are not enabled. A ClassKit
  platform administrator must separately add the exact trailing-slash URL to
  the shared remote Supabase Auth Redirect URLs before OAuth testing; no
  wildcard or Site URL change is allowed.
- Spec changes: ClassKit Staging Product And Authentication.

### Question 5: Which credentials and GitHub environment protect staging?

- Status: Answered
- Why it matters: The build needs a private SDK and the upload needs a
  host-specific write credential, but neither should be available to other
  branches or production.
- Scenario: Code pushed to a feature branch must not be able to read staging
  deployment secrets or upload an artifact.
- Options:
  - A. Repository-wide shared secrets — simple but exposes credentials to more
    workflows and branches than necessary.
  - B. `staging` environment restricted to the `staging` branch, with a
    Pages-scoped Cloudflare token and a separate read-only SDK deploy key —
    least privilege within the selected topology.
  - C. Reuse production credentials — avoids setup but couples revocation and
    violates the no-copy default.
- Recommendation: B.
- Answer: Use the restricted `staging` GitHub environment and dedicated
  credentials.
- Resulting decision: The environment owns the exact secrets and variables
  listed in the spec; no production secret is copied by default. The
  Cloudflare account contains only the staging Pages project because Pages
  Edit permission is account-scoped rather than project-scoped.
- Spec changes: GitHub Workflow And Environment Boundary; Configuration And
  Credentials.

### Question 6: Are staging deployments automatic or manually approved?

- Status: Answered
- Why it matters: A persistent review environment should reflect the accepted
  staging branch without redundant gates, while production safety remains
  independent.
- Scenario: A reviewed fix merges to `staging` during a client review cycle.
  Reviewers need the stable URL to update promptly.
- Options:
  - A. Auto-deploy every push to `staging` — branch review is the approval and
    the environment remains current.
  - B. Require a GitHub environment reviewer for every staging deploy — adds a
    second gate and can leave the review environment stale.
  - C. Manual-only deploy — weakens reproducibility and branch-to-environment
    correspondence.
- Recommendation: A. Retry an existing run only at its recorded SHA; use a
  reviewed revert pull request for rollback rather than arbitrary dispatch.
- Answer: Auto-deploy `staging` pushes; do not configure required reviewers.
- Resulting decision: The environment branch restriction is mandatory, while
  a reviewer gate and `workflow_dispatch` are not.
- Spec changes: Source Branch And Promotion Flow; GitHub Workflow And
  Environment Boundary.

### Question 7: How are base paths, routes, and PWA behavior handled without changing production?

- Status: Answered
- Why it matters: Production is a GitHub project site while staging is a
  root-hosted Pages project; their asset and fallback mechanisms differ.
- Scenario: A client refreshes `/manager`, installs the PWA, and opens a
  generated signup link. All requests must remain on staging, including the
  newly added `/pricing` route and canonical manager tab routes.
- Options:
  - A. Keep production's fixed `/noya_website/` base for staging — preserves
    production but breaks root-hosted staging URLs.
  - B. Replace the base globally with `/` — breaks production's GitHub project
    subpath.
  - C. Add a bounded staging public-base input, preserve production's
    `/noya_website/` default when it is absent, and omit staging `404.html` —
    preserves both hosting contracts.
- Recommendation: C.
- Answer: Add `VITE_PUBLIC_BASE=/` for staging only and preserve the existing
  production `/noya_website/` default, `%BASE_URL%` HTML links,
  `getSitePath`/`navigateTo` routing seams, and `404.html` step.
- Resulting decision: The new workflow does not create `dist/404.html`;
  Cloudflare serves the SPA shell for application routes. Acceptance covers
  all eight top-level routes, all ten canonical manager tab routes,
  trailing-slash forms, the invite-only sign-in behavior at
  `/auth?mode=signup`, a generated `/lessons?signup=...` link, manifest URL
  resolution, root service-worker scope, and one offline deep-route shell
  navigation.
- Spec changes: Vite, Routing, Signup Links, And PWA.

### Question 8: What is the failure, rollback, and production-isolation contract?

- Status: Answered
- Why it matters: A failed staging release must not partially mutate source,
  production, or ClassKit configuration.
- Scenario: Build succeeds but upload or ClassKit origin verification fails
  after production has already served traffic throughout the run.
- Options:
  - A. Treat staging as disposable and fix forward — leaves client review
    without a known-good state.
  - B. Preserve the last successful deployment, fail the run, repair only the
    staging boundary, and redeploy a reviewed staging commit — isolates
    recovery.
- Recommendation: B.
- Answer: Preserve the last successful staging deployment. Retry only the
  recorded run SHA or merge a reviewed revert into `staging`.
- Resulting decision: The workflow has no source write, version bump,
  production dispatch, GitHub Pages permission, or production environment
  reference. The production `github-pages` environment's master-only branch
  rule is a hard precondition and acceptance check.
- Spec changes: Failure And Recovery Behavior; Testing And Acceptance Evidence.

## Pressure-Test Result

- Status: Complete
- Categories checked:
  - branch lifecycle, promotion, redeploy, and rollback;
  - artifact, browser-origin, auth-storage, manager-cache, product-data,
    credential, and permission ownership;
  - remote SDK product discovery and auth redirect ownership;
  - SPA fallback, base path, signup links, manifest, and service-worker scope;
  - partial build/upload/configuration failures;
  - shared Supabase Auth redirect ownership and exact allow-list evidence;
  - complete staging product policy, test identities, capabilities, and
    minimum business fixtures;
  - the `/pricing` route, every canonical manager tab route, query-bearing auth
    and signup routes, manifest resolution, worker scope, and offline shell;
  - repeated promotion ancestry, synchronization, and second-cycle diff;
  - production non-mutation and acceptance evidence; and
  - out-of-scope hosting, SDK, backend, routing, and CI changes.
- New questions added:
  - Question 7 after verifying that Cloudflare's SPA fallback requires no
    top-level `404.html`.
  - Question 8 to make recovery and non-mutation observable.
- Remaining non-blocking risks:
  - Exact Cloudflare project-name availability cannot be proven until project
    creation; Cloudflare may suffix an unavailable hostname, and implementation
    must stop before upload or ClassKit changes if the canonical URL differs.
  - A Cloudflare Pages Edit token cannot be narrowed to one Pages project; the
    dedicated single-project account is required to bound its authority.
  - Live ClassKit product provisioning and Google provider setup require
    authorized ClassKit administration and cannot be verified during planning.

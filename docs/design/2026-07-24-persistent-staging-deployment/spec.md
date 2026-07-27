# Persistent Staging Deployment Design

Status: Approved — eligible for implementation planning.
Design directory: `docs/design/2026-07-24-persistent-staging-deployment/`

## Goal And Success Criteria

Provide a stable staging deployment for client review and ClassKit integration
testing without changing or sharing Noya Website's production GitHub Pages
deployment boundary.

The design succeeds when:

- production remains deployed only from `master` through
  `.github/workflows/deploy-pages.yml`;
- staging is independently reachable at
  `https://noya-website-staging.pages.dev/`;
- a staging deployment cannot replace the production GitHub Pages artifact,
  mutate `master`, or bump `package.json`;
- staging uses an isolated ClassKit product and data/permission configuration
  on the ClassKit remote platform;
- the staging origin and Google OAuth redirect are explicitly registered on
  that staging product;
- pushes to `staging` automatically update the stable staging deployment;
- reviewed staging commits reach production through a pull request into
  `master`; and
- root navigation, direct route loads, refreshes, assets, PWA scope, signup
  links, password auth, Google OAuth, profile access, and capability-gated
  manager access are verified at the staging origin.

## Current Repository Context

- `.github/workflows/deploy-pages.yml` is the sole production workflow. It
  triggers on `master`, bumps the patch version on push, commits that bump,
  builds, copies `dist/index.html` to `dist/404.html`, and deploys to the
  repository's `github-pages` environment.
- The current production build step injects `VITE_SUPABASE_TARGET`,
  `VITE_REMOTE_SUPABASE_URL`, `VITE_REMOTE_SUPABASE_PUBLISHABLE_KEY`, and
  `VITE_AUTH_REDIRECT_URL`. The pinned SDK client path does not read those
  legacy inputs. Preserving production means leaving that workflow unchanged,
  not treating its inputs as the staging contract.
- The production workflow has `contents: write`, `pages: write`, and
  `id-token: write` because it mutates `master` and uses GitHub Pages.
- The production workflow also exposes `workflow_dispatch` and checks out
  `github.ref_name`. Once a `staging` branch exists, the production
  `github-pages` environment must restrict deployments to `master`; otherwise
  a manual dispatch at `staging` could publish that ref to production.
- `vite.config.ts` uses `base: "/noya_website/"` for the production GitHub
  Pages project site. `index.html` resolves its manifest and Apple icon through
  `%BASE_URL%`; `src/content/site-content.ts`,
  `src/features/classes/signup-links.ts`, and
  `src/register-service-worker.ts` consume `import.meta.env.BASE_URL`.
- `src/content/site-content.ts#getSitePath` prefixes site-owned navigation
  with `BASE_URL`, and `src/App.tsx#navigateTo` resolves route changes against
  `new URL(import.meta.env.BASE_URL, window.location.origin)`. These are the
  current production subpath-navigation seams and must remain base-aware.
- `public/manifest.webmanifest` uses relative `start_url`, `scope`, and icon
  paths. `public/service-worker.js` derives its shell URL from the worker
  registration scope.
- Client-side top-level routes are `/`, `/lessons`, `/pricing`, `/auth`,
  `/profile`, `/manager`, `/terms`, and `/health-declaration`. Manager routing
  also owns ten canonical tab paths under `/manager`: `classes`, `pending`,
  `templates`, `schedules`, `documents`, `memberships`, `customers`,
  `permissions`, `change-requests`, and `settings`. The application uses
  lightweight pathname routing rather than a router package.
- `src/lib/class-kit-client.ts` calls
  `createClassKitClient(import.meta.env, { authStorageKey })`; the website does
  not own remote product selection.
- The pinned `@class-kit/react` commit
  `a158bc588f5ec3421788475ccab2c5c2cb47ce9f` defaults production builds to the
  ClassKit remote Supabase transport. For remote product discovery it sends a
  same-origin, pathful `x-class-kit-site-url` header.
- That pinned SDK explicitly reads `VITE_CLASS_KIT_TARGET`: only the exact
  value `local` selects local transport; `remote`, an omitted value, and every
  other value select the SDK-owned remote URL and publishable key. It does not
  read `VITE_SUPABASE_TARGET`, either remote URL/key workflow input, or
  `VITE_AUTH_REDIRECT_URL`.
- ClassKit validates that header against the HTTP origin, then resolves remote
  products by the longest matching configured site URL. Pathful entries can
  route two same-host project sites to different products, but they do not
  create a browser security boundary: same-origin JavaScript can supply either
  pathful site URL.
- `src/lib/class-kit-client.ts` fixes the Supabase auth storage key as
  `noya-flow-class-kit-auth`, and `src/App.tsx` fixes the manager-access cache
  key as `noya.manager.lastAccess`. Two `khgs2411.github.io` project paths
  would therefore share authentication and cached access state. A staging
  login, logout, or cache update could affect the production application in
  the same browser.
- The repository has no automated test script. `npm run lint` and
  `npm run build` are the available repository-wide static gates.

## Hosting Topology

Use a dedicated Cloudflare Pages Direct Upload project:

- Project name: `noya-website-staging`
- Canonical URL: `https://noya-website-staging.pages.dev/`
- Production branch configured in Cloudflare: `staging`
- Build owner: GitHub Actions in this repository
- Deploy owner: the new `.github/workflows/deploy-staging.yml`

Provision the project explicitly before adding GitHub environment values or
registering ClassKit URLs:

`wrangler pages project create noya-website-staging --production-branch=staging`

Cloudflare documents that a globally unavailable project hostname may receive
random suffix characters. The provisioning gate must therefore verify that
Cloudflare records `staging` as the production branch and returns the exact
canonical production URL
`https://noya-website-staging.pages.dev/`, not merely the requested project
name. If it does not, implementation stops before the first upload and before
any ClassKit configuration changes; a suffixed hostname or different stable
URL is a design change, not an executor choice.

Cloudflare Pages is selected over:

- a staging subpath in the existing GitHub Pages artifact, because any such
  publish replaces the sole production artifact;
- a second Pages repository under `khgs2411.github.io`, because pathful
  ClassKit routing would not isolate origin-scoped authentication, cached
  manager state, service workers, or same-origin script authority; and
- a separate GitHub account or organization solely to manufacture a distinct
  Pages origin, because that creates a larger identity and ownership boundary
  than the staging host requires.

Cloudflare Direct Upload keeps the source, build, branch filters, dependency
access, and deployment record in the current repository while sending only
the prebuilt `dist` artifact to a separate origin.

## Source Branch And Promotion Flow

- Add a long-lived `staging` branch based on the currently accepted production
  baseline.
- Feature work reaches `staging` through reviewed pull requests.
- Protect `staging`: require pull-request review, disallow force pushes and
  deletion, and do not grant a bypass to the staging deployment workflow.
- After those rules and the production environment restriction are effective,
  an authorized maintainer may create `staging` once at the exact reviewed
  staging-implementation commit. Record and compare the intended and created
  SHAs. Every later update requires a reviewed pull request.
- Every push to `staging` triggers the staging workflow automatically.
- Client review occurs only after the workflow records the stable staging URL
  and the smoke checklist passes.
- Production promotion is a reviewed pull request from `staging` into
  `master` using a merge commit. Squash and rebase merges are not allowed for
  this promotion PR. The merge invokes the existing production workflow
  unchanged, including its current patch-version bump.
- After the production deployment and version-bump commit succeed, open a
  reviewed `master` to `staging` synchronization pull request and merge it with
  a merge commit. This carries the production version baseline back to staging
  without replaying or reconstructing changes.
- Repeat the same cycle for every release. Before a second promotion, verify
  that the prior production merge and version-bump commit are ancestors of
  `staging`, and that the `staging` to `master` PR diff contains only the new
  release changes. Do not reset, rebase, force-push, squash, or cherry-pick the
  long-lived branches to realign them.

The staging workflow never invokes `npm version`, commits, pushes source
changes, dispatches the production workflow, or references the `github-pages`
environment.

## GitHub Workflow And Environment Boundary

Create `.github/workflows/deploy-staging.yml` with:

- a trigger limited to pushes on `staging`;
- workflow permissions `contents: read` and `deployments: write`;
- concurrency group `staging-pages`, with stale in-progress staging deploys
  cancellable;
- checkout of the triggering `staging` revision;
- the repository's Bun setup and frozen-lockfile install;
- a dedicated read-only SSH credential for the pinned private ClassKit SDK;
- `bun run lint` before building or uploading;
- a staging build with a root public base and explicit remote ClassKit target;
- no generated `404.html`, because Cloudflare Pages' SPA fallback applies only
  when a top-level `404.html` is absent; and
- direct upload through `cloudflare/wrangler-action` v3, pinned to a reviewed
  immutable commit, with an exact Wrangler `4.81.0`, `gitHubToken`, and command
  `pages deploy dist --project-name=noya-website-staging --branch=staging`.

Give the deploy step the ID `deploy`. Require non-empty
`pages-deployment-id` and `deployment-url` outputs. Write the staging source
SHA, those values, and any `pages-deployment-alias-url` output to the job
summary. If the production-branch deploy does not emit an alias output, query
the Cloudflare Pages deployment API by deployment ID and verify that the
project's canonical production alias points to that deployment. Verify both
the immutable deployment URL and canonical alias serve the locally recorded
artifact fingerprint. Missing or malformed required provenance fails the run.

Create a GitHub environment named `staging` and restrict it to the `staging`
branch. The deploy job must reference that environment so its secrets are not
available to other jobs or branches.

Before creating or pushing `staging`, configure and verify the existing
production `github-pages` environment with a selected-branch deployment rule
that allows only `master`. This is a hard production-isolation precondition.
Do not rely on the production workflow's push filter to constrain
`workflow_dispatch`.

Staging deploys are automatic and have no required-reviewer gate. Review occurs
before merge to `staging`; adding a second approval after every accepted push
would make the review environment stale without improving production safety.
Production retains its independent review and deployment behavior. An operator
may rerun an existing workflow run for the exact recorded commit; rollback
otherwise uses a reviewed revert pull request into `staging`, which creates a
new auditable staging revision.

## Configuration And Credentials

The `staging` GitHub environment owns exactly:

| Name | Kind | Purpose |
| --- | --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | Secret | Select the Cloudflare account containing only the staging Pages project. |
| `CLOUDFLARE_API_TOKEN` | Secret | Direct-upload credential with Cloudflare Pages Edit access scoped to the selected account. |
| `STAGING_CLASS_KIT_SDK_DEPLOY_KEY` | Secret | Dedicated read-only SSH deploy key for installing `@class-kit/react`. |
| `VITE_PUBLIC_BASE` | Variable | `/`, making assets, signup links, and service-worker registration root-relative on the staging origin. |
| `VITE_CLASS_KIT_TARGET` | Variable | Exact value `remote`; the pinned SDK recognizes this input and selects local transport only for exact value `local`. |
| `STAGING_URL` | Variable | `https://noya-website-staging.pages.dev/`, used for workflow summaries and verification. |

Provision a dedicated Cloudflare account containing only the
`noya-website-staging` Pages project. Cloudflare Pages Edit tokens are scoped
to the account rather than an individual Pages project; keeping that account
single-purpose is therefore part of the least-privilege boundary.

Do not copy the production workflow's credentials or its legacy
`VITE_SUPABASE_TARGET`, remote URL/key, and `VITE_AUTH_REDIRECT_URL` inputs
into staging. The pinned SDK owns the ClassKit remote URL and publishable key,
and obtains the Google redirect from the resolved product context.
`VITE_CLASS_KIT_TARGET=remote` is retained as an explicit staging invariant
even though the pinned SDK also defaults an omitted value to remote. The
implementation must inspect the then-pinned SDK before removing or adding any
environment input; a changed SDK contract is a stop condition.

The Cloudflare token must not receive DNS, Workers, zone, user, or unrelated
account permissions. GitHub's generated token remains read-only for repository
contents and receives only the deployment-record permission required by the
upload action.

No browser bundle may contain Cloudflare credentials, the private SDK deploy
key, or any service-role/backend secret. ClassKit's remote publishable
configuration remains SDK-owned browser configuration.

## ClassKit Staging Product And Authentication

Create a separate ClassKit product for staging on the existing ClassKit remote
platform with this exact contract:

| Field | Value |
| --- | --- |
| Product key | `noya_website_staging` |
| Display name | `Noya's Website (Staging)` |
| Status | `active` |
| ClassKit environment | `production` |
| Auth mode | `invite_only` |
| Email/password | Enabled |
| Google OAuth | Enabled |

It must have its own:

- product-user assignments;
- manager roles and permissions;
- customer, class, template, schedule, registration, document, and membership
  data; and
- Google provider redirect configuration.

Register only:

- allowed origin: `https://noya-website-staging.pages.dev`
- active Google redirect record:
  - provider: `google`
  - environment: `production`
  - origin: `https://noya-website-staging.pages.dev`
  - redirect URL: `https://noya-website-staging.pages.dev/`
  - default: `true`

A ClassKit platform administrator with administration rights to the shared
remote Supabase project must also add the exact
`https://noya-website-staging.pages.dev/` URL to Authentication > URL
Configuration > Redirect URLs. The ClassKit product redirect and the Supabase
Auth Redirect URL are separate required controls. Add no wildcard and do not
change the shared Site URL.

Do not allow wildcard `*.pages.dev` origins or generated preview-deployment
origins. Do not add the staging origin to the production product. Do not add
the production origin to the staging product unless a separately approved
cross-origin test requirement appears.

Password and Google authentication must be tested with identities whose
product-user assignments exist only on the staging product. Supabase Auth
identities belong to the shared ClassKit remote platform; the isolated
boundary is the product's assignments, roles, permissions, policies, and
business data. Manager access must be granted through staging-product
capabilities rather than copied production assignments. Product identity,
authentication policy, redirects, permissions, and data remain ClassKit-owned;
the website continues to use only `@class-kit/react`.

Provision this minimum isolated review fixture:

- one invited non-manager identity with a staging product-user assignment and
  profile data but no manager capability;
- one invited manager identity with a staging product-user assignment,
  `dashboard.can_enter`, and exact permission `class_signup_links.manage`;
- at least one active class template and schedule that yield one visible
  upcoming class; and
- one valid signup link for the visible staging class or range.

Credentials for the two identities remain outside the repository. Neither
identity may have a production product-user assignment during acceptance
testing. The fixture establishes class discovery, signup-link resolution,
password auth, Google auth, profile access, manager denial, and manager access
without copying production business data.

## Vite, Routing, Signup Links, And PWA

Make `vite.config.ts` read one deployment-only public base input:

- when `VITE_PUBLIC_BASE` is exact `/`, use `/` for staging;
- when `VITE_PUBLIC_BASE` is absent or empty, preserve the current
  `/noya_website/` production behavior; and
- reject every other non-empty value with the named error
  `VITE_PUBLIC_BASE must be "/" or unset`.

The implementation must keep this input limited to the root staging override
or the fixed production default. It is not a general multi-tenant base-path
system. It must not weaken or bypass the existing `%BASE_URL%`, `getSitePath`,
`navigateTo`, signup-link, or service-worker consumers.

For staging:

- assets load from the staging origin root;
- `BASE_URL` makes generated signup links resolve to
  `https://noya-website-staging.pages.dev/lessons?...`;
- service-worker registration resolves to `/service-worker.js`;
- the manifest retains staging-root `start_url` and `scope` behavior;
- direct loads and refreshes on every application route return the SPA shell;
  and
- `dist/404.html` is absent so Cloudflare's default SPA fallback remains
  enabled.

The staging route and PWA acceptance matrix is:

| Surface | Required checks |
| --- | --- |
| Top-level routes | Direct load and refresh of `/`, `/lessons`, `/pricing`, `/auth`, `/profile`, `/manager`, `/terms`, and `/health-declaration`, including trailing-slash forms where distinct. `/manager` must settle on `/manager/classes`. |
| Manager routes | Direct load and refresh of all ten canonical `/manager/<tab>` paths, including trailing-slash forms. Capability-restricted tabs must either render for an authorized staging manager or repair to `/manager/classes` according to current application behavior. |
| Query-bearing routes | `/auth?mode=signup` preserves the query-bearing staging URL, then renders sign-in after the `invite_only` product policy loads; it must not expose open signup. A generated `/lessons?signup=...` URL remains on the staging origin and resolves the staging fixture. |
| Manifest | `/manifest.webmanifest` loads from staging; its relative `start_url`, `scope`, and icon URLs resolve to the staging root. |
| Service worker | `/service-worker.js` registers with root scope, controls the staging routes after activation, and does not register against or control production because the origins differ. |
| Offline shell | After one successful online load and worker activation, an offline navigation to a representative deep route returns the cached root application shell. |
| SPA fallback | A direct request for each route returns the root SPA shell while top-level `dist/404.html` remains absent. |

The existing production workflow continues creating `dist/404.html` for
GitHub Pages and continues using the `/noya_website/` base default.

## Failure And Recovery Behavior

- Build or lint failure blocks upload and leaves the previous staging
  deployment live.
- Missing or empty environment configuration, or a
  `VITE_CLASS_KIT_TARGET` value other than exact `remote`, fails before build
  or upload with a named configuration error.
- A Cloudflare upload failure leaves production untouched and preserves the
  last successful staging deployment.
- A ClassKit origin or redirect mismatch is a failed staging release. Diagnose
  and repair the staging product redirect and shared Supabase Auth Redirect
  URL through ClassKit platform administration; do not add direct Supabase
  access or bypass origin validation in the website.
- Rollback merges a reviewed revert into `staging` and deploys that new commit
  through the same workflow. Rerunning an existing run is allowed only for
  that run's recorded commit. Neither path modifies the production artifact.
- Rotating either deploy credential is isolated to the `staging` GitHub
  environment.

## Documentation

Add a staging operations section to `README.md` covering:

- canonical URL and hosting owner;
- `staging` branch and pull-request flow;
- automatic deployment, exact-run retry, and reviewed-revert rollback behavior;
- GitHub environment variables, secrets, and branch restriction;
- Cloudflare project and token scope;
- ClassKit product origin, redirect, and isolation rules;
- shared Supabase Auth Redirect URL ownership and exact-value verification;
- exact staging product policy and minimum review fixture;
- route/auth/PWA smoke checklist;
- rollback and credential rotation; and
- troubleshooting for build, upload, origin, redirect, and deep-link failures.

Do not document secret values.

## Testing And Acceptance Evidence

Static and workflow evidence:

- inspect both workflow triggers, permissions, environments, concurrency, and
  build/deploy commands;
- verify the `github-pages` environment permits only `master` before the
  `staging` branch is created or pushed;
- verify the production workflow is unchanged by the staging implementation
  relative to the implementation card's base commit;
- verify staging contains no version bump, source write, GitHub Pages deploy,
  or `dist/404.html` creation;
- run `npm run lint`;
- run one production-default build with `VITE_PUBLIC_BASE` unset and verify
  emitted HTML/assets use `/noya_website/`, including the manifest and Apple
  icon expanded from `%BASE_URL%`;
- run one staging build with `VITE_PUBLIC_BASE=/` and
  `VITE_CLASS_KIT_TARGET=remote`, then verify emitted HTML/assets, generated
  signup links, and service-worker registration use `/`; and
- verify both builds preserve base-aware navigation through `getSitePath` and
  `navigateTo`, while the staging artifact omits `dist/404.html`.

Before the first staging upload, record:

- `refs/heads/master` SHA;
- `package.json` version at that SHA;
- latest production `github-pages` deployment ID and timestamp; and
- a production URL availability check plus a stable artifact fingerprint.

After the staging upload, repeat those four observations and require equality.

Live staging evidence after first deployment:

- complete the top-level, manager-route, query-bearing, manifest,
  service-worker, offline-shell, and SPA-fallback matrix defined above;
- verify successful asset and icon loads within the staging origin;
- password sign-in/sign-out;
- Google OAuth round trip back to the staging root;
- profile access;
- manager denial for a non-manager and capability-gated access for a staging
  manager;
- ClassKit product context identifies the staging product; and
- the production URL, production Pages deployment, `master`, and
  `package.json` version are unchanged by the staging run.

Record the mapping from staging source SHA to Cloudflare deployment ID and
immutable deployment URL, then verify the canonical staging alias serves that
same artifact fingerprint.

Before Google OAuth testing, capture authorized-administrator evidence that:

- the staging product has the exact identity, status, environment, auth policy,
  allowed origin, and active default Google redirect specified above;
- the shared Supabase Auth Redirect URLs contain the exact staging URL once and
  no staging wildcard; and
- the two test identities, capabilities, and minimum business fixture are
  assigned only to the staging product.

After the first promotion and `master` to `staging` synchronization, perform a
dry second-cycle history check with a temporary documentation-only commit or
equivalent local refs: verify the previous production merge and version bump
are ancestors of staging, and verify the next promotion diff excludes the
already promoted release. Do not push the dry-run commit.

The implementation report must distinguish static evidence, live Cloudflare
evidence, and live ClassKit evidence.

## Implementation Constraints And Seams

- Do not modify `.github/workflows/deploy-pages.yml`.
- Do not create or push `staging` until the production `github-pages`
  environment's selected-branch rule is verified as `master` only.
- Do not replace production hosting.
- Do not add direct Supabase access or raw ClassKit Edge Function calls.
- Shared Supabase Auth Redirect URL administration is owned by a ClassKit
  platform administrator and is external configuration, not website access.
- Do not share production product data, roles, user assignments, or secrets.
- Do not add a router, a general environment framework, preview deployments,
  a custom domain, or a broad CI/CD redesign.
- Pin third-party workflow actions to reviewed immutable revisions during
  implementation, including the Cloudflare deployment action.
- Verify the exact pinned ClassKit environment contract before implementation;
  if it no longer uses remote origin discovery or its required inputs differ,
  stop and revise this design rather than guessing.

## Assumptions And Provenance

| Item | Provenance |
| --- | --- |
| Plan-only scope, production preservation, stable distinct URL, isolated staging product, and acceptance matrix | Assignment ledger |
| Current workflows, production workflow inputs, `/noya_website/` base, `%BASE_URL%` HTML links, base-aware navigation, routes, PWA files, scripts, and SDK call site | Repository inspection at resolved `master` baseline `c451452` |
| `VITE_CLASS_KIT_TARGET` semantics, SDK-owned remote URL/key, product-context OAuth redirect, same-origin pathful discovery, and origin-scoped auth/manager caches | Pinned `@class-kit/react` source at `a158bc5`, ClassKit API origin resolver, and website storage keys |
| OAuth `redirectTo` must appear exactly in Supabase Auth Redirect URLs | Current Supabase Auth redirect documentation and ClassKit auth contract |
| Cloudflare Direct Upload, Pages Edit token, stable project URL, and no-`404.html` SPA fallback | Current Cloudflare Pages documentation |
| Environment branch restriction and secret-release behavior | Current GitHub Actions environment documentation |

## Open Questions

None. The resolved decision record is in `agenda.md`.

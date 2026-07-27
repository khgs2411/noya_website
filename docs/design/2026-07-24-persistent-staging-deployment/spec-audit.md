# Persistent Staging Deployment Design Audit

## Audit Mode: Full

Rationale: The design crosses repository workflows, GitHub environments,
Cloudflare Pages, ClassKit product administration, shared Supabase
authentication, branch lifecycle, routing, and PWA behavior. It is intended to
be carried into agent-executable implementation planning after a separate
approval gate.

## Plan Overview

Objective: Provide a stable staging environment for client review and ClassKit
integration testing without allowing staging deployment, authentication,
product data, or branch activity to mutate the production GitHub Pages
boundary.

Scope: A long-lived `staging` branch, merge-commit promotion and
synchronization, Cloudflare Pages Direct Upload, a restricted GitHub
environment and credentials, an isolated ClassKit product on the shared remote
platform, exact shared Supabase Auth redirect administration, a
deployment-specific Vite base, route/PWA verification, documentation, and
acceptance evidence.

Explicitly excluded: Production hosting replacement, changes to
`.github/workflows/deploy-pages.yml`, direct Supabase or raw ClassKit Edge
Function access from this website, ClassKit product behavior changes, preview
deployments, a new router, and broad CI/CD redesign.

Target Audience: Human developers and AI agents.

Readiness Level: Ready for Development.

Key Technical Decisions:

- Staging uses the distinct origin
  `https://noya-website-staging.pages.dev/` and a separate Cloudflare Pages
  artifact.
- `staging` pushes auto-deploy through a branch-restricted GitHub environment;
  production remains `master`-only and keeps its existing version bump.
- Staging uses a separate ClassKit product and product-owned redirect while the
  shared Supabase Auth allow-list remains ClassKit platform administration.
- `VITE_PUBLIC_BASE=/` is staging-only. An absent or empty override preserves
  production `base: "/noya_website/"`, `%BASE_URL%` HTML links,
  `getSitePath`/`navigateTo` routing, and the generated GitHub Pages
  `404.html`.
- The current card remains design-only. Implementation planning and all live
  external changes require a later approved card carrying these artifacts.

## Evidence Boundary

The refreshed planning branch was inspected against resolved `master` baseline
`c45145208adf63e88a931c3434fb6a17739e74d2`. That baseline is the planning
branch merge base and an ancestor of current planning HEAD
`b592c10fe42ed869cddf97828be5ae0ad88244fe`; the affected production source
seams do not differ between them. Only feedback `6a6728ae940e6a15bb3a2f7d`
and the corresponding `spec.md`/`agenda.md` base-path delta were re-audited.
No build, test suite, deployment, provisioning command, GitHub mutation,
ClassKit mutation, or Supabase mutation was performed.

External claims were checked against current primary documentation:

- [Cloudflare Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)
  documents project-name suffixing when the requested hostname is unavailable,
  production-branch selection, and Direct Upload deployment behavior.
- [Wrangler Pages commands](https://developers.cloudflare.com/workers/wrangler/commands/pages/)
  documents `pages project create [PROJECT-NAME]`,
  `--production-branch`, and `pages deploy --branch`.
- [Cloudflare Pages serving behavior](https://developers.cloudflare.com/pages/configuration/serving-pages/)
  confirms that a deployment without a top-level `404.html` receives the
  default SPA fallback.
- [Cloudflare Direct Upload with CI](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/)
  confirms the Pages edit credential, `contents: read`,
  `deployments: write`, `gitHubToken`, and Wrangler action shape.
- [Cloudflare Wrangler Action](https://github.com/cloudflare/wrangler-action)
  confirms `wranglerVersion`, `deployment-url`,
  `pages-deployment-alias-url`, and `pages-deployment-id`.
- [GitHub environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)
  confirms selected-branch deployment policies and environment-scoped secret
  release.
- [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
  confirms that SDK `redirectTo` values must be present in the Auth redirect
  allow-list and recommends exact production URLs rather than wildcards.

## File Path Verification

| Referenced Path | Status | Notes |
| --- | --- | --- |
| `.github/workflows/deploy-pages.yml` | Exists | `master` push plus `workflow_dispatch`; patch bump only on push; write-capable GitHub Pages deployment confirmed. |
| `.github/workflows/deploy-staging.yml` | Not Found | Correctly identified as a future implementation file. |
| `vite.config.ts` | Exists | Currently fixes production `base: "/noya_website/"`; only staging may override it to `/`. |
| `src/lib/class-kit-client.ts` | Exists | Calls `createClassKitClient(import.meta.env, { authStorageKey })` and does not directly select a product/backend. |
| `src/App.tsx` | Exists | `navigateTo` resolves route changes against `new URL(BASE_URL, origin)` and owns `noya.manager.lastAccess`; the base-aware seam is protected. |
| `src/content/site-content.ts` | Exists | `getSitePath` prefixes site navigation with `BASE_URL`; route predicates and asset consumers remain base-aware. |
| `src/features/manager/manager-routes.ts` | Exists | Defines all ten canonical manager tab paths and trailing-slash normalization. |
| `src/features/account/auth-page.tsx` | Exists | Enforces the staging-policy contradiction described below. |
| `src/features/classes/signup-links.ts` | Exists | Builds signup URLs from `BASE_URL`. |
| `src/register-service-worker.ts` | Exists | Registers the worker from `BASE_URL`. |
| `public/manifest.webmanifest` | Exists | Uses relative root/scope/icon values. |
| `public/service-worker.js` | Exists | Derives the cached shell from registration scope. |
| `index.html` | Exists | Manifest and Apple icon use `%BASE_URL%`, yielding production-subpath or staging-root URLs from the selected base. |
| `package.json` | Exists | Has `lint` and `build`, no automated test script, and pins the SDK commit. |
| `bun.lock` | Exists | Resolves `@class-kit/react` to `a158bc588f5ec3421788475ccab2c5c2cb47ce9f`. |
| `README.md` | Exists | Future staging-operations documentation target. |
| `dist/index.html` | Not Found | Expected generated output, correctly absent from source. |
| `dist/404.html` | Not Found | Expected production-generated output, correctly absent from source. |
| `docs/design/2026-07-24-persistent-staging-deployment/spec.md` | Exists | Final design under audit. |
| `docs/design/2026-07-24-persistent-staging-deployment/agenda.md` | Exists | Final decision record under audit. |

## Focused Rework Closure

| Feedback Requirement | Status | Evidence |
| --- | --- | --- |
| Refresh against resolved `master` | Closed | `c45145208adf63e88a931c3434fb6a17739e74d2` is the planning branch merge base and ancestor; no affected product seam differs through current HEAD. |
| Preserve production `/noya_website/` | Closed | The current Vite config, spec repository context, bounded override contract, agenda Question 7, and production artifact checks all use `/noya_website/`. |
| Use `/` only for staging | Closed | The design accepts exact `VITE_PUBLIC_BASE=/` as the staging override and requires the staging workflow variable to be `/`. |
| Preserve production for unset/empty override | Closed | The spec explicitly maps absent or empty `VITE_PUBLIC_BASE` to `/noya_website/` and rejects only other non-empty values. |
| Protect `%BASE_URL%`, `getSitePath`, and `navigateTo` | Closed | The spec names all three current seams, forbids weakening/bypassing them, and requires generated/static evidence for both deployment bases. |
| Correct generated-artifact checks | Closed | Production-default evidence requires `/noya_website/` HTML/assets and expanded manifest/icon links; staging evidence requires root HTML/assets, signup links, worker registration, base-aware navigation, and no `dist/404.html`. The unchanged production workflow remains responsible for its `dist/404.html` copy. |

The generic failure rule for missing or empty environment configuration is
read as the staging workflow preflight: that workflow requires
`VITE_PUBLIC_BASE=/`. It does not override the more specific Vite contract,
under which an unset or empty override selects the production default.

The pinned SDK source was also verified directly at commit
`a158bc588f5ec3421788475ccab2c5c2cb47ce9f` in the ClassKit SDK repository:

- only exact `VITE_CLASS_KIT_TARGET === "local"` selects local transport;
- omission, `remote`, and other values select the SDK-owned remote URL/key;
- the Vite constructor does not consume `VITE_SUPABASE_TARGET`,
  `VITE_REMOTE_SUPABASE_URL`,
  `VITE_REMOTE_SUPABASE_PUBLISHABLE_KEY`, or
  `VITE_AUTH_REDIRECT_URL`;
- Google OAuth obtains `redirectTo` from resolved product context; and
- remote calls send a query/hash-free, same-origin
  `x-class-kit-site-url`.

## Strengths

### 1. Current route coverage is complete

The matrix now names all eight top-level routes: `/`, `/lessons`, `/pricing`,
`/auth`, `/profile`, `/manager`, `/terms`, and `/health-declaration`. It also
names the ten canonical manager tabs implemented by
`manager-routes.ts`: `classes`, `pending`, `templates`, `schedules`,
`documents`, `memberships`, `customers`, `permissions`,
`change-requests`, and `settings`. Trailing-slash, manager repair,
query-bearing, manifest, worker, offline, and SPA-fallback behavior are
observable.

### 2. The refreshed base-path contract preserves production

The design now starts from the current `/noya_website/` production invariant.
Only exact `/` selects the staging base; unset and empty preserve production;
other non-empty values fail. `%BASE_URL%` owns manifest/icon expansion,
`getSitePath` owns site-link prefixing, and `navigateTo` resolves application
navigation against the active base. This is the smallest coherent seam for a
root-hosted staging artifact without regressing the GitHub project site.

### 3. The staging SDK input contract matches the pin

The design correctly rejects the production workflow's legacy Supabase and
redirect inputs as staging inputs while leaving the production workflow
unchanged. Exact `VITE_CLASS_KIT_TARGET=remote` is stricter than the SDK
requires but is a coherent staging invariant, and the then-pinned-SDK
revalidation stop condition prevents configuration drift.

### 4. Cloudflare provisioning fails before dependent mutations

The project-create command and exact canonical-hostname check match current
Cloudflare behavior. A suffixed hostname is treated as a design change.
Critically, the design stops before first upload and before ClassKit/Supabase
configuration if the exact URL or production branch differs. Omitting
top-level `404.html` is also consistent with Cloudflare's documented SPA
fallback.

### 5. Production non-mutation is objective

The future staging workflow has read-only source permission, no version bump,
no source push, no production workflow dispatch, no GitHub Pages permission,
and no `github-pages` environment reference. The production workflow is
explicitly immutable relative to the future implementation card's base
commit. Pre/post observations cover `master`, package version, production
deployment identity, URL availability, and artifact fingerprint.

### 6. ClassKit and Supabase ownership are correctly separated

The website continues to use only `@class-kit/react`. The staging ClassKit
product owns product identity, origin, auth policy, product redirect,
assignments, capabilities, and business data. A ClassKit platform
administrator separately owns the shared Supabase Auth Redirect URL. Exact
URLs, no wildcards, no shared Site URL change, and authorized-administrator
evidence keep those controls distinct.

### 7. External and plan-only authority are bounded

The current assignment authorizes design only. The spec and agenda repeatedly
defer implementation planning and all GitHub, Cloudflare, ClassKit, Supabase,
and branch mutations to a future approved implementation card. Within that
future work, maintainer and ClassKit platform-administrator gates are stated,
and unavailable external prerequisites stop progress rather than inviting
workarounds.

## Critical Issues

None.

The prior auth-policy blocker is closed. The route matrix now requires
`/auth?mode=signup` to preserve the query-bearing staging URL, render sign-in
after the specified `invite_only` policy loads, and never expose open signup.
The agenda records the same decision. This matches `src/App.tsx`, which
preserves and parses the query, and `src/features/account/auth-page.tsx`, which
sets `visibleMode` to sign-in unless `auth_mode === "open"`.

## Questions for Plan Author

None.

## Recommendations

### External operations

- In the future implementation plan, name the Cloudflare account
  administrator and GitHub repository/environment administrator responsible
  for the preconditions. The present design correctly forbids autonomous live
  changes under this card, but named ownership will make handoff clearer.
- Treat Cloudflare's recorded `production_branch` as deployment routing, not
  as an authorization boundary. GitHub's workflow trigger, environment branch
  policy, protected branch, and dedicated token remain the enforcement
  controls.

### Acceptance clarity

- State that `/manager` settling on `/manager/classes` is checked with the
  authorized staging manager. The non-manager denial check correctly settles
  outside manager routing and should remain a separate case.
- In implementation planning, phrase “missing or empty environment
  configuration” as “missing required staging workflow configuration” so it
  cannot be mistaken for the Vite fallback contract.
- Exercise an explicitly empty `VITE_PUBLIC_BASE` in addition to the required
  unset production build, or verify the empty branch with an equally objective
  focused check. This strengthens coverage without changing the settled
  contract.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Staging override regresses production project-site paths | Low | High | Preserve `/noya_website/` for unset/empty input and verify `%BASE_URL%`, navigation seams, and generated production artifacts. |
| Exact Cloudflare hostname is unavailable | Low | High | Preserve the pre-upload, pre-ClassKit stop gate and require design review for a new URL. |
| Cloudflare Pages credential affects every project in its account | Medium | High | Use the specified dedicated single-project account and Pages-only permission. |
| ClassKit or shared Supabase administration is unavailable | Medium | High | Require authorized evidence before OAuth acceptance; do not bypass from the website. |
| Manual production dispatch targets a non-`master` ref | Low | High | Verify the `github-pages` environment's selected-branch rule before creating or pushing `staging`. |
| Promotion history drifts after the first release | Low | High | Preserve merge-commit-only promotion/sync and the second-cycle ancestry/diff gate. |

Highest Risk: Exact Cloudflare hostname reservation and authorized ClassKit
platform provisioning are external preconditions. Both have explicit stop
conditions and evidence gates, so neither requires design-time guessing.

## Pre-Development Checklist

- [x] Resolved `master` baseline `c451452` is the planning branch merge base
      and affected production seams remain unchanged through current HEAD.
- [x] Unset or empty `VITE_PUBLIC_BASE` preserves `/noya_website/`.
- [x] Exact `VITE_PUBLIC_BASE=/` selects staging root behavior.
- [x] Other non-empty base values fail with a named error.
- [x] `%BASE_URL%` manifest/icon links and `getSitePath`/`navigateTo` remain
      protected current seams.
- [x] Production and staging generated-artifact expectations are distinct and
      coherent.
- [x] `/auth?mode=signup` preserves the query-bearing URL, settles on sign-in
      under `invite_only`, and must not expose open signup.
- [x] All eight top-level routes are covered.
- [x] All ten canonical manager tab paths are covered.
- [x] The pinned SDK input and OAuth redirect contract is verified.
- [x] Cloudflare project creation, production branch, exact-hostname, and SPA
      fallback gates are explicit.
- [x] Production workflow immutability and non-mutation evidence are explicit.
- [x] ClassKit product redirect and shared Supabase Auth redirect ownership are
      separate and exact.
- [x] Live external mutations are excluded from this Plan Only assignment.
- [x] All referenced source paths are verified or correctly marked
      planned/generated.
- [x] AI autonomy, forbidden actions, stop conditions, and rollback paths are
      otherwise explicit.

## Next Steps

1. Approve these design artifacts for implementation planning.
2. Create a separate implementation-planning card carrying the accepted
   design artifact contract; do not implement under this Plan Only assignment.
3. Carry the `/noya_website/` default, `/` staging override, protected routing
   seams, and dual generated-artifact checks into the refreshed plan-set audit.

## Evaluation Matrix

| Dimension | Weight | Raw Score | Weighted Score | Notes |
| --- | --- | --- | --- | --- |
| Completeness | x3 | 5/5 | 15/15 | Hosting, current production/staging bases, protected consumers, auth policy, routes, fixtures, rollback, and artifact evidence are complete. |
| Feasibility | x3 | 5/5 | 15/15 | The bounded Vite override and generated-artifact checks match the refreshed source seams; unaffected hosting, SDK, and redirect contracts remain accepted. |
| Clarity | x2 | 5/5 | 10/10 | `/noya_website/`, `/`, unset/empty behavior, invalid values, protected consumers, and evidence are explicit. |
| Logical Flow | x2 | 5/5 | 10/10 | External prerequisites, branch creation, deployment, acceptance, promotion, and recovery are correctly ordered. |
| Scope & Risk | x2 | 4/5 | 8/10 | External hostname and platform-administration dependencies remain, with explicit stop conditions and evidence gates. |
| Developer Experience | x1 | 5/5 | 5/5 | File seams, external prerequisites, checkpoints, rollback, and done evidence are concrete. |
| AI Readiness | x1 | 5/5 | 5/5 | Autonomy boundaries, forbidden actions, stop conditions, path accuracy, and objective checks are explicit. |

Overall: 68/70 -> Ready for Development

Critical Dimension Check: Pass; neither weighted x3 dimension scores 1.

## Handoff

DESIGN READY FOR IMPLEMENTATION PLANNING

Key constraints:

- Preserve `.github/workflows/deploy-pages.yml`, production hosting, and
  `master`-only production deployment/versioning behavior, including the
  `/noya_website/` base and `dist/404.html` copy.
- Allow only exact `/` as the staging base override; unset or empty must keep
  `/noya_website/`, and other non-empty values must fail.
- Preserve `%BASE_URL%` manifest/icon links, `getSitePath`, `navigateTo`,
  signup-link generation, and worker registration as base-aware consumers.
- Do not create or push `staging` until the production GitHub Pages
  environment restriction and staging branch protections are verified.
- Reserve the exact Cloudflare hostname before upload or ClassKit/Supabase
  configuration.
- Keep staging product data, assignments, permissions, origins, and redirects
  isolated; the shared Supabase Auth redirect remains ClassKit platform
  administration.
- Preserve `invite_only`: `/auth?mode=signup` keeps its URL but settles on
  sign-in and must not expose open signup.
- Carry this design through a separate approved implementation-planning card;
  this Plan Only assignment authorizes no implementation or live mutation.

Suggested starting point: In the future implementation plan, sequence the
production environment restriction, exact Cloudflare hostname reservation,
and authorized ClassKit/Supabase prerequisites before branch creation or
workflow deployment.

First milestone: External production-isolation, hostname, ClassKit product,
and Auth redirect prerequisites are recorded and verified without creating or
pushing `staging`.

Verdict: Ready for Development

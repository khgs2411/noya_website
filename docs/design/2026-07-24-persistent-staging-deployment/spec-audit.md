# Persistent Staging Deployment Spec Re-Audit

## Audit Mode: Full

Rationale: The revised design still crosses GitHub Actions, GitHub Pages,
Cloudflare Pages, ClassKit product administration, shared Supabase
authentication, branch lifecycle, routing, and PWA behavior. This re-audit
focuses on the previously blocking contracts and their revised acceptance
evidence.

## Plan Overview

Objective: Add an independently hosted, stable staging environment without
allowing staging deployment, authentication, product data, or review activity
to mutate Noya Website production.

Scope: A long-lived `staging` branch, merge-commit-only promotion and
synchronization, Cloudflare Pages Direct Upload, restricted GitHub environment
and credentials, isolated ClassKit product, shared-auth redirect
administration, deployment-specific Vite base, SPA/PWA behavior,
documentation, and acceptance evidence. Production hosting replacement, direct
Supabase use from the website, raw ClassKit Edge Function calls, preview
deployments, and broad CI/CD redesign are excluded.

Target Audience: Human developers and AI agents.

Readiness Level: Ready for Development.

Key Technical Decisions:

- `noya-website-staging.pages.dev` provides an artifact and browser origin
  independent from production GitHub Pages.
- The `staging` branch deploys automatically through a restricted GitHub
  environment and pinned `cloudflare/wrangler-action`/Wrangler toolchain.
- Staging uses an isolated ClassKit product on the shared remote platform, with
  a separate product redirect and exact shared Supabase Auth Redirect URL.
- Promotion and the subsequent `master` to `staging` synchronization use merge
  commits only, with second-cycle ancestry and diff verification.
- `VITE_PUBLIC_BASE=/` applies only to staging; production preserves
  `base: "./"` and the existing GitHub Pages `404.html` fallback.

## File Path Verification

Verified against repository commit `4c9f110`; no referenced source path changed
since the first audit:

| Referenced Path | Status | Notes |
| --- | --- | --- |
| `.github/workflows/deploy-pages.yml` | Exists | Current production workflow; `master` push, patch bump, and GitHub Pages deployment confirmed. |
| `.github/workflows/deploy-staging.yml` | Not Found | Expected new implementation file. |
| `vite.config.ts` | Exists | Currently fixes `base: "./"`. |
| `src/lib/class-kit-client.ts` | Exists | Delegates Vite environment interpretation to the pinned SDK and fixes the auth storage key. |
| `src/App.tsx` | Exists | Contains lightweight routing and the manager-access cache key. |
| `src/content/site-content.ts` | Exists | Defines all six client-side paths and consumes `BASE_URL`. |
| `src/features/classes/signup-links.ts` | Exists | Constructs signup URLs from `BASE_URL`. |
| `src/register-service-worker.ts` | Exists | Registers from `BASE_URL`. |
| `public/manifest.webmanifest` | Exists | Uses relative start, scope, and icon paths. |
| `public/service-worker.js` | Exists | Derives the app shell from registration scope. |
| `index.html` | Exists | Uses relative manifest and icon references. |
| `package.json` | Exists | Has `lint` and `build`, no automated test script, and pins the private SDK commit. |
| `bun.lock` | Exists | Resolves `@class-kit/react` to `a158bc588f5ec3421788475ccab2c5c2cb47ce9f`. |
| `README.md` | Exists | Planned documentation target. |
| `dist/index.html` | Not Found | Expected generated output, correctly absent from source. |
| `dist/404.html` | Not Found | Expected generated production-only fallback, correctly absent from source. |
| `docs/design/2026-07-24-persistent-staging-deployment/spec.md` | Exists | Revised design audited. |
| `docs/design/2026-07-24-persistent-staging-deployment/agenda.md` | Exists | Revised decision record audited. |

## Prior Finding Closure

| Prior Critical Finding | Status | Evidence |
| --- | --- | --- |
| Shared Supabase Auth Redirect URL gate was omitted | Closed | The spec assigns ownership to a ClassKit platform administrator, requires the exact trailing-slash URL, forbids wildcards and Site URL changes, and requires authorized-administrator evidence before OAuth testing. |
| Staging ClassKit product contract was underspecified | Closed | Product key, name, supported `production` environment, status, auth mode, provider flags, identities, exact `class_signup_links.manage` permission, and minimum data are stated. The agenda distinguishes this ClassKit enum from the staging deployment labels. |
| Repeated promotion history was non-deterministic | Closed | Both direction changes use reviewed merge commits; squash, rebase, reset, force-push, and cherry-pick realignment are excluded; the second cycle verifies ancestry and diff cleanliness. |

All prior critical findings and route/deployment recommendations are closed.
The live matrix covers all six routes and their trailing-slash forms. The
workflow contract specifies exact Wrangler `4.81.0`, action outputs, command,
job-summary evidence, immutable action pinning, and a deployment-API fallback
when the optional alias output is absent.

## Strengths

### 1. OAuth now has both required configuration gates

The revised design distinguishes the origin-scoped ClassKit product redirect
from the shared Supabase Auth Redirect URL, assigns the latter to a ClassKit
platform administrator, and verifies exact-value/no-wildcard evidence before
the Google round trip. This matches the pinned SDK, which passes the
product-owned redirect as Supabase OAuth `redirectTo`.

### 2. The product fixture makes live acceptance repeatable

The staging-only non-manager and manager identities, profile data, visible
class, schedule, and signup link cover product discovery, password and Google
auth, profile access, manager denial/access, and signup-link resolution without
copying production data.

### 3. The branch lifecycle now covers the second release

Merge-commit-only promotion preserves the staging tip in `master`; the reviewed
reverse synchronization then carries the production version-bump commit back
to staging. Explicit ancestry and clean-diff checks make repeated promotion
observable rather than leaving realignment to operator preference. The
one-time branch initialization is also bounded: it occurs only after the
master-only production environment rule and staging ruleset are effective,
records equality between the reviewed intended SHA and created branch SHA, and
does not create an exception for later updates.

### 4. Route and PWA evidence now covers the repository's actual route set

The revised matrix includes `/lessons`, `/auth`, `/profile`, `/manager`,
`/terms`, and `/health-declaration`, plus all trailing-slash forms. This matches
the six route predicates in `src/content/site-content.ts` and exercises the
relative manifest/icon behavior that differs at slash-terminated URLs.

### 5. Cloudflare deployment evidence is concrete

The design specifies `cloudflare/wrangler-action`, exact Wrangler `4.81.0`,
`gitHubToken`, the full Pages command, and the deployment ID, immutable URL,
alias URL, source SHA, and artifact-fingerprint evidence. The named inputs and
outputs exist in the current action contract:
[cloudflare/wrangler-action](https://github.com/cloudflare/wrangler-action).

## Critical Issues

None. The previously unsupported ClassKit environment now uses `production`
consistently for the stable remote origin and origin-scoped Google redirect.
This is accepted by the pinned SDK, current backend validator, and database
constraints. The agenda explicitly preserves `staging` only as the website,
branch, GitHub environment, and Cloudflare deployment label.

## Questions for Plan Author

None.

## Recommendations

No design changes are required. During implementation, retain the specified
stop conditions: pin the reviewed action commit, reserve the exact hostname
before ClassKit configuration, verify the then-pinned SDK contract, and do not
create or push `staging` before the production environment's master-only rule
is proven.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| ClassKit or shared Auth administration is unavailable | Medium | High | Treat authorized provisioning evidence as a prerequisite to live auth acceptance. |
| Pages production deployment omits an alias output | Medium | Low | Use the specified deployment API lookup by required deployment ID. |
| Exact Cloudflare hostname is unavailable | Low | High | Preserve the existing stop condition before ClassKit configuration changes. |
| Shared Supabase redirect is changed too broadly | Low | High | Keep the exact one-entry/no-wildcard administrator evidence now specified. |
| Repeated branch promotion drifts | Low | High | Enforce merge commits and the second-cycle ancestry/diff gate. |

Highest Risk: Exact Cloudflare hostname reservation and authorized ClassKit
platform provisioning are external preconditions. Both have explicit stop
conditions and evidence gates, so neither requires design-time guessing.

## Pre-Development Checklist

- [x] ClassKit `production` environment is used consistently for the stable
      remote origin and Google redirect.
- [x] The staging deployment labels are distinguished from the ClassKit enum.
- [x] Shared Supabase Auth Redirect URL ownership and exact evidence are
      explicit.
- [x] Staging product identity, auth policy, identities, and minimum business
      fixture are otherwise explicit.
- [x] Manager fixture names exact permission `class_signup_links.manage`.
- [x] One-time `staging` initialization is authorized only after both
      protection layers are effective, uses the exact reviewed implementation
      commit, and verifies the intended and created SHAs.
- [x] Every post-initialization `staging` update requires a reviewed pull
      request.
- [x] Repeated promotion and synchronization history are deterministic.
- [x] All six routes and trailing-slash forms are covered.
- [x] Wrangler version, command, action pinning rule, and deployment outputs
      are explicit.
- [x] Optional alias output has a deployment-API fallback keyed by required
      deployment ID.
- [x] All referenced source paths are verified or marked as planned/generated.
- [x] AI autonomy, stop conditions, and verification gates are complete.

## Next Steps

1. Approve these design artifacts for implementation planning.
2. Carry the accepted design through a new approved-plan implementation card;
   do not implement under this Plan Only assignment.
3. Begin future implementation with hostname reservation and production
   `github-pages` environment verification before creating or pushing
   `staging`.

## Evaluation Matrix

| Dimension | Weight | Raw Score | Weighted Score | Notes |
| --- | --- | --- | --- | --- |
| Completeness | x3 | 5/5 | 15/15 | Hosting, auth, product policy, fixtures, routes, provenance, promotion, rollback, and acceptance evidence are complete. |
| Feasibility | x3 | 5/5 | 15/15 | The chosen ClassKit environment, permission, SDK inputs, Cloudflare action outputs, and hosting behavior match verified contracts. |
| Clarity | x2 | 5/5 | 10/10 | Deployment labels, ClassKit enum, credential ownership, stop conditions, and evidence are unambiguous. |
| Logical Flow | x2 | 5/5 | 10/10 | Preconditions, deployment, live validation, synchronization, and second-cycle verification are correctly ordered. |
| Scope & Risk | x2 | 4/5 | 8/10 | External hostname and platform-administration dependencies remain, with explicit stop conditions and evidence gates. |
| Developer Experience | x1 | 5/5 | 5/5 | File seams, external prerequisites, checkpoints, rollback, and done evidence are concrete. |
| AI Readiness | x1 | 5/5 | 5/5 | Autonomy boundaries, forbidden actions, stop conditions, path accuracy, and objective checks are explicit. |

Overall: 68/70 -> Ready for Development

Critical Dimension Check: Pass; neither weighted x3 dimension scores 1.

## Handoff

PLAN APPROVED FOR IMPLEMENTATION

Key constraints:

- Preserve `.github/workflows/deploy-pages.yml`, production hosting, and
  `master`-only production deployment/versioning behavior.
- Do not create or push `staging` until the production `github-pages`
  environment allows only `master` and the staging ruleset is effective. Its
  one-time creation must target the exact reviewed implementation commit and
  record matching intended and created SHAs; all later changes require
  reviewed pull requests.
- Reserve the exact Cloudflare hostname before ClassKit or shared Auth
  configuration.
- Keep ClassKit product data, assignments, permissions, origins, and redirects
  isolated while using the supported `production` ClassKit environment enum.
- Pin workflow actions to reviewed immutable commits and preserve the exact
  evidence, rollback, and second-cycle promotion gates.

Suggested starting point: Verify the production GitHub environment restriction
and reserve `noya-website-staging.pages.dev`, then create the isolated ClassKit
product and external redirect controls before authoring the staging workflow.

First milestone: External production-isolation, hostname, ClassKit product, and
Auth redirect prerequisites are recorded and verified without creating or
pushing the `staging` branch.

Verdict: Ready for Development

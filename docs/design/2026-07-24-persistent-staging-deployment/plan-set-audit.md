# Persistent Staging Deployment Plan-Set Audit

## Audit Mode: Full

Rationale: The plan set spans repository changes, two deployment providers,
GitHub branch and environment administration, ClassKit product administration,
shared Supabase Auth configuration, live authentication/PWA acceptance, and a
four-chunk agent-executable sequence.

## Plan Overview

Objective: Implement a persistent Cloudflare Pages staging deployment from a
protected `staging` branch while preserving the existing production GitHub
Pages workflow, isolating ClassKit staging data and permissions, and proving
the staging experience and promotion model without promoting to production.

Scope: One production-guardrail chunk, one repository-change chunk, one
external-service provisioning chunk, and one live deployment/acceptance chunk.
The repository changes are limited to a new staging workflow, two validation
and evidence scripts, the bounded Vite public-base seam, and staging operations
documentation.

Explicitly excluded: Production workflow or hosting changes, production
promotion, direct Supabase or raw ClassKit Edge Function access, production
data reuse, preview deployments, a router or test-framework addition, custom
domains, and broad CI/CD redesign.

Target Audience: Human developers and AI agents operating under a separately
approved implementation card.

Readiness Level: Ready for Development.

Key Technical Decisions:

- Staging uses a dedicated Cloudflare Pages Direct Upload project and distinct
  browser origin.
- Production remains on `master` through the unchanged
  `.github/workflows/deploy-pages.yml`.
- Production retains `base: "/noya_website/"`; exact
  `VITE_PUBLIC_BASE=/` selects staging root output, while an absent or empty
  override preserves the production default.
- `index.html`'s `%BASE_URL%` manifest/icon links,
  `src/content/site-content.ts#getSitePath`, and
  `src/App.tsx#navigateTo` remain protected base-aware production seams.
- A future implementation card must name the exact `master`-derived commit
  containing the complete approved artifact set. The old
  `version/1.1.5`/`4c9f110` assumptions no longer appear in the plan set.
- The staging product remains `invite_only`; `/auth?mode=signup` retains its
  query-bearing URL but settles on sign-in after product policy loads.
- External writes are intended to require target-specific authority, with
  human-administrator gates where the executor is not the owner.

## Evidence Boundary

This focused rework audit inspected feedback `6a6728ae940e6a15bb3a2f7d`
against resolved `master` baseline
`c45145208adf63e88a931c3434fb6a17739e74d2`. That commit is the current
planning branch's merge base and an ancestor of planning HEAD
`b592c10fe42ed869cddf97828be5ae0ad88244fe`; the affected product files do not
differ between the baseline and planning HEAD. No build, lint, test, install,
browser session, deployment, branch mutation, or external administration
command was run.

Per the rework runbook, the audit compared only:

- `spec.md`;
- resolved `agenda.md`;
- refreshed ready `spec-audit.md`;
- root `plan.md`;
- `plans/02-staging-workflow-base-and-operations.md`; and
- current `vite.config.ts`, `index.html`,
  `src/content/site-content.ts`, `src/App.tsx`,
  `src/features/classes/signup-links.ts`,
  `src/register-service-worker.ts`, and `package.json`.

All unaffected plan boundaries and prior accepted audit findings were carried
forward without re-execution.

## File Path Verification

Verified using local repository inspection:

| Referenced Path | Status | Notes |
| --- | --- | --- |
| `.github/workflows/deploy-pages.yml` | Exists | Current production workflow triggers on `master` plus manual dispatch, writes source for push version bumps, creates `dist/404.html`, and deploys through `github-pages`. |
| `.github/workflows/deploy-staging.yml` | Not Found — planned | Owned only by Chunk 02 as an expected new file. |
| `vite.config.ts` | Exists | Current production base is exactly `"/noya_website/"`; Chunk 02 permits only the staging `/` override and preserves this default for absent/empty input. |
| `index.html` | Exists | Manifest and Apple icon URLs use `%BASE_URL%`, so production and staging expand from the selected base. |
| `README.md` | Exists | Chunk 02 owns the staging operations section. |
| `DESIGN_GUIDE.md` | Exists | Context only; no plan chunk modifies it. |
| `scripts/validate-staging-workflow.py` | Not Found — planned | Owned only by Chunk 02 as an expected new validator. |
| `scripts/staging-artifact-evidence.mjs` | Not Found — planned | Owned only by Chunk 02 as an expected new evidence tool. |
| `src/App.tsx` | Exists | `navigateTo` resolves route changes against `new URL(BASE_URL, origin)`; this production subpath seam is protected by Chunk 02. |
| `src/content/site-content.ts` | Exists | `getSitePath` prefixes site-owned navigation with `BASE_URL`; route predicates and assets remain base-aware. |
| `src/features/manager/manager-routes.ts` | Exists | Confirms all ten canonical manager tabs and trailing-slash normalization. |
| `src/features/account/auth-page.tsx` | Exists | Confirms signup is visible only when product `auth_mode === "open"`; invite-only policy renders sign-in. |
| `src/features/classes/signup-links.ts` | Exists | Confirms generated lesson signup URLs use `BASE_URL`. |
| `src/lib/class-kit-client.ts` | Exists | Confirms the website delegates environment/product interpretation to `@class-kit/react`. |
| `src/register-service-worker.ts` | Exists | Confirms worker registration uses `BASE_URL`. |
| `public/manifest.webmanifest` | Exists | Uses relative `start_url`, scope, and icon paths. |
| `public/service-worker.js` | Exists | Derives the cached shell from registration scope. |
| `package.json` | Exists | Version is currently `1.1.14`; `lint` and `build` exist and no automated test script exists. |
| `bun.lock` | Exists | Confirms the private SDK Git+SSH dependency and pinned SDK revision. |
| `dist/index.html` | Not Found — generated | Correctly treated as build output rather than a source file. |
| `dist/404.html` | Not Found — generated | Correctly absent from source and forbidden in staging output. |
| `docs/design/2026-07-24-persistent-staging-deployment/spec.md` | Exists | Approved source. |
| `docs/design/2026-07-24-persistent-staging-deployment/agenda.md` | Exists | Resolved decision record. |
| `docs/design/2026-07-24-persistent-staging-deployment/spec-audit.md` | Exists | Ends with the ready design verdict. |
| `docs/design/2026-07-24-persistent-staging-deployment/plan.md` | Exists | Root sequencing, authority, coverage, and handoff contract. |
| `docs/design/2026-07-24-persistent-staging-deployment/plans/01-authority-and-production-guardrails.md` | Exists | No repository file ownership. |
| `docs/design/2026-07-24-persistent-staging-deployment/plans/02-staging-workflow-base-and-operations.md` | Exists | Sole owner of all five planned repository paths. |
| `docs/design/2026-07-24-persistent-staging-deployment/plans/03-staging-service-provisioning.md` | Exists | No repository file ownership. |
| `docs/design/2026-07-24-persistent-staging-deployment/plans/04-live-deployment-acceptance-and-promotion-proof.md` | Exists | No repository file ownership. |

All source paths are valid. Planned and generated paths are explicitly
identified rather than incorrectly claimed to exist.

## Focused Rework Closure

| Feedback Requirement | Status | Evidence |
| --- | --- | --- |
| Refresh against resolved `master` | Closed | `c45145208adf63e88a931c3434fb6a17739e74d2` is the planning branch merge base and ancestor; the affected source paths are unchanged through current planning HEAD. |
| Preserve production `/noya_website/` | Closed | Root `plan.md` and Chunk 02 now match current `vite.config.ts` and forbid replacing the production default. |
| Use `/` only for staging | Closed | Exact `VITE_PUBLIC_BASE=/` is the sole staging override and the staging environment contract fixes that value. |
| Preserve absent/empty behavior | Closed | Chunk 02 explicitly maps both absent and empty input to `/noya_website/`; every other non-empty value fails with `VITE_PUBLIC_BASE must be "/" or unset`. |
| Preserve `%BASE_URL%` HTML seams | Closed | Chunk 02 forbids altering the current manifest and Apple-icon placeholders and checks their expansion in both generated artifacts. |
| Preserve base-aware routing | Closed | `getSitePath` and `navigateTo` are named source seams, forbidden from weakening, and inspected after the production-default build. Signup-link and service-worker consumers are preserved too. |
| Verify the production artifact | Closed | The unset-variable build must emit manifest, Apple icon, JS, and CSS URLs beneath `/noya_website/`. |
| Verify the staging artifact | Closed | The exact-`/` build must emit root manifest, icon, JS, CSS, signup-link, and service-worker behavior; `/noya_website/` output and `dist/404.html` are rejected. |
| Remove stale repository assumptions | Closed | No `6f322ff` or `base: "./"`/relative-default assumption remains in the reworked spec, agenda, refreshed spec audit, root plan, or Chunk 02. |

## Strengths

### 1. Four-chunk sequencing protects production before staging exists

The sequence is strict and non-parallel: authority and the master-only
production environment first, repository semantics and static gates second,
external staging services third, and branch creation/live deployment last.
Chunk 04 cannot create `staging` until the production environment restriction,
ruleset, workflow validation, and all service read-after-write checks pass.

### 2. Repository file ownership is exact and non-overlapping

Only Chunk 02 changes repository files. It owns exactly:

- `.github/workflows/deploy-staging.yml`;
- `vite.config.ts`;
- `README.md`;
- `scripts/validate-staging-workflow.py`; and
- `scripts/staging-artifact-evidence.mjs`.

Chunks 01, 03, and 04 correctly own external state and evidence rather than
source files. The production workflow is explicitly read-only and compared
byte-for-byte with the future implementation-card baseline.

### 3. Route and invite-only behavior match current code

The plan covers all eight current top-level routes:
`/`, `/lessons`, `/pricing`, `/auth`, `/profile`, `/manager`, `/terms`, and
`/health-declaration`. It separately covers the ten current manager tabs:
`classes`, `pending`, `templates`, `schedules`, `documents`, `memberships`,
`customers`, `permissions`, `change-requests`, and `settings`.

`src/App.tsx` preserves the auth query while
`src/features/account/auth-page.tsx` forces sign-in whenever the product is not
open. The Chunk 04 requirement for `/auth?mode=signup` therefore matches the
approved `invite_only` contract and observable code.

### 4. Repository grounding now matches the production release

The plan is grounded on resolved `master` baseline `c451452`, package version
`1.1.14`, and the current production project-site base. The stale `6f322ff`
and `"./"` assumptions are gone from the affected artifact set. The older
`version/1.1.5`/`4c9f110` assumptions also remain absent. A future
implementation card still names the exact artifact-containing commit used for
production-workflow comparison.

### 5. Production non-mutation is measured rather than assumed

The plan combines workflow semantic exclusions, a production-workflow byte
comparison, source/version/deployment snapshots, deterministic production web
fingerprints, a quiet window, and production run-ID equality. A concurrent
production run makes the result inconclusive and forces a later retry instead
of being misattributed to staging.

### 6. Repository-native verification is concrete

The plan uses the existing Bun lockfile and package scripts:
`bun install --frozen-lockfile`, `bun run lint`, one production-default build
with `VITE_PUBLIC_BASE` removed from the environment, and one staging build
with exact `/`. It then inspects both generated artifacts against distinct
base-path contracts. The invalid-value build must fail with the exact named
error. It correctly notes that no automated test script or existing browser
framework is available. Structural YAML validation and deterministic artifact
verification are assigned to the two planned repository scripts. No command
starts a development server.

### 7. External ownership and stop conditions are complete

GitHub environment/ruleset changes, Cloudflare resources, ClassKit product
configuration, shared Supabase Auth redirects, staging fixture writes, and
branch creation each have classifications, preflights, post-write evidence,
and rollback restrictions. The ClassKit SDK deploy-key collection is now also
an explicit target with a read-only registration contract. Exact-hostname
failure, unavailable authority, changed SDK inputs, production drift, and
concurrent production activity all stop or invalidate execution.

## Critical Issues

None.

The prior SDK deploy-key authority blocker is closed:

- Root `plan.md` now names GitHub repository
  `khgs2411/class-kit-sdk`, exact title
  `noya-website-staging-sdk-read`, read-only registration, the ClassKit SDK
  repository administrator, and the required implementation-card
  authorization.
- The matrix requires exact inventory and expected-fingerprint preflight,
  then records the numeric key ID, exact title, `read_only == true`, and the
  matching public-key fingerprint.
- Chunk 03 generates a dedicated Ed25519 keypair only after target-specific
  authorization, registers only the public key, and verifies exactly one
  matching deploy key through the dedicated GitHub API.
- Private key material may be stored only in
  `STAGING_CLASS_KIT_SDK_DEPLOY_KEY` and is forbidden from logs and durable
  evidence.
- Removal is a separate destructive mutation requiring new authorization
  naming the recorded key ID.

This is continuous with Chunk 01's matrix-derived authority record and
Chunk 03's GitHub-environment secret storage, so the executor no longer faces
an unclassified cross-repository mutation.

## Questions for Plan Author

None.

## Recommendations

### Status precision

- Change root `plan.md`'s “Canonical committed source verified: Yes” wording
  to distinguish a defined future commit gate from a commit already verified.
  The current planning artifacts are still uncommitted, although Chunk 01's
  future baseline check is correct and sufficient for execution safety.

### External evidence writes

- Classify creation/update of the durable GitHub PR evidence comment and the
  implementation-card link, or explicitly state that those reporting writes
  are authorized by the future implementation card. They are lower risk than
  credential registration, but the current blanket “external writes” wording
  otherwise overstates matrix completeness.

### Command reproducibility

- Record the accepted `uv` execution expectation alongside the planned
  PyYAML validator, because `uv run --with PyYAML` is an execution-host tool
  rather than a package script. The command is concrete and currently
  available, so this is not a development blocker.

### Empty override evidence

- Add one explicit `VITE_PUBLIC_BASE=` production-default check, or an
  equivalent focused assertion, alongside the existing unset build. The
  implementation task and consistency check already make empty-input behavior
  unambiguous, and neither deployed workflow relies on an empty override, so
  this is a non-blocking strengthening of the evidence rather than a missing
  design decision.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Staging override regresses production project-site paths | Low | High | Preserve `/noya_website/` for absent/empty input and inspect `%BASE_URL%`, navigation seams, and both generated artifacts. |
| SDK deploy key registration is duplicated or mismatched | Low | High | Require the exact title/fingerprint preflight, one numeric returned key ID, `read_only == true`, and matching post-write fingerprint. |
| Exact Cloudflare hostname is unavailable | Low | High | Preserve the pre-ClassKit, pre-upload stop gate and require design review for any alternate URL. |
| Production manual dispatch can target staging | Low | High | Complete Chunk 01's exact master-only environment policy before creating `staging`. |
| ClassKit or shared Supabase administration is unavailable | Medium | High | Stop at the named human-admin gates; do not bypass from the website. |
| A production run overlaps the staging observation window | Medium | Medium | Mark the window inconclusive by run ID and repeat it later. |
| Future implementation starts from an artifact-incomplete commit | Low | High | Require the implementation-card SHA and Chunk 01 byte-for-byte artifact gate. |

Highest Risk: Exact Cloudflare hostname reservation and authorized external
administration remain the largest execution risks. Both have explicit stop
conditions, target-specific authority, redacted evidence, and non-automatic
rollback boundaries.

## Pre-Development Checklist

- [x] Approved spec, agenda, and design audit are represented in the plan set.
- [x] Four chunks have strict 01 → 02 → 03 → 04 dependencies.
- [x] Repository file ownership is exact and non-overlapping.
- [x] All eight top-level routes are covered.
- [x] All ten canonical manager tab routes are covered.
- [x] `/auth?mode=signup` preserves the URL and renders sign-in under
      `invite_only`.
- [x] Stale `version/1.1.5` and `4c9f110` assumptions are absent.
- [x] The future implementation-card baseline owns workflow byte comparison.
- [x] Production workflow, artifact, branch, and version non-mutation are
      explicitly verified.
- [x] Repository-native lint/build commands and the absence of an automated
      test script are correctly represented.
- [x] The ClassKit SDK deploy-key target, exact title, read-only registration,
      preflight, evidence, private-key redaction, and rollback authority are
      explicit.
- [x] The resolved SDK deploy-key authority delta has been independently
      re-audited.
- [x] Resolved `master` baseline `c451452` is the planning branch merge base
      and the affected source seams remain unchanged through planning HEAD.
- [x] Absent or empty `VITE_PUBLIC_BASE` preserves `/noya_website/`.
- [x] Exact `VITE_PUBLIC_BASE=/` selects staging-root output.
- [x] Every other non-empty override fails with the named validation error.
- [x] `%BASE_URL%`, `getSitePath`, `navigateTo`, signup-link, and
      service-worker seams remain protected.
- [x] Production-default and staging generated artifacts have distinct,
      objective path checks.
- [x] Stale `6f322ff` and `"./"` production-default assumptions are absent
      from the affected plan artifacts.

## Next Steps

1. Approve the complete plan set for execution through a separate
   implementation card.
2. Name the exact `master`-derived artifact-containing commit and every
   confirm-first external mutation in that card.
3. Begin with Chunk 01; do not create or push `staging` until its production
   and authority gates pass.

## Evaluation Matrix

| Dimension | Weight | Raw Score | Weighted Score | Notes |
| --- | --- | --- | --- | --- |
| Completeness | x3 | 5/5 | 15/15 | Requirements, routes, files, dual-base artifacts, evidence, acceptance, and external mutations have complete ownership and coverage. |
| Feasibility | x3 | 5/5 | 15/15 | Public-base seams and commands match resolved `master`; workflow topology, hosting, routing, and PWA checks remain feasible. |
| Clarity | x2 | 5/5 | 10/10 | Production default, staging override, invalid values, protected consumers, exact identifiers, stop rules, and evidence are explicit. |
| Logical Flow | x2 | 5/5 | 10/10 | The strict four-chunk critical path correctly orders production protection, code, services, and live acceptance. |
| Scope & Risk | x2 | 4/5 | 8/10 | External hostname and administrator dependencies remain significant, with explicit stop, evidence, and rollback boundaries. |
| Developer Experience | x1 | 5/5 | 5/5 | File ownership, commands, milestones, exact identifiers, and blocked-state behavior are concrete. |
| AI Readiness | x1 | 5/5 | 5/5 | Autonomy, confirm-first and human-only gates, redaction, path accuracy, verification, and rollback rules are executable without guesswork. |

Overall: 68/70 -> Ready for Development

Critical Dimension Check: Pass; neither weighted x3 dimension scores 1.

## Handoff

PLAN APPROVED FOR IMPLEMENTATION

Key constraints:

- Start only from the exact artifact-containing commit named by the future
  approved implementation card.
- Execute 01 → 02 → 03 → 04 with no parallel chunks.
- Do not create or push `staging` until production is verifiably master-only.
- Register `noya-website-staging-sdk-read` on
  `khgs2411/class-kit-sdk` only after exact confirm-first authorization; keep
  it read-only and never expose the private key.
- Preserve `.github/workflows/deploy-pages.yml`, production hosting,
  production versioning, and all production before/after observations.
- Preserve production `/noya_website/`, `%BASE_URL%` HTML links,
  `getSitePath`, and `navigateTo`; exact `/` is staging-only.

Suggested starting point: Record the future implementation-card baseline and
complete Chunk 01's byte-for-byte artifact, target-specific authority, and
production guardrail checks.

First milestone: All Chunk 01 gates pass without creating a staging ref,
service, credential, or deployment.

Verdict: Ready for Development

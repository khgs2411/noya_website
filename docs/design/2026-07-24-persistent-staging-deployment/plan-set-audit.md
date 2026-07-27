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
- A future implementation card must name the exact `master`-derived commit
  containing the complete approved artifact set. The old
  `version/1.1.5`/`4c9f110` assumptions no longer appear in the plan set.
- The staging product remains `invite_only`; `/auth?mode=signup` retains its
  query-bearing URL but settles on sign-in after product policy loads.
- External writes are intended to require target-specific authority, with
  human-administrator gates where the executor is not the owner.

## Evidence Boundary

The repository and all plan artifacts were inspected at
`6f322ff60f8936f1ef5e12d3ec1efe4c27b5a0c0`, with the current uncommitted
planning changes included. No build, lint, test, install, browser session,
deployment, branch mutation, or external administration command was run.

The audit compared:

- `spec.md`;
- resolved `agenda.md`;
- ready `spec-audit.md`;
- root `plan.md`;
- all four files under `plans/`; and
- current workflow, package, routing, auth, signup-link, Vite, manifest, and
  service-worker source.

## File Path Verification

Verified using local repository inspection:

| Referenced Path | Status | Notes |
| --- | --- | --- |
| `.github/workflows/deploy-pages.yml` | Exists | Current production workflow triggers on `master` plus manual dispatch, writes source for push version bumps, creates `dist/404.html`, and deploys through `github-pages`. |
| `.github/workflows/deploy-staging.yml` | Not Found — planned | Owned only by Chunk 02 as an expected new file. |
| `vite.config.ts` | Exists | Current production base is exactly `"./"`; Chunk 02 owns the bounded override. |
| `README.md` | Exists | Chunk 02 owns the staging operations section. |
| `DESIGN_GUIDE.md` | Exists | Context only; no plan chunk modifies it. |
| `scripts/validate-staging-workflow.py` | Not Found — planned | Owned only by Chunk 02 as an expected new validator. |
| `scripts/staging-artifact-evidence.mjs` | Not Found — planned | Owned only by Chunk 02 as an expected new evidence tool. |
| `src/App.tsx` | Exists | Confirms query preservation, manager-root repair, and current top-level route composition. |
| `src/content/site-content.ts` | Exists | Confirms `/lessons`, `/pricing`, `/auth`, `/profile`, `/terms`, and `/health-declaration` predicates and `BASE_URL` use. |
| `src/features/manager/manager-routes.ts` | Exists | Confirms all ten canonical manager tabs and trailing-slash normalization. |
| `src/features/account/auth-page.tsx` | Exists | Confirms signup is visible only when product `auth_mode === "open"`; invite-only policy renders sign-in. |
| `src/features/classes/signup-links.ts` | Exists | Confirms generated lesson signup URLs use `BASE_URL`. |
| `src/lib/class-kit-client.ts` | Exists | Confirms the website delegates environment/product interpretation to `@class-kit/react`. |
| `src/register-service-worker.ts` | Exists | Confirms worker registration uses `BASE_URL`. |
| `public/manifest.webmanifest` | Exists | Uses relative `start_url`, scope, and icon paths. |
| `public/service-worker.js` | Exists | Derives the cached shell from registration scope. |
| `package.json` | Exists | Version is currently `1.1.11`; `lint` and `build` exist and no automated test script exists. |
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

### 4. The stale implementation baseline has been removed

No plan or approved design artifact retains `version/1.1.5`, `1.1.5`, or
`4c9f110`. The root plan and Chunk 01 instead require a future approved
implementation card to name an exact `master`-derived commit containing the
complete artifact set. Chunk 02 compares the production workflow with that
same recorded baseline, which avoids freezing implementation to an obsolete
inspection snapshot.

### 5. Production non-mutation is measured rather than assumed

The plan combines workflow semantic exclusions, a production-workflow byte
comparison, source/version/deployment snapshots, deterministic production web
fingerprints, a quiet window, and production run-ID equality. A concurrent
production run makes the result inconclusive and forces a later retry instead
of being misattributed to staging.

### 6. Repository-native verification is concrete

The plan uses the existing Bun lockfile and package scripts:
`bun install --frozen-lockfile`, `bun run lint`, and a staging-variable
`bun run build`. It correctly notes that no automated test script or existing
browser framework is available. Structural YAML validation and deterministic
artifact verification are assigned to the two planned repository scripts.
No command starts a development server.

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

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
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
| Completeness | x3 | 5/5 | 15/15 | Requirements, routes, files, evidence, acceptance, and every material external mutation now have complete ownership and authority coverage. |
| Feasibility | x3 | 5/5 | 15/15 | Repository seams, workflow topology, hosting, routing, PWA, and implementation commands are feasible against current evidence. |
| Clarity | x2 | 5/5 | 10/10 | Targets, exact identifiers, stop rules, evidence, redaction, and rollback classifications are explicit. |
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

Suggested starting point: Record the future implementation-card baseline and
complete Chunk 01's byte-for-byte artifact, target-specific authority, and
production guardrail checks.

First milestone: All Chunk 01 gates pass without creating a staging ref,
service, credential, or deployment.

Verdict: Ready for Development

# Persistent Staging Deployment Implementation Plan Set

**Approved Source:** `spec.md`
**Agenda:** `agenda.md`
**Pseudocode:** Absent
**Context:** `README.md` and `DESIGN_GUIDE.md`
**ADRs:** None
**Status:** Ready for Review

## Goal

Create a stable Cloudflare Pages staging deployment from a protected
`staging` branch, isolate its browser and ClassKit product behavior from
production, preserve the existing production GitHub Pages workflow, and leave
an evidence-backed promotion and rollback contract for a later implementation
card.

## Source Artifacts And Repository Evidence

- `spec.md` is the approved design source and `agenda.md` is its resolved
  decision record. Together with this roadmap and its four chunks, they contain every
  hosting, branch, credential, ClassKit, Supabase Auth, routing, PWA,
  promotion, authority, and evidence decision needed for execution.
- The future approved implementation card must name an exact `master`-derived
  commit containing this complete approved artifact set. That recorded commit,
  not the planning inspection snapshot, is the implementation baseline and the
  byte-comparison source for the production workflow.
- `spec-audit.md` ends with `Verdict: Ready for Development`.
- `.github/workflows/deploy-pages.yml` is the untouched production workflow.
- `vite.config.ts` owns the current `base: "./"` production behavior.
- `src/content/site-content.ts`,
  `src/features/classes/signup-links.ts`, and
  `src/register-service-worker.ts` consume `BASE_URL`.
- `public/manifest.webmanifest` and `public/service-worker.js` already use
  relative/scope-derived PWA paths.
- `src/lib/class-kit-client.ts` delegates the remote transport and product
  context to the pinned SDK.
- `src/App.tsx`, `src/content/site-content.ts`, and
  `src/features/manager/manager-routes.ts` define eight top-level routes and
  ten canonical manager-tab routes.
- `package.json` provides `lint` and `build`; there is no automated test
  script.
- Cloudflare, GitHub environment, ClassKit administration, and shared Supabase
  Auth configuration are external state and require authorized administrators.

Missing artifacts:

- `.github/workflows/deploy-staging.yml` is expected new.
- Cloudflare project, ClassKit staging product, GitHub environments/rulesets,
  and live deployment evidence do not exist in the repository and are created
  or verified during execution.
- No automated browser test framework exists; live route, PWA, auth, and
  capability evidence remains an explicit manual/browser acceptance layer.

## Design Readiness

- Canonical committed source verified: Yes. The spec, agenda, roadmap, chunks,
  and audits are self-contained and require no `.symphony` files at execution.
- Design paths verified: Yes.
- Pseudocode: Absent; no source-shape ambiguity requires it.
- Design audit: Ready for Development.
- Artifact consistency: Spec, agenda, and audit agree on Cloudflare Direct
  Upload, ClassKit environment `production`, staging product isolation,
  shared Supabase Auth redirect administration, protected branch flow, and
  production non-mutation.
- Repository constraints reconciled:
  - production keeps `base: "./"` and `dist/404.html`;
  - staging uses `VITE_PUBLIC_BASE=/` and omits `dist/404.html`;
  - staging never uses the production `github-pages` environment;
  - current obsolete production environment inputs remain untouched.
- Remaining non-blocking risks:
  - exact Cloudflare project-name availability is known only during
    provisioning;
  - GitHub and ClassKit/Supabase administration require authorized accounts;
  - live Google OAuth and capability evidence needs two controlled identities.
- Blockers: None. Each unavailable external prerequisite has a stop rule before
  staging branch creation or deployment.

## Reconciliations And Decision Ownership

| Item | Evidence / Decision Rule | Owning Chunk | Must Resolve Before |
| --- | --- | --- | --- |
| Immutable action pin | Resolve the reviewed commit for `cloudflare/wrangler-action` v3 and record it beside Wrangler `4.81.0`; do not use a mutable tag in the committed workflow. | Chunk 02 | Workflow review |
| Bun version | Pin one explicit version accepted by `oven-sh/setup-bun` and prove `bun install --frozen-lockfile`, lint, and build succeed; do not use `latest`. | Chunk 02 | Workflow review |
| Cloudflare alias output | Use `pages-deployment-alias-url` when non-empty; otherwise resolve the production alias through the deployment API using `pages-deployment-id`. | Chunk 04 | Canonical alias verification |

## Approved Chunks

| Chunk | Deliverable | Depends On | Enables | Verification Focus | Status |
| --- | --- | --- | --- | --- | --- |
| [01](plans/01-authority-and-production-guardrails.md) | Explicit external-mutation authority plus master-only production and protected-staging rules | None | Safe workflow implementation and later external provisioning | Dedicated GitHub policy APIs, ruleset detail, authority record | Ready for Review |
| [02](plans/02-staging-workflow-base-and-operations.md) | Bounded Vite base, semantically validated pinned staging workflow, evidence tooling, and operator documentation | Chunk 01 | Safe staging service provisioning | Structural YAML assertions, lint, staging build, deterministic artifact inspection | Ready for Review |
| [03](plans/03-staging-service-provisioning.md) | Least-privileged GitHub, Cloudflare, ClassKit access, and Supabase Auth staging services | Chunks 01–02 | Live staging deployment | Exact APIs/field sets, production-assignment absence, and redacted read-after-write evidence | Ready for Review |
| [04](plans/04-live-deployment-acceptance-and-promotion-proof.md) | First live deployment, product-context fixture, browser/auth evidence, production non-mutation proof, and promotion simulation | Chunks 01–03 | Client review and future production promotion | Deployment provenance, supported fixture reads, eight top-level routes, ten manager tabs, PWA/auth/capabilities, quiet-window snapshots | Ready for Review |

Boundary rationale:

- Chunk 01 separates authority and production protection from every staging
  commitment. Creating `staging` before the production restriction exists
  would expose production to the current manual workflow.
- Chunk 02 owns every repository change as one reviewable deployment contract.
  It validates YAML semantics and build output before new service commitments.
- Chunk 03 owns pre-deployment staging services and access policy after code
  validation.
- Chunk 04 establishes the live staging origin, then creates and proves the
  product-context business fixture before browser acceptance.

## Dependency And Parallelism Order

1. Chunk 01 runs first.
2. Chunk 02 follows after the production guardrail and authority record.
3. Chunk 03 follows only after Chunk 02 semantic/build checks pass.
4. Chunk 04 follows after staging services pass exact read-after-write checks.

No chunks run in parallel.

## External-State Authority

Approval of this plan set or a future implementation plan does not authorize
external writes. Read-only preflights are autonomous. Every confirm-first
mutation requires a written implementation-card authorization naming its exact
target and operation; human-admin-only mutations require the named
administrator to perform the change and supply redacted evidence.

| Target | Mutation | Classification / Owner | Required authorization | Preflight | Post-write evidence | Rollback authority |
| --- | --- | --- | --- | --- | --- | --- |
| GitHub `github-pages` environment | Restrict deployment policy to `master` | Confirm-first / repository admin | Card entry naming environment and master-only change | Environment plus branch-policy collection | Exact one-policy assertion | New explicit approval; never broaden automatically |
| GitHub staging ruleset | Create active `refs/heads/staging` protections | Confirm-first / repository admin | Card entry naming ruleset and rules | Detailed existing rulesets and bypass actors | Detailed ruleset assertion | New explicit approval |
| Repository staging environment, secrets, variables | Create/update exact staging-only names | Confirm-first / repository admin | Card entry naming environment and exact name sets | Dedicated environment/policy/secret/variable endpoints | Exact set assertions with values redacted | New explicit approval |
| GitHub `khgs2411/class-kit-sdk` deploy keys | Register the staging website's dedicated public key as read-only | Confirm-first / ClassKit SDK repository admin | Card entry naming repository, key title `noya-website-staging-sdk-read`, and read-only registration | Exact deploy-key inventory plus expected public-key fingerprint | New key ID/title, `read_only == true`, and matching fingerprint; private key never logged | Key deletion requires new explicit approval naming the exact key ID |
| Cloudflare account/project/token | Create single-purpose account, Pages project, Pages Edit token | Confirm-first / Cloudflare account owner | Card entry explicitly accepting account/project/token commitment | Account resources and projects | Exact project fields and permission summary | New explicit approval; no automatic deletion |
| ClassKit product and access | Create exact staging product, assignments, roles, and permission | Confirm-first / ClassKit platform admin | Card entry naming product key and access scope | ClassKit admin product/user/role reads | Exact fields and production-assignment absence | New explicit approval |
| ClassKit business fixture | Create template and schedule/class after staging is live | Confirm-first / ClassKit fixture administrator | Card entry naming staging product and fixture scope | Live product context plus `templates.manage` and `schedules.manage` | Supported management reads | New explicit approval |
| ClassKit signup fixture | Create signup link for the recorded class/range | Confirm-first / staging test manager | Card entry naming recorded fixture target | `dashboard.can_enter` plus `class_signup_links.manage` | Returned-slug resolution | New explicit approval |
| Shared Supabase Auth Redirect URLs | Add exact staging redirect | Human-admin-only / ClassKit Supabase project admin | Administrator performs change after explicit card approval | Redacted exact-URL set | Exact URL once and no wildcard | Administrator plus new explicit approval |
| `staging` branch creation and first deploy | Create ref at reviewed SHA, triggering workflow | Confirm-first / repository maintainer | Card entry naming SHA and acknowledging live deploy | Guardrails, services, and quiet-window preflight | Created ref SHA plus run/deployment provenance | Reviewed revert for code; external cleanup separately approved |
| `master`, production workflow/artifact/product/data | Any mutation beyond the approved master-only environment rule | Forbidden | Not available | Read-only snapshots only | Equality or inconclusive classification | Requires a new task and authority |

Canceling the currently authorized staging workflow run is the only autonomous
containment action. Do not delete branches/resources, revoke credentials,
weaken rulesets, disable environments, or mutate production without new
target-specific authority.

## Shared Contracts And Integration Points

- Stable URL: `https://noya-website-staging.pages.dev/`.
- Source branch: protected `staging`.
- Production trigger/host: unchanged `master` and GitHub Pages.
- Staging GitHub environment: `staging`, selected branch `staging`.
- Production GitHub environment: `github-pages`, selected branch `master`.
- Cloudflare account: single-purpose, containing only project
  `noya-website-staging`.
- Cloudflare production branch: `staging`.
- Workflow permissions: `contents: read`, `deployments: write`.
- Environment secrets:
  `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`,
  `STAGING_CLASS_KIT_SDK_DEPLOY_KEY`.
- ClassKit SDK deploy-key target and title:
  `khgs2411/class-kit-sdk`, `noya-website-staging-sdk-read`, read-only.
- Environment variables:
  `VITE_PUBLIC_BASE=/`, `VITE_CLASS_KIT_TARGET=remote`,
  `STAGING_URL=https://noya-website-staging.pages.dev/`.
- ClassKit product:
  `noya_website_staging`, `Noya's Website (Staging)`, active,
  environment `production`, `invite_only`, password and Google enabled.
- ClassKit origin:
  `https://noya-website-staging.pages.dev`.
- Google redirect and Supabase Auth Redirect URL:
  `https://noya-website-staging.pages.dev/`.
- Manager fixture permission: `class_signup_links.manage`.
- Staging deploy action:
  immutable `cloudflare/wrangler-action` v3 revision, Wrangler `4.81.0`,
  command
  `pages deploy dist --project-name=noya-website-staging --branch=staging`.
- Promotion: merge-commit-only `staging` to `master`, followed after
  production success by merge-commit-only `master` to `staging`.

## Approved-Source Coverage

| Requirement / Acceptance Criterion | Covered By | Notes |
| --- | --- | --- |
| Stable distinct production and staging URLs | Chunks 03–04 | Exact Cloudflare project and canonical alias |
| Staging cannot overwrite production | Chunks 01–04 | Master-only production environment, separate host, semantic workflow validation, before/after snapshots |
| Least-privileged environments, variables, secrets, and approval rules | Chunks 01, 03 | Authority matrix plus account, environment, branch, key, and token boundaries |
| Isolated staging ClassKit behavior/data | Chunks 03–04 | Separate assignments, production-assignment absence, and live product-context fixture; shared platform Auth identity acknowledged |
| Origin and two-level OAuth redirect configuration | Chunks 03–04 | ClassKit redirect plus exact Supabase Auth Redirect URL |
| Automatic staging updates, no version bump | Chunks 02, 04 | Push-only protected branch; no source write |
| Root/deep routes, signup links, PWA, password/Google auth, profile, manager | Chunk 04 | Eight top-level routes, ten manager tabs, trailing slashes, invite-only signup-query behavior, and two fixture identities |
| Production behavior unchanged | Chunks 01–02, 04 | Production workflow byte comparison and quiet-window snapshot equality |
| Reproducible staging-to-production promotion | Chunks 01, 04 | Merge-only review contract and second-cycle local history proof |
| Documentation and troubleshooting | Chunk 02 | `README.md` |
| No direct Supabase/raw Edge Function/product behavior changes | Chunks 01–04 | External admin ownership and source scans |

## Verification Strategy

1. Dedicated GitHub API resources prove authority boundaries before any
   staging branch exists.
2. A repository-owned structural PyYAML validator proves exact workflow
   trigger, permission, environment, ordering, immutable pins, and
   forbidden-reference semantics. This is the authoritative workflow check;
   the execution environment has no repository-native `actionlint`.
3. `bun run lint` and a staging-variable `bun run build` exercise TypeScript,
   Vite, and public-base integration.
4. Generated artifact inspection proves root paths and absence of `404.html`.
5. GitHub/Cloudflare deployment metadata maps source SHA to immutable and
   canonical staging URLs.
6. Browser checks exercise all route, signup, PWA, password, Google, profile,
   and capability boundaries.
7. Before/after production snapshots prove non-mutation.
8. An isolated temporary Git clone models two merge-commit promotion cycles
   without touching real branches.

### Deterministic Evidence Contract

- `scripts/staging-artifact-evidence.mjs` emits canonical JSON with each
  `dist` file's repository-relative path, byte length, and SHA-256, sorted by
  UTF-8 path bytes. The aggregate fingerprint is SHA-256 of the UTF-8 canonical
  JSON plus one trailing newline.
- Remote staging verification requests every manifest path without
  cross-origin redirects and requires status 200 plus byte-for-byte SHA-256
  equality. Route checks require status 200, `text/html` content type, and body
  SHA equal to local `dist/index.html`.
- A production web fingerprint uses the same canonical JSON rule over exact
  GET bodies for production root, `manifest.webmanifest`, and
  `service-worker.js`, alongside GitHub Pages deployment/run provenance.
  Chunk 01 computes it with built-in `curl`, Node, and `shasum` before the
  repository-owned evidence tool exists; the before and after commands and
  algorithms are identical.
- The execution lead owns one durable PR comment titled
  `Persistent staging implementation evidence`; it contains redacted
  authority, static, external, deploy, browser/auth, production-window, and Git
  simulation results and links the workflow run. The implementation card links
  that comment. Job summaries/artifacts are supporting evidence, not the sole
  record.
- Before/after production comparison runs only in a window with no active
  production workflow. Record production run IDs before and after. If a run
  starts, classify it by run ID, actor, ref, and SHA, mark the window
  inconclusive, and repeat later; never infer staging causation.

## Risks And Sequencing

- Production manual dispatch can target `staging` unless the `github-pages`
  environment is master-only. Chunk 01 blocks all later work until verified.
- Cloudflare Pages Edit is account-scoped. A single-project account bounds the
  token.
- The stable hostname may be unavailable. Stop before ClassKit or Supabase
  configuration if Cloudflare returns another hostname.
- OAuth needs both ClassKit and Supabase Auth redirect controls. Chunk 04 does
  not test Google until both are evidenced.
- Long-lived branch drift returns if squash/rebase/reset/cherry-pick is used.
  Branch rules, documentation, and the history simulation enforce the merge
  contract.
- Live identity credentials and service tokens must never enter repository
  files, command output, job summaries, screenshots, or the final report.

## Execution Handoff

Load the committed spec, agenda, both audits, root plan, and current chunk
before acting. Execute 01 → 02 → 03 → 04. No `.symphony` mission artifact is
an execution input. Stop when:

- the production environment is not verifiably master-only;
- the exact Cloudflare hostname is unavailable;
- the Cloudflare account contains another Pages project;
- required GitHub/ClassKit/Supabase authority is unavailable;
- the then-pinned SDK environment contract differs;
- an immutable action/Bun pin cannot pass the frozen install, lint, and build;
  or
- any staging action changes production observations.

Also stop before any external mutation whose exact authority-matrix approval
is absent or expired. A concurrent authorized production run makes the
observation window inconclusive; it is not evidence that staging caused a
production change.

The plan set is ready for review, not approved for execution.

## User Approval

- Roadmap approved by: Symphony Plan Only one-pass workflow on 2026-07-24
- Plan set approved for execution by: Pending

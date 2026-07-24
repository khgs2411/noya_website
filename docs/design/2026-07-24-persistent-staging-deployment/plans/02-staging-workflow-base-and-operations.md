# Chunk 02: Staging Workflow, Public Base, And Operations

**Plan Set:** `../plan.md`
**Canonical Source:** `../spec.md`, `../agenda.md`, and `../plan.md`; no
Symphony mission file is required
**Status:** Ready for Review
**Depends on:** Chunk 01
**Enables:** Chunk 03

## Goal

Add one pinned, push-only staging deployment workflow, a bounded staging public
base, and complete operator documentation while leaving production behavior
unchanged.

## Source Artifacts And Constraints

- `../spec.md`: GitHub Workflow, Vite/PWA, Documentation, Testing, and
  Implementation Constraints.
- Chunk 01's exact external identifiers and redacted evidence.
- `.github/workflows/deploy-pages.yml` is read-only.
- `vite.config.ts` retains the default `base: "./"`.
- `README.md` receives staging operations documentation.
- No production credential or obsolete production variable is copied.

## Relationships

- Consumes Chunk 01's production guardrail and authority record.
- Produces the workflow/build/evidence contract required before Chunk 03
  provisions staging services.
- Does not create branches or deploy.

## File Responsibility Map

**Create:**

- `.github/workflows/deploy-staging.yml` — protected-branch staging build and
  Cloudflare Direct Upload.
- `scripts/validate-staging-workflow.py` — YAML 1.2 structural assertions for
  exact trigger, permissions, environment, step ordering, pins, and forbidden
  semantics.
- `scripts/staging-artifact-evidence.mjs` — deterministic local/remote
  SHA-256 manifest, route-shell, asset, and production web fingerprint tool.

**Modify:**

- `vite.config.ts` — validated `VITE_PUBLIC_BASE` override with unchanged
  production default.
- `README.md` — staging setup, deploy, verification, promotion, rollback, and
  troubleshooting.

**Test:** No new test file; repository has no automated test framework.

## Behavioral And Contract Changes

- `VITE_PUBLIC_BASE` accepts `/` for staging; absent input remains `"./"`.
  Any other non-empty value fails configuration.
- Staging pushes lint, build, fingerprint, and deploy without source writes or
  a version bump.
- Cloudflare receives no top-level `404.html`, preserving its SPA fallback.
- Deployment metadata records source SHA, Cloudflare deployment ID, immutable
  URL, and canonical-alias evidence.

## Implementation Tasks

- [ ] Update `vite.config.ts` using Vite's config-time environment loading.
      Resolve `VITE_PUBLIC_BASE`; accept only absent/empty → `"./"` or exact
      `/` → `/`. Throw a named configuration error otherwise. Do not create a
      general base-path framework or touch consumers already using `BASE_URL`.
- [ ] Resolve and record an immutable commit for the reviewed v3
      `cloudflare/wrangler-action` release and one exact Bun version compatible
      with the lockfile. Keep Wrangler exactly `4.81.0`.
- [ ] Implement `scripts/validate-staging-workflow.py` with a YAML 1.2-safe
      PyYAML loader. Assert one push-only `staging` trigger, exact top/job
      permissions, exact `staging` environment, no arbitrary ref/input,
      immutable action SHAs, required step order, and absence of all production
      workflow/environment/credential/source-write semantics.
- [ ] Implement `scripts/staging-artifact-evidence.mjs` with two explicit
      modes:
      - local manifest/fingerprint using the root deterministic evidence
        contract; and
      - remote verification using a local manifest, manual redirect handling,
        exact status/content-type/body hashes, same-origin assets, and route
        shell equality.
- [ ] Create `.github/workflows/deploy-staging.yml`:
      - trigger only `push.branches: [staging]`;
      - set `contents: read` and `deployments: write`;
      - use concurrency `staging-pages` with cancellation;
      - reference GitHub environment `staging` and canonical URL;
      - check out the triggering SHA;
      - set up the pinned Bun version;
      - assert required variables/secrets are non-empty without printing them;
      - configure only the dedicated read-only SDK deploy key;
      - run `bun install --frozen-lockfile`, `bun run lint`, and staging build;
      - assert `dist/404.html` is absent and compute a deterministic dist
        fingerprint;
      - invoke the immutable Cloudflare action with exact account, token,
        project, branch, Wrangler, and GitHub token inputs; and
      - validate/write deployment provenance and fingerprint evidence.
- [ ] Run the structural validator before any Chunk 03 external provisioning.
      It is authoritative because this repository and current execution
      environment have no native `actionlint` toolchain. Supplement it with a
      raw forbidden-reference scan for the exact production environment,
      exact production credential expression, source-write, dispatch,
      arbitrary-ref, or GitHub Pages deployment references.
- [ ] Expand `README.md` with the complete setup and operations contract from
      the spec, including master-only production environment, branch rules,
      dedicated Cloudflare account, exact ClassKit/Supabase controls, retry,
      reviewed-revert rollback, merge-only promotion/sync, smoke matrix, and
      redaction rules.
- [ ] Compare `.github/workflows/deploy-pages.yml` byte-for-byte with its
      pre-change blob and repair any accidental change before review.

## Verification

- `git diff --check -- .github/workflows/deploy-staging.yml vite.config.ts README.md scripts/validate-staging-workflow.py scripts/staging-artifact-evidence.mjs`
  — expect exit 0.
- `uv run --with PyYAML python scripts/validate-staging-workflow.py .github/workflows/deploy-staging.yml`
  — expect exit 0 and a named success summary. The validator asserts YAML
  structure and step ordering, not text presence.
- `bun run lint`
  — expect ESLint exit 0.
- `VITE_PUBLIC_BASE=/ VITE_CLASS_KIT_TARGET=remote bun run build`
  — expect `tsc -b` and Vite exit 0.
- `test -f dist/index.html && test ! -e dist/404.html`
  — expect exit 0.
- `node scripts/staging-artifact-evidence.mjs manifest dist`
  — expect canonical JSON and aggregate SHA-256 covering every dist file.
- `if rg -n 'environment:[[:space:]]*github-pages|secrets\\.CLASS_KIT_SDK_DEPLOY_KEY|npm version|git commit|git push|pages:[[:space:]]*write|id-token:[[:space:]]*write|actions/deploy-pages|workflow_dispatch' .github/workflows/deploy-staging.yml; then exit 1; fi`
  — expect exit 0 with no forbidden staging behavior.
- `git diff --exit-code 4c9f110 -- .github/workflows/deploy-pages.yml`
  — expect exit 0; production workflow unchanged from the original
  repository-inspection snapshot. This does not require `4c9f110` to be the
  implementation branch tip.
- `VITE_PUBLIC_BASE=/unexpected bun run build` with stdout/stderr captured to a
  temporary log
  — expect non-zero.
- `rg -F 'VITE_PUBLIC_BASE must be either / or unset' <invalid-base-log>`
  — expect exactly the named validation error; an unrelated failure does not
  satisfy the negative test.

Remove generated `dist` only if it was created by this chunk and repository
practice permits; never remove a pre-existing user-owned artifact.

## Acceptance Criteria Covered

- Staging workflow is branch-specific, automatic, least-privileged, and cannot
  bump or write source.
- Production workflow and default base behavior remain unchanged.
- Staging build uses root asset/signup/PWA paths and Cloudflare SPA fallback.
- Operator setup, troubleshooting, promotion, and rollback are reproducible.

## Risks, Rollback, And Isolation

- A mutable action or Bun version makes the workflow non-reproducible; exact
  pins are mandatory. The semantic validator must reject mutable action refs.
- Rollback removes the new workflow and Vite override and reverts only the
  README section. External state belongs to Chunk 01 and is not silently
  removed.
- Never print secret values during required-input checks.

## Non-Goals

- Deploying or creating `staging`.
- Modifying production workflow/versioning.
- New router, PWA library, test framework, or dependency.
- Cloudflare preview deployments.

## Consistency Check

- The five owned paths do not appear in another chunk's file map.
- Workflow names, environment keys, project, URL, action outputs, and commands
  match the root plan.
- Production's absent `VITE_PUBLIC_BASE` still produces `"./"`.
- No command starts a dev server.

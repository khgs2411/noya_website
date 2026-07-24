# Chunk 01: Authority And Production Guardrails

**Plan Set:** `../plan.md`
**Approved Source:** `.symphony/assignment.md` accepted requirements;
`../spec.md` supplies audited design detail
**Status:** Ready for Review
**Depends on:** None
**Enables:** Chunk 02

## Goal

Record target-specific external mutation authority and establish the
master-only production deployment boundary before any staging service,
credential, branch, or deployment is created.

## Source Artifacts And Constraints

- `../spec.md`: Hosting Topology; Source Branch And Promotion Flow; GitHub
  Workflow And Environment Boundary.
- `../agenda.md`: Questions 1–6 and 8.
- `../spec-audit.md`: production-safety findings.
- `.github/workflows/deploy-pages.yml`: current manual-dispatch risk.
- No website source or workflow file changes belong in this chunk.
- Available credentials never imply authority to mutate external state.

## Relationships

- Establishes the production guardrail required by all later chunks.
- Establishes authorization records consumed by Chunks 03 and 04.
- No repository file ownership.

## File Responsibility Map

**Create:** None.

**Modify:** None.

**Test:** External configuration inspection only.

## Behavioral And Contract Changes

- Production `github-pages` accepts deployments from `master` only.
- A future `staging` ref is covered by an active ruleset requiring reviewed
  update PRs and forbidding deletion/non-fast-forward updates.
- Every future external write has an explicit approval source, owner, target,
  scope, and rollback classification before execution.

## Implementation Tasks

- [ ] Confirm the implementation baseline is branch `version/1.1.5` at
      `4c9f110`. Stop for design review if the implementation card names a
      different baseline.
- [ ] Create the external-state authority record from the root matrix. For
      every confirm-first target, require a written authorization entry on the
      approved implementation card naming the exact target and mutation. For
      human-admin-only targets, record the administrator role and required
      evidence. Do not infer authorization from this plan or credentials.
- [ ] Record the current production baseline before the GitHub environment
      change: `master` SHA, version at that SHA, latest `github-pages`
      deployment ID/timestamp/run provenance, production URL status, and the
      deterministic production web fingerprint defined below. This uses only
      built-in tools and does not depend on Chunk 02.
- [ ] Inspect the existing `github-pages` environment. Configure its selected
      deployment branch to exactly `master`, then re-read the effective rule.
      Stop before creating or pushing `staging` if the rule is absent, broader,
      bypassable by the staging workflow, or not verifiable.
- [ ] Create a GitHub ruleset targeting `refs/heads/staging` before that branch
      exists. Require reviewed pull requests for updates; forbid force pushes
      and deletion. Ensure neither `GITHUB_TOKEN` nor the staging workflow can
      bypass it. Merge-commit-only promotion and synchronization remain an
      operator/reviewer checklist because the branch ruleset does not safely
      impose a repository-wide merge-method change.
- [ ] Fetch the exact ruleset detail and assert enforcement, ref condition,
      rules, and empty bypass actors. Stop on any mismatch.
- [ ] Repeat the production environment and baseline reads. If a concurrent
      production run occurred, classify it by run ID, actor, ref, and SHA and
      mark the comparison window inconclusive rather than attributing it to
      this change.
- [ ] Post the redacted authority and production-guardrail evidence to the
      named implementation PR comment and link it from the implementation card.

## Verification

- `gh api repos/khgs2411/noya_website/environments/github-pages`
  — require `deployment_branch_policy.custom_branch_policies == true`.
- `gh api repos/khgs2411/noya_website/environments/github-pages/deployment-branch-policies --paginate`
  — canonicalize to sorted `[type, name]` pairs and require exact equality with
  `[["branch","master"]]`; an empty, additional, wildcard, or tag policy fails.
- `gh api repos/khgs2411/noya_website/rulesets`
  — filter by the planned name and require exactly one numeric ruleset ID.
- `gh api repos/khgs2411/noya_website/rulesets/{ruleset_id}`
  — require `target == "branch"`, `enforcement == "active"`, inclusion exactly
  `["refs/heads/staging"]`, no exclusions, `bypass_actors == []`, and rule
  types containing `pull_request`, `deletion`, and `non_fast_forward`.
  Require the pull-request rule to need at least one approving review and
  dismissal of stale approvals. Persist the canonical asserted fields in the
  named evidence comment.
- For both production snapshots, create a fresh `mktemp -d`, then use separate
  `curl --fail --silent --show-error --location --output` calls to save exact
  response bodies as `root`, `manifest.webmanifest`, and `service-worker.js`
  from:
  `https://khgs2411.github.io/noya_website/`,
  `https://khgs2411.github.io/noya_website/manifest.webmanifest`, and
  `https://khgs2411.github.io/noya_website/service-worker.js`.
  Use Node to emit UTF-8 canonical JSON containing the URL-relative filename,
  `Buffer.byteLength`, and `crypto.createHash("sha256")` digest for each file,
  sorted by UTF-8 filename bytes, with no insignificant whitespace. Append one
  newline and record `shasum -a 256` of that JSON. Require the after aggregate,
  all three entries, and GitHub Pages provenance to equal the before snapshot,
  then remove only that temporary directory. A fetch or hash failure blocks
  the mutation/comparison.

No build, test, install, or browser command runs in this chunk.

## Acceptance Criteria Covered

- Production deployment branch isolation.
- Protected future staging ref.
- Explicit authority boundary for every later external mutation.

## Risks, Rollback, And Isolation

- Do not create any staging service or ref until the production environment
  rule is effective and authority records exist.
- No automatic rollback of external state is authorized. Any reversal requires
  a new target-specific approval and must never broaden production access.

## Non-Goals

- Website/workflow changes or staging service provisioning.
- Production product, data, redirect, artifact, or hosting changes.

## Consistency Check

- Environment policy and detailed ruleset assertions use their dedicated API
  resources.
- Authority records cover every later external target.
- Chunk 02 remains blocked until the production boundary is verified.

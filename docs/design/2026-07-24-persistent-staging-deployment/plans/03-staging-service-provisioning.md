# Chunk 03: Staging Service Provisioning

> **Suspended — superseded by the 2026-07-27 architecture amendment.**
>
> Do not execute this chunk. The separate staging account/project topology is
> no longer approved. See the addenda at the top of `../spec.md` and
> `../plan.md`; replacement chunks must be written and approved first.

**Plan Set:** `../plan.md`
**Approved Source:** `../spec.md`
**Status:** Ready for Review
**Depends on:** Chunks 01 and 02
**Enables:** Chunk 04

## Goal

Provision the approved GitHub staging environment, single-purpose Cloudflare
project, ClassKit staging product/access policy, and exact Supabase Auth
redirect only after the staging workflow passes semantic and build validation.

## Source Artifacts And Constraints

- `../spec.md`: Configuration And Credentials; ClassKit Staging Product And
  Authentication.
- Root-plan external authority matrix and explicit authorization records from
  Chunk 01.
- Chunk 02's validated workflow, public-base build, and evidence tooling.
- Each external write is confirm-first or human-admin-only; plan approval and
  credential availability are not mutation authority.
- No source file changes belong in this chunk.

## Relationships

- Consumes the safe production boundary from Chunk 01.
- Consumes exact identifiers and validation tools from Chunk 02.
- Supplies environment, product access, and credentials to Chunk 04. The
  business fixture waits for Chunk 04's live product context.

## File Responsibility Map

**Create:** None.

**Modify:** None.

**Test:** Read-after-write API/admin inspection only.

## Behavioral And Contract Changes

- GitHub environment `staging` exposes only the approved secret/variable names
  to branch `staging`.
- A single-purpose Cloudflare account contains exactly one Pages project with
  the exact canonical hostname and production branch.
- ClassKit resolves the exact origin to the isolated active staging product,
  and both test identities are absent from the production product.
- Supabase Auth accepts the exact Google return URL without a wildcard.

## Implementation Tasks

- [ ] Reconfirm the unexpired explicit authorization record for each target in
      the root authority matrix. If a human administrator owns a write, pause
      until that administrator supplies the specified redacted evidence.
- [ ] Create the dedicated Cloudflare account and verify it contains no Pages,
      Workers, DNS, or unrelated resources before project creation. Create
      Direct Upload project `noya-website-staging` with production branch
      `staging`. Stop immediately if `subdomain` is not exactly
      `noya-website-staging.pages.dev`.
- [ ] Create a Cloudflare API token with only account-level Pages Edit for that
      single-purpose account. Do not log or return the token value.
- [ ] After confirming target-specific authorization for
      `khgs2411/class-kit-sdk`, generate a dedicated Ed25519 keypair for this
      staging workflow. Preflight the repository's deploy-key inventory, then
      register only the public key with title
      `noya-website-staging-sdk-read` and `read_only=true`. Record the returned
      key ID and verify the returned public-key fingerprint matches the
      generated key. Never print, upload anywhere else, or persist the private
      key outside the `STAGING_CLASS_KIT_SDK_DEPLOY_KEY` environment secret.
      Do not reuse the production SDK credential or Cloudflare token.
- [ ] Create GitHub environment `staging` with custom deployment-branch policy,
      add exactly branch policy `staging`, store the three secret names and
      three variable names from the shared contract, and perform exact
      read-after-write set assertions with values redacted.
- [ ] Through ClassKit platform administration, provision the exact
      `noya_website_staging` product, origin, auth policy, Google redirect,
      product-user assignments, roles, and permission
      `class_signup_links.manage`. Do not attempt the business fixture before
      the canonical staging origin is live.
- [ ] Have a ClassKit platform administrator add the exact trailing-slash URL
      to shared Supabase Auth Redirect URLs once. The executor does not make
      this Supabase mutation. Do not add a wildcard or change Site URL.
- [ ] Re-read every target using the exact endpoints/fields below. Compare
      canonical JSON/name sets, not screenshots alone. Preserve only redacted
      evidence.

## Verification

- `gh api repos/khgs2411/noya_website/environments/staging`
  — require `deployment_branch_policy.custom_branch_policies == true`.
- `gh api repos/khgs2411/noya_website/environments/staging/deployment-branch-policies --paginate`
  — canonicalize to sorted `[type, name]` pairs and require exact equality with
  `[["branch","staging"]]`; an empty, additional, wildcard, or tag policy
  fails.
- `gh api repos/khgs2411/noya_website/environments/staging/secrets --jq '[.secrets[].name] | sort'`
  — compare exactly with
  `["CLOUDFLARE_ACCOUNT_ID","CLOUDFLARE_API_TOKEN","STAGING_CLASS_KIT_SDK_DEPLOY_KEY"]`.
- `gh api repos/khgs2411/noya_website/environments/staging/variables --jq '([.variables[] | {key:.name,value:.value}] | sort_by(.key)) == [{key:"STAGING_URL",value:"https://noya-website-staging.pages.dev/"},{key:"VITE_CLASS_KIT_TARGET",value:"remote"},{key:"VITE_PUBLIC_BASE",value:"/"}]'`
  — require the sole output `true`; this compares the exact non-secret
  name/value map without echoing returned values.
- `gh api repos/khgs2411/class-kit-sdk/keys --paginate`
  — before registration, require no existing deploy key with title
  `noya-website-staging-sdk-read` or the generated public-key fingerprint;
  after registration, require exactly one matching key with a numeric ID,
  exact title, `read_only == true`, and a public-key fingerprint equal to the
  locally generated public key. Persist only the key ID, title, read-only
  boolean, and fingerprint; never persist or print the private key.
- Cloudflare `GET /accounts/{account_id}/pages/projects`
  — require exactly one result.
- Cloudflare `GET /accounts/{account_id}/pages/projects/noya-website-staging`
  — require `name == "noya-website-staging"`,
  `subdomain == "noya-website-staging.pages.dev"`, and
  `production_branch == "staging"`. Log no credential fields.
- ClassKit Admin SDK/admin-app product inventory and product-detail reads
  — select only product `noya_website_staging` and assert exact product key,
  name, active status, `invite_only`, password/Google flags, allowed origin,
  environment `production`, and active default Google redirect.
- ClassKit Admin SDK/admin-app product-user, product-role, user-role, and
  permission reads scoped to `noya_website_staging`
  — require exactly the two named staging test identities to have staging
  product-user assignments; require the non-manager to lack manager capability
  and require the manager to have `dashboard.can_enter` and exact
  `class_signup_links.manage`. Persist only pseudonymous labels, hashed user
  IDs, and canonical capability booleans.
- `admin.users.listProductUsers("noya_website")`
  — compare the exact two staging test user IDs in memory and require neither
  appears in the production product-user result. Do not infer absence from the
  staging-scoped read or compare by email alone.
- Supabase Dashboard Authentication > URL Configuration export/administrator
  evidence
  — require the exact trailing-slash staging URL once and no URL matching
  `*.pages.dev`; redact unrelated redirect entries.

No install, lint, build, browser, branch creation, or deployment runs here.

## Acceptance Criteria Covered

- Exact stable staging host and branch.
- Least-privileged GitHub/Cloudflare/SDK credentials.
- Separate ClassKit product assignments, policy, permissions, and explicit
  production-assignment absence.
- Complete ClassKit plus Supabase Auth Google redirect controls.

## Risks, Rollback, And Isolation

- Stop before ClassKit/Supabase writes when the canonical hostname differs.
- No automatic cleanup is authorized. On failure, preserve an inventory of
  newly created staging-only objects and request target-specific rollback
  authority. Never delete or weaken production configuration.
- Removing the ClassKit SDK deploy key is a separate destructive mutation that
  requires new authorization naming its recorded key ID.
- Secret/variable evidence contains names and redacted metadata only.

## Non-Goals

- Branch creation, live deployment, or browser testing.
- Production configuration beyond the already approved Chunk 01 environment
  restriction.
- Production data/identity assignments or a separate Supabase backend.

## Consistency Check

- Every write has an authorization record from Chunk 01.
- Exact name sets and API fields match the root shared contract.
- “Staging” is not used as a ClassKit environment enum.
- Chunk 04 remains blocked until all pre-deployment read-after-write assertions
  pass; it owns the live product-context business fixture.

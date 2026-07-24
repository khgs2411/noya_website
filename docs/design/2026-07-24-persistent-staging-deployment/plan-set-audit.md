# Persistent Staging Deployment Implementation Plan-Set Final Audit

## Audit Mode: Full

Rationale: This final follow-up verifies the last ClassKit
fixture-authorization blocker after the complete cross-system plan had already
closed its production, workflow, evidence, external-authority, and sequencing
findings.

## Plan Overview

Objective: Create a stable Cloudflare Pages staging deployment from a protected
`staging` branch while preserving the production GitHub Pages artifact,
`master`, production versioning behavior, and ClassKit ownership boundaries.

Scope: Explicit external-state authority, production and staging GitHub
guardrails, a bounded Vite base, a structurally validated staging workflow,
deterministic evidence tooling, dedicated Cloudflare and ClassKit staging
services, exact shared Auth redirect configuration, live product-context
fixture creation, route/auth/PWA acceptance, production non-mutation evidence,
and a disposable promotion-history simulation.

Target Audience: Human developers and AI agents executing a later approved
implementation card.

Readiness Level: Ready for Development.

## File Path Verification

Only artifacts changed for the final ClassKit repair were rechecked:

| Referenced Path | Status | Notes |
| --- | --- | --- |
| `docs/design/2026-07-24-persistent-staging-deployment/plan.md` | Exists | Authority matrix separates product access, business fixture, and signup fixture owners. |
| `docs/design/2026-07-24-persistent-staging-deployment/plans/03-staging-service-provisioning.md` | Exists | Owns pre-deployment product/access state and production-assignment absence. |
| `docs/design/2026-07-24-persistent-staging-deployment/plans/04-live-deployment-acceptance-and-promotion-proof.md` | Exists | Owns live administrator fixture creation, manager signup-link creation, and acceptance. |
| `src/lib/class-kit-client.ts` | Exists | Website remains on the pinned `@class-kit/react` boundary. |

All previously verified source, workflow, PWA, plan, and expected-new paths
remain unchanged. No repository ownership overlap was introduced.

## Final Finding Closure

| Prior Finding | Status | Evidence |
| --- | --- | --- |
| Fixture manager was not guaranteed `templates.manage` and `schedules.manage` | Closed | The root matrix and Chunk 04 assign template/schedule/class setup to a distinct ClassKit fixture administrator and require both permissions before mutation. |
| Test manager could be over-privileged for setup | Closed | Signup-link creation remains with the staging test manager, which needs only `dashboard.can_enter` and `class_signup_links.manage`; the plan forbids granting template/schedule mutation solely for setup. |
| Business fixture lacked supported readback | Closed | The live product context uses `management.templates.list()`, `management.schedules.list()`, and `management.classes.list()`. |
| Signup-link evidence lacked a supported read | Closed | The test manager preserves the slug returned by `management.signupLinks.create(...)`, then `signupLinks.resolve(recordedSlug)` proves the exact class/range. |
| Test identities might also belong to production | Closed | Chunk 03 calls `admin.users.listProductUsers("noya_website")` and compares both exact test user IDs in memory. |

## ClassKit Boundary Verification

### Product And Access Administration

Chunk 03 remains limited to state supported by ClassKit admin surfaces:

- product identity, status, environment, auth policy, origin, and redirect;
- staging product-user assignments;
- product roles, user-role assignments, and effective permissions; and
- exact absence of both test IDs from the production product.

Shared Supabase Auth redirect administration remains human-admin-only.

### Business-Fixture Administrator

After successful deployment and canonical artifact verification, Chunk 04
authenticates a separately authorized ClassKit fixture administrator at the
live staging origin. It requires:

- product context `noya_website_staging`;
- effective `templates.manage`; and
- effective `schedules.manage`.

That principal alone creates the minimum active template and schedule needed
to yield one visible upcoming class. It is explicitly distinct from the
non-manager and manager acceptance identities.

This matches the current ClassKit guards:

| Mutation | Required Permission | Plan Principal |
| --- | --- | --- |
| Create template | `templates.manage` | Fixture administrator |
| Create schedule / generate class | `schedules.manage` | Fixture administrator |

### Signup-Link Test Manager

The staging test manager separately requires:

- product context `noya_website_staging`;
- `dashboard.can_enter`; and
- `class_signup_links.manage`.

It creates the review signup link for the recorded class/range, preserves the
returned slug, and resolves that slug through the public product-context API.
The plan explicitly does not grant this identity template or schedule mutation
merely to facilitate setup.

This preserves least privilege while still exercising the exact manager
capability under acceptance.

## Scope And Acceptance Coverage

| Requirement / Acceptance Criterion | Assessment |
| --- | --- |
| Staging product identity/policy/origin/redirect | Complete |
| Two staging-only acceptance identities | Complete |
| Exact absence from production product users | Complete |
| Live canonical product context before business writes | Complete |
| Template/schedule mutation authority | Complete |
| Fixture administrator separated from acceptance users | Complete |
| Template/schedule/class readback | Complete |
| Signup-link manager authority | Complete |
| Exact returned-slug resolution | Complete |
| Non-manager denial and manager access | Complete |
| No website Supabase/raw Edge Function access | Complete |

## Sequencing And Dependencies

The final ClassKit sequence is deterministic:

1. Chunk 03 provisions product identity, test users, roles, permissions, and
   redirects through authorized admin surfaces.
2. It separately proves the two test IDs are absent from production.
3. Chunk 04 deploys and verifies the recorded artifact at the canonical origin.
4. The distinct fixture administrator proves the staging product context and
   both setup permissions before creating template/schedule/class state.
5. The staging test manager proves its narrower signup-link authority, creates
   the link for the recorded target, and preserves the slug.
6. Supported list/resolve calls prove the complete fixture.
7. Browser/auth acceptance exercises the non-manager and manager identities.

No setup mutation relies on an unproven permission, and the acceptance
identities are not broadened for operational convenience.

## Repository-Native Contract Verification

| Operation | Supported Method | Required Authority | Status |
| --- | --- | --- | --- |
| Read staging users/roles/permissions | ClassKit admin SDK methods | Platform admin | Complete |
| Prove production user absence | `admin.users.listProductUsers("noya_website")` | Platform admin | Complete |
| Create/read template | `management.templates.create/list` | `templates.manage` | Complete |
| Create/read schedule | `management.schedules.create/list` | `schedules.manage` | Complete |
| Read generated class | `management.classes.list` | Live staging manager context | Complete |
| Create signup link | `management.signupLinks.create` | `class_signup_links.manage` | Complete |
| Resolve signup slug | `signupLinks.resolve(recordedSlug)` | Live staging product context | Complete |

No build, lint, test, install, browser, or external mutation was performed
during this final audit.

## Strengths

### 1. Least Privilege Is Preserved

Operational fixture setup and acceptance-manager behavior use separate
principals. The plan does not distort the product's test roles to simplify
provisioning.

### 2. Every Mutation Has A Matching Preflight

Template, schedule, and signup-link creation each follow an explicit product
context and effective-permission check.

### 3. Fixture Evidence Is End-To-End

The plan connects administrator-created template/schedule/class IDs to the
test-manager-created signup link and then to public slug resolution.

### 4. Identity Isolation Is Objective

Production absence is tested using immutable user IDs against the production
product, not inferred from staging state or email.

### 5. ClassKit Ownership Remains Intact

All product, access, permission, and business behavior stays in ClassKit
surfaces. Noya owns only workflow integration, presentation, and acceptance.

## Critical Issues

None. All previously blocking production-isolation, external-authority,
workflow-validation, evidence, quiet-window, ClassKit method, identity, and
fixture-permission findings are closed.

## Questions For Plan Author

None.

## Recommendations

### Execution Evidence

- Record the fixture administrator and acceptance identities only through
  pseudonyms and stable hashed IDs.
- Preserve the effective permission pass/fail set, not raw unrelated
  permissions.
- Link the template, schedule, generated class, and signup target through
  hashed IDs in the durable evidence comment.

These are reporting refinements; the plan already defines the required
redaction and evidence boundary.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Fixture administrator lacks a setup permission | Low | High | Chunk 04 requires both effective permissions before mutation. |
| Acceptance manager is accidentally broadened | Low | Medium | Explicitly forbid template/schedule grants solely for setup. |
| Signup link targets unrelated data | Low | High | Create from the recorded class/range and resolve the exact returned slug. |
| Test identity has production assignment | Low | High | Exact production product-user read before live acceptance. |
| Canonical origin resolves the wrong product | Low | High | Require `noya_website_staging` before any fixture write. |

Highest Risk: External platform or principal authority may be unavailable at
execution time. The existing authority matrix and stop rules correctly convert
that condition into a blocked implementation rather than an unsafe fallback.

## Pre-Development Checklist

- [x] Product/access provisioning uses supported admin surfaces.
- [x] Both acceptance identities are absent from production.
- [x] Live canonical product context precedes business writes.
- [x] Fixture administrator is distinct from both acceptance identities.
- [x] Fixture administrator has `templates.manage`.
- [x] Fixture administrator has `schedules.manage`.
- [x] Test manager has `dashboard.can_enter`.
- [x] Test manager has `class_signup_links.manage`.
- [x] Test manager is not broadened for fixture setup.
- [x] Template, schedule, and class use supported readback.
- [x] Signup evidence preserves and resolves the exact returned slug.
- [x] All prior plan-set audit blockers remain closed.

## Next Steps

1. Approve the plan set for a separately authorized implementation card.
2. Execute Chunks 01 → 02 → 03 → 04 without combining their authority gates.
3. Preserve the durable redacted PR evidence comment and implementation-card
   backlink.

## Evaluation Matrix

| Dimension | Weight | Raw Score | Weighted Score | Notes |
| --- | --- | --- | --- | --- |
| Completeness | x3 | 5/5 | 15/15 | Every approved requirement, external target, fixture principal, permission, method, and evidence row has an owner. |
| Feasibility | x3 | 5/5 | Current repository, pinned SDK, ClassKit guards, Cloudflare topology, GitHub APIs, and available tooling support the plan. |
| Clarity | x2 | 5/5 | Product access, administrator setup, manager acceptance, and evidence responsibilities are unambiguous. |
| Logical Flow | x2 | 5/5 | Guardrails, code validation, service provisioning, deployment, fixture setup, and acceptance are correctly ordered. |
| Scope & Risk | x2 | 4/5 | External administration remains operationally significant, with explicit authority, stop, rollback, and redaction controls. |
| Developer Experience | x1 | 5/5 | Exact paths, commands, principals, permissions, checkpoints, and done evidence are defined. |
| AI Readiness | x1 | 5/5 | Autonomy boundaries, confirm-first writes, forbidden actions, ambiguity handling, verification, and durable evidence are executable. |

Overall: 68/70 -> Ready for Development

Critical Dimension Check: Pass; neither weighted x3 dimension scores 1, and no
critical issue remains.

## Handoff

PLAN APPROVED FOR IMPLEMENTATION

Key constraints:

- Preserve the four-chunk authority sequence.
- Keep the fixture administrator distinct from both acceptance identities.
- Do not grant the test manager template/schedule authority solely for setup.
- Stop on missing external authority, wrong origin/product, permission failure,
  hostname drift, production observation changes, or provenance mismatch.

Suggested starting point: Execute Chunk 01's target-specific authority record
and master-only production environment proof.

First milestone: Production guardrails and authority evidence are complete
without creating staging services, branches, or deployments.

Verdict: Ready for Development

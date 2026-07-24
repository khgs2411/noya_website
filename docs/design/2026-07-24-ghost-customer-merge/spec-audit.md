# Ghost Customer Merge Design Audit

## Audit Mode: Standard

Rationale: This is a substantial single-feature design spanning the manager
customer workspace, an in-memory merge workflow, shared directory/picker seams,
localization, and the pinned ClassKit SDK, but it does not introduce a new
service, persistence model, dependency, or deployment boundary.

## Plan Overview

Objective: Let an authorized manager preview, explicitly resolve, and
irreversibly merge an eligible manager-created unlinked customer into a
distinct linked survivor without moving reconciliation logic into the website.

Scope: Source and survivor eligibility, preview and resolution UI, frozen
idempotent completion attempts, typed recovery, local source retirement,
survivor selection, localization, responsive presentation, and acceptance
evidence. Automatic matching, unmerge, hard deletion, direct backend access,
client-side reconciliation, ghost-to-ghost merge, and cross-product merge are
excluded.

Target Audience: Both human developers and AI agents.

Readiness Level: Ready for Development.

Key Technical Decisions:

- ClassKit remains authoritative through only
  `management.customers.previewMerge(...)`,
  `management.customers.merge(...)`, and the typed merge error helper.
- One dedicated in-memory hook owns the irreversible workflow state while
  `CustomerManagementTab` remains the sole owner of directory and selected
  customer reconciliation.
- Every SDK-required scalar resolution and returned metadata conflict is
  explicitly chosen from its allowed selections; replacement values preserve
  intentional scalar null and JSON null.
- An unknown completion result retains one byte-for-byte completion input and
  UUID, blocks in-app dismissal, and permits only an explicit same-request
  retry.
- The existing customer picker and directory hook gain bounded, reusable seams
  rather than merge policy or global state.

## File Path Verification

Verified using local codebase inspection at
`f4d5a32bcad79b3e7b35a6b37eaec88350009f3f`:

| Referenced Path | Status | Notes |
| --- | --- | --- |
| `docs/design/2026-07-24-ghost-customer-merge/spec.md` | Exists | Audited in full. |
| `docs/design/2026-07-24-ghost-customer-merge/agenda.md` | Exists | Decisions and remaining risks agree with the specification. |
| `src/features/manager/customers/customer-management-tab.tsx` | Exists | Owns selected customer state, request guards, mutation denial, context loading, and directory reconciliation as described. |
| `src/features/manager/customers/customer-detail-panel.tsx` | Exists | Existing responsive detail overlay and lifecycle action seam. |
| `src/features/manager/customers/use-customer-directory.ts` | Exists | Owns opaque cursor pages, refresh, forbidden clearing, and bounded record reconciliation; adding `remove(customerId)` is coherent. |
| `src/features/manager/customers/customer-picker.tsx` | Exists | Reusable paginated picker; the proposed optional eligibility callback is bounded and does not embed merge policy. |
| `src/features/customers/customer-labels.ts` | Exists | Provides display-safe customer label and contact helpers. |
| `src/features/manager/customers/merge/` | Not Found | Intended new feature directory. |
| `src/features/manager/customers/merge/customer-merge-dialog.tsx` | Not Found | Intended new accessible workflow surface. |
| `src/features/manager/customers/merge/use-customer-merge.ts` | Not Found | Intended new workflow state owner. |
| `src/features/manager/customers/merge/customer-merge-presentation.ts` | Not Found | Intended new pure presentation/eligibility module. |
| `src/i18n.ts` | Exists | Single English, Hebrew, and Russian locale registry. |
| `src/components/ui` | Exists | Existing shadcn-compatible primitive location. |
| `src/components/site` | Exists | Existing shared branded primitive location. |
| `src/index.css` | Exists | Existing theme-token owner referenced by the design guide. |
| `DESIGN_GUIDE.md` | Exists | Confirms mobile-first overlays, RTL safety, branded controls, and wrapping requirements. |
| `package.json` | Exists | Pins `@class-kit/react` to the stated SDK commit. |
| `bun.lock` | Exists | Resolves the same exact SDK commit. |

Pinned SDK verification:

- Cached package `@class-kit/react` reports version `0.1.23` and corresponds to
  commit `a158bc588f5ec3421788475ccab2c5c2cb47ce9f`.
- Its public root exports `management.customers.previewMerge`,
  `management.customers.merge`, `MergeCustomersInput`,
  `CustomerMergePreview`, and `isCustomerMergeApiError`.
- The SDK shapes match the design's camelCase fields, required three scalar
  resolutions, metadata conflict record, allowed selections, preview expiry,
  reconciliation summaries, movement counts, authoritative survivor customer,
  and correlated typed error details.
- Merge conflict reasons are exactly `idempotency_key_reused`,
  `concurrent_activity`, and `payload_too_large`; stale reasons are exactly
  `expired` and `state_changed`; already-merged and missing-recipient details
  expose `survivorCustomerId` and `missingCount` respectively.

## Strengths

### 1. Strong ownership boundary

The design keeps reconciliation, collision policy, stock restoration,
tombstones, atomicity, and idempotency in ClassKit. The website owns only
presentation, explicit user choices, request lifecycle, and bounded local
reconciliation.

### 2. Safe irreversible-operation model

Preview freshness, complete resolution derivation, frozen completion input,
unknown-outcome dismissal suppression, exact idempotent retry, and generation
guards form a coherent safety model. Each invalidating event has an explicit
state-reset consequence.

### 3. Repository-grounded integration

The selected-customer owner, mutation-forbidden latch, request-generation
guards, directory reconciliation, customer label helpers, picker paging, and
locale registry all exist at the specified paths and support the proposed
extensions without a new global state boundary.

### 4. Faithful SDK use

The proposed request fields, preview projections, open participant result
strings, error codes, and typed detail members match v0.1.23. The design does
not invent a positive merge capability that the current product context cannot
truthfully supply.

### 5. Objective acceptance evidence

The design names observable source/survivor eligibility, resolution
completeness, UUID timing and reuse, source retirement, typed recovery,
privacy, localization, responsive behavior, and explicit reporting when
browser prerequisites are unavailable.

## Critical Issues

None. No contract mismatch, missing ownership decision, path error, or
implementation-blocking ambiguity remains.

## Questions for Plan Author

None. Pair eligibility, permission behavior, conflict resolution, retry
identity, redirect handling, reconciliation ownership, and unavailable browser
evidence are all resolved.

## Recommendations

### Implementation discipline

- Treat the three proposed merge files as a cohesive feature boundary and keep
  parent reconciliation callbacks narrow, as specified.
- Build resolution completeness from the current preview on every render; do
  not let stale object keys or UI defaults satisfy submission.
- Reuse one parent source-retirement path for completion and typed redirects,
  including `customers.get(sourceId)`.

### Verification traceability

- Record unavailable fixture/server browser rows explicitly rather than
  weakening the matrix.
- Inspect the final frozen `MergeCustomersInput` construction directly so
  source/survivor selections omit replacement values and intentional nulls are
  preserved.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| An old preview response commits after the pair or authority changes | Medium | High | Use the specified generation/ref guard across every invalidation boundary. |
| Unknown completion is retried with a new UUID or mutated payload | Low | High | Freeze one complete input and expose only same-request retry in `completion_unknown`. |
| Dynamic metadata conflict keys or JSON null are mishandled | Medium | High | Derive keys from the live preview and validate parsed JSON values without truthiness checks. |
| Source remains actionable in one local surface after success | Medium | High | Centralize retirement in `CustomerManagementTab`, remove from all committed pages, invalidate context requests, and select the survivor. |
| Dense translated content becomes unusable on narrow RTL layouts | Medium | Medium | Follow the specified semantic, wrapping-safe, logical-direction layout and exercise the locale/viewport matrix when prerequisites exist. |
| Product level 75 is not positively visible in frontend capabilities | High | Medium | Rely on server authorization and latch mutation denial after authoritative `forbidden`, while preserving authorized reads. |

Highest Risk: Preserving a single safe request identity across an unknown
completion outcome. The finite state model, frozen input, blocked dismissal,
and explicit same-request retry directly mitigate it.

## Pre-Development Checklist

- [x] Assignment scope and plan-only boundary are represented.
- [x] Existing repository paths and integration owners are verified.
- [x] Intended new paths are identified as creations.
- [x] Exact pinned SDK commit, package version, methods, types, and error details
  are verified.
- [x] Acceptance criteria are objectively testable.
- [x] Forbidden actions, unavailable-fixture reporting, and AI autonomy
  boundaries are explicit.
- [x] No critical issue remains.

## Next Steps

1. Produce the dependency-aware implementation plan from the verified feature
   files and parent reconciliation seam.
2. Implement the pure eligibility/presentation and state-machine contracts
   before integrating the dense dialog surface.
3. Finish with source/static checks and the available existing-server browser
   matrix, reporting any skipped evidence exactly.

## Evaluation Matrix

| Dimension | Weight | Raw Score | Weighted Score | Notes |
| --- | --- | --- | --- | --- |
| Completeness | x3 | 5/5 | 15/15 | Requirements, edge cases, ownership, errors, privacy, localization, target files, and evidence are explicit. |
| Feasibility | x3 | 5/5 | 15/15 | Current repository seams and pinned SDK methods/types support the design without a dependency or backend change. |
| Clarity | x2 | 5/5 | 10/10 | State transitions, invalidation events, retry identity, and parent/hook responsibilities are concrete. |
| Logical Flow | x2 | 5/5 | 10/10 | Selection, preview, resolution, confirmation, completion, recovery, and reconciliation form an ordered critical path. |
| Scope & Risk | x2 | 5/5 | 10/10 | ClassKit/UI ownership is strong, exclusions are explicit, and irreversible-operation risks have direct mitigations. |
| Developer Experience | x1 | 4/5 | 4/5 | File owners, callbacks, states, and done signals are concrete; detailed task sequencing appropriately remains for implementation planning. |
| AI Readiness | x1 | 5/5 | 5/5 | Paths, contracts, forbidden actions, verification boundaries, and ambiguity outcomes are explicit enough for autonomous planning. |

Overall: 69/70 -> Ready for Development

Critical Dimension Check: Pass; Completeness and Feasibility both score 5/5,
and no critical override applies.

## Handoff

PLAN APPROVED FOR IMPLEMENTATION PLANNING

Key constraints:

- Preserve the ClassKit boundary: no client-side merge/reconciliation rules and
  no direct backend access.
- Preserve one frozen completion identity through unknown outcomes.
- Keep source retirement and survivor selection parent-owned and convergent
  across success and typed redirects.
- Do not invent frontend authority; treat server `forbidden` as authoritative
  and keep read denial distinct from mutation denial.

Suggested starting point: Plan the pure merge presentation/eligibility module
and workflow state machine before picker and parent integration.

First milestone: A file-by-file implementation plan that traces each state
transition, invalidation rule, typed error, and parent reconciliation callback
to the verified SDK and repository seam.

Verdict: Ready for Development

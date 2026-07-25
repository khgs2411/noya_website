# Manager Change-Request Workspace Design Audit

## Audit Mode: Standard

Rationale: This is a cross-component feature design with one external SDK
boundary, manager-shell integration, permission-sensitive data access, and
localized responsive UI.

## Plan Overview

Objective: Add a capability-gated manager workspace for listing, creating,
revising, soft-deleting, and attaching files to ClassKit product change-request
threads.

Scope: Manager navigation and workspace UI, live permission enforcement,
localized request lifecycle states, read-only status/context/history/attachment
metadata, and SDK reconciliation. Routes, persistence, status mutation,
downloads, direct Supabase or Edge Function access, admin APIs, and new
production dependencies are excluded.

Target Audience: Both human developers and the AI-assisted Symphony planning and
execution workflow.

Readiness Level: Ready for Development.

Key Technical Decisions:

- `ManagerPage` remains the capability integration boundary, while
  `ManagerTabs` receives only a derived availability boolean.
- Cached manager access may preserve the enclosing shell but cannot authorize,
  import, mount, load, or mutate the change-request workspace.
- The repository-supported `useProductContext().client` access replaces the
  assignment's nonexistent `useClassKit` hook without changing the required
  `management.changeRequests` namespace.
- ClassKit remains authoritative; the selected thread is resolved from the
  latest list, revisions are rendered from copied SDK data, and mutations
  reconcile from SDK responses or a fresh list.

## File Path Verification

Verified using local repository inspection and the exact ClassKit commit pinned
by `bun.lock`:

| Referenced Path | Status | Notes |
| --- | --- | --- |
| `docs/design/2026-07-23-manager-change-requests/spec.md` | Exists | Complete design under audit. |
| `docs/design/2026-07-23-manager-change-requests/agenda.md` | Exists | Decisions and pressure-test result agree with the spec. |
| `src/features/manager/manager-page.tsx` | Exists | Owns active-tab state, permission derivation, lazy workspace imports, and rendering. |
| `src/features/manager/manager-tabs.tsx` | Exists | Owns typed primary and overflow tab definitions; currently has no capability filtering. |
| `src/App.tsx` | Exists | Gates `/manager` with `dashboard.can_enter` and implements the five-minute local-storage snapshot. |
| `src/i18n.ts` | Exists | Contains the English, Russian, and Hebrew translation trees and current manager tab/request copy. |
| `src/features/manager/change-requests/` | Not Found — expected new path | The spec explicitly creates this domain folder. |
| `src/components/ui` | Exists | Contains the shared `Button` and toast primitives; existing manager overlays also provide a close-on-backdrop pattern. |
| `DESIGN_GUIDE.md` | Exists | Requires mobile-first, RTL-safe, branded manager UI and mobile drawer/wider dialog details. |
| `ROADMAP.md` | Exists | Records the permission, read-only status, append-only history, and manager-workspace outcome. |
| `package.json` | Exists | Pins `@class-kit/react` to tag `v0.1.21` and exposes `build` and `lint` but no automated test script. |
| `bun.lock` | Exists | Resolves `@class-kit/react` to `c0d1fc7a0f7eff77a17b3fbccc3944d19c74711d`. |

The matching SDK source at the pinned commit confirms:

- there is no exported `useClassKit` hook; `useProductContext` and
  `useClassKitClient` are exported;
- `management.changeRequests` exposes the five allowed operations with the
  specified signatures;
- `ProductChangeRequest`, revisions, attachments, status, and request-type
  declarations match the fields recorded in the design;
- omitted create/update context is serialized as `{}`, so passing the current
  context through on revision prevents accidental data loss; and
- `uploadAttachment(requestId, { file })` owns the signed upload and returns
  only the completed attachment response.

## Strengths

### 1. Authorization Is Treated As A Data Boundary

The spec distinguishes route access, cached shell rendering, live positive
authorization, tab visibility, component mounting, loading, and mutations. Its
active-tab repair rule closes the transient-render gap that could otherwise
mount a just-revoked workspace for one render.

### 2. The SDK Contract Is Verified Rather Than Assumed

The design correctly challenges the assignment's hook spelling while preserving
the intended ClassKit namespace. Exact record fields, input casing, update
serialization, and upload return shape all match the lockfile's commit.

### 3. State Ownership Preserves Append-Only Server History

Resolving selection by ID, sorting a copy of `revisions`, and forbidding
synthesized request, revision, status, context, or attachment records establish
a strong boundary against divergent client state.

### 4. Failure And Privacy Behavior Is Concrete

Load, refresh, create, revise, delete, upload, and permission-loss failures each
have an explicit recovery posture. The design also excludes sensitive logging,
internal storage identifiers, direct storage calls, and download URLs.

## Critical Issues

None. No issue remains that would require a product, architecture, data, or
public-contract decision before implementation.

## Questions for Plan Author

None. The design resolves the assignment's hook mismatch and leaves no material
behavioral ambiguity.

## Recommendations

### Implementation Planning

- Name the concrete files to create inside
  `src/features/manager/change-requests/` when producing the implementation
  plan; the domain boundary is clear, but exact work units are intentionally
  deferred.
- Choose an exact summary distinguisher from the SDK record, such as
  `created_at` and/or `version_number`, rather than carrying “enough metadata”
  into implementation as subjective wording.
- Map a temporarily null ClassKit client to an explicit localized unavailable
  or retry state, following existing manager features.

### Interaction Verification

- Include dialog semantics, Escape handling, focus return, and background-scroll
  behavior in the overlay implementation checkpoint. The repository supplies
  the visual/backdrop pattern, but these interaction details should be verified
  for the new form-bearing surface.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Permission loss leaves `activeTab` pointing at Requests for one render | Low | High | Derive the authorized rendered tab before mounting content, then repair stored tab state. |
| Installed SDK differs from the lockfile commit | Low | High | Confirm dependency resolution before coding and compile against exported types. |
| Upload completes remotely but list refresh fails | Medium | Medium | Keep the selected thread and existing list, report refresh failure, and allow retry. |
| Full browser flow cannot be exercised because no approved server is running | Medium | Medium | Use an existing server only; report the gap rather than starting one without approval. |
| Long localized or structured values break the overlay | Medium | Medium | Apply the design guide's wrapping and inspect Hebrew RTL plus narrow and wide layouts. |

Highest Risk: Permission-transition rendering. It affects data exposure, but the
spec supplies a sufficient mitigation at both the shell and workspace
boundaries.

## Pre-Development Checklist

- [x] Product behavior, permissions, data ownership, and exclusions are explicit.
- [x] Current repository paths and manager-shell consumers are verified.
- [x] The pinned SDK namespace, types, serialization, and upload behavior are verified.
- [x] Acceptance conditions are objective and cover all assignment operations.
- [x] AI autonomy boundaries forbid direct network/storage work, new dependencies, and contract duplication.
- [ ] At implementation start, confirm the installed dependency resolves to the pinned lockfile commit.
- [ ] In the implementation plan, name concrete new files and focused verification checkpoints.

## Next Steps

1. Approve the design and translate it into a dependency-aware implementation
   plan.
2. Start with the permission-derived tab and render boundary, because every data
   operation depends on it.
3. Implement the SDK-backed domain workspace, then localization and focused
   verification.

## Evaluation Matrix

| Dimension | Weight | Raw Score | Weighted Score | Notes |
| --- | --- | --- | --- | --- |
| Completeness | x3 | 4/5 | 12/15 | All required behavior, failures, dependencies, and acceptance evidence are covered; concrete new filenames are deferred to planning. |
| Feasibility | x3 | 5/5 | 15/15 | Repository and exact pinned-SDK evidence support every material technical claim. |
| Clarity | x2 | 5/5 | 10/10 | Boundaries, state ownership, mutation behavior, and forbidden paths are unambiguous. |
| Logical Flow | x2 | 4/5 | 8/10 | Capability integration is the clear prerequisite; the implementation sequence itself belongs in the next plan artifact. |
| Scope & Risk | x2 | 5/5 | 10/10 | Scope is coherent and surgical, with high-risk authorization and reconciliation behavior explicitly mitigated. |
| Developer Experience | x1 | 4/5 | 4/5 | Strong seams and done signals; exact file-level milestones remain for implementation planning. |
| AI Readiness | x1 | 4/5 | 4/5 | Objective constraints and verification points are strong; concrete file work units and rollback notes remain for the plan. |

Overall: 63/70 -> Ready for Development

Critical Dimension Check: Pass; neither Completeness nor Feasibility scores 1.

## Handoff

PLAN APPROVED FOR IMPLEMENTATION

Key constraints:

- Only a live `product_change_requests.manage` permission may expose or mount
  the workspace; cached manager access is never positive authorization.
- Use only the pinned client's `management.changeRequests` operations and
  exported types; no direct Supabase, raw Edge Function, admin API, status
  mutation, download, or local server-contract adapter.
- Preserve current context unchanged on revisions, render append-only history
  from SDK records, and reconcile mutations authoritatively.

Suggested starting point: Define the conditional Requests tab and
permission-safe effective active-tab rendering across `ManagerPage` and
`ManagerTabs`.

First milestone: An authorized live capability exposes a lazy Requests
workspace, while cached, denied, and revoked states never import, mount, or call
it.

Verdict: Ready for Development

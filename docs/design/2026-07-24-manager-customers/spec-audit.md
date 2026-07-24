# Manager Customers Workspace Specification Audit

## Audit Mode: Full

Rationale: This is an authorization-sensitive, multi-surface redesign intended
for agent execution across manager navigation, customer data, membership
context, linked access, localization, and responsive interaction.

## Plan Overview

Objective: Replace the manager Users directory with a customer-first workspace
whose service state is keyed by `customerId` and whose optional linked `userId`
is used only for access identity and role assignment.

Scope: Customer list/detail, status filtering, opaque cursor pagination,
read-only membership context, linked-user access context, role
assignment/revocation, capability transitions, reusable customer labels,
localization, and responsive overlays. Customer lifecycle mutations, membership
mutations, registration/attendance mutations, matching, and backend/SDK
development are excluded.

Target Audience: Human developers and AI implementation agents.

Readiness Level: Ready for Development.

Key Technical Decisions:

- `dashboard.can_read_customers` alone authorizes directory exposure and
  customer list/get; `dashboard.can_read_memberships` independently authorizes
  membership reads.
- `users.read` and `dashboard.can_manage_users` independently govern linked
  identity reads and role mutations; assignment choices come only from
  `management.users.roles.listAssignable()`.
- Every protected section clears stale data on an authoritative
  `ClassKitManagerApiError` with code `forbidden`.
- Cursor pages are committed immutable triples with generation/token guards,
  forward-cache invalidation, and no inferred page number, total, or search.

## File Path Verification

Verified using local repository and released SDK inspection:

| Referenced Path | Status | Notes |
| --- | --- | --- |
| `src/features/manager/manager-page.tsx` | Exists | Current live capability integration and lazy workspace owner. |
| `src/features/manager/manager-tabs.tsx` | Exists | Current responsive primary/More navigation owner. |
| `src/features/manager/users/user-role-management-tab.tsx` | Exists | Current user directory and linked-role behavior to replace with Customers. |
| `src/features/manager/permissions/permission-management-tab.tsx` | Exists | Merged role-definition and permission-configuration owner. |
| `src/features/manager/access/role-permission-presentation.ts` | Exists | Existing pure grouped-permission presentation seam. |
| `src/features/manager/memberships/membership-management-tab.tsx` | Exists | Adjacent legacy user-oriented service surface, explicitly not migrated here. |
| `src/features/users/user-labels.ts` | Exists | User-shaped helper that must not become the customer label contract. |
| `src/App.tsx` | Exists | Cached manager-shell snapshot owner; new read booleans remain live-only. |
| `src/i18n.ts` | Exists | English, Russian, and Hebrew locale registry. |
| `DESIGN_GUIDE.md` | Exists | Mobile-first, overlay, theme, and RTL constraints. |
| `package.json` | Exists | Currently pins v0.1.22; implementation updates to v0.1.23. |
| `bun.lock` | Exists | Currently resolves v0.1.22; implementation refreshes it from the declared tag. |
| `src/features/manager/customers/` | Planned creation | Customer workspace domain. |
| `src/features/customers/` | Planned creation | Pure reusable customer label/contact seam. |

Released SDK tag v0.1.23 resolves to
`a158bc588f5ec3421788475ccab2c5c2cb47ce9f` and verifies the two dashboard
read booleans plus `management.users.roles.listAssignable()`.

## Strengths

### 1. Strong Customer Versus Access Boundary

The spec consistently keys service-recipient list, selection, detail, and
membership history by `customerId`. It treats `userId` as nullable access
linkage, fails closed on contradictory identity fields, and prevents ghosts
from reaching user or role APIs.

### 2. Exact Authorization Matrix

The design consumes the v0.1.23 dashboard read booleans directly and keeps
explicit user-read and role-mutation grants separate. It prohibits inference
from role names, levels, `can_manage_users`, or the general permission array
where those are not authoritative.

### 3. Complete Async State Contract

Opaque pagination commit rules, filter generations, stale-response rejection,
refresh invalidation, selection transitions, partial section failure, and
authoritative forbidden handling are concrete enough to implement and test
without inventing recovery semantics.

### 4. Preserved Ownership Boundaries

Permissions remains the sole role-definition surface. Customers reuses only
the assignment facade and pure presentation logic, with no new global state,
direct backend access, or speculative framework.

## Critical Issues

None.

## Questions for Plan Author

None. The released upstream contract and assignment resolve all material
product, authorization, data, and sequencing decisions.

## Recommendations

### Implementation Precision

- Keep the customer directory state machine in a focused hook so cursor tokens,
  generations, and refresh invalidation remain testable without coupling them
  to drawer markup.
- Reuse `ClassKitManagerApiError` for exact `forbidden` classification rather
  than parsing messages.
- Preserve the current Permissions files untouched except for any locale
  grouping required by the Customers navigation rename.

### Verification

- Compile against the installed v0.1.23 types after a frozen dependency
  resolution check.
- Use focused source inspection for capability ownership and forbidden cleanup,
  then lint/build and approved-server browser verification when available.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Cached or stale capability exposes protected data | Medium | High | Live-only positive gates plus authoritative forbidden clearing. |
| Stale cursor response overwrites a newer filter/page | Medium | High | Generation and request-token commit rules. |
| Ghost reaches linked-user APIs | Low | High | `userId` fail-closed discriminator and explicit inconsistency state. |
| Role-definition behavior drifts back into Customers | Low | High | Use only user-role facade; keep merged Permissions ownership. |
| Membership failure blanks customer identity | Medium | Medium | Independent section state and recovery. |
| Responsive/RTL regressions lack automation | Medium | Medium | Existing-server browser matrix and explicit evidence gap when unavailable. |

Highest Risk: Authorization drift from stale or incorrectly combined capability
signals. The design mitigates it with exact live gates and server-authoritative
forbidden handling.

## Pre-Development Checklist

- [x] Required Permissions owner exists on the current base.
- [x] v0.1.23 capability and assignable-role contracts are verified.
- [x] Every referenced existing path is verified.
- [x] Acceptance criteria are objective and testable.
- [x] AI autonomy and stop conditions are defined.
- [x] No material design blocker remains.

## Next Steps

1. Update the dependency and lockfile to v0.1.23 as the first implementation
   boundary.
2. Build the customer presentation and directory state seams.
3. Integrate the localized workspace and run the complete capability,
   pagination, identity, and responsive verification matrix.

## Evaluation Matrix

| Dimension | Weight | Raw Score | Weighted Score | Notes |
| --- | --- | --- | --- | --- |
| Completeness | x3 | 5/5 | 15/15 | All requested states, exclusions, failures, and acceptance evidence are explicit. |
| Feasibility | x3 | 5/5 | 15/15 | Current repository owners and released v0.1.23 contracts support the design. |
| Clarity | x2 | 5/5 | 10/10 | Identity, capability, cursor, and ownership terms are unambiguous. |
| Logical Flow | x2 | 5/5 | 10/10 | Dependency, data, state, recovery, and verification boundaries align. |
| Scope & Risk | x2 | 5/5 | 10/10 | Exclusions are preserved and high-risk authorization transitions fail closed. |
| Developer Experience | x1 | 4/5 | 4/5 | Concrete contracts and paths are strong; browser fixtures remain environment-dependent. |
| AI Readiness | x1 | 5/5 | 5/5 | Stop conditions, commit rules, path ownership, and objective checks are explicit. |

Overall: 69/70 -> Ready for Development.

Critical Dimension Check: Pass; no x3 dimension scores 1.

## Handoff

PLAN APPROVED FOR IMPLEMENTATION

Key constraints:

- Use v0.1.23 live capability fields and user-role facade only.
- Never infer customer or membership read authority in Noya.
- Clear protected data on authoritative forbidden responses.
- Preserve the merged Permissions ownership boundary.

Suggested starting point: dependency baseline and customer presentation/state
seams.

First milestone: a type-safe, capability-gated paginated customer directory
that handles ghosts without any linked-user call.

Verdict: Ready for Development

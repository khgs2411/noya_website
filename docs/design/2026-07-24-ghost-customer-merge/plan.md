# Ghost Customer Merge Implementation Plan Set

**Approved Source:** `docs/design/2026-07-24-ghost-customer-merge/spec.md`
**Agenda:** `docs/design/2026-07-24-ghost-customer-merge/agenda.md`
**Pseudocode:** Absent
**Context:** Not available
**ADRs:** None
**Status:** Ready for Review

## Goal

Add a safe, mobile-first Customers-workspace flow that selects a linked
survivor, previews every ClassKit-owned consequence, requires complete explicit
resolutions, confirms irreversibility, submits one frozen idempotent request,
and reconciles the local workspace to the authoritative survivor without
implementing merge rules in Noya.

## Source Artifacts And Repository Evidence

- Approved feature contract:
  `docs/design/2026-07-24-ghost-customer-merge/spec.md`.
- Resolved decisions:
  `docs/design/2026-07-24-ghost-customer-merge/agenda.md`.
- Independent ready design audit:
  `docs/design/2026-07-24-ghost-customer-merge/spec-audit.md`.
- Current Customers orchestration:
  `src/features/manager/customers/customer-management-tab.tsx`.
- Existing detail and action surface:
  `src/features/manager/customers/customer-detail-panel.tsx`.
- Opaque customer directory state:
  `src/features/manager/customers/use-customer-directory.ts`.
- Shared embedded customer picker:
  `src/features/manager/customers/customer-picker.tsx`.
- Safe customer presentation:
  `src/features/customers/customer-labels.ts`.
- English, Hebrew, and Russian registry: `src/i18n.ts`.
- Responsive and RTL conventions: `DESIGN_GUIDE.md`.
- `package.json` and `bun.lock` already pin `@class-kit/react` v0.1.23 commit
  `a158bc588f5ec3421788475ccab2c5c2cb47ce9f`.
- The pinned SDK exposes the exact `CustomerMergePreview`,
  `MergeCustomersInput`, resolution, result, and typed error shapes consumed by
  this plan.
- No automated component-test framework exists. Static verification uses the
  repository scripts; interactive evidence is conditional on suitable
  fixtures and an already-running server.

## Design Readiness

- Approved source verified: Yes.
- Agenda path verified: Yes; no unresolved question remains.
- Design audit verified: Yes; exact verdict is
  `Verdict: Ready for Development`.
- Pseudocode: Absent; the spec and SDK types define the state and request
  boundaries sufficiently, so no implementation blocker results.
- Context/glossary/ADR: Absent; no new durable domain term or architectural
  tradeoff requires one.
- Approved artifacts are consistent with repository constraints: Yes.
- Stale references reconciled: The SDK dependency is already v0.1.23 on the
  current base, so this feature must not plan the older dependency-upgrade work
  described by prerequisite customer plans.
- Remaining non-blocking risks:
  - product level 75 has no positive frontend capability, so server
    `forbidden` remains the mutation authority;
  - dense arbitrary metadata needs generic wrapping-safe JSON presentation;
  - unknown completion can still be abandoned by browser reload/navigation;
  - browser fixtures or an existing server may be unavailable.
- Blockers: None.

## Reconciliations And Decision Ownership

| Item | Evidence / Decision Rule | Owning Chunk | Must Resolve Before |
| --- | --- | --- | --- |
| Optional picker eligibility seam | The shared picker already owns page/filter/error UI; accept a callback returning selectable state and optional localized reason, but keep linked/distinct merge policy in the merge caller | Chunk 01 | Chunk 02 |
| Unknown completion transport classification | If a completion error is not a typed deterministic merge error or authoritative `forbidden`, preserve the frozen input and enter `completion_unknown`; never infer server rollback | Chunk 01 | Chunk 02 |
| Pre-preview failure classification | Generic preview `bad_request`, `not_found`, or `conflict` clears preview/resolutions and returns to pair selection with guidance; an unknown/transport preview failure keeps the valid selected pair in a dismissible retry state and never enters `completion_unknown` | Chunks 01–02 | Final acceptance |
| Human labels for open result strings | Map known closed values to locale keys; render localized generic “reported outcome/rule” copy for unknown open strings without displaying raw IDs | Chunk 02 | Final acceptance |
| Survivor redirect fetch | One parent helper accepts either an authoritative returned survivor or a typed survivor ID; the latter must fetch `customers.get` before exposing actions | Chunk 03 | Final acceptance |

## Approved Chunks

| Chunk | Deliverable | Depends On | Enables | Verification Focus | Status |
| --- | --- | --- | --- | --- | --- |
| [01 — Merge state and reusable customer seams](plans/01-merge-state-and-customer-seams.md) | Typed in-memory workflow, eligibility/presentation helpers, safe directory removal, and caller-supplied picker availability | None | Chunks 02–03 | SDK shapes, completeness, frozen request identity, stale guards, reusable picker contract | Ready for Review |
| [02 — Localized merge review and confirmation surface](plans/02-localized-merge-dialog.md) | Accessible survivor selection, consequence review, explicit resolutions, confirmation, expiry, and typed recovery UI | Chunk 01 | Chunk 03 | Dense consequence coverage, validation, focus/dismissal rules, locale parity, mobile/RTL layout | Ready for Review |
| [03 — Customers workspace integration and reconciliation](plans/03-customers-integration-and-acceptance.md) | Eligible detail entry, mutation/read denial integration, convergent source retirement, survivor selection, refresh, and final acceptance | Chunks 01–02 | Feature completion | Eligibility visibility, success/redirect reconciliation, existing workflow preservation, static/browser evidence | Ready for Review |

The boundaries keep every mutable file under one chunk owner. Chunk 01 creates
the reusable state contracts and extends existing shared customer seams. Chunk
02 owns all merge dialog markup and locale copy. Chunk 03 alone changes the
existing customer detail/workspace orchestration that exposes the feature.

## Dependency And Parallelism Order

1. Execute Chunk 01.
2. Execute Chunk 02 after Chunk 01 exports are stable.
3. Execute Chunk 03 after Chunks 01–02.

No chunks are safely parallel: Chunk 02 consumes Chunk 01 contracts, and Chunk
03 integrates the completed dialog and callback contracts. Review of completed
chunks may overlap, but implementation ownership remains sequential.

## Shared Contracts And Integration Points

- `isEligibleMergeSource(customer)` is exact: active,
  `manager_created`, `userId === null`, `identityStatus === "unlinked"`.
- Survivor availability is exact: different `customerId`, non-null `userId`,
  and `identityStatus === "linked"`; lifecycle may be active or inactive.
- `CustomerPicker` gains an optional callback shaped like
  `(customer: Customer) => { selectable: boolean; reason?: string }`.
  Existing consumers omit it and retain current behavior.
- `CustomerDirectoryState` gains `remove(customerId: string): void`, which
  removes the ID from every committed page without inventing a replacement or
  cursor.
- `useCustomerMerge` owns one `CustomerMergePreview`, resolution maps derived
  against that preview, request generations, local expiry, one frozen
  `MergeCustomersInput`, typed error state, and same-request retry.
- Pair/source change, dialog teardown, authority loss, and re-preview invalidate
  preview and resolutions. Unknown completion deliberately blocks
  user-initiated close, pair/source changes, and ordinary teardown through the
  dialog contract.
- Authoritative customer-read denial or live customer-read capability loss is
  a security boundary and takes precedence over active/unknown-completion
  dismissal suppression: close and clear the protected merge/customer UI even
  though the in-memory frozen retry identity is abandoned. A later
  server-authoritative directory/detail read is the recovery path and follows
  a merged-source redirect when applicable.
- Generic preview `bad_request`, `not_found`, and `conflict` return to safe pair
  selection with localized guidance. Unknown/transport preview failure keeps
  the selected pair in a dismissible preview-retry state. Neither can enter
  the non-dismissible completion-unknown state.
- The dialog reports successful completion as
  `{ sourceCustomerId, survivor: Customer }` and typed already-merged redirect
  as `{ sourceCustomerId, survivorCustomerId }`. It does not reconcile parent
  customer state.
- `CustomerManagementTab` owns one convergence helper for both outcomes,
  invalidates detail/context requests, removes the source, obtains the
  authoritative survivor, selects it, refreshes context/directory, and shows a
  localized notice.
- Survivor-directory `forbidden` invokes the parent customer-read forbidden
  path. Preview/merge `forbidden` invokes the parent mutation-denied path.
- No preview token, metadata, idempotency key, or merge result is placed in
  storage, routes, logs, or global state.

## Approved-Source Coverage

| Requirement / Acceptance Criterion | Covered By | Notes |
| --- | --- | --- |
| Active manager-created unlinked source only | Chunks 01, 03 | Pure eligibility plus detail action gate |
| Distinct eligible linked same-product survivor | Chunks 01–02 | Independent product-directory picker; backend revalidates |
| Preview always precedes merge | Chunks 01–02 | State machine has no direct completion transition |
| Show field, metadata, membership, collision, movement, and expiry consequences | Chunk 02 | IDs and secrets remain hidden |
| Explicit source/survivor/replacement resolutions | Chunks 01–02 | Current-preview completeness and JSON/null validation |
| Irreversible confirmation and fresh UUID | Chunks 01–02 | UUID created once at confirmed completion |
| 15-minute expiry and stale/state-change recovery | Chunks 01–02 | Local advisory timer plus typed server response |
| Idempotent unknown-outcome retry | Chunks 01–02 | Frozen exact input; non-dismissible state |
| Typed already-merged, concurrent, payload, and missing-strategy recovery | Chunks 01–03 | Parent redirect for merged; no client workarounds |
| Generic and unknown/transport preview recovery | Chunks 01–03 | Phase-aware pair reset versus dismissible preview retry |
| ClassKit owns reconciliation and atomicity | All | Only typed SDK facade calls |
| Successful survivor selection and source retirement | Chunks 01, 03 | Remove all committed source records, then authoritative survivor |
| Prevent further source actions | Chunk 03 | Request invalidation and immediate selected-state replacement |
| English, Hebrew, Russian, mobile, desktop, RTL | Chunks 02–03 | Locale parity and conditional browser matrix |
| No matching, unmerge, deletion, raw backend, or cross-product/ghost pair | All | Explicit non-goals and source checks |

## Verification Strategy

- Before implementation verification, check whether `node_modules` exists. If
  absent, run `bun install --frozen-lockfile` as a separate preflight; do not
  use an unconstrained install or create a second lockfile.
- Chunk 01 performs exact SDK-pin/source inspections and focused lint because
  it introduces merge SDK types and a state-machine boundary.
- Chunk 02 runs lint and locale/source checks, then inspects focus,
  dismissal, ID/secret privacy, and consequence coverage.
- Chunk 03 runs repository-wide lint and the one full build after integration,
  then uses
  targeted `rg` checks for ownership, forbidden handling, source retirement,
  and prohibited calls.
- `git diff --check` is run at each completed chunk and for the final set.
- Before browser acceptance, check for an existing localhost server. Do not
  start one. If one exists and fixtures/principals support the cases, exercise
  the matrix in the spec; otherwise report each unavailable row.
- Full `npm run build` is justified during implementation because the feature
  adds substantial typed SDK integration across several new and existing
  modules. This plan-only mission does not execute it.

## Risks And Sequencing

- A hook/API shape mismatch discovered after UI work would cause churn, so the
  state and callback contract is established first.
- Shared picker changes can regress membership, attendance, and registration
  consumers. The callback remains optional and existing call sites require no
  changes; final build/lint and smoke inspection cover compatibility.
- Unknown completion is the highest-risk state. It must be implemented before
  UI integration and tested by inspecting exact payload/UUID reuse.
- Phase-aware failure handling must be fixed in Chunk 01: an error before a
  completion request cannot enter completion-unknown, and authoritative
  customer-read denial always clears protected state even after a completion
  request may have committed.
- Parent reconciliation must land only after the dialog's success/redirect
  outputs are stable, preventing two owners from mutating selection.
- The local directory refresh may not display a survivor outside the current
  page, so selected survivor detail is driven by the authoritative returned/get
  record rather than current-page membership.
- No migration or rollout toggle exists. Isolation is the feature entry/action;
  reverting the three chunks removes only local UI/state and leaves ClassKit
  data untouched unless a real merge already completed.

## Execution Handoff

The executor loads the spec, agenda, design audit, this roadmap, plan-set audit,
and all three chunk files. Execute Chunks 01–03 in order.

Stop if:

- the installed dependency no longer resolves to v0.1.23 commit `a158bc5`;
- the typed merge methods, preview projections, required resolution shapes, or
  error helper differ from the approved contract;
- implementation would require a direct backend call, SDK/backend change,
  persistence, a new dependency, or inferred merge/reconciliation logic;
- an overlapping user change in an owned file cannot be preserved;
- unknown completion cannot retain the same complete request identity; or
- a material product/permission choice not resolved by the approved design is
  discovered.

Implementation environment preflight:

1. Run `test -d node_modules`.
2. Only if it exits 1, run `bun install --frozen-lockfile` as its own command.
3. Verify the exact SDK pin before running repository scripts or editing
   merge-facing code.

Do not commit, stage, push, start a server, or implement product code as part of
this plan-only mission.

## User Approval

- Roadmap approved by: One-pass generation explicitly authorized by the
  2026-07-24 Symphony Plan Only assignment.
- Plan set approved for execution by: Pending Symphony planning review and
  implementation-card promotion.

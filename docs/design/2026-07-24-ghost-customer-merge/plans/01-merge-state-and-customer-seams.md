# Chunk 01: Merge State And Reusable Customer Seams

**Plan Set:** `../plan.md`
**Approved Source:** `../spec.md`
**Status:** Ready for Review
**Depends on:** None
**Enables:** Chunks 02–03

## Goal

Establish a type-safe, in-memory customer-merge workflow and the smallest
reusable customer-directory/picker extensions needed by the merge surface,
without yet exposing a merge action to managers.

## Source Artifacts And Constraints

- `../spec.md`: eligibility, state lifecycle, frozen request, error, privacy,
  and ownership contract.
- `../agenda.md`: resolved retry, denial, and picker decisions.
- `../spec-audit.md`: verified SDK shapes and highest-risk boundaries.
- `src/features/manager/customers/use-customer-directory.ts`: current opaque
  cursor and local reconcile owner.
- `src/features/manager/customers/customer-picker.tsx`: shared embedded picker
  used by memberships, attendance, and registrations.
- Pinned `@class-kit/react` v0.1.23 types:
  `CustomerMergePreview`, `MergeCustomersInput`,
  `CustomerMergeFieldResolutionsInput`, `CustomerMergeJsonValue`,
  `CustomerMergeApiError`, and `isCustomerMergeApiError`.
- Do not add UI copy, change current Customers behavior, persist workflow
  state, generate a UUID before irreversible confirmation, or call any
  non-customer merge API.

## Relationships

- Creates the hook and pure helpers consumed by Chunk 02.
- Adds `remove` consumed by Chunk 03.
- Adds an optional picker availability seam consumed by Chunk 02; existing
  consumers remain behaviorally unchanged.
- The hook emits success/redirect/denial outcomes but never mutates parent
  directory or selection state.

## File Responsibility Map

**Create:**

- `src/features/manager/customers/merge/customer-merge-presentation.ts` —
  source/survivor eligibility, safe JSON/value derivation, known outcome-key
  mapping, and pure resolution validation helpers.
- `src/features/manager/customers/merge/use-customer-merge.ts` — preview,
  resolutions, expiry, generation guards, frozen completion input, typed
  failure/retry, and output callbacks.

**Modify:**

- `src/features/manager/customers/use-customer-directory.ts` — add bounded
  removal of one customer ID across all committed pages.
- `src/features/manager/customers/customer-picker.tsx` — add optional
  caller-supplied record availability and disabled-reason presentation while
  preserving all existing consumers.

**Test:**

- No automated test target exists. Verification uses compile/lint/source
  evidence and the later integrated browser matrix.

## Behavioral And Contract Changes

- Export `isEligibleMergeSource(customer)` and
  `getMergeSurvivorAvailability(sourceCustomerId, candidate)`.
- Eligibility comparisons use exact canonical fields, not labels:
  source is active, `manager_created`, null user, and consistently unlinked;
  survivor is distinct, non-null user, and consistently linked.
- Export safe helpers that:
  - distinguish metadata side absence from explicit JSON null;
  - parse replacement metadata as `CustomerMergeJsonValue`;
  - convert intentional empty scalar replacement to null;
  - determine whether all preview-required scalar and metadata resolutions are
    complete and permitted; and
  - map only known closed result strings to presentation keys while leaving
    unknown values for generic localized treatment.
- The hook has no transition from initial/pair selection directly to merge.
  `merge()` requires the current preview, complete current-preview
  resolutions, non-expiry, and explicit confirmation call.
- Build `MergeCustomersInput` exactly once at confirmed completion with
  `crypto.randomUUID()`. Store that full object as the frozen attempt before
  awaiting the SDK.
- Unknown completion reuses the same object. Pair change, re-preview, source
  change, deterministic failure, or successful completion clears it.
- Typed error outputs:
  - stale and concurrent activity return to re-preview;
  - already merged emits the typed survivor ID;
  - idempotency reuse forces new preview without manufacturing a key;
  - payload too large and missing recipient strategy become terminal-safe
    visible workflow errors;
  - generic preview `bad_request`, `not_found`, and `conflict` clear any
    preview/resolutions and return to pair selection with a classified guidance
    state;
  - unknown/transport preview failure retains the selected pair in a
    dismissible `preview_error` state with explicit preview retry;
  - preview/merge forbidden emits mutation denial;
  - unknown completion enters non-dismissible same-request retry.
- Error classification is phase-aware. A failure from `previewMerge` can never
  enter `completion_unknown`; only an unknown failure after the frozen
  `merge(input)` request was issued can do so.
- Every async commit compares a generation/request token so closed or replaced
  workflows cannot commit late state.
- Ordinary source/pair changes and user dismissal remain blocked during active
  or unknown completion, but authoritative customer-read denial/live capability
  loss is a higher-priority security teardown. It invalidates and clears the
  protected workflow even though the in-memory frozen retry identity is
  abandoned.
- `CustomerDirectoryState.remove(id)` removes matching records from every
  cached page and preserves cursors/page index.
- Picker availability is optional. When absent, all current behavior and
  selection callbacks remain identical. When present, unavailable records
  remain visible, cannot invoke selection, expose disabled semantics, and show
  the provided reason without the picker understanding why.

## Implementation Tasks

- [ ] Create `customer-merge-presentation.ts` with exact eligibility predicates,
      JSON parsing/formatting boundaries, known-result presentation mapping,
      and resolution completeness derived from the current preview. Ensure
      `allowedSelections` is authoritative and no resolution is preselected.
- [ ] Create `use-customer-merge.ts` around the two SDK methods and typed error
      helper. Model selection, previewing, reviewing, confirming, merging, and
      completion-unknown explicitly; freeze one complete input/UUID and expose
      only same-request retry after an unknown completion outcome.
- [ ] Implement the complete phase-aware preview error matrix. After
      merge-specific classification, route generic `bad_request`, `not_found`,
      and `conflict` to safe pair selection; route unknown/transport preview
      failure to a dismissible retry state retaining the pair; keep all of
      these outside `completion_unknown`.
- [ ] Add generation invalidation for source/pair changes, preview replacement,
      authority loss, close, deterministic error recovery, and unmount. Keep
      unknown completion protected from user/ordinary dismissal while allowing
      mandatory customer-read/capability security teardown to clear it.
- [ ] Extend `use-customer-directory.ts` with `remove(customerId)`, removing
      matches from every committed page without changing cursor identity,
      inserting the survivor, or initiating network work.
- [ ] Extend `customer-picker.tsx` with an optional availability callback.
      Preserve all existing props/call sites, add disabled/accessibility state
      and optional reason text, and ensure an unavailable record can never call
      `onSelectCustomer`.
- [ ] Inspect the full changed surface for tokens, UUIDs, arbitrary metadata,
      or customer data crossing logs/storage/URL state. Remove any such path.

## Verification

- `test -d node_modules`
  — exit 0 means dependencies are present; if it exits 1, run the following
  frozen install as a separate preflight command.
- `bun install --frozen-lockfile`
  — run only when the preceding directory check exits 1; installs the exact
  lockfile without changing dependency intent.
- `rg -n '"@class-kit/react".*a158bc588f5ec3421788475ccab2c5c2cb47ce9f' package.json bun.lock`
  — both manifest and lock resolve the approved SDK commit.
- `rg -n 'previewMerge|management\\.customers\\.merge|isCustomerMergeApiError|crypto\\.randomUUID' src/features/manager/customers/merge`
  — only the intended hook uses the two merge calls/helper and UUID boundary.
- `rg -n 'localStorage|sessionStorage|console\\.|location\\.|URLSearchParams' src/features/manager/customers/merge`
  — expected exit 1 with empty output; that is success because workflow data is
  in-memory and unlogged.
- `rg -n 'getRecordAvailability|CustomerPicker' src/features/manager/{memberships,attendance,registrations,customers}`
  — existing consumers still omit the optional seam; merge is the only caller
  that will supply it in Chunk 02.
- `npm run lint`
  — no lint errors.
- `git diff --check`
  — no whitespace errors.

## Acceptance Criteria Covered

- Exact source/survivor eligibility without matching.
- Mandatory preview and complete allowed resolutions.
- Fresh UUID at confirmation and exact unknown-outcome retry.
- Typed stale, concurrent, already-merged, payload, and recipient-strategy
  outcomes.
- Generic/unknown preview pair reset or dismissible retry, distinct from
  completion unknown.
- Source-removal primitive and protected async state.
- No persistence, logging, backend bypass, or client reconciliation.

## Risks, Rollback, And Isolation

- Picker regression affects three existing service surfaces. The new callback
  must be optional and default behavior must remain byte-for-byte equivalent at
  the interaction boundary.
- A truthiness check would reject JSON null. Validation must distinguish parse
  success from parsed value.
- An unknown error classification that is too broad can trap deterministic
  failures; branch typed SDK errors and authoritative forbidden before the
  unknown-outcome fallback.
- This chunk exposes no manager action. It can be reverted independently
  without affecting persisted data.

## Non-Goals

- Dialog markup, localization, parent selection/reconciliation, browser
  acceptance, backend/SDK changes, tests/framework installation, matching,
  merge rules, unmerge, or deletion.

## Consistency Check

- Confirm root `@class-kit/react` exports every imported type/helper.
- Confirm source and survivor fields use camelCase SDK names.
- Confirm picker prop naming and callback result match Chunk 02.
- Confirm the hook output names match the dialog and parent contracts in Chunks
  02–03.
- Confirm every existing `CustomerPicker` call compiles unchanged.

# Ghost Customer Merge Design

Status: Approved — eligible for implementation planning.
Design directory: `docs/design/2026-07-24-ghost-customer-merge/`

## Goal And Success Criteria

Let an authorized manager deliberately merge one active, manager-created,
unlinked customer into the linked ClassKit customer representing the same
person. The manager must see and resolve every consequence returned by
ClassKit before the irreversible operation, while ClassKit remains the sole
owner of reconciliation and merge validity.

The feature succeeds when:

- a merge affordance appears only on an active `manager_created` customer with
  `userId: null` and a non-contradictory unlinked identity state;
- the survivor is an explicitly selected, different, linked customer from the
  same product directory;
- a fresh preview is mandatory and the UI presents scalar comparisons,
  metadata conflicts, membership resolution, registration and participant
  collisions, movement counts, sample truncation, and expiry;
- every scalar resolution and every returned metadata conflict has an explicit
  source, survivor, or allowed replacement choice before confirmation;
- confirmation clearly states irreversibility and submits the unchanged pair,
  opaque preview token, complete resolutions, and a fresh
  `crypto.randomUUID()` idempotency key;
- stale, expired, concurrent, already-merged, missing-recipient-strategy, and
  retryable generic failures have safe recovery paths based on typed SDK
  errors;
- success immediately retires the source from actionable local state, selects
  the returned survivor, and refreshes the directory from ClassKit; and
- the complete dense workflow remains usable on mobile and desktop, in
  English, Hebrew RTL, and Russian.

## Current Repository Context

- `version/1.1.5` is checked out at `f4d5a32`, including the Customers
  workspace, customer lifecycle actions, customer-first memberships,
  attendance, and registration workflows.
- `src/features/manager/customers/customer-management-tab.tsx` owns selected
  customer state, customer mutations, directory reconciliation, and the
  customer detail/dialog surfaces.
- `src/features/manager/customers/customer-detail-panel.tsx` is the existing
  responsive customer overlay and already owns lifecycle action entry points.
- `src/features/manager/customers/use-customer-directory.ts` owns paginated,
  opaque-cursor customer records and exposes bounded local reconciliation.
- `src/features/manager/customers/customer-picker.tsx` is an embedded,
  customer-first paginated picker backed by the same directory hook.
- `src/features/customers/customer-labels.ts` is the safe customer label seam;
  raw customer/user IDs are not presentation fields.
- `src/i18n.ts` is the single English, Hebrew, and Russian locale registry.
- `DESIGN_GUIDE.md` requires mobile-first, RTL-safe overlays and branded,
  wrapping-safe dense content.
- `package.json` and `bun.lock` already resolve `@class-kit/react` v0.1.23 at
  `a158bc588f5ec3421788475ccab2c5c2cb47ce9f`; no dependency change is needed.
- v0.1.23 provides only
  `management.customers.previewMerge(...)`,
  `management.customers.merge(...)`, and
  `isCustomerMergeApiError(...)` for this workflow. Its preview and completion
  projections are camelCase and its backend owns eligibility, locking,
  reconciliation, stock restoration, tombstones, atomicity, and idempotency.
- The repository has no automated component/unit test harness. Its native
  static checks are `npm run lint` and `npm run build`; browser acceptance may
  use only an already-running development server unless separately approved.

## User-Facing Behavior

### Entry And Pair Selection

- Add a localized **Merge customer** action to the customer detail panel only
  when the selected source is:
  - `status === "active"`;
  - `customerOrigin === "manager_created"`;
  - `userId === null`; and
  - `identityStatus === "unlinked"`.
- Contradictory identity data, linked customers, signup-origin customers, and
  inactive customers never receive the action.
- Opening merge suspends the ordinary customer detail actions behind a
  dedicated merge dialog. The initial step reiterates the source identity and
  requires selecting a survivor.
- The survivor picker lists the same product's customer directory across its
  opaque pages and lifecycle filters, but makes selectable only records with a
  non-null `userId`, `identityStatus === "linked"`, and a different
  `customerId`. Both active and inactive linked survivors remain eligible
  because ClassKit permits either lifecycle state.
- Inconsistent records remain visible only as unavailable when necessary to
  explain an otherwise empty page; they cannot be selected. The UI does not
  infer a global search or silently auto-match anyone.
- Before preview, the dialog repeats distinct source and survivor labels,
  contacts when present, linkage, lifecycle, and origin without exposing IDs.

### Preview And Resolution

- `previewMerge({ sourceCustomerId, survivorCustomerId })` is the only way to
  enter review. Pair changes, dialog close, source changes, capability loss,
  and re-preview all discard the previous token and resolutions.
- The review step shows:
  - source and survivor identity summaries;
  - display name, contact email, and phone comparisons with the exact
    `allowedSelections`;
  - carried metadata as a count and every metadata conflict with both presence
    states and safely formatted JSON values;
  - membership resolution and both returned grant summaries;
  - registration and participant moved/collision counts, each returned sample,
    stock restoration in registration samples, and truncation notices;
  - all movement counts; and
  - the absolute expiry plus a live remaining-time warning.
- Internal IDs in preview samples and grants are not rendered. Counts, rules,
  lifecycle, membership names, attendance/kind outcomes, and stock restoration
  quantities are rendered with localized human labels. Unknown open result
  strings use localized generic wording rather than raw backend vocabulary.
- The three scalar resolutions are always explicit because the SDK completion
  input requires them. Every metadata entry in
  `fieldComparisons.metadata.conflicts` is also explicitly resolved. No choice
  is preselected.
- Render only the selections allowed by each comparison. A replacement scalar
  uses a text/email/tel field appropriate to that scalar and converts an
  intentional empty value to `null`. A replacement metadata value uses a
  textarea whose content must parse as JSON; explicit JSON `null` is valid.
- Carried metadata does not require a choice and is not editable. Arbitrary
  metadata keys are content, not translation keys, and must wrap safely.
- The confirm step remains disabled until every required resolution is valid
  and the preview has not expired.

### Irreversible Confirmation And Completion

- Confirmation repeats source, survivor, chosen final scalar values, metadata
  conflict choices, membership outcome, collision/movement totals, and expiry.
- The primary action uses explicit irreversible copy and remains disabled while
  a merge request is in flight. The dialog cannot close by its close control,
  Escape, or backdrop during that request or while its outcome remains
  unknown.
- Generate `crypto.randomUUID()` immediately before the first completion
  attempt for a preview. Retain that key and the exact payload only while the
  request outcome is unknown, so a user-initiated retry of the identical
  request is idempotent. Never generate a second key for that retry.
- Any pair, preview, or resolution change invalidates the retained completion
  attempt. A newly previewed request receives a new key only when completion is
  next attempted.
- On success, use the returned `customer` as authoritative survivor state,
  remove the source from every committed directory page, reconcile the
  survivor where already present, switch selected detail state to the survivor,
  clear the merge workflow, reload its permitted membership/linked context,
  refresh the current directory page, and announce localized success.
- The source must not remain selectable or retain edit, lifecycle, role,
  registration, attendance, or membership affordances after local success.
  ClassKit's tombstone remains the authoritative cross-session protection.

### Failure And Recovery

- Use `isCustomerMergeApiError(error)` before reading merge-specific details:
  - `merge_preview_stale`: discard token/resolutions/completion attempt and
    offer re-preview for both `expired` and `state_changed`;
  - `customer_merged`: discard the source workflow, remove the source locally,
    load and select `details.survivorCustomerId`, and refresh the directory;
  - `merge_conflict` / `concurrent_activity`: discard the preview and require a
    fresh preview;
  - `merge_conflict` / `idempotency_key_reused`: do not retry with a new key;
    discard the preview and require a fresh preview because the request identity
    is no longer safe;
  - `merge_conflict` / `payload_too_large`: keep the source safe, explain that
    the merge cannot be completed in this UI, and allow closing/refreshing;
  - `merge_recipient_strategy_missing`: preserve both customers, expose the
    returned missing count, and offer close/refresh rather than inventing a
    client reconciliation strategy.
- A generic preview `bad_request`, `not_found`, or `conflict` invalidates the
  pair/preview as appropriate and returns to safe pair selection with localized
  guidance. `forbidden` latches the existing customer mutation access denial,
  closes the merge surface, and keeps the read-only customer directory
  boundary intact.
- An unknown or transport failure before a preview exists offers preview retry.
- An unknown completion failure retains the exact frozen payload and
  idempotency key and offers **Retry same request**. The merge dialog remains
  non-dismissible in this state: closing would discard the only safe request
  identity while the server may already have committed. A browser navigation or
  reload cannot be prevented, but the next directory/list or source/get read
  remains server-authoritative and follows the merged-source redirect when
  applicable. The UI never silently retries.
- A client-side expiry timer is advisory. Completion errors remain
  server-authoritative even if the local clock has not yet reached
  `expiresAt`.
- If a later `customers.get(sourceId)` returns typed `customer_merged`, the
  Customers workspace follows the same survivor redirect and local source
  retirement path instead of presenting a generic missing-detail error.

## Technical Design And Boundaries

Create a merge workflow under
`src/features/manager/customers/merge/`:

- `customer-merge-dialog.tsx` owns the accessible, responsive multi-step
  surface and presentational sections;
- `use-customer-merge.ts` owns pair, preview, resolution, expiry, frozen
  completion attempt, typed failure, and success state transitions; and
- `customer-merge-presentation.ts` owns pure eligibility, safe JSON/value
  formatting, and localized presentation keys for closed merge outcomes.

Keep workflow orchestration integrated with
`CustomerManagementTab`, which already owns the selected customer, customer
mutation access latch, permitted detail context, and directory reconciliation.
Extend the directory hook only with a bounded `remove(customerId)` operation;
do not add global customer state.

The hook receives the current source and ClassKit client, but completion success
is returned to the management tab through one callback containing the
authoritative survivor and source ID. The tab owns source removal, survivor
selection, context reload, notice copy, and directory refresh so two state
machines do not independently mutate the customer workspace.

Keep one parent-owned merged-source reconciliation path inside
`CustomerManagementTab`. Normal completion invokes it with the authoritative
returned survivor; typed `customer_merged` from merge or a later
`customers.get(sourceId)` invokes the same path with the typed survivor ID and
loads that survivor. The path invalidates outstanding detail/context requests
before removing the source, selecting the survivor, and loading permitted
context. Do not duplicate redirect behavior between the merge hook and
`loadCustomer`.

`CustomerDetailPanel` receives a boolean eligibility signal and `onMerge`
callback. It does not import ClassKit merge types or call the client.

Reuse `CustomerPicker` with an independent `useCustomerDirectory` instance for
survivor paging. Add a bounded optional record-eligibility callback to the
picker so all records on the current opaque page remain visible, while only a
distinct, consistently linked record can be selected and unavailable records
carry localized explanatory text. Keep merge eligibility policy in the merge
surface; the picker only renders the supplied selectable state. Do not add
page-local search or duplicate the paging UI.

## Data And State

The merge workflow is a finite state machine:

1. `selecting_survivor`
2. `previewing`
3. `reviewing`
4. `confirming`
5. `merging`
6. `completion_unknown`
7. terminal success returned to the parent

Store the complete SDK `CustomerMergePreview` in memory only. Store resolutions
by the three scalar names and metadata conflict key. Derive completeness from
the preview each render so stale or missing keys cannot be submitted.

The frozen completion attempt contains the exact
`MergeCustomersInput`. It is created once per confirmed preview and reused
byte-for-byte for an unknown-outcome retry. No merge token, resolution, or
idempotency key is persisted to storage or URL state.

Use a request generation/ref guard so a response cannot commit after close,
pair change, re-preview, source change, customer authority loss, or workflow
replacement. The hook performs no optimistic merge.

## Permissions, Security, And Privacy

- ClassKit authorizes preview/merge at product level 75 and revalidates the
  exact pair and actor. The current product context exposes no trustworthy
  dedicated `can_merge_customers` capability, so Noya must not invent one from
  role names, permission arrays, or other dashboard booleans.
- The surface follows the existing customer-mutation boundary: it is available
  while customer data is live-readable and the customer mutation latch has not
  received an authoritative `forbidden`. Any merge `forbidden` closes the
  workflow and latches mutation denial.
- Keep read and write denial distinct. A `forbidden` from the independent
  survivor directory means customer read authority changed: close the merge
  and detail surfaces and clear the parent directory through its existing
  forbidden path. A `forbidden` from preview/merge means level-75 customer
  mutation authority is absent: close the merge and latch the existing
  mutation denial without discarding still-authorized read data.
- Never call Supabase, raw Edge Functions, or any ClassKit API beyond
  `management.customers.previewMerge(...)`, `merge(...)`, and customer
  list/get already owned by the surrounding workspace/picker.
- Do not log or persist preview tokens, idempotency keys, metadata values,
  collision data, or customer contact data.
- Treat arbitrary metadata as text/JSON content. React escaping remains intact;
  do not use HTML injection.

## Testing And Acceptance Evidence

Static and source checks must prove:

- the workflow calls only the two typed merge methods and uses
  `isCustomerMergeApiError`;
- a UUID is generated only at confirmed completion and identical unknown
  retries reuse the frozen input;
- an unknown completion outcome cannot be dismissed in-app or converted into
  a new request identity;
- eligibility is exactly active + `manager_created` + unlinked source and a
  distinct linked survivor;
- all scalar and metadata conflict resolutions are completeness-checked against
  the current preview;
- source removal and survivor selection occur for success and already-merged
  redirects;
- no raw IDs or merge secrets are rendered, logged, persisted, or placed in
  routes;
- all new locale keys have English, Hebrew, and Russian entries; and
- `npm run lint`, `npm run build`, and `git diff --check` pass when the
  implementation risk justifies the full checks.

An existing-server browser matrix should exercise:

- no-conflict and conflict-heavy previews;
- source/survivor/replacement choices, including null scalar and JSON metadata
  replacement;
- each membership-resolution kind available in fixtures;
- registration and participant collisions, stock restoration, and truncated
  samples;
- local expiry and server `expired`/`state_changed`;
- concurrent activity, missing recipient strategy, payload too large,
  already-merged redirect, unknown completion retry, and exact idempotent
  replay;
- in-app close/Escape/backdrop suppression during both the request and an
  unknown completion outcome;
- success source retirement and survivor selection;
- narrow mobile and desktop widths in English, Russian, and Hebrew RTL; and
- capability/mutation denial without protected stale merge state.

If suitable principals, fixtures, or an already-running server are unavailable,
implementation reports the exact browser rows not exercised rather than
starting a server or weakening the acceptance contract.

## Implementation Constraints And Seams

- Preserve the current customer lifecycle, membership, role, registration, and
  attendance ownership boundaries.
- Do not change the ClassKit dependency, backend, SDK, database, or permission
  model.
- Do not auto-match, preselect resolutions, auto-retry, decode opaque tokens,
  implement merge rules, support ghost-to-ghost or cross-product pairs, add
  unmerge, or hard-delete the source.
- Use existing Tailwind/shadcn-compatible primitives. Add no production
  dependency or router/global-state framework.
- Dense preview sections must use semantic headings, lists/tables that collapse
  safely on mobile, visible focus, trapped dialog focus, wrapping-safe values,
  and logical-direction spacing.

## Assumptions And Provenance

- User requirements and acceptance criteria come from the Symphony assignment
  for mission `5c373708-a601-4a68-94c4-c07d69382019`.
- Repository facts come from `version/1.1.5` at `f4d5a32`.
- The merge method, types, typed errors, and backend-owned rules come from the
  pinned v0.1.23 SDK at `a158bc5` and its approved ghost-merge design.
- The assignment's active-source rule intentionally narrows the backend, which
  permits active or inactive sources. Survivor lifecycle remains backend-valid
  for both states.
- The UI cannot positively identify product level 75 from current capabilities;
  server authorization plus the existing mutation-forbidden latch is the only
  truthful boundary.

## Open Questions

No material product question remains. The assignment, current Customers
workspace, and pinned typed SDK determine the workflow. The finite decision
ledger is in `agenda.md`.

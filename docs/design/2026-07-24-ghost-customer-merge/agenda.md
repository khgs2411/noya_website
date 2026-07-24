# Ghost Customer Merge Design Agenda

## Status

- Spec: `docs/design/2026-07-24-ghost-customer-merge/spec.md`
- State: Approved
- Approval: Approved by Software Architect counterpart on 2026-07-24 under the autonomous lead playbook

## Documented Decisions

- The Symphony assignment is the approved product direction and explicitly
  authorizes one-pass planning only.
- Noya offers merge only for an active `manager_created`, unlinked source even
  though ClassKit's broader backend contract also accepts inactive sources.
- A survivor must be explicitly selected from the same product customer
  directory, must be linked, must be distinct from the source, and may be
  active or inactive.
- The UI never matches automatically, preselects a resolution, implements
  reconciliation, or infers database outcomes.
- Every preview precedes merge. All three scalar resolutions and every returned
  metadata conflict require an explicit allowed selection.
- Unknown completion outcome is the only state that may retry completion
  directly, and it reuses the exact frozen request and idempotency key. The
  dialog is not dismissible in this state because the server may already have
  committed and closing would lose the only safe retry identity.
- Typed stale and concurrent failures require a new preview. Already-merged
  errors redirect to the typed survivor. Missing recipient strategy and payload
  size failures never gain client-side workarounds.
- Success locally removes the source, selects the returned survivor, reloads
  permitted context, and refreshes the directory while ClassKit remains
  authoritative.
- Normal completion, typed `customer_merged` during merge, and a later typed
  `customer_merged` from source detail loading converge on one
  `CustomerManagementTab`-owned source-retirement/survivor-selection path.
- The workflow is in-memory only and uses the current Customers workspace,
  ClassKit v0.1.23 merge methods/error helper, existing customer picker/directory
  seams, Tailwind component conventions, and the shared locale registry.
- No current capability positively expresses ClassKit's product-level-75 merge
  authority. The design uses server authorization and the existing
  customer-mutation forbidden latch rather than inventing a frontend gate.
- Read denial and mutation denial remain separate: a forbidden survivor
  directory read clears the parent customer workspace, while forbidden
  preview/merge closes merge and latches customer mutations without clearing
  authorized read data.
- Survivor paging reuses `CustomerPicker` with one bounded optional
  record-eligibility callback. The merge surface owns the linked/distinct rule;
  the picker renders supplied disabled states and does not learn merge policy.

## Questions

No material product questions remain. Repository and pinned SDK evidence
resolve the pair, resolution, retry, reconciliation, permission, and ownership
boundaries without an operator decision.

## Pressure-Test Result

- Status: Complete
- Categories checked: source/survivor eligibility; two-step preview lifecycle;
  scalar and metadata replacement validation; membership, registration, and
  participant consequences; expiry and state changes; request races;
  idempotent unknown-outcome retry; already-merged redirect; missing recipient
  strategies; permission denial; source retirement; privacy; localization;
  mobile/desktop/RTL presentation; verification feasibility.
- New questions added: None.
- Remaining non-blocking risks:
  - The repository has no automated component test harness, so interaction and
    responsive evidence depends on suitable fixtures and an already-running
    server.
  - Arbitrary metadata JSON can be dense; the design requires bounded,
    wrapping-safe text presentation rather than schema-specific rendering.
  - Current frontend capabilities do not expose product level 75, so an
    unauthorized reader may reach the action before the server returns
    `forbidden`; the workspace then latches customer mutation denial.
  - Browser navigation or reload can still abandon an unknown completion
    request. This cannot be prevented reliably; subsequent directory/detail
    reads are authoritative and merged-source reads redirect to the survivor.

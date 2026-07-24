# Manager Service Customer Identity Migration Design Agenda

## Status

- Spec: `docs/design/2026-07-24-manager-service-customer-ids/spec.md`
- State: Ready for Review
- Approval: Not Approved

## Documented Decisions

- Customer identity is canonical for membership recipients, membership
  histories, attendance walk-ins, and participant presentation.
- The Membership management surface has an explicit independent authority
  matrix:
  - without `memberships.manage`, retain the existing no-management state and
    call no membership API from this surface;
  - with management but without live `dashboard.can_read_memberships`, expose
    no membership reads or context-dependent mutations;
  - with membership read/manage but without customer read, allow membership
    type administration but no customer-specific work; and
  - with all three authorities, expose the full workflow.
- `memberships.manage` never implies `memberships.read`. Membership mutation
  controls require current read context because they operate on server-owned
  type/grant state.
- A membership API `forbidden` clears membership types, grants, ledger, and
  mutation forms while preserving the independent customer directory.
  Explicit `listTypes` retry is the only recovery probe while the live
  membership-read capability remains true, and the forbidden latch clears only
  after that probe succeeds.
- Customer forbidden and membership forbidden are independent latches; each
  domain preserves authorized state owned by the other.
- `userId` remains only for authentication/access-role operations and
  linked-user display compatibility.
- Existing customer-directory pagination and customer-label helpers are reused
  instead of creating competing list or presentation contracts.
- Membership type administration, grant-ID stock adjustment/revoke, attendance
  lifecycle, and trial participants retain their existing ClassKit methods.
- Lack or loss of customer-read authority disables only customer directory/get
  calls and customer-based selection/mutations; it does not disable unrelated
  membership type administration or attendance lifecycle controls.
- A customer API `forbidden` overrides a still-true dashboard capability for
  the affected surface. Only an explicit directory retry may probe for restored
  access; customer detail and mutation calls resume after that retry succeeds.
- Page-local customer filtering must not be presented as global search.
- Customer-first labels use customer summaries/details first, linked users only
  as compatibility fallback, and localized unknown/unnamed copy rather than
  raw IDs.
- Attendance removes the broad user directory call. Exact
  `management.users.get(userId)` fallback reads are live-`users.read` gated,
  deduplicated per reconciliation, presentation-only, and cannot render an ID.
- One attendance generation guard covers participant, registration, customer,
  and linked-user results so late work cannot combine different classes or
  refresh generations.
- Picker filter/page transitions clear selection; refresh also clears it when
  the selected customer is absent from the newly committed page.
- The assignment explicitly excludes customer lifecycle UI, register/
  deregister controls, ghost merge, new policy, and access-role migration.

## Questions

No material questions remain. The tracker contract, current repository, and
v0.1.23 public types determine the required product and architectural boundary.

## Pressure-Test Result

- Status: Complete
- Categories checked: identity ownership, pagination, permissions and
  forbidden recovery, nullable linkage, privacy-safe fallbacks, partial
  failure, stale async work, localization, and acceptance evidence.
- New questions added: None.
- Remaining non-blocking risks: embedded picker layout and the availability of
  browser principals for linked/ghost and permission-loss acceptance.

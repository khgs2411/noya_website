# Manager Service Customer Identity Migration Design

Status: Ready for Review — not approved for implementation planning.
Design directory: `docs/design/2026-07-24-manager-service-customer-ids/`

## Goal And Success Criteria

Make the existing manager membership and attendance workflows operate on the
ClassKit customer service identity so linked and ghost customers receive the
same supported behavior.

The migration succeeds when:

- membership selection, selected state, grants, ledger reads, and set/replace
  mutations are keyed by `customerId`;
- membership stock adjustment and revoke continue to operate on grant IDs and
  membership-type administration remains unchanged;
- attendance walk-ins select a customer and call
  `management.attendance.addCustomerWalkIn`;
- registered and walk-in participant labels remain useful when `userId` is
  null, without rendering raw customer or user IDs;
- trial attendance and the start, update, complete, refresh, and permission
  error lifecycles remain intact;
- customer directories remain opaque-cursor paginated instead of pretending a
  page-local filter is a complete search; and
- deprecated membership and attendance user-identity methods made obsolete by
  this migration no longer occur in website source.

## Current Repository Context

- `@class-kit/react` is already pinned to the v0.1.23 commit
  `a158bc588f5ec3421788475ccab2c5c2cb47ce9f`.
- `src/features/manager/customers/use-customer-directory.ts` owns the existing
  customer list contract: active/all/inactive filters, opaque cursor pages,
  retry, refresh, stale-request rejection, and forbidden clearing.
- `src/features/customers/customer-labels.ts` is the existing customer-safe
  presentation seam. It uses display name, contact email, phone, then a
  localized unnamed fallback, and never exposes IDs.
- `src/features/users/user-labels.ts` is not ID-safe by itself:
  `getUserDisplayName` falls through to `user_id`/`id`. Any linked-user
  compatibility path in this migration must stop before that fallback.
- `src/features/manager/memberships/membership-management-tab.tsx` still loads
  `management.users.list()`, keys state by `selectedUserId`, calls
  `listUserGrants`, filters the ledger by `userId`, and calls `setForUser`.
- `src/features/manager/attendance/class-attendance-form.tsx` still loads
  `management.users.list()`, selects `walkInUserId`, and calls deprecated
  `addWalkIn({ userId })`. Participant labels are user-first even though
  `ClassParticipant.customer_id` and registration customer summaries are
  canonical in v0.1.23.
- `src/features/manager/registrations/pending-registrations-panel.tsx` also
  presents a registration through its nullable linked user instead of its
  customer summary.
- `src/features/manager/manager-page.tsx` already derives the live
  `dashboard.can_read_customers`, `dashboard.can_read_memberships`, and
  `users.read` signals, but does not pass them into membership or
  class/attendance surfaces.
- v0.1.23 exposes `Customer.userId: string | null`,
  `MembershipGrant.user_id: string | null`,
  `MembershipLedgerEntry.user_id: string | null`,
  `ManagementRegistrationSummary.customer`, and
  `ClassParticipant.customer_id: string | null`.
- v0.1.23 customer-first service methods are
  `setForCustomer`, `listCustomerGrants`,
  `listLedger({ customerId })`, and `addCustomerWalkIn`.
  Grant-ID methods `revoke` and `adjustStock`, membership type methods, trial
  attendance, and attendance lifecycle methods do not change identity
  contracts.

## User-Facing Behavior

### Membership Management

- Replace the Users selector with the customer directory. The selector uses the
  existing directory hook and presents one opaque-cursor page at a time with
  localized lifecycle filters, Previous/Next, refresh, retry, and customer-safe
  labels.
- Do not retain the current local “search users” control: filtering one
  customer page would falsely imply global search, while v0.1.23 provides no
  customer search operation.
- Store selection as `selectedCustomerId`. Closing selection, changing the
  lifecycle filter, or changing pages clears customer-specific membership
  state so details cannot be attributed to a different visible page. Refresh
  also clears selection if the selected customer is absent from the newly
  committed page.
- A selected linked or ghost customer receives the same membership form,
  current-grant cards, ledger, stock adjustment, and revoke controls.
- Use customer-oriented localized copy throughout this section. Linked-login
  state may be shown as secondary context but cannot determine eligibility.
- Treat `memberships.read` and `memberships.manage` as independent
  authorities. This management surface requires both live
  `dashboard.can_read_memberships` and the existing `memberships.manage`
  permission before it calls `listTypes` or renders membership type or grant
  mutation controls. Read authority is required because every mutation form
  depends on current server-owned type/grant context; manage authority is not a
  proxy for that context.
- When `memberships.manage` is absent, preserve the existing no-management
  state and make no membership API call from this surface even if read
  authority exists. Read-only customer membership context remains owned by the
  Customers workspace.
- When `memberships.manage` exists but live
  `dashboard.can_read_memberships` is false, show a distinct localized
  membership-read unavailable state. Do not call `listTypes`,
  `listCustomerGrants`, or `listLedger`, and do not render create, edit,
  deactivate, set, revoke, or stock-adjustment controls.
- If live customer-directory authority is unavailable, keep membership type
  administration available only when both membership read and management
  authority remain effective, but show an explicit customer-selection
  unavailable state and make no customer directory, grant, ledger, or customer
  membership mutation call. After a customer API `forbidden`, only an explicit
  directory retry may probe for restored access; customer detail and
  membership calls remain blocked until a successful directory response
  re-establishes effective customer authority.
- A membership read API `forbidden` independently invalidates effective
  membership-read authority even if the latest dashboard capability remains
  true. Clear membership types, selected grants, ledger, and every
  membership-derived mutation form; stop all membership mutations until
  recovery. Preserve any committed customer-directory page because customer
  authority is independent.
- While the live membership-read capability remains true, an explicit
  membership retry may call `listTypes` as the recovery probe. Keep the
  invalidated state latched while the request is in flight. Only a successful
  type response restores membership type administration; customer grant and
  ledger reads resume only after a currently selected customer is loaded
  again. When the live capability is false, no retry may probe the API.
- A forbidden customer-directory response clears customer records and selected
  customer membership state. Ordinary failures preserve the last committed
  directory page and offer retry according to the existing hook contract.

### Attendance

- Preserve start, participant status updates, completion, refresh, and trial
  participant behavior exactly.
- Replace the walk-in user selector with a paginated customer selector backed
  by the existing customer-directory contract. It supports linked and ghost
  customers and never uses linked-login status as eligibility. Filter/page
  transitions clear the pending walk-in selection, and refresh clears it when
  the selected customer is no longer on the committed page.
- The selector is available only while attendance is editable and live
  customer-directory authority is present. Without that authority, attendance
  lifecycle and existing participants remain usable, but adding a customer
  walk-in is unavailable with explicit localized copy.
- Adding a walk-in calls
  `addCustomerWalkIn(classId, { customerId, attendanceStatus: "present" })`,
  appends the returned participant optimistically, clears selection, and
  silently reconciles from ClassKit as today.
- Preserve the existing ClassKit error mapping. The live-registration conflict
  copy becomes customer-oriented rather than user-oriented.

### Customer-First Labels

- Registration presentation uses `registration.customer` first, with
  `registration.user` only as a linked-user compatibility fallback when the
  customer summary is absent. That fallback may use display name or email, but
  never the linked user ID.
- Registered attendance participants use the matching registration customer
  summary first.
- Non-trial attendance participants with a `customer_id` not covered by a
  registration summary load the customer through
  `management.customers.get(customerId)` when customer-read authority exists.
  Fetch unique IDs once per attendance reconciliation and reject stale
  responses when the class or load generation changes.
- If customer detail is unavailable, a non-null `user_id` may use the existing
  exact `management.users.get(userId)` record as a linked-user compatibility
  fallback when live `users.read` authority exists. Resolve each unique
  fallback user ID at most once per attendance reconciliation; do not retain a
  broad `management.users.list()` call solely for labels. A customer with no
  available presentation data uses the localized unknown-participant label,
  never a raw ID.
- Membership customer rows use the shared customer-label helper directly.

## Technical Design And Boundaries

### Customer Directory Reuse

Reuse `useCustomerDirectory` as the single list-state owner. Do not introduce a
second pagination implementation or make membership/attendance call
`management.customers.list` directly.

Add a reusable manager customer-picker presentation component under
`src/features/manager/customers/`. It receives the hook result and selection
callbacks; it does not own ClassKit calls, capability derivation, or membership
or attendance state. Membership and attendance each instantiate the hook so
their paging, filter, selection, and failure state remain independent.

The hook must expose enough state for embedded pickers to:

- render the current committed page and lifecycle filter;
- show loading, error, access-changed, retry, refresh, and navigation states;
- clear protected records after a forbidden response; and
- close or reset selection when filter/page context changes or a refreshed
  page no longer contains the selected customer.

Treat customer authority as effective only while the live
`dashboard.can_read_customers` signal is true and no customer API `forbidden`
has invalidated it. A forbidden response clears protected records and
selection immediately. The embedded picker's explicit retry remains the sole
allowed access probe; a successful list response clears the invalidation and
re-enables customer detail and mutation paths. This preserves recoverability
without trusting a capability snapshot contradicted by the API.

Existing Customers-workspace behavior must remain compatible. Any hook
extension must be additive and preserve its current consumers.

### Membership Identity

Rename user-oriented local concepts to customer-oriented concepts:

- `ProductUserListItem[]` becomes `Customer[]`;
- `selectedUserId` becomes `selectedCustomerId`;
- customer membership load calls
  `listCustomerGrants(customerId)` and
  `listLedger({ customerId, limit })`;
- set/replace calls `setForCustomer({ customerId, ...grantFields })`; and
- grant and ledger reconciliation remain based on returned grant/ledger
  objects, whose nullable `user_id` is display metadata only.

Do not migrate `revoke(membershipGrantId)` or
`adjustStock({ membershipGrantId, stockDelta })`: their canonical identity is
the grant, not the customer or user.

Pass both `canReadCustomers` and `canReadMemberships` from `ManagerPage` to the
membership surface. Keep separate effective-authority latches for customer and
membership reads so a forbidden response in one domain does not erase
authorized data owned by the other.

The complete membership call and UI matrix is:

| Customer read | Membership read | Membership manage | Result |
| --- | --- | --- | --- |
| Any | Any | No | Existing no-management state; no membership calls from this surface |
| Any | No | Yes | Membership-read unavailable state; no membership reads or mutations |
| No | Yes | Yes | Type list and type administration only; no customer list, customer grant/ledger reads, or customer mutations |
| Yes | Yes | Yes | Full type administration and customer membership workflow |

An effective forbidden latch is treated as `No` for its read column until the
explicit successful recovery defined above. Never infer either read column
from management authority, another capability, a role name, or the cached
manager shell.

### Attendance Identity And Presentation

Pass `canReadCustomers` from `ManagerPage` through
`ClassManagementTab`, the class detail surface, and `ClassAttendanceForm`.
This signal gates customer list/get calls and walk-in selection only; it does
not gate attendance lifecycle operations. Pass the existing live
`canReadUsers` signal through the same boundary solely for exact linked-user
fallback reads; neither signal may come from the cached manager shell.

Maintain customer presentation state separately from participants and
registrations. Customer-detail lookup failure must not turn the whole
attendance load into an error. Silent refresh retains known labels on an
ordinary failure, while a forbidden response clears customer-derived
presentation data, invalidates effective customer authority, and disables
customer detail/mutation paths until an explicit picker retry succeeds.

Remove attendance's `management.users.list()` call. After customer-first
sources are applied, resolve only otherwise-unlabelled non-null
`participant.user_id` values with `management.users.get` when `canReadUsers`
is live. User lookup failure is presentation-only. Ordinary failure retains
known labels during silent refresh; `forbidden` clears user-derived labels and
invalidates further user fallback reads for the mounted surface. User fallback
uses display name/email only and must never expose `user_id`/`id`.

Use one attendance load generation across participants, registration
summaries, customer details, and exact user fallbacks. A newer reconciliation
or class change invalidates every older result so records and labels from
different classes or generations cannot be combined. Base attendance failure
retains the existing whole-load behavior; registration, customer-detail, and
user-detail failures remain optional presentation failures.

### Registration Presentation

Extend the shared customer presentation input only when necessary to accept the
registration summary's `customer` shape without adapters. In particular,
`customerOrigin` is not required for label/contact helpers and may be optional
on their shared presentation input while origin-specific rendering continues
to accept the full `Customer`. Pending registration cards use customer
label/contact first and user display name/email only when the customer summary
is missing; they do not use the generic user helper's ID fallback.

## Permissions, Security, And Privacy

- ClassKit remains authoritative for customer reads, memberships, attendance,
  accounting, and lifecycle authorization.
- The website derives no access from linked-user existence, role names, or
  cached capabilities.
- Only live `dashboard.can_read_customers` positively authorizes customer
  list/get calls initially. A cached shell snapshot cannot mount protected
  customer directory state. A customer API `forbidden` overrides the live
  boolean until an explicit directory retry succeeds; the retry is an access
  probe, not permission inference.
- Only live `dashboard.can_read_memberships` positively authorizes membership
  type, customer grant, and ledger reads. `memberships.manage`,
  `customers.read`, role names, and cached shell state are not read authority.
- The membership management UI requires both current read context and
  `memberships.manage` before exposing mutations. This is a website safety
  boundary around context-dependent controls, not a new backend entitlement
  rule.
- Only live `users.read` authorizes exact linked-user fallback reads. No broad
  user directory is loaded for attendance presentation.
- `userId` remains in scope only for authentication/access-role behavior and
  linked-user display compatibility. No service mutation introduced here sends
  it.
- Raw customer IDs, user IDs, permission keys, and metadata are not rendered.
- No Supabase or raw Edge Function call is introduced.

## Failure And Recovery Behavior

- Membership type/template loading remains independent from customer-directory
  loading so a directory failure does not disable authorized type
  administration.
- Membership-read loss clears membership types, grants, ledger, and
  context-dependent mutation controls without clearing the independent
  customer directory. Customer-read loss clears the directory and selected
  customer context without clearing authorized membership types.
- Customer-specific membership calls commit only for the currently selected
  `customerId`; late responses from a prior selection are ignored.
- Filter/page changes clear selection before the new page is presented;
  refresh clears selection when the selected customer disappears from the
  committed page.
- Customer detail lookup failures affect labels/picker context only, not
  attendance participants or lifecycle controls.
- Attendance reconciliation uses a shared generation guard so late
  participant, registration, customer, or linked-user results cannot cross a
  class or refresh boundary.
- Existing mutation busy-state protections continue to prevent competing
  membership and attendance actions.
- Permission loss clears protected customer data and disables customer-based
  mutations without erasing already loaded ClassKit attendance participants.
- Successful mutations continue the existing optimistic update plus silent
  authoritative refresh pattern.

## Testing And Acceptance Evidence

- Static source checks prove the obsolete calls are absent from `src`:
  membership and attendance `management.users.list()`,
  `memberships.listUserGrants`, ledger `{ userId }`,
  `memberships.setForUser`, and `attendance.addWalkIn`.
- Static inspection proves `canReadMemberships` is passed independently and
  protected membership reads cannot run when it or the effective
  membership-read latch is false.
- Type/build verification compiles the exact v0.1.23 customer-first method
  names and nullable identity fields.
- Lint verifies hook dependencies and component contracts.
- Browser acceptance, using an already-running approved server only, covers:
  linked and ghost customer membership selection/set/change/list/ledger;
  stock adjustment and revoke; linked and ghost customer walk-ins; trial
  attendance; participant and registration labels with nullable users;
  permission loss/errors; refresh; mobile/desktop; and English, Russian, and
  Hebrew RTL.
- Capability acceptance separately exercises customer-read,
  membership-read, and membership-manage denial/loss. It verifies that
  membership-read loss removes protected membership data and mutations without
  erasing the customer page, while customer-read loss preserves authorized
  membership type administration.
- If no server or suitable principals exist, report those browser rows as
  unverified rather than weakening static verification or starting a server.

## Implementation Constraints And Seams

- Preserve Tailwind and existing shadcn-compatible components.
- Keep all visible copy in `src/i18n.ts` for English, Russian, and Hebrew.
- Preserve branded mobile-first detail/picker behavior and safe long-value
  wrapping.
- Do not change the ClassKit dependency, backend policy, entitlement rules,
  attendance policy, customer lifecycle UI, merge UI, or registration
  mutation contract.
- Do not add a router, global state, direct Supabase use, or a raw ClassKit
  function call.
- Do not start a development server without explicit approval.

## Assumptions And Provenance

- The assignment ledger supplies the required outcome, scope, exclusions,
  acceptance criteria, v0.1.23 prerequisite, and customer-first method names.
- Current repository code supplies the existing customer directory,
  presentation helper, capability gates, optimistic mutation patterns, and
  localization/design conventions.
- The locally cached v0.1.23 package at the exact pinned commit verifies the
  nullable identity types and method signatures.
- The picker reuse and lookup fallback ordering are design inferences chosen to
  preserve complete-customer reach, prevent false global search, and retain
  linked-user compatibility without making user identity canonical.

## Open Questions

None. The assignment and repository evidence establish one coherent migration
boundary without a product fork.

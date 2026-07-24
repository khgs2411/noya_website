# Manager Customers Workspace Design

Status: Working Draft — not approved for implementation planning.
Design directory: `docs/design/2026-07-24-manager-customers/`

## Goal And Success Criteria

Replace the manager's mixed Users directory with a customer-first workspace.
The workspace treats a ClassKit customer as the service recipient and treats an
optional linked user as a separate login and access identity.

The feature succeeds when:

- active and inactive, linked and unlinked customers coexist in one paginated
  directory backed by `client.management.customers`;
- list, selection, detail, refresh, and membership-history state are keyed by
  `customerId`, never by `userId`;
- an unlinked customer remains fully selectable and understandable without a
  fabricated user identity;
- linked-user role assignment and revocation remain available through
  `client.management.users.roles`, while role creation and permission
  configuration remain exclusively in the prerequisite Permissions workspace;
- customer, membership, and linked-access capability combinations have
  explicit, independent states instead of blank or partially misleading UI;
- the workspace is usable on mobile and desktop, in light and dark themes, and
  in English, Russian, and Hebrew RTL; and
- no website component calls Supabase or a raw ClassKit Edge Function.

## Current Repository Context

- `src/features/manager/manager-page.tsx` derives manager capabilities, owns the
  active tab, and lazy-loads manager workspaces.
- `src/features/manager/manager-tabs.tsx` currently exposes a primary `users`
  tab.
- `src/features/manager/users/user-role-management-tab.tsx` currently combines
  a `management.users.list()` directory, role assignment/revocation, role
  creation/editing, and permission grants/revocations in one component.
- `src/features/manager/memberships/membership-management-tab.tsx` still uses
  the legacy user-oriented membership facade. That adjacent migration is not
  part of this customer-directory slice; new customer workspace state and
  reads must nevertheless use the customer-first v0.1.21 facade.
- `src/features/users/user-labels.ts` accepts user-shaped identities and can
  expose IDs as display fallbacks. It is not a safe customer presentation
  contract because ghost customers have no user ID and raw customer IDs are
  not presentation fields.
- `src/App.tsx` may render the manager shell from a short-lived cached
  capability snapshot. Cached authority is not fresh enough to positively
  authorize this data-bearing workspace.
- `src/i18n.ts` is the single English, Russian, and Hebrew locale registry.
- `DESIGN_GUIDE.md` requires branded mobile-first manager layouts, safe wrapping,
  RTL support, and drawer/dialog detail surfaces instead of inline expansion.
- `package.json` and `bun.lock` already pin `@class-kit/react` v0.1.21 at commit
  `c0d1fc7a0f7eff77a17b3fbccc3944d19c74711d`.
- The pinned SDK exposes `management.customers.list({ limit, cursor, status })`
  with `nextCursor`, `management.customers.get(customerId)`, customer-first
  membership reads, and nullable `Customer.userId`.
- The assignment requires a dedicated Permissions workspace to own role
  creation and permission configuration before this redesign. That workspace is
  not present on the current `version/1.1.5` base. Customer implementation must
  therefore start only after the prerequisite is integrated.
- The accepted ClassKit backend at
  `2f3c6390e34f288cd349cb49312f2cb5e097db1a` does not expose one authority
  matching the proposed page:
  - customer list/get requires product role level 75;
  - membership type, customer-grant, and ledger reads require level 75;
  - linked-user get requires `users.read`;
  - user-role assignment/revocation requires
    `product_user_roles.manage`; and
  - the complete role catalog requires level 75 or
    `product_role_permissions.manage`.
- The current product context derives `dashboard.can_manage_users` solely from
  `product_user_roles.manage`. It can therefore authorize a page whose
  customer, membership, user-read, or role-catalog calls will be denied, while
  hiding customer reads from a level-75 manager who lacks that mutation key.
  v0.1.21 exposes no granular live customer-read or membership-read signal and
  no assignment-authorized role-catalog facade.

## User-Facing Behavior

### Navigation And Access

- Replace the primary **Users** entry with a localized **Customers** entry.
- Keep the prerequisite **Permissions** entry separate and lower-frequency in
  the manager's More menu. Customers must not contain role creation, role
  editing, permission-catalog configuration, or permission grant/revoke
  controls.
- Do not use `dashboard.can_manage_users` as a proxy for the whole page. The
  final integration requires independent, live signals matching the accepted
  operation matrix:

  | Surface / operation | Accepted backend authority | Required live website signal |
  | --- | --- | --- |
  | Customer list/get | Product role level 75 | Explicit customer-directory read signal |
  | Membership context reads | Product role level 75 | Explicit membership-context read signal |
  | Linked-user get | `users.read` | `users.read` in live effective permissions |
  | Role assign/revoke | `product_user_roles.manage` | `product_user_roles.manage` in live effective permissions |
  | Complete assignable-role catalog | Level 75 or `product_role_permissions.manage` | Assignment-authorized catalog-read signal that does not imply configuration authority |

- A cached manager snapshot may keep the enclosing shell visible but cannot
  positively authorize, expose, mount, or load any Customer data surface.
- Show and mount Customers only when the final live customer-directory read
  signal is present. Pass the other live signals independently so linked
  identity, membership context, and access mutations never inherit authority
  from navigation visibility.
- If customer access disappears while Customers is active, derive a safe
  effective tab before render, do not mount the workspace, and then repair the
  stored active tab.
- The workspace receives and enforces `canManageCustomers` as a defensive
  boundary. A denied state contains no customer data or controls.

### Directory, Status Filters, And Opaque Pagination

- The default directory view requests both active and inactive customers by
  omitting the SDK `status` filter. Localized **All**, **Active**, and
  **Inactive** filters make lifecycle state explicit; choosing a specific
  filter sends the corresponding SDK status.
- Use a bounded page size within the SDK's supported 1–100 range. The UI must
  not infer a total or page number because the contract supplies neither.
- Treat every cursor as opaque. A successful response's `nextCursor` is the
  only value used for the next request.
- Represent each committed page as
  `{ requestCursor, records, nextCursor }`, plus a current index and filter
  generation. Keep committed pages in memory so **Previous** can return to a
  prior page without reversing or decoding a cursor.
- Fetching next does not change the current index or append a page until the
  response succeeds. Starting a different status filter increments the
  generation, clears committed pages, and ignores or aborts every response from
  the prior generation.
- Refresh replaces only the current page after success. If its `nextCursor`
  differs from the committed value, invalidate every cached forward page
  because its request cursor is no longer authoritative.
- Page, filter, capability, and selected-customer transitions carry request
  tokens or abort signals. A response may commit only if its token still
  matches the current filter generation, page request, and capability state.
- Disable forward navigation when `nextCursor` is null and backward navigation
  on the first page. A failed next-page request preserves the current page and
  cursor stack and offers retry.
- Do not present page-local filtering as global customer search. v0.1.21 has no
  search contract, so this slice adds no search field.
- Each row/card shows a safe customer label, supporting contact information
  when present, localized linked/unlinked state, localized active/inactive
  state, and a human label for origin. Known origins include
  `manager_created` and `signup`; unknown origin strings use a localized
  generic source label rather than exposing the raw value.
- Customer IDs, user IDs, metadata keys/values, role IDs, and raw permission
  keys are never rendered.

### Selection And Detail

- Selecting a row stores only its `customerId` and loads the authoritative
  customer with `management.customers.get(customerId)`.
- Open selection in a bottom drawer on mobile and a compact dialog-style
  overlay on wider screens. Backdrop and Escape close it; clicks within it do
  not.
- Page or lifecycle-filter changes close the current selection so the detail
  cannot appear to belong to a different visible result set.
- Refresh reloads the current list page and, when a detail is open, reloads its
  customer and permitted context. It preserves the current page/filter and
  selected `customerId` while requests are in flight.
- If the selected customer no longer exists, close the detail and show a
  localized list-level notice. Other detail-context failures do not discard the
  customer record.

### Customer Identity And Lifecycle Presentation

- The primary label uses trimmed `displayName`, then contact email, then phone,
  then a localized **Unnamed customer** fallback. It never falls back to
  `customerId` or `userId`.
- Present contact email and phone only when supplied.
- Present linked/unlinked state as access linkage, not as customer validity.
  Unlinked customers use customer-oriented copy such as **No login linked**,
  never **incomplete user**.
- Present active/inactive as the customer lifecycle. Do not imply that an
  inactive customer is an inactive login or that unlinking changes lifecycle.
- Present created/updated timestamps only when they help the manager understand
  the record. Do not render raw metadata in this slice.
- Customer creation, editing, deactivation, reactivation, and merge affordances
  are absent.

### Membership Context

- When the final live membership-context read signal is present, load the
  selected customer's grants with
  `management.memberships.listCustomerGrants(customerId)`, recent history with
  `management.memberships.listLedger({ customerId, limit })`, and membership
  type names with `management.memberships.listTypes()`.
- Show a concise read-only membership summary: type label, grant lifecycle,
  validity, remaining stock where applicable, and a bounded recent-history
  list using localized event labels. Do not render internal IDs or raw metadata.
- When membership-read authority is absent, show a localized explanation that
  membership context is not available to this manager and do not call the
  membership facade. `memberships.manage` is not a valid read gate: the accepted
  backend uses level 75 for these reads, while that permission names mutation
  authority.
- Membership context has its own loading, error, and retry state. Its failure
  does not hide customer identity or linked-access context.
- The Customers workspace performs no membership grant, set, upgrade, revoke,
  or stock-adjustment mutation.

### Linked Access Context And Role Changes

- For `userId: null`, show **No login linked** and never call
  `management.users`, load role choices, or render role assignment/revocation
  affordances.
- For a linked customer with live `users.read`, load the access identity with
  `management.users.get(customer.userId)`. Display only user-relevant access
  status, scope, and assigned role labels; do not duplicate customer contact
  fields as the canonical service identity.
- A linked customer without `users.read` remains visibly linked but shows a
  localized identity-unavailable state and makes no user-read call.
- Identity read and role mutation are independent:
  - no `users.read`: no access record or role controls;
  - `users.read` without `product_user_roles.manage`: read-only linked access;
  - both authorities plus the assignment-authorized catalog read: read access
    and assignment/revocation; and
  - ghost: no linked-access calls or controls regardless of capabilities.
- Load the complete assignable role catalog through the ClassKit read contract
  established as an upstream prerequisite. The Permissions UI split alone does
  not establish this contract. The read must be authorized for user-role
  managers without conferring role-definition mutation authority.
- Assign and revoke only through
  `management.users.roles.assign({ userId, roleId })` and
  `management.users.roles.revoke({ userId, roleId })`.
- Disable competing role actions during a role mutation. On success, refresh
  the linked user access record and reconcile the displayed assignments from
  ClassKit. On failure, preserve the selected customer and current assignments
  and show a localized retryable error.
- Role assignment/revocation must remain functional for a manager who can
  manage linked-user access but cannot configure role definitions. Requiring
  `can_manage_roles` for Customers would collapse the boundary back into the
  design this assignment replaces.
- If the prerequisite role-catalog contract is still unavailable at
  implementation time, stop rather than broadening authority, calling a raw
  backend, hiding assignment, or presenting an empty catalog.
- `userId` is the fail-closed access discriminator. `identityStatus` may label
  the record only when consistent with `userId`. If the SDK returns
  `identityStatus: "linked"` with `userId: null`, or `"unlinked"` with a
  non-null `userId`, show a localized customer-detail data error and render no
  access calls or controls.

## Technical Design And Boundaries

Add a customer domain under `src/features/manager/customers/`. The workspace
owns directory loading, page-stack state, selection, independent detail-context
loads, and linked-role mutations.

Create a small customer presentation seam under `src/features/customers/` for
pure, reusable customer label and supporting-contact derivation. It accepts
customer-shaped identity, never performs ClassKit calls, never exposes raw IDs,
and can later be reused by membership, registration, and attendance surfaces.
Pagination, capability logic, detail loading, and mutations remain in the
manager customer feature rather than leaking into the shared helper.

`ManagerPage` remains the capability integration boundary:

- derive every positive Customer data signal from live ClassKit context, not
  `accessSnapshot`;
- pass customer-directory, membership-read, linked-user-read, role-mutation,
  and assignment-catalog availability independently;
- expose Customers to `ManagerTabs` only when live-authorized;
- lazy-load and mount the workspace only when authorized; and
- repair an invalid active tab before mounting any denied workspace.

`ManagerTabs` owns navigation placement and labels but does not read ClassKit.
The prerequisite Permissions workspace remains separately capability-gated.

The existing mixed Users component is retired only after its role-definition
responsibilities exist in Permissions. Customer implementation must not delete
the sole working role configuration UI from the current base and claim the
prerequisite is satisfied.

No new route, global state, persisted cursor cache, website data model, backend
API, dependency, direct Supabase call, or raw Edge Function call is introduced.

## Data And State

ClassKit remains authoritative for customers, linked users, roles,
memberships, and permissions. Noya owns only ephemeral UI state:

- selected lifecycle filter;
- current page index, per-page request cursor, loaded customers, and
  `nextCursor`;
- list loading/error/refresh state;
- selected `customerId`;
- authoritative selected customer and its load state;
- independent membership-context and linked-access-context state; and
- active role mutation and localized feedback.

Selection and every service-recipient request use `customerId`. The nullable
`userId` is read from the latest selected-customer response and is used only for
linked access calls. If a refresh changes or removes that link, clear stale
access state before any new access call.

Do not store selected customer, linked user, or membership objects as
independent long-lived copies when they can be resolved from the latest
authoritative response. Each committed directory page stores its request cursor,
records, and next cursor; changing filters creates a new generation. Do not
persist cursors or customer data in local storage.

## Integrations

The customer and read-only service integration is:

```text
useProductContext().client
  -> management.customers.list({ limit, cursor?, status? })
  -> management.customers.get(customerId)
  -> management.memberships.listTypes()
  -> management.memberships.listCustomerGrants(customerId)
  -> management.memberships.listLedger({ customerId, limit })
```

Linked access adds:

```text
management.users.get(userId)
management.users.roles.assign({ userId, roleId })
management.users.roles.revoke({ userId, roleId })
ClassKit prerequisite role-catalog read authorized for user-role managers
```

Only exported v0.1.21 types are used for ClassKit records and inputs. The
executor must confirm the installed dependency resolves to the pinned lockfile
commit before relying on those types.

## Permissions, Security, And Privacy

- The final live customer-directory read signal governs Customers navigation,
  mounting, and customer list/get calls.
- The final live membership-context read signal separately governs membership
  reads.
- Live `users.read` governs linked-user reads.
- Live `product_user_roles.manage` governs assignment/revocation only after
  linked identity is readable and an assignment-authorized catalog is
  available.
- Role-definition capability does not grant or substitute for customer
  authority. `dashboard.can_manage_roles` remains owned by Permissions.
- Cached manager access is a shell-loading optimization, never positive
  authority for customer or service data.
- Frontend guards improve UX but do not replace ClassKit server authorization.
- Do not log customer records, contact fields, membership history, user access
  records, or raw API error payloads.
- Do not expose metadata, internal IDs, raw permission keys, or unknown origin
  strings.

## Failure And Recovery Behavior

- Missing client or denied customer authority produces an unavailable/denied
  state and no customer calls.
- Initial list failure shows a retry state. Refresh failure preserves the last
  successful page and marks it stale.
- Next-page failure preserves the current page and does not push a cursor.
- Detail identity, membership context, and linked-access context fail
  independently. Customer identity remains visible whenever its authoritative
  load succeeded.
- A linked-user record that cannot be loaded shows an access-specific error and
  retry; it must not be reclassified as an unlinked customer.
- Contradictory `identityStatus` and `userId` values show a detail data error and
  fail closed for every access call and control.
- Role mutation failure preserves current access data and selection.
- Customer linkage changing during refresh clears stale user-role controls
  before rendering the new linked/unlinked state.
- Capability loss prevents new calls, unmounts the workspace when customer
  authority is lost, and replaces a membership section when only membership
  authority is lost.

## Localization, Layout, And Accessibility

- Replace `manager.tabs.users` with `manager.tabs.customers` and add a complete
  `manager.customers` tree in English, Russian, and Hebrew.
- The prerequisite `manager.tabs.permissions` and `manager.permissions` copy
  remain separately owned; role-definition copy must not move back under
  Customers.
- Use logical layout and spacing utilities and the application's active
  direction. Directional pagination and close/back icons account for RTL.
- Long names, emails, phone numbers, and role labels wrap safely.
- Status filters expose pressed/selected state, list rows are keyboard
  selectable, loading and errors are announced, and the detail overlay manages
  focus, Escape, backdrop close, and focus return.
- Use current brand tokens, typography, rounded warm surfaces, and responsive
  stacked-to-grid layouts. No new visual dependency is needed.

## Testing And Acceptance Evidence

Static and type verification:

- install from the existing lockfile only if dependencies are absent, without
  modifying manifests or lockfiles;
- run `npm run lint`;
- run `npm run build` because the change introduces a new pinned-SDK surface,
  customer/member types, lazy imports, and cross-component capability props;
- inspect that Customers calls only `management.customers`,
  customer-first membership reads, linked `management.users.get`, and
  `management.users.roles.assign/revoke`;
- inspect that customer IDs never enter translated or rendered values and
  ghosts never reach linked-user calls;
- inspect that role create/update and permission grant/revoke operations exist
  only in Permissions after the prerequisite is integrated; and
- compare all consumed Customers and navigation keys across English, Russian,
  and Hebrew locale trees.

Browser smoke verification uses an already-running approved local server only:

- all/active/inactive filters and multiple cursor pages, including next failure,
  previous navigation, refresh, empty, and selection behavior;
- linked and ghost customers on the same page;
- active and inactive customer presentation;
- customer-read without membership-read; linked identity unreadable; linked
  identity read-only; linked role assignment/revocation without
  role-definition authority; and full-context combinations;
- capability loss while active;
- narrow and wide layouts, light and dark themes, English/Russian, and Hebrew
  RTL.

If no server or suitable capability/customer fixtures exist, report the missing
interaction matrix rows explicitly. Do not start a server or fabricate evidence.

## Implementation Constraints And Seams

- The Permissions workspace and the ClassKit assignment-authorized
  role-catalog read are separate prerequisites, not hidden work inside
  Customers.
- Implementation planning is blocked until ClassKit documents and tests live
  signals for customer-directory reads and membership-context reads, exposes
  `users.read` and `product_user_roles.manage` to the website's live capability
  decision, and supplies a complete assignable-role catalog readable by
  assignment managers without role-definition authority. The consuming SDK
  version and lockfile commit must be named before planning resumes.
- The customer presentation helper is the only reusable seam required now.
  Do not build a global customer store, generic data-fetching framework, or
  speculative service-card abstraction.
- This slice presents customer lifecycle but does not add customer lifecycle
  mutations, membership mutations,
  registration/attendance mutations, automatic matching, or backend/SDK work.
- Existing membership, registration, and attendance screens are not migrated
  in this slice. The shared customer presentation seam is intentionally shaped
  for those later customer-first migrations.
- Do not preserve the mixed Users component solely to minimize the diff. Once
  Permissions owns role definitions and Customers owns the customer directory
  plus linked access, remove the superseded composition and any state/imports
  made unused by the split.

## Assumptions And Provenance

- Outcome, data boundaries, scope, exclusions, required SDK version, and
  acceptance criteria come from `.symphony/assignment.md`.
- Current page, capability-cache, localization, and styling facts come from the
  repository files named above.
- Exact customer, membership, cursor, nullable-link, and user-role method shapes
  were verified against the v0.1.21 tag at the commit pinned by `bun.lock`.
- The status-filter/page-stack model, no-search decision, independent detail
  context failures, live-only authorization, and generic unknown-origin label
  are repository-grounded design inferences.
- Treating the separate Permissions workspace and an independently authorized
  role-catalog read as execution prerequisites follows the assignment's
  sequencing requirement and the current repository's lack of that boundary.
- Backend authorization evidence comes from accepted ClassKit API commit
  `2f3c6390e34f288cd349cb49312f2cb5e097db1a`:
  `class-kit-customers`, `class-kit-memberships`,
  `class-kit-product-users`, `class-kit-product-roles`,
  `class-kit-product-user-roles`, and `class-kit-product-context`.

## Open Questions

None. The assignment fixes the product boundary. The missing Permissions
workspace and granular upstream authorization/read contracts are blocking
execution prerequisites, not product choices this website may redefine.

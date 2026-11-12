# Lesson delete and customer soft delete

Target release: API and SDK `v0.1.24`. First consumer: `noya_website`.

Managers can archive and cancel lessons and recurring lessons today, and set
customers `inactive`. They cannot remove any of them. This spec adds a
permanent lesson delete, a permanent recurring-lesson delete, and a customer
soft delete that removes the customer from every manager read.

## Decisions

Settled with Liad on 2026-11-12:

- Deleting a lesson refunds first, then deletes. A lesson that isn't already
  `cancelled` goes through the existing
  `cancel_class_with_registration_restoration` path, so unused membership
  stock comes back. The lesson row is then hard-deleted, and its
  registrations, participants and attendance cascade with it. The append-only
  `membership_ledger` keeps its rows: its `class_id` and `registration_id`
  carry no foreign key, so the history survives as audit.
- Deleting a recurring lesson (schedule) deletes the schedule and every class
  it generated, past and future. Each class goes through the same refund-then-
  delete path. The schema needs this anyway: `classes_schedule_product_fk` is
  `on delete restrict`.
- Soft-deleting a customer is terminal in this release: no undelete action.
  It cancels the customer's upcoming registrations with stock restoration,
  sets linked product access `inactive`, and keeps all historical rows.
- Every delete is authorized by a new explicit product permission key. None is
  backfilled onto existing roles or granted to built-in roles: a product
  operator grants them on purpose.

## Permission keys

| Key | Authorizes |
| --- | --- |
| `classes.delete` | `class-kit-classes` / `delete` |
| `schedules.delete` | `class-kit-schedules` / `delete` |
| `customers.delete` | `class-kit-customers` / `delete` |

They're seeded in a migration next to the existing keys and are checked with
`requirePermissionByKey(..., { scope: "product" })`. Following the
key-guard rule, platform level alone doesn't imply them.

## API contract

### `class-kit-classes` / `delete`

Request `{ action: "delete", class_id }`. It needs `classes.delete` and goes
through one transactional RPC, `class_kit.delete_class(p_product_id,
p_class_id, p_actor_user_id)`:

1. Lock the class row, scoped to the product. Missing or cross-product:
   HTTP 404 `not_found`.
2. If the status isn't `cancelled`, run the same restoration logic as
   `cancel_class_with_registration_restoration`, inside the same transaction.
3. Delete the class. Registrations, participants and attendance cascade.

Response `{ deleted: true, class_id, restored_registration_count }`. It works
for standalone, template-backed and schedule-generated classes. Deleting a
generated class doesn't stop the schedule from generating that date again,
because generation's existing idempotency keys on rows that are now gone.
Callers who want the date gone for good add a skip. The SDK documents this,
and the noya UI offers it (see below).

### `class-kit-schedules` / `delete`

Request `{ action: "delete", schedule_id }`. It needs `schedules.delete` and
goes through one transactional RPC, `class_kit.delete_schedule(...)`:

1. Lock the schedule. If it doesn't exist in the product: HTTP 404
   `not_found`.
2. Run the class delete logic (step 2 and step 3 above) for every class with
   this `schedule_id`.
3. Delete the schedule. Its skips cascade.

Response `{ deleted: true, schedule_id, deleted_class_count,
restored_registration_count }`.

### `class-kit-customers` / `delete`

Request `{ action: "delete", customer_id }`. It needs `customers.delete` and
goes through one transactional RPC, `class_kit.soft_delete_product_customer(...)`:

1. Lock the customer. A missing or already deleted customer returns
   HTTP 404 `not_found`. A `merged` customer returns
   `customer_merged`, matching `get`.
2. Cancel every registration of theirs whose class hasn't started yet
   (pending or approved), restoring stock. Reuse the existing registration
   cancellation function with manager authority. The cancellation-policy
   window doesn't apply to a manager-initiated delete.
3. If the customer is linked (`user_id` not null), set their product access
   `inactive` through `set_product_user_access_status`.
4. Set `status = 'deleted'` and `deleted_at = now()`.

Response, using the same envelope as `deactivate`: `{ customer: { ...shapeCustomer(row),
deleted_at } }`, where `status` is `"deleted"` and `deleted_at` is an ISO
timestamp. `deleted_at` appears only in this response. Other customer
responses never return deleted rows, so their shape is unchanged.

Schema: widen `users_status_check` to `active | inactive | merged | deleted`
and add a nullable `deleted_at`. `set_product_customer_status` keeps
accepting only `active | inactive`, so a deleted customer can't be
reactivated through `reactivate`.

After a soft delete, "managers no longer fetch them" means:

- `class-kit-customers` `list` never returns `deleted` rows, for any `status`
  filter. A `status` filter of `deleted` is rejected with a 400. `get`,
  `update`, `deactivate`, `reactivate`, `preview_merge` and `merge`, as source
  or survivor, all return HTTP 404 `not_found`.
- `class-kit-product-users` `list` and `get` exclude deleted customers.
- Manager registration commands (`register_customer`), attendance walk-ins,
  membership grant and set commands, and `list_customer_grants` treat a deleted
  customer as HTTP 404 `not_found`.
- Historical reads keep the customer's name where the row already exists:
  past class rosters, attendance, registration history and the ledger.

A linked user whose customer is deleted can't regain access by signing in or
signing up again. The existing `(product_id, user_id)` uniqueness keeps the
deleted row in place, and access stays `inactive`.

## SDK contract (`v0.1.24`)

- `management.classes.delete(classId)`: resolves
  `{ deleted, classId, restoredRegistrationCount }`.
- `management.schedules.delete(scheduleId)`: resolves
  `{ deleted, scheduleId, deletedClassCount, restoredRegistrationCount }`.
- `management.customers.delete(customerId)`: resolves
  `{ customer: DeletedCustomer }`. `DeletedCustomer` is
  `Omit<Customer, "status"> & { status: "deleted"; deletedAt: string }`,
  mapped with the existing customer mapper plus `deleted_at` → `deletedAt`.
- `CustomerStatus` and `Customer` are unchanged.
- Error codes map through the existing error envelope. No new error classes and no new `ApiErrorCode` values.

## Noya website

Build on `master` at or after the staging merge (lifecycle-visibility toggle).

- Class management tab: a destructive "Delete lesson" action, shown only when
  the product context grants `classes.delete`. The confirmation dialog says
  it's permanent and that unused credits are restored. For a generated lesson
  it offers "also skip this date", which calls `schedules.skipDate` after the
  delete.
- Schedule management tab: "Delete recurring lesson", gated on
  `schedules.delete`. The confirmation states that every lesson it created is
  deleted.
- Customer directory: "Delete customer", gated on `customers.delete`. The
  confirmation states that upcoming bookings are cancelled and login access is
  removed. After success the customer drops out of the directory.
- Hebrew and English strings in `src/i18n.ts`, matching existing patterns.
- Pin the SDK to the released `v0.1.24` tag commit, the way existing pins work.

## Done when

- pgTAP covers each RPC. Lesson delete restores stock for an approved
  membership-consumed registration and removes registrations and attendance.
  Schedule delete removes all its generated classes and the schedule. Customer
  delete cancels an upcoming registration with stock restored, sets linked
  access inactive, and leaves a past attendance row intact.
- Edge function tests cover the auth matrix for each action. A role without
  the key gets 403, platform level 100 without the key gets 403, and a role
  with the key gets 200.
- The customer `list` test shows a deleted customer absent under every filter.
- SDK runtime and type tests cover all three methods.
- `bun run deno:check`, `supabase test db`, and the SDK's `npm test` pass.
  `npm run build` passes in noya.
- Canonical docs are updated: `docs/api/backend-api.md`,
  `docs/api/class-api-map.md`, `docs/sdk/client-sdk.md`, and a `v0.1.24`
  entry in `docs/changelog.md`.

## Test seams (confirmed)

The architect confirmed these seams on 2026-11-12. Test only here:

- API database: the three RPCs, called directly in pgTAP. This catches stock
  restoration, cascade, access deactivation and history retention. It misses
  HTTP mapping.
- API edge: each function handler with injected permission dependencies,
  following the existing `index.test.ts` pattern. This catches the auth
  matrix, request validation, error-code-to-HTTP mapping and the `list`
  exclusion. It misses SQL behavior.
- SDK: the public `management.*` methods against a mocked transport, plus type
  tests. This catches the request shape and response mapping.
- Noya: `npm run build` only. The repo has no UI test harness, and adding one
  is out of scope.

## Non-goals

- Undeleting a customer, and purging a customer's personal data.
- Deleting templates.
- Backfilling the new keys onto any existing role.

## Error codes

Every not-found case, new or existing, keeps the established wire code: HTTP
404 with `code: "not_found"`. The message names the resource. RPCs may raise
`class_not_found`, `schedule_not_found` or `customer_not_found` internally, and
the edge functions map all three to `not_found`. Existing consumers, such as
noya's customer tab and merge flow, match on `not_found`, so no not-found
response that ships today may change its code.

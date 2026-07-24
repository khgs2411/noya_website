# Chunk 01: SDK Baseline And Customer Foundations

**Plan Set:** `../plan.md`
**Approved Source:** `../spec.md` and latest `.symphony/assignment.md`
**Status:** Ready for Review
**Depends on:** None
**Enables:** Chunks 02–03

## Goal

Establish the exact v0.1.23 SDK contract plus reusable, privacy-safe customer
presentation and race-safe opaque-cursor directory state required by every
later Customers surface.

## Source Artifacts And Constraints

- `../spec.md`: current repository context, directory/pagination behavior,
  customer identity presentation, data/state, integration, and privacy.
- `../agenda.md`: resolved v0.1.23 and Permissions prerequisites.
- `../spec-audit.md`: exact authorization and cursor risks.
- `package.json` and `bun.lock`: current v0.1.22 dependency state.
- Released SDK tag v0.1.23 at
  `a158bc588f5ec3421788475ccab2c5c2cb47ce9f`.
- `src/features/users/user-labels.ts`: user-only helper; preserve for current
  non-customer consumers.
- No new dependency family, backend call, persistent state, or test framework.

## Relationships

- Supplies the SDK types and capability fields consumed by Chunks 02–03.
- Supplies the customer label/contact seam consumed by list cards and detail.
- Supplies the page state contract consumed only by the manager customer
  workspace.
- Does not expose navigation, render protected customer data, or move role
  ownership.

## File Responsibility Map

**Create:**

- `src/features/customers/customer-labels.ts` — pure safe label, supporting
  contact, initials, and known-origin presentation inputs without ID fallbacks.
- `src/features/manager/customers/use-customer-directory.ts` — customer list
  load/refresh/filter/page state, committed page triples, generation/request
  tokens, and authoritative forbidden state.

**Modify:**

- `package.json` — update only `@class-kit/react` from v0.1.22 to v0.1.23.
- `bun.lock` — resolve the updated tag to commit `a158bc5` without unrelated
  dependency drift.

**Test:**

- No automated test directory exists. Verification uses exact type/build and
  focused source/state-transition inspection; do not add a framework in this
  chunk.

## Behavioral And Contract Changes

`customer-labels.ts` accepts only presentation-safe customer identity fields.
Its label order is trimmed display name, contact email, phone, then a caller
supplied localized unnamed label. It never returns `customerId`, `userId`,
metadata, or raw unknown origin strings.

The directory hook owns:

```ts
type CustomerPage = {
  requestCursor: string | null;
  records: Customer[];
  nextCursor: string | null;
};
```

It requests `management.customers.list` with a fixed bounded limit and optional
opaque cursor/status. It commits only the active request generation. Successful
next loads append and advance; failures preserve the current page. Refresh
replaces the current page and invalidates forward pages when `nextCursor`
changes. Filter change clears pages, selection-facing output, errors, and stale
requests before loading generation zero.

`ClassKitManagerApiError("forbidden")` clears all committed customer data and
enters an access-changed state distinct from ordinary retryable transport
errors.

## Implementation Tasks

- [ ] Update the existing ClassKit dependency spec to v0.1.23 and regenerate
      only its lockfile resolution. Inspect the manifest/lock diff and verify
      the exact released commit before using new types.
- [ ] Add the customer presentation helper with a narrow structural input and
      caller-supplied localized fallbacks. Cover empty/whitespace display name,
      missing contacts, known `manager_created`/`signup` origin mapping, unknown
      origin fallback, and initials without raw ID exposure.
- [ ] Implement the directory hook around
      `management.customers.list({ limit, cursor?, status? })`. Keep status
      filters as `undefined | "active" | "inactive"` and cursors opaque.
- [ ] Implement generation/request-token invalidation for filter, refresh,
      next, prior-page, capability, and unmount transitions. A stale completion
      must not change pages, loading state, or errors for a newer generation.
- [ ] Implement ordinary error, refresh-stale, next-error, empty, and
      authoritative forbidden states. Forbidden clears pages; ordinary refresh
      failure preserves the last successful current page.
- [ ] Expose only operations and state needed by the Customers workspace:
      current records, page direction availability, filter, load/refresh
      status, retry, next, previous, and access-changed state. Do not expose
      raw cursors to presentational components.

## Verification

- `bun install --frozen-lockfile` — exits 0 after the updated lockfile is
  generated and produces no further manifest/lock changes.
- `rg -n '@class-kit/react.*v0\\.1\\.23' package.json bun.lock` — both files
  name the required tag.
- `rg -n 'a158bc588f5ec3421788475ccab2c5c2cb47ce9f' bun.lock` — exact released
  SDK commit is present.
- `npm run build` — exits 0 and confirms v0.1.23 customer/capability/error types.
- `rg -n 'customerId|userId|metadata' src/features/customers/customer-labels.ts`
  — inspect that IDs and metadata are input exclusions or explicit
  non-rendering guards, never label fallbacks.
- Focused review of `use-customer-directory.ts` confirms next-page commit after
  success only, refresh forward invalidation, stale token rejection, and
  forbidden data clearing.

## Acceptance Criteria Covered

- Required v0.1.23 baseline.
- Customer list state keys records by `customerId` and tolerates nullable
  `userId`.
- Active/inactive opaque cursor pagination.
- Safe reusable customer label/contact presentation.
- Loading, empty, error, refresh, and stale authorization foundations.

## Risks, Rollback, And Isolation

- Dependency drift: reject unrelated lock changes before continuing. Reverting
  the two dependency files restores the prior SDK baseline.
- Async race: keep request identity explicit and localized to the hook; do not
  rely on React render order or cursor string interpretation.
- This chunk creates no user-visible route and performs no mutation.

## Non-Goals

- Customer cards/detail, membership or linked access, manager navigation,
  localization registry changes, and browser verification.

## Consistency Check

- v0.1.23 tag/commit and exported names match the released SDK.
- Created paths do not collide with current user or manager access modules.
- No cursor, customer data, or capability state is persisted.
- No raw SDK/backend call or production dependency family is introduced.

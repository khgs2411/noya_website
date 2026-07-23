# Manager Change-Request Workspace Design

Status: Ready for Review — not approved for implementation planning.
Design directory: `docs/design/2026-07-23-manager-change-requests/`

## Goal And Success Criteria

Add a manager-only Requests workspace inside Noya's existing management
experience so authorized staff can review and manage ClassKit product issue and
feature-request threads without leaving the website.

The feature succeeds when:

- managers without `product_change_requests.manage` cannot see or enter the
  workspace;
- authorized managers can list, create, revise, soft-delete, and attach files
  through the pinned ClassKit client's `management.changeRequests` namespace;
- current title, request type, read-only status, read-only context, append-only
  revisions, and attachment metadata remain visible;
- all visible copy is available in English, Hebrew, and Russian, including
  RTL-safe Hebrew presentation;
- the workspace remains usable on mobile and desktop and matches the existing
  branded manager shell; and
- no website component calls Supabase or a raw ClassKit Edge Function.

## Current Repository Context

- `src/features/manager/manager-page.tsx` owns the active manager tab, derives
  granular permissions from the ClassKit capability snapshot, and lazy-loads
  each manager workspace.
- `src/features/manager/manager-tabs.tsx` owns the manager navigation model. It
  currently mixes primary and overflow tabs and has no capability-aware tab
  filtering.
- `src/App.tsx` protects the manager route with
  `capabilities.dashboard.can_enter` and temporarily renders from a manager
  capability snapshot cached for up to five minutes while live ClassKit context
  is loading. Although that snapshot contains `permissions`, it is not fresh
  enough to positively authorize this workspace.
- Existing manager feature components access ClassKit only through
  `useProductContext()` and its client, and own their loading, empty, error,
  mutation, and retry states locally.
- `src/i18n.ts` is the repository's single English, Russian, and Hebrew copy
  registry.
- `DESIGN_GUIDE.md` requires mobile-first manager views, branded warm surfaces,
  RTL safety, and drawer/dialog detail surfaces instead of inline expansion.
- `ROADMAP.md` records this outcome as the second carried-forward ClassKit
  commitment and fixes the permission, append-only revision, and read-only
  status boundaries.
- `package.json` pins `@class-kit/react` to `v0.1.21`, the assignment's required
  SDK baseline.

## User-Facing Behavior

### Navigation And Access

- Show a localized Requests manager tab only when the current manager's
  permission list includes `product_change_requests.manage`.
- Place Requests in the manager navigation without replacing the existing
  registration-request workspace. The two labels must remain distinguishable in
  all locales.
- A cached manager-access snapshot may keep the enclosing manager shell usable
  while ClassKit context loads, but it must not make Requests visible or mount
  the workspace. Only the current live capability response may positively
  authorize this data-bearing feature.
- If live permission becomes unavailable while Requests is active, immediately
  select the first visible manager tab and do not mount or call the change
  request workspace during the active-tab repair render.
- The workspace also receives and enforces the permission as a defense-in-depth
  component boundary. A denied state contains no request data or controls.
- The enclosing `/manager` route remains governed by
  `capabilities.dashboard.can_enter`; this feature does not introduce a new
  route or router.

### Thread List And Detail

- Load the current request threads when an authorized manager opens the
  workspace.
- Provide explicit loading, load-error with retry, and empty states.
- Show a scannable thread summary with current title (or a localized fallback),
  request type, current status, and enough metadata from the SDK record to
  distinguish threads.
- Selecting a thread opens its details in a mobile bottom drawer and compact
  wider-screen dialog-style overlay, following `DESIGN_GUIDE.md`.
- The detail surface shows the current description, optional context,
  chronological revision history, and attachment metadata. Each revision shows
  its SDK `version_number`, recorded title fallback, type, description,
  read-only context, and `created_at` so append-only history is substantively
  visible rather than represented by timestamps alone. Long values wrap safely.
- Status is rendered as a localized badge or label with no editing control.
- Context is rendered as read-only structured content. Noya must not infer
  domain meaning or offer context mutation.
- Attachments show only user-relevant metadata supplied by ClassKit:
  `file_name`, `content_type`, `size_bytes`, upload status, and `created_at`.
  Internal storage identifiers (`bucket_id` and `object_path`) and user IDs are
  not presentation fields. No attachment is linked or downloaded.

### Create, Revise, Delete, And Upload

- A create action opens a focused form for request type (`issue` or
  `feature_request`), optional title, and required description.
- The create form does not expose editable status or context. Noya may omit the
  optional SDK `context` field rather than inventing product context.
- A revise action on an existing thread opens a form initialized from the
  thread's current type, title, and description. Saving calls
  `update({ requestId, type, description, title?, context })`, passing the
  current thread's context through unchanged. This pass-through is required
  because v0.1.21 serializes omitted update context as `{}`; it does not make
  context editable or Noya-owned. The returned request represents the
  append-only revision; the UI never edits or removes prior revisions.
- A destructive action requires explicit confirmation and calls
  `delete(requestId)`. Successful deletion removes the thread from the visible
  list and closes its detail surface; Noya does not present a hard-delete
  promise.
- An attachment action uses a native file input and passes
  `{ file: selectedFile }` through the SDK's supported
  `uploadAttachment(requestId, input)` method. The SDK owns its internal signed
  upload flow; Noya does not call storage directly. Since v0.1.21 returns only
  the completed attachment from this convenience method, upload success
  refreshes `list()` before presenting the authoritative thread metadata.
- While a mutation is running, disable competing actions for the affected form
  or thread and show a clear progress state. On failure, preserve the user's
  typed form values or selected thread and present a retryable localized error.
- Successful create, revise, delete, and upload operations reconcile the local
  view with the authoritative SDK result or a fresh `list()` response. The UI
  must not synthesize revision, attachment, status, or context records.

## Technical Design And Boundaries

Add one domain folder under `src/features/manager/change-requests/`. The feature
component owns request loading, selection, forms, mutation state, and SDK
reconciliation. Small presentational helpers may remain in the domain folder;
only a genuinely reusable overlay primitive belongs under
`src/components/ui`.

`ManagerPage` remains the capability integration boundary:

- derive `canManageChangeRequests` from the current live permissions array;
  `accessSnapshot !== null` identifies the provisional cached rendering path
  and must force this capability false;
- make the tab available to `ManagerTabs` only when authorized;
- lazy-load and render the change-request workspace only for authorized users;
  and
- repair active-tab state when the visible tab set changes.

`ManagerTabs` continues to own the tab definitions and receives a
capability-derived Requests availability boolean from `ManagerPage`. It must not
read ClassKit or duplicate the permission key internally. A complete generic
tab-availability model is not justified for the single conditional tab in this
slice.

The assignment's `useClassKit().management.changeRequests` wording names the
required ClassKit manager namespace, but the exact v0.1.21 commit pinned by
`bun.lock` exports no `useClassKit` hook. The repository-supported access is
`useProductContext().client`, matching existing manager features. The feature
therefore obtains that exported client and calls only
`client.management.changeRequests.list`, `create`, `update`, `delete`, and
`uploadAttachment`. It uses the SDK's exported `ProductChangeRequest` and input
types instead of recreating server contracts. No local alias is introduced
solely to mimic a nonexistent hook name.

No route, persistence model, global state, direct network client, Supabase call,
raw Edge Function call, status update, download URL, or admin-only API is added.

## Data And State

ClassKit remains authoritative for the complete request thread. Noya owns only
ephemeral UI state:

- load status and load error;
- the current list response;
- selected request ID;
- create/revision/delete/upload surface state;
- form draft values;
- active mutation and localized mutation feedback.

The selected request should be resolved from the latest list by ID rather than
stored as a divergent copy. A successful mutation must update from the SDK
result when it contains the full authoritative thread; otherwise reload the
list. Closing and reopening a detail surface must not discard server-backed
history.

Render the SDK-provided `revisions` records without synthesizing entries. Sort a
copied array by the explicit `version_number` ascending for history display,
using `created_at` only as a stable tie-breaker, and do not mutate the source
record. Earlier revisions are never removed, overwritten, or editable.

## Integrations

The only data integration is:

```text
useProductContext().client
  -> management.changeRequests
     -> list()
     -> create({ type, description, title? })
     -> update({ requestId, type, description, title?, context: currentContext })
     -> delete(requestId)
     -> uploadAttachment(requestId, { file })
```

During implementation, the executor must confirm that the installed dependency
resolves to the `bun.lock` commit already reviewed here and compile against its
exported types. A dependency-resolution mismatch is a blocker, not a reason to
change the approved behavior or cross the SDK boundary.

## Permissions, Security, And Privacy

- A live `product_change_requests.manage` permission controls navigation
  visibility, component mounting, data loading, and all mutations. The
  local-storage manager snapshot is a loading optimization, not positive
  authorization for this workspace.
- `dashboard.can_enter` continues to control the enclosing manager route.
- Client-side guards improve the product experience but do not replace
  ClassKit's server-side authorization.
- Do not log descriptions, context, revision content, filenames, or API error
  payloads.
- Native browser file selection passes the `File` as the SDK input's `file`
  property; Noya adds no separate storage or upload endpoint.
- Do not construct or expose attachment download URLs.

## Failure And Recovery Behavior

- Initial list failure leaves the workspace in an error state with retry.
- Refresh failure preserves any already loaded list when practical and reports
  that refresh failed.
- Create or revise failure preserves the form and permits retry.
- Delete failure leaves the thread selected and visible.
- Upload failure leaves the thread selected, clears no server metadata, and
  permits a new attempt.
- A permission loss unmounts the feature and removes its navigation entry,
  regardless of in-flight local UI state. A request already dispatched cannot
  be reliably canceled at the UI boundary; ClassKit remains authoritative for
  whether it succeeds after the permission change, and the unmounted workspace
  must not re-present its result.
- Unknown SDK status or request-type values must render a safe textual fallback
  rather than enabling unsupported behavior.

## Testing And Acceptance Evidence

The repository has no current automated test script. Verification therefore
uses:

- TypeScript compilation and Vite bundling through the repository's existing
  `npm run build` command because the new SDK surface and cross-component types
  create meaningful compile-time risk;
- `npm run lint` for React hook, TypeScript, and repository lint rules;
- focused source inspection confirming the permission is applied to tab
  visibility and component rendering and that all calls stay under
  `management.changeRequests`;
- localization inspection confirming equivalent English, Hebrew, and Russian
  keys; and
- an existing-server browser smoke check, if a dev server is already running,
  for permitted and denied navigation, list/create/revise/delete/upload
  behavior, append-only history, read-only fields, overlay behavior, all three
  locales, and mobile/desktop layouts. If no server exists, do not start one
  without explicit approval and report the browser verification gap.

## Implementation Constraints And Seams

- Preserve the manager shell and lightweight route state.
- Keep the existing registration Requests label distinct from the new product
  change-request label.
- Prefer existing `Button`, toast, branded card, and overlay patterns before
  adding a primitive or dependency.
- Do not introduce a production dependency.
- Keep changes to `src/i18n.ts`, manager navigation, and `ManagerPage` limited
  to this feature.
- Conform implementation to the exact exported v0.1.21 types. Relevant verified
  fields are snake_case on records (`version_number`, `created_at`,
  `file_name`, `content_type`, and `size_bytes`) while mutation inputs use the
  SDK's camelCase contract (`requestId`) and upload accepts `{ file: Blob }`.
  Do not create a local adapter that duplicates the API.

## Assumptions And Provenance

| Statement | Provenance |
| --- | --- |
| Supported operations, request types, statuses, permission, and scope boundaries | Symphony assignment contract |
| Manager route, capability snapshot, and tab structure | Current repository code |
| Mobile drawer / wider dialog and visual behavior | `DESIGN_GUIDE.md` |
| ClassKit owns authorization and request data | Assignment contract, `ROADMAP.md`, and repository instructions |
| Create omits context; revise passes current context through unchanged without exposing an editor | Read-only context requirement plus pinned v0.1.21 serialization behavior |
| Client hook, response fields, mutation inputs, and upload return shape | `bun.lock` pinned commit and matching v0.1.21 ClassKit declarations/source |
| No automated component test layer is introduced | Current `package.json` and surgical scope |

## Open Questions

None. The assignment's nonexistent `useClassKit` hook name is resolved as a
contract-vocabulary mismatch: the pinned SDK and existing repository establish
the exported ClassKit client boundary without changing the required
`management.changeRequests` namespace or adding a wrapper.

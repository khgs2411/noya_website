# Chunk 01: ClassKit Change-Request Workspace

**Plan Set:** `../plan.md`
**Approved Source:** `.symphony/assignment.md` accepted task requirements
**Status:** Ready for Review
**Depends on:** None
**Enables:** Chunk 02

## Goal

Create a self-contained, permission-defensive manager workspace that presents
ClassKit change-request threads and supports list, create, append-revision,
soft-delete, and attachment-upload operations with authoritative
reconciliation.

## Source Artifacts And Constraints

- `../spec.md`, especially User-Facing Behavior, Technical Design, Data And
  State, Integrations, Permissions, and Failure behavior.
- `../agenda.md` for context preservation, live authorization, revision order,
  and upload-return decisions.
- `../spec-audit.md` for verified pinned-SDK fields and interaction risks.
- Existing manager domain files for loading/error/retry states, form controls,
  branded cards, and mobile drawer/wider dialog presentation.
- `src/components/ui/button.tsx`, `src/components/ui/toast.tsx`, and
  `src/lib/focus.ts` for existing primitives.
- Use only the pinned SDK client's five `management.changeRequests` operations.
  Do not add a client adapter, production dependency, direct storage/network
  call, or website persistence.

## Relationships

- Exports `ChangeRequestManagementTab` with the prop contract recorded in
  `../plan.md`.
- Reads translation keys under `manager.changeRequests.*`; Chunk 02 owns their
  definitions.
- Chunk 02 is the sole consumer/integration owner.

## File Responsibility Map

**Create:**

- `src/features/manager/change-requests/change-request-management-tab.tsx` —
  capability short-circuit, list/selection orchestration, mutation feedback, and
  workspace composition.
- `src/features/manager/change-requests/use-change-requests.ts` — typed
  ClassKit loading and mutation controller with authoritative reconciliation.
- `src/features/manager/change-requests/change-request-detail-panel.tsx` —
  read-only status/context/history/attachment presentation and revise,
  soft-delete, and upload controls.
- `src/features/manager/change-requests/change-request-form-dialog.tsx` —
  create/revision form with request type, optional title, required description,
  context pass-through, validation, and retry-preserving state.

**Modify:**

- None.

**Test:**

- No automated test file is added because the repository has no test runner.
  This chunk owns type/build conformance and focused source inspection.

## Behavioral And Contract Changes

- `ChangeRequestManagementTab` accepts only
  `canManageChangeRequests: boolean`. When false, it returns before client
  access and renders a localized denied state with no request content or action.
- When true, it obtains `client` from `useProductContext()` and calls only:

  ```ts
  client.management.changeRequests.list()
  client.management.changeRequests.create({ type, description, title? })
  client.management.changeRequests.update({
    requestId,
    type,
    description,
    title?,
    context: currentRequest.context,
  })
  client.management.changeRequests.delete(requestId)
  client.management.changeRequests.uploadAttachment(requestId, { file })
  ```

- Use the SDK's exported request/input types. Do not reproduce the server schema
  locally.
- Selection is an ID resolved against the latest list. Create, revise, and
  delete reconcile from a full SDK request result when available or reload
  `list()`. Upload always reloads because its response contains only the
  attachment.
- Revisions render from a copied array ordered by ascending `version_number`
  with `created_at` as a tie-breaker. They show substantive saved fields and
  remain non-editable.
- Status and context have no form controls. Context is displayed safely as
  read-only structured content and passed unchanged on revise.
- Attachment presentation is limited to user-relevant metadata; it never
  exposes `bucket_id`, `object_path`, user IDs, or a download action.
- The detail surface follows the repository drawer/dialog pattern and adds
  dialog labeling, Escape close, backdrop close, focus return, inside-click
  isolation, and body-scroll restoration.

## Implementation Tasks

- [ ] Confirm installed `@class-kit/react` resolves to the lockfile's v0.1.21
      commit and inspect its exported change-request types before writing code.
      Decision rule: use the verified exports and exact fields when they match
      the design; stop and report a blocker on a contract mismatch rather than
      adding a local compatibility API.
- [ ] Implement `use-change-requests.ts` as the single SDK operation owner.
      Keep loaded data authoritative, preserve an existing list on refresh
      failure, expose bounded load/mutation states, and make every mutation
      failure retryable without inventing server records.
- [ ] Implement `change-request-form-dialog.tsx` for create and revision modes.
      Validate trimmed description, normalize blank title to the SDK-supported
      optional value, preserve fields after failure, and pass current context
      unchanged only in revision mode. Add accessible dialog behavior and
      disable competing submissions while busy.
- [ ] Implement `change-request-detail-panel.tsx` with localized request
      metadata, safe structured context rendering, ascending append-only
      revision history, filtered attachment metadata, upload input, revise
      action, and explicit soft-delete confirmation. Keep status, context,
      history, and attachments read-only.
- [ ] Implement `change-request-management-tab.tsx` to short-circuit denied
      access before client use, load authorized requests, render loading/error/
      empty/list states, resolve selection by ID, compose overlays, and show
      localized operation notices without logging sensitive API payloads.
- [ ] Inspect the new domain for forbidden imports/calls and confirm every
      supported operation flows only through
      `client.management.changeRequests`.

## Verification

- `npm run build`
  - Expected signal: exit 0; SDK types, new TSX components, and imports compile
    and Vite bundles successfully.
- `rg -n "management\\.changeRequests" src/features/manager/change-requests`
  - Expected signal: only the controller contains the five allowed operation
    calls.
- `rg -n "supabase|functions\\.invoke|download|bucket_id|object_path|status:"
  src/features/manager/change-requests`
  - Expected signal: no direct Supabase/raw function/download/status-mutation
    implementation; internal attachment keys may appear only in an explicit
    presentation-exclusion check, not rendered output.

## Acceptance Criteria Covered

- Authorized data list and all five supported manager operations.
- Current title/type/status/context, append-only revisions, and attachment
  metadata.
- Read-only status/context and metadata-only attachments.
- Permission-defensive component behavior.
- Mobile/wide detail presentation and mutation recovery.
- No direct Supabase, raw Edge Function, admin API, status mutation, or download.

## Risks, Rollback, And Isolation

- Exact SDK exports are compile-critical; the first task stops on mismatch.
- Upload can succeed before refresh fails; preserve current UI and report a
  retryable refresh error.
- The chunk creates only isolated feature files. Rollback removes that folder
  and has no data migration or website-owned persistence consequence.

## Non-Goals

- Manager navigation, live/cached shell authorization, or locale definitions.
- Status updates, PM integrations, downloads, customer submission, admin APIs,
  or new ClassKit behavior.

## Consistency Check

- Confirm exported component name and prop match `../plan.md`.
- Confirm all SDK type/property names against installed v0.1.21 declarations.
- Confirm every translation key uses `manager.changeRequests.*`.
- Confirm no created file is also owned by Chunk 02.

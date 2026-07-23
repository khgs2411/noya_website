# Manager Change-Request Workspace Design Agenda

## Status

- Spec: `docs/design/2026-07-23-manager-change-requests/spec.md`
- State: Ready for Review
- Approval: Not Approved

## Documented Decisions

- The Symphony assignment is the approved product contract: add one coherent,
  manager-only change-request workspace.
- The workspace is visible and mountable only with
  `product_change_requests.manage`.
- The pinned v0.1.21 SDK exports no `useClassKit` hook. Noya uses the exported
  ClassKit client from `useProductContext().client`, matching existing manager
  features, and only its `management.changeRequests` list, create,
  append-revision update, soft-delete, and attachment upload operations. No
  compatibility wrapper is added.
- Request types are `issue` and `feature_request`.
- Status is read-only and may be `open`, `in_progress`, `done`, or `closed`.
- Context and attachment metadata are read-only; attachment download is out of
  scope.
- Revisions remain append-only and visible.
- The existing manager route and tab shell are retained; no new router, global
  state, persistence, backend, or production dependency is introduced.
- All visible copy is localized in English, Hebrew, and Russian and the feature
  follows the existing mobile-first manager design.
- The create/revision forms omit an editable context field. This follows the
  explicit read-only context requirement and avoids inventing Noya-owned
  context semantics.
- Create omits context, but revise passes the current thread's context through
  unchanged because v0.1.21 otherwise serializes omitted context as `{}`.
- The cached manager-access snapshot may render the enclosing loading shell but
  cannot positively authorize Requests; visibility and mounting require the
  live `product_change_requests.manage` permission.
- `ManagerPage` passes a capability-derived Requests availability boolean to
  `ManagerTabs`; the navigation component remains unaware of the permission key.
- Revision history is displayed in ascending SDK `version_number` order.
- `uploadAttachment(requestId, { file })` owns the signed storage flow and
  returns only attachment metadata, so the workspace reloads `list()` after a
  successful upload.

## Questions

No material open questions. The assignment supplies the product contract, while
the package lock's exact v0.1.21 commit resolves the incorrect hook name and
exact SDK conformance details without changing the intended ClassKit boundary.

## Pressure-Test Result

- Status: Complete
- Categories checked: lifecycle and retries; state ownership; permissions,
  privacy, and security; ClassKit integration boundary; mutation recovery;
  localization and responsive behavior; acceptance evidence.
- Material corrections:
  - replaced the nonexistent `useClassKit` hook with the SDK's exported client
    access while retaining the required manager namespace;
  - preserved read-only context across revisions instead of accidentally
    clearing it;
  - prevented cached permissions from positively authorizing the workspace;
  - fixed revision ordering and post-upload reconciliation to match v0.1.21.
- New questions added: None.
- Remaining non-blocking risks:
  - Dependencies are not installed in this worktree, so implementation must
    still compile against the installed package; the reviewed v0.1.21 tag
    matches `bun.lock` commit `c0d1fc7a0f7eff77a17b3fbccc3944d19c74711d`.
  - The repository has no automated UI test script; browser flow evidence
    depends on an already-running approved dev server.

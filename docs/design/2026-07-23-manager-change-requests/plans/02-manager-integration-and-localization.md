# Chunk 02: Manager Integration And Localization

**Plan Set:** `../plan.md`
**Approved Source:** `.symphony/assignment.md` accepted task requirements
**Status:** Ready for Review
**Depends on:** Chunk 01
**Enables:** Complete manager change-request outcome

## Goal

Expose the completed request workspace only from a current live authorized
manager capability, repair active navigation safely when permission changes,
and provide complete English, Russian, and Hebrew copy.

## Source Artifacts And Constraints

- `../spec.md`, `../agenda.md`, and `../spec-audit.md`.
- Chunk 01's exported `ChangeRequestManagementTab` contract.
- `src/App.tsx` cached-vs-live `ManagerPage` rendering behavior.
- `src/features/manager/manager-page.tsx` capability integration and lazy
  workspace pattern.
- `src/features/manager/manager-tabs.tsx` primary/overflow navigation model.
- `src/i18n.ts` locale ordering and nested manager-copy conventions.
- `DESIGN_GUIDE.md` mobile-first, branded, and RTL-safe requirements.

## Relationships

- Depends on the complete Chunk 01 workspace export.
- Owns all existing-file changes and the translation keys consumed by Chunk 01.
- Does not change `App.tsx`; it uses `ManagerPage`'s existing
  `accessSnapshot` signal to distinguish provisional cached rendering.

## File Responsibility Map

**Create:**

- None.

**Modify:**

- `src/features/manager/manager-page.tsx` — derive live authorization, lazy-load
  the workspace, prevent cached positive authorization, and render an effective
  safe active tab.
- `src/features/manager/manager-tabs.tsx` — add a conditional, localized product
  change-request tab without owning the permission key.
- `src/i18n.ts` — add complete, semantically equivalent
  `manager.tabs.changeRequests` and `manager.changeRequests.*` copy for English,
  Russian, and Hebrew.

**Test:**

- No automated test file is added because the repository has no test runner.
  This chunk owns full lint/build, focused authorization/localization
  inspection, and any available existing-server browser smoke check.

## Behavioral And Contract Changes

- `ManagerPage` derives `canManageChangeRequests` only when
  `accessSnapshot === null` and current live
  `capabilities.permissions.includes("product_change_requests.manage")`.
- Cached access can continue rendering existing manager content but cannot show
  the tab, trigger its lazy import, mount it, or perform its data calls.
- Compute an effective active tab that falls back to `"classes"` during the
  same render in which Requests becomes unavailable, then repair stored
  `activeTab` in an effect. No transient render may mount the denied workspace.
- `ManagerTabs` receives a derived availability boolean. It owns the request
  tab's placement and icon/label only; it does not import ClassKit or know the
  permission string.
- The new tab label must remain distinct from the existing pending registration
  Requests label in English, Russian, and Hebrew.
- Every visible list, detail, form, confirmation, upload, status, type,
  validation, empty, denied, error, retry, and success string used by Chunk 01
  is present in all three locales.

## Implementation Tasks

- [ ] Extend `manager-tabs.tsx` with a conditional product change-request tab
      and a typed derived-availability prop. Preserve current primary/overflow
      responsive behavior and ensure the hidden tab cannot be selected from the
      rendered navigation.
- [ ] Extend `manager-page.tsx` with the lazy workspace import, live-only
      permission derivation, effective safe active tab, post-render state
      repair, availability prop, and guarded workspace mount. Keep the existing
      manager route and cached access behavior unchanged for other tabs.
- [ ] Add the complete `manager.tabs.changeRequests` and
      `manager.changeRequests.*` trees to English, Russian, and Hebrew in
      `src/i18n.ts`. Use terminology that distinguishes product feedback from
      pending class-registration requests and keep structured/long values
      RTL-safe through the component layout.
- [ ] Run focused authorization and locale-key inspections, then the full
      repository lint and build. Repair only failures attributable to this
      feature.
- [ ] Check whether a localhost Vite server is already listening. If available,
      smoke denied/authorized navigation, list/create/revise/delete/upload,
      revision history, read-only status/context, metadata-only attachments,
      overlay interactions, all locales, and narrow/wide layouts. If absent, do
      not start one and record the verification gap.

## Verification

- `npm run lint`
  - Expected signal: exit 0 with no new feature-attributable errors or warnings.
- `npm run build`
  - Expected signal: exit 0 from TypeScript and Vite.
- `rg -n "product_change_requests\\.manage|canManageChangeRequests|changeRequests"
  src/features/manager/manager-page.tsx
  src/features/manager/manager-tabs.tsx`
  - Expected signal: permission key exists only at the `ManagerPage` capability
    boundary; tab rendering and workspace mounting use the derived boolean.
- `rg -n "changeRequests:" src/i18n.ts`
  - Expected signal: one feature tree exists in each of the three locale
    translations.
- `rg -n "supabase|functions\\.invoke|download"
  src/features/manager/change-requests
  src/features/manager/manager-page.tsx
  src/features/manager/manager-tabs.tsx`
  - Expected signal: no forbidden data or download implementation.
- Existing-server browser smoke check, if and only if an approved server is
  already running.
  - Expected signal: accepted flows and responsive/locale states behave as
    specified; otherwise the final report names this check as not run.

## Acceptance Criteria Covered

- Unauthorized managers cannot see or open the workspace, including during
  cached loading and permission loss.
- Authorized managers can reach the complete Chunk 01 workspace.
- English, Hebrew, and Russian copy is complete and distinguishable.
- Mobile and desktop manager navigation and overlays preserve the established
  design.
- Full static verification and available manual acceptance evidence.

## Risks, Rollback, And Isolation

- The active-tab transition is security-sensitive. Compute a safe render value
  before effect-based state repair.
- Localization is a shared file in the repository, so preserve unrelated work
  and keep edits scoped to the new manager keys.
- Rollback removes the three integration edits; Chunk 01 then becomes
  unreachable without affecting other manager tabs or persisted data.

## Non-Goals

- Changes to the outer manager route, cached access TTL, global state, router,
  existing registration-request behavior, or any ClassKit/backend contract.

## Consistency Check

- Confirm the lazy import path and named export match Chunk 01.
- Confirm `ManagerTab`, tab definitions, active state, and availability prop
  agree.
- Confirm every `manager.changeRequests.*` use has an equivalent key in all
  three locale trees.
- Confirm cached `accessSnapshot` never yields positive authorization.
- Confirm no file is owned by both chunks.

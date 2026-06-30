# Manager Class Management Implementation Plan Set

**Spec:** `spec.md`  
**Agenda:** `agenda.md`  
**Pseudocode:** `pseudocode/` loaded; accepted as shaping input despite draft status  
**Context:** Not available; intentionally skipped by design disposition  
**ADRs:** None  
**Status:** Chunk Plans Written

## Goal

Implement the first operational manager workspace slice for Noya's ClassKit-backed platform: a mobile-first, manager-only class management surface for listing, creating, editing, publishing, drafting, and cancelling concrete one-off classes through the `@class-kit/react` client SDK, while keeping Templates and Schedules present as non-operational future workspace tabs.

## Source Artifacts

- `docs/design/2026-06-30-manager-class-management/spec.md`
- `docs/design/2026-06-30-manager-class-management/agenda.md`
- `docs/design/2026-06-30-manager-class-management/pseudocode/README.md`
- `docs/design/2026-06-30-manager-class-management/pseudocode/ManagerWorkspaceShape.md`
- `docs/design/2026-06-30-manager-class-management/pseudocode/ClassManagementStateAndSdkBoundary.md`
- `docs/design/2026-06-30-manager-class-management/pseudocode/ClassRangeAndCalendarFlow.md`
- `docs/design/2026-06-30-manager-class-management/pseudocode/ClassMutationReconciliationFlow.md`
- `docs/design/2026-06-30-manager-class-management/pseudocode/ClassFormAndLifecycleSurfaces.md`
- `docs/design/2026-06-30-manager-class-management/pseudocode/ManagerClassComponentMap.md`
- External audit: Software Architect sub-agent `Euclid` (`019f1864-b77e-72d3-9272-752f1d4f1297`), verdict `Ready for Development`
- Current implementation paths inspected:
  - `src/App.tsx`
  - `src/features/manager/manager-page.tsx`
  - `src/content/site-content.ts`
  - `src/components/ui/button.tsx`
  - `src/lib/utils.ts`
  - `src/components/site/design-guide.ts`
  - `src/i18n.ts`
  - `AGENTS.md`
  - `DESIGN_GUIDE.md`
  - `ROADMAP.md`
  - `package.json`
  - `components.json`
  - `node_modules/@class-kit/react/src/manager/manager-api.ts`
  - `node_modules/@class-kit/react/src/client/class-kit-client.ts`
- Test and validation commands discovered:
  - `npm run lint`
  - `npm run build`
  - Existing Vite dev server/browser smoke checks at `http://localhost:5173`
  - No repo test script exists in `package.json`

## Design Readiness Check

- Source artifact paths verified: Pass.
- Pseudocode artifacts: Loaded. All source-like artifacts include the non-executable reference header.
- Pseudocode alignment: Pass. The roadmap preserves the pseudocode-defined workspace shell, feature-local class state owner, range utility boundary, mobile list default, desktop select-only calendar, form/detail/cancel surfaces, explicit lifecycle SDK commands, and no template/schedule SDK loading in this slice.
- Missing or unavailable artifacts: `CONTEXT.md` and ADRs are unavailable by design. Planning impact: none; the agenda records that no glossary or durable architecture decision was needed.
- Open agenda questions or risks: No unresolved agenda questions. Non-blocking risks are assigned below.
- Spec / agenda / context / ADR consistency: Pass. Context and ADRs are intentionally absent.
- Parent / child spec consistency: Not applicable; no child specs are present.
- Accepted planning reconciliations:
  - Treat pseudocode `Status: Draft` as accepted shaping input because the external audit found the draft status is only metadata and the user approved moving to writing plans.
  - Today control default interpretation: preserve the active scope and jump the anchor to the current local day/week/month. Chunk `02-class-range-state-and-sdk-loading.md` owns final UI wording before implementation.
  - Default create status: `draft`, unless the chunk owner records a product correction before coding. Chunk `05-class-detail-form-and-cancel-surfaces.md` owns this.
  - Selected class detail starts list-derived from the active range. Chunk `02-class-range-state-and-sdk-loading.md` may add `management.classes.get(classId)` only if implementation proves the list payload is insufficient.
  - Internal notes stay in the first form but should be visually secondary, such as an advanced/details section. Chunk `05-class-detail-form-and-cancel-surfaces.md` owns the exact UI placement.
- Blockers: None.

## Unresolved Decision Ownership

| Item | Type | Owning Chunk | Must Resolve Before | Notes |
| --- | --- | --- | --- | --- |
| Today control preserves active scope versus switching to Today scope | Reconciliation | `02-class-range-state-and-sdk-loading.md` | Implementation steps in owning chunk | Default planning interpretation is preserve scope and jump anchor. Copy must make this clear. |
| Native date APIs versus a date utility | Non-blocking risk | `02-class-range-state-and-sdk-loading.md` | Implementation steps in owning chunk | Native APIs are preferred first. Add a utility only if timezone/range math becomes brittle. |
| Range-load race handling | Deferred implementation decision | `02-class-range-state-and-sdk-loading.md` | Implementation steps in owning chunk | Use request ids or an equivalent latest-range guard so stale responses do not overwrite current state. |
| Selected class detail source | Reconciliation | `02-class-range-state-and-sdk-loading.md` | Implementation steps in owning chunk | Start list-derived; use `get` only if needed for detail completeness. |
| `class-card.tsx` split timing | Deferred implementation decision | `03-mobile-class-list-and-card-actions.md` | Implementation steps in owning chunk | Split immediately if list and calendar both need the card; otherwise keep the boundary visible in list code. |
| Card publish/draft action error placement | Deferred implementation decision | `03-mobile-class-list-and-card-actions.md` | Implementation steps in owning chunk | Error can be card-local or shared class-surface error, but it must not expose raw permissions. |
| Custom range desktop calendar behavior | Deferred implementation decision | `04-desktop-calendar-and-view-mode.md` | Implementation steps in owning chunk | List fallback is allowed and preferred if a custom grid is cramped. |
| Dialog/drawer primitive scope | Deferred implementation decision | `05-class-detail-form-and-cancel-surfaces.md` | Implementation steps in owning chunk | Keep local unless shadcn-style reuse is clearly needed. |
| Default create status | Reconciliation | `05-class-detail-form-and-cancel-surfaces.md` | Implementation steps in owning chunk | Default to draft for safety; form can still expose status. |
| Internal notes placement | Reconciliation | `05-class-detail-form-and-cancel-surfaces.md` | Implementation steps in owning chunk | Include, but do not make it prominent in the first mobile form. |
| Successful create/edit close behavior | Deferred implementation decision | `05-class-detail-form-and-cancel-surfaces.md` | Implementation steps in owning chunk | Prefer close to detail after successful refetch unless implementation finds a clearer flow. |
| Refetch failure after successful mutation | Deferred implementation decision | `06-mutation-reconciliation-localization-and-verification.md` | Implementation steps in owning chunk | Must show that mutation likely succeeded but visible data may be stale, with a retry refresh path. |

## Approved Chunks

| Chunk | Purpose | Depends On | Enables | Status |
| --- | --- | --- | --- | --- |
| [`01-manager-workspace-shell-and-tabs.md`](plans/01-manager-workspace-shell-and-tabs.md) | Replace the placeholder `/manager` page with a protected branded workspace shell, three tabs, class capability pass-through, and non-operational Templates/Schedules placeholders. Boundary exists because it creates the screen structure without class SDK data. | None | `02-class-range-state-and-sdk-loading.md`, later class UI chunks | Ready For Implementation |
| [`02-class-range-state-and-sdk-loading.md`](plans/02-class-range-state-and-sdk-loading.md) | Add the feature-local class state owner, date range utilities, explicit SDK list loading, capability-aware loading/error/empty states, and range toolbar contract. Boundary exists because every visual class surface depends on stable range and SDK state. | `01-manager-workspace-shell-and-tabs.md` | `03-mobile-class-list-and-card-actions.md`, `04-desktop-calendar-and-view-mode.md`, `05-class-detail-form-and-cancel-surfaces.md` | Ready For Implementation |
| [`03-mobile-class-list-and-card-actions.md`](plans/03-mobile-class-list-and-card-actions.md) | Implement the mobile-first date-grouped class list, class card summaries, selection, and safe publish/draft quick actions. Boundary exists because mobile scanning is the primary operational workflow and should be reviewable before desktop calendar complexity. | `02-class-range-state-and-sdk-loading.md` | `04-desktop-calendar-and-view-mode.md`, `05-class-detail-form-and-cancel-surfaces.md` | Ready For Implementation |
| [`04-desktop-calendar-and-view-mode.md`](plans/04-desktop-calendar-and-view-mode.md) | Add desktop list/calendar view switching and select-only week/month calendar presentation, while keeping mobile list-only. Boundary exists because calendar UX is desktop-specific and should not block mobile class management. | `02-class-range-state-and-sdk-loading.md`, `03-mobile-class-list-and-card-actions.md` | `06-mutation-reconciliation-localization-and-verification.md` | Ready For Implementation |
| [`05-class-detail-form-and-cancel-surfaces.md`](plans/05-class-detail-form-and-cancel-surfaces.md) | Add selected class detail, responsive create/edit form, local validation, SDK create/update handoff, and cancel confirmation flow. Boundary exists because write workflows need their own form and confirmation review separate from list/calendar display. | `02-class-range-state-and-sdk-loading.md`, `03-mobile-class-list-and-card-actions.md` | `06-mutation-reconciliation-localization-and-verification.md` | Ready For Implementation |
| [`06-mutation-reconciliation-localization-and-verification.md`](plans/06-mutation-reconciliation-localization-and-verification.md) | Harden create/edit/publish/draft/cancel reconciliation after refetch, finish localized copy in English/Hebrew/Russian, verify manager access states, responsive behavior, and SDK-boundary compliance. Boundary exists because it closes cross-surface behavior after all read/write surfaces exist. | `03-mobile-class-list-and-card-actions.md`, `04-desktop-calendar-and-view-mode.md`, `05-class-detail-form-and-cancel-surfaces.md` | Implementation completion | Ready For Implementation |

## Dependency Order

1. `01-manager-workspace-shell-and-tabs.md`
2. `02-class-range-state-and-sdk-loading.md`
3. `03-mobile-class-list-and-card-actions.md`
4. `05-class-detail-form-and-cancel-surfaces.md`
5. `04-desktop-calendar-and-view-mode.md`
6. `06-mutation-reconciliation-localization-and-verification.md`

Chunks `04` and `05` can be planned independently after `02` and `03`, but execution should usually do `05` before `04` so the class detail/edit workflow is available when calendar item selection lands.

## Shared Contracts

- Route: `/manager` remains the protected manager route. Route-level access remains gated by `capabilities.dashboard.can_enter` in the existing local path-state model.
- Capability gate: `capabilities.dashboard.can_manage_classes` controls visible class management affordances. Backend SDK errors remain authoritative.
- SDK boundary: UI code may call only `client.management.classes.list`, `get`, `create`, `update`, `publish`, `draft`, and `cancel` through the `@class-kit/react` facade. No raw Supabase, RPC, Edge Function, admin, template, or schedule calls belong in this slice.
- Feature ownership: class management code lives under `src/features/manager/classes/`; shared UI promotion happens only for a real shadcn primitive need or reuse beyond the feature.
- State ownership: a feature-local hook/module owns range state, class list state, selected class state, load/mutation status, SDK calls, and post-mutation refetch/reconciliation.
- Date/range ownership: a small `class-range.ts` utility owns local date scope calculations and ISO range conversion.
- Presentation rule: mobile displays list view only; desktop may switch between list and select-only calendar.
- Lifecycle rule: publish/draft are explicit SDK lifecycle commands and may appear as safe quick actions; cancel is detail-only with confirmation; no hard delete appears.
- Template/schedule rule: Templates and Schedules tabs are visible but non-operational; no template/schedule SDK loading or partial controls in this slice.
- Copy rule: all visible manager copy is localized in `en`, `he`, and `ru`, and remains RTL-safe.

## Spec Coverage Map

| Spec Requirement | Covered By | Notes |
| --- | --- | --- |
| Manager-only protected workspace remains under `/manager` | `plans/01-manager-workspace-shell-and-tabs.md` | Uses existing route model and `can_enter` gate. |
| Three connected tabs with only Classes operational | `plans/01-manager-workspace-shell-and-tabs.md` | Templates/Schedules are branded placeholders only. |
| SDK facade-only ClassKit usage | `plans/02-class-range-state-and-sdk-loading.md`, `plans/05-class-detail-form-and-cancel-surfaces.md`, `plans/06-mutation-reconciliation-localization-and-verification.md` | Final chunk verifies no raw Supabase/Edge Function calls were added. |
| Date scopes Today/Week/Month/Custom with previous/next navigation | `plans/02-class-range-state-and-sdk-loading.md` | Includes explicit ISO range conversion and custom range length shift. |
| Loading, empty, error, and class capability states | `plans/02-class-range-state-and-sdk-loading.md` | User-facing states avoid raw permissions. |
| Mobile date-grouped list view | `plans/03-mobile-class-list-and-card-actions.md` | Primary manager scanning workflow. |
| Publish/draft quick actions on cards when safe | `plans/03-mobile-class-list-and-card-actions.md`, `plans/06-mutation-reconciliation-localization-and-verification.md` | Uses explicit SDK commands and refetches active range. |
| Desktop list/calendar view toggle and select-only calendar | `plans/04-desktop-calendar-and-view-mode.md` | No drag/drop rescheduling. |
| Class detail display | `plans/05-class-detail-form-and-cancel-surfaces.md` | Includes status, capacity/counts, location, read-only state, and provenance hints where useful. |
| Create/edit one-off class form | `plans/05-class-detail-form-and-cancel-surfaces.md` | No template selector; future template default insertion point preserved. |
| Cancel confirmation with optional reason and user-visible reason toggle | `plans/05-class-detail-form-and-cancel-surfaces.md` | Cancel is not delete. |
| Refetch active range after every successful mutation | `plans/06-mutation-reconciliation-localization-and-verification.md` | Cross-surface behavior after list, calendar, and forms exist. |
| Mutation errors appear in active surface | `plans/03-mobile-class-list-and-card-actions.md`, `plans/05-class-detail-form-and-cancel-surfaces.md`, `plans/06-mutation-reconciliation-localization-and-verification.md` | Error copy should be displayable SDK messages without raw permission leakage. |
| Noya design guide, Tailwind, shadcn-compatible primitives, mobile-first layout | All chunks | Visual verification is chunk-local and final-smoked in chunk `06`. |
| English, Hebrew, and Russian copy | `plans/01-manager-workspace-shell-and-tabs.md`, `plans/06-mutation-reconciliation-localization-and-verification.md` | Chunk `06` owns final copy completeness. |

## Verification Strategy

Use repo-native validation without running builds after every small edit.

- `$pmp-executing-plans` preflight:
  - inspect `git status --short` before edits and preserve user/local changes, especially overlaps in `src/i18n.ts`, `src/App.tsx`, `src/features/manager/`, and `ROADMAP.md`;
  - if the existing Vite dev server is not available, start `npm run dev` and use the reported local URL for browser smoke checks;
  - do not update `ROADMAP.md` during execution unless the user separately asks after implementation evidence is reported.
- Focused inspection:
  - no raw Supabase, RPC, Edge Function, template SDK, or schedule SDK calls in manager class UI;
  - `/manager` route still redirects users without `capabilities.dashboard.can_enter`;
  - users without `can_manage_classes` do not see create/edit/lifecycle controls;
  - no raw permission lists are exposed.
- Browser smoke on the existing dev server:
  - manager sees `/manager` shell and tabs;
  - mobile width defaults to list view only;
  - desktop can switch list/calendar;
  - range controls produce expected visible ranges;
  - create/edit/publish/draft/cancel surfaces display errors from SDK methods;
  - profile/menu changes from prior work remain intact.
- Final command-level checks after the full slice, or when TypeScript risk appears:
  - `npm run lint` should complete without new lint errors.
  - `npm run build` may be run as final integration verification, not after every edit.

## Risks And Sequencing Notes

- Date math and timezone boundaries are the highest correctness risk. Keep the date utility small and easy to verify, and do not bury date conversion in JSX.
- Calendar UI can easily become too large for this slice. Keep it select-only and desktop-only; drag/drop rescheduling stays out of scope.
- The form is broad enough to become cluttered on mobile. Chunk `05` should keep manager-secondary fields, especially internal notes, visually secondary.
- Mutation correctness crosses list, calendar, detail, and form surfaces. Chunk `06` exists to close the integration behavior after the individual surfaces are present.
- Templates and Schedules must remain real workspace tabs but not become partial data workflows in this slice.
- The current repo has no automated test script; verification will rely on lint/build when appropriate, focused code inspection, and browser smoke checks.

## Execution Handoff

Recommended next skill after chunk plans are written: `$pmp-executing-plans`.

Execution should load:

- `docs/design/2026-06-30-manager-class-management/plan.md`
- the selected chunk plan files under `docs/design/2026-06-30-manager-class-management/plans/`
- all source artifacts listed above

Recommended execution modes:

- execute one chunk;
- execute selected chunks in dependency order;
- execute all chunks in dependency order.

Execution must stop on unclear plan steps, failed verification, code/spec conflict, missing dependencies, or user-requested changes.

Execution must not rewrite `ROADMAP.md` as part of these chunks. Roadmap bookkeeping is a separate follow-up after verified implementation evidence unless the user explicitly requests it.

## User Approval

Roadmap approved by user request to proceed with chunk creation. Chunk plan files have been created and are ready for implementation review or execution.

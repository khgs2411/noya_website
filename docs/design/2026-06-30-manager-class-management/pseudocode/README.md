# Manager Class Management Pseudocode Artifacts

Status: Draft

## Draft Shape Summary

These artifacts define the intended non-executable shape for the first manager
class-management implementation. The shape keeps `/manager` as a protected
workspace route, adds a three-tab manager shell, makes only the Classes tab
operational, and keeps all class operations behind the `@class-kit/react`
management facade.

The key implementation posture is:

- ClassKit SDK data is the source of truth.
- Manager UI owns view state, range state, selected class state, and form/dialog
  state.
- Mutations refetch the active visible range after success.
- Mobile uses date-grouped list view only.
- Desktop can switch between list and select-only calendar view.
- Templates and Schedules are connected tabs but non-operational in this slice.

## Assumptions Made

- `capabilities.dashboard.can_enter` remains the route-level manager gate.
- `capabilities.dashboard.can_manage_classes` is the UI affordance gate for
  operational class controls.
- The app continues to use local route state and does not add a router for this
  slice.
- Native date APIs are acceptable for initial date range calculations unless
  implementation shows they are brittle around timezone behavior.
- No additional state library is introduced; feature-local React state is enough.
- New shadcn primitives may be added only if needed for reusable dialog/drawer,
  tabs, select, or form behavior.

## Artifact Map

| Artifact | Type | Intended Destination | Responsibility |
| --- | --- | --- | --- |
| `ManagerWorkspaceShape.md` | File-shaped | `src/features/manager/manager-page.tsx`, `src/features/manager/manager-tabs.tsx` | Defines protected manager shell, tab ownership, and non-operational tab behavior. |
| `ClassManagementStateAndSdkBoundary.md` | Boundary-shaped | `src/features/manager/classes/use-managed-classes.ts` or equivalent feature-local hook | Defines SDK method grammar, UI state ownership, non-ownership, result vocabulary, and ClassKit boundary. |
| `ClassRangeAndCalendarFlow.md` | Flow-shaped | `src/features/manager/classes/class-range-toolbar.tsx`, `class-list-view.tsx`, `class-calendar-view.tsx` | Defines date scope, range navigation, mobile list default, desktop calendar selection, and range-to-SDK flow. |
| `ClassMutationReconciliationFlow.md` | Flow-shaped | Class management hook plus form/action surfaces | Defines create/edit/publish/draft/cancel sequencing, refetch behavior, selected-detail reconciliation, and failure posture. |
| `ClassFormAndLifecycleSurfaces.md` | File-shaped / flow-shaped | `class-form-dialog.tsx`, `class-detail-panel.tsx`, `class-cancel-dialog.tsx` | Defines responsive form surfaces, field ownership, publish/draft quick actions, cancel confirmation, and no hard delete. |
| `ManagerClassComponentMap.md` | File-shaped | `src/features/manager/classes/*` | Defines likely component split and prop/state relationships without prescribing implementation chunks. |

## Cross-Artifact Relationships

- `ManagerWorkspaceShape.md` owns the outer manager shell and tab model.
- `ClassManagementStateAndSdkBoundary.md` owns the state/API contract that the
  class UI components consume.
- `ClassRangeAndCalendarFlow.md` produces the active visible range used by
  `ClassManagementStateAndSdkBoundary.md` to call
  `client.management.classes.list`.
- `ClassMutationReconciliationFlow.md` depends on the state hook and requires a
  range refetch after every successful mutation.
- `ClassFormAndLifecycleSurfaces.md` defines how mutation intents reach the
  state hook and how errors return to the active operation surface.
- `ManagerClassComponentMap.md` names the intended file/component boundaries for
  later planning and implementation.

## Libraries And Conventions To Preserve

- React with feature-local state.
- `@class-kit/react` via `useProductContext()` and `client.management.classes.*`.
- Tailwind utilities and shadcn-compatible primitives.
- `Button` from `src/components/ui/button.tsx`.
- `cn` from `src/lib/utils.ts`.
- lucide icons for controls.
- Copy in `src/i18n.ts` for English, Hebrew, and Russian.
- Existing Noya design guide: Montserrat body, Cormorant labels/headings, blush
  borders, warm surfaces, mobile-first spacing.

## Artifact Quality Checks

- Source-like artifacts are non-executable reference material.
- Boundary artifacts state ownership and non-ownership.
- Flow artifacts name inputs, outputs, terminal states, and failure posture.
- No artifact calls raw Supabase, RPCs, or Edge Functions.
- No artifact implements a plan or chunk sequence.
- No artifact creates template or schedule operations in the first slice.

## Review Points

- Confirm the proposed hook boundary in
  `ClassManagementStateAndSdkBoundary.md`: one feature-local state owner for
  range, view mode, selected class, loading, mutations, and SDK calls.
- Confirm the desktop calendar contract in `ClassRangeAndCalendarFlow.md`:
  select-only now, drag/drop later.
- Confirm the card/action split in `ClassFormAndLifecycleSurfaces.md`:
  publish/draft quick actions are allowed on cards, cancel stays in detail.
- Confirm the component split in `ManagerClassComponentMap.md` before planning
  implementation files.

## Use Notes

Downstream design, planning, or implementation should preserve these files,
flows, boundaries, method grammar, and ownership rules unless new evidence
forces an explicit divergence.

These artifacts are not implementation plans. They should be consumed by a
planning pass to create smaller implementation chunks.

## Open Risks Or Allowed Divergence

- Native date APIs may be replaced by a small date utility if implementation
  proves timezone/range math is too fragile.
- A reusable shadcn Dialog/Drawer/Tabs primitive may be added if the existing
  `Button` primitive is not enough for accessible surfaces.
- Selected-detail reconciliation can either clear selection or show a "moved
  outside this range" state when an edited class leaves the current range; the
  design allows either as long as it is clear.
- Drag/drop calendar rescheduling is explicitly deferred.

## Non-Executable Rule

Every source-like file in this folder is pseudocode reference material, not
implementation.

## Source Artifacts

- `docs/design/2026-06-30-manager-class-management/spec.md`
- `docs/design/2026-06-30-manager-class-management/agenda.md`
- `/Users/liadgoren/Repositories/class-kit/docs/getting-started.md`
- `/Users/liadgoren/Repositories/class-kit/docs/sdk/client-sdk.md`
- `/Users/liadgoren/Repositories/class-kit/docs/api/class-api-map.md`
- `/Users/liadgoren/.codex/memories/MEMORY.md`

## Code Context Inspected

- `src/App.tsx`
- `src/features/manager/manager-page.tsx`
- `src/content/site-content.ts`
- `src/components/ui/button.tsx`
- `src/lib/utils.ts`
- `src/components/site/design-guide.ts`
- `AGENTS.md`
- `DESIGN_GUIDE.md`
- `node_modules/@class-kit/react/src/manager/manager-api.ts`
- `node_modules/@class-kit/react/src/client/class-kit-client.ts`

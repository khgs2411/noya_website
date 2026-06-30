# ClassManagementStateAndSdkBoundary

Pseudocode artifact. Non-executable reference shape for planning.

## Intended Destination

- `src/features/manager/classes/use-managed-classes.ts`
- Or equivalent feature-local state hook/module inside
  `src/features/manager/classes/`.

## Boundary Summary

The class-management state owner is a feature-local adapter between manager UI
state and the ClassKit SDK facade.

It owns:

- active date scope and visible range;
- mobile/desktop view mode intent;
- loaded managed classes for the active range;
- loading/error/mutation state;
- selected class id and selected class detail source;
- command methods for create, update, publish, draft, cancel;
- refetch-after-mutation behavior.

It does not own:

- backend authorization;
- Supabase transport;
- Edge Function action names;
- raw ClassKit table/RPC access;
- template or schedule data loading in first slice;
- public class discovery behavior.

## SDK Method Grammar

Only use:

```text
client.management.classes.list({ range, fields })
client.management.classes.get(classId)
client.management.classes.create(input)
client.management.classes.update(input)
client.management.classes.publish(classId)
client.management.classes.draft(classId)
client.management.classes.cancel(classId, input?)
```

Do not use:

```text
supabase.from(...)
supabase.rpc(...)
supabase.functions.invoke(...)
raw action names such as "list_manager" from UI code
client.admin.*
client.management.templates.* in the first slice
client.management.schedules.* in the first slice
```

## State Shape

```text
ManagedClassesState
  rangeScope: "today" | "week" | "month" | "custom"
  rangeAnchorDate: LocalDateLike
  customRange: { startDate, endDate } | null
  visibleRange: { start: ISOString, end: ISOString }
  viewMode: "list" | "calendar"
  classes: ManagedClass[]
  selectedClassId: string | null
  selectedClass: ManagedClass | null
  loadStatus: "idle" | "loading" | "loaded" | "error"
  mutationStatus:
    | "idle"
    | "creating"
    | "updating"
    | "publishing"
    | "drafting"
    | "cancelling"
  errorMessage: string | null
  operationError: string | null
```

`selectedClass` should be derived from loaded classes when possible. If a
dedicated `get(classId)` is used for richer detail, the hook still reconciles it
after range refetch.

## Inputs

- `client` from `useProductContext()`.
- `canManageClasses` boolean for UI affordance gating.
- local date/timezone from browser environment.
- optional initial scope.

## Outputs

```text
state
  rangeScope
  currentRangeLabel
  visibleRange
  viewMode
  classes
  classesGroupedByDate
  selectedClass
  loadStatus
  mutationStatus
  errorMessage
  operationError

actions
  setRangeScope(scope)
  setCustomRange(startDate, endDate)
  goToPreviousRange()
  goToNextRange()
  goToToday()
  setViewMode(mode)
  selectClass(classId)
  clearSelection()
  refreshVisibleRange()
  createClass(formInput)
  updateClass(classId, formInput)
  publishClass(classId)
  draftClass(classId)
  cancelClass(classId, cancelInput)
```

## Result And Status Vocabulary

Terminal load states:

- `loaded`: SDK list succeeded and classes reflect active visible range.
- `error`: SDK list failed and `errorMessage` has displayable text.

Terminal mutation states:

- `idle`: no mutation running.
- success: mutation resolved, visible range refetched, selected detail
  reconciled.
- failure: mutation threw, previous loaded data remains, operation surface shows
  error.

## Idempotency And Concurrency Posture

- Do not start two mutations at once from the same UI surface.
- Disable the active action while its mutation is pending.
- Range changes may trigger a new list call; stale list responses should not
  overwrite newer range state.
- Mutations are not retried automatically; manager can retry after seeing the
  SDK error.

## Failure Posture

- SDK facade methods throw `Error` on backend API errors.
- Catch errors around each load/mutation.
- Show `error.message` in the active operation surface.
- Do not transform backend authorization errors into raw permission details.
- Preserve previous list state after mutation failure.

## Review Points

- Confirm whether `selectedClass` should always be list-derived in the first
  implementation, or whether selecting a class should call
  `management.classes.get(classId)` immediately for detail freshness.
- Confirm whether range-load cancellation is handled with request ids or a
  simpler latest-range guard.

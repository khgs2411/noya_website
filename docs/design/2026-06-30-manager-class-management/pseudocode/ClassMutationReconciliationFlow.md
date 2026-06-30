# ClassMutationReconciliationFlow

Pseudocode artifact. Non-executable reference shape for planning.

## Intended Destination

- Feature-local class management hook/module.
- Form/detail/card action surfaces call into this flow.

## Flow Summary

Class mutations are explicit SDK commands. After a successful mutation, the
workspace refetches the active visible range and reconciles the selected class
from fresh SDK data. The first implementation does not rely on optimistic local
updates for manager-visible state.

## Mutation Inputs

```text
createClass(formInput)
  input: CreateManagedClassInput without templateId

updateClass(classId, formInput)
  input: UpdateManagedClassInput with classId

publishClass(classId)
  input: classId

draftClass(classId)
  input: classId

cancelClass(classId, cancelInput)
  input: {
    reason?: string | null
    exposeReasonToUsers?: boolean
  }
```

## Mutation Sequence

```text
performMutation(commandName, command):
  clear operationError
  set mutationStatus to commandName

  try:
    result = await command()
    await refreshVisibleRange()
    reconcileSelection(result.class?.id)
    close operation surface when appropriate
    set mutationStatus idle
    return success result

  catch error:
    keep previous classes and selectedClass
    set operationError to displayable SDK error message
    set mutationStatus idle
    return failure result
```

## Selection Reconciliation

```text
after refreshVisibleRange:
  if no selectedClassId:
    no-op

  if selectedClassId exists in refreshed classes:
    selectedClass = refreshed class

  else if mutated class id is known and not in refreshed range:
    selectedClass = null
    show optional moved-out-of-range notice

  else:
    selectedClass = null
```

Allowed divergence:

- Instead of clearing selection immediately for moved-out-of-range classes, the
  UI may show a small state explaining that the class moved outside the current
  range and offer to jump to its new date if that date is known.

## Command Rules

- Create and update use ordinary resource methods.
- Publish, draft, and cancel use explicit SDK commands.
- Cancel is not delete.
- Publish/draft may appear as card quick actions.
- Cancel must remain in detail with confirmation.
- Do not collapse publish/draft/cancel into `update({ status })`.

## Terminal States

```text
success:
  SDK command resolved
  active range refetched
  list/calendar reflect fresh range
  selected detail reconciled
  operation error cleared

failure:
  SDK command rejected/threw
  active range not replaced by guessed state
  previous list/detail remain visible
  operation surface shows error

cancelled-by-user:
  dialog/surface closes or returns to detail
  no SDK command runs
  list/detail unchanged
```

## Idempotency Posture

- UI should prevent duplicate submissions while the same mutation is pending.
- Repeated publish/draft/cancel attempts are backend-owned for final validity.
- The hook should not invent idempotency keys.

## Failure Posture

- Display SDK error messages without exposing raw permissions.
- If refetch after successful mutation fails, show a recovery state:
  - mutation likely succeeded;
  - list may be stale;
  - manager can retry refresh.
- Do not roll back successful backend mutation locally.

## Review Points

- Confirm whether mutation surfaces should close after successful create/edit or
  stay open in detail mode. The flow supports either after refetch.
- Confirm whether refetch failure after mutation should keep a stale item with a
  warning or clear the list into a load-error state.

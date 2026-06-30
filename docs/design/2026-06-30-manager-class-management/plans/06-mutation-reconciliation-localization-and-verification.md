# Chunk 06: Mutation Reconciliation Localization And Verification

**Plan Set:** `../plan.md`  
**Spec:** `../spec.md`  
**Status:** Ready For Implementation  
**Depends on:** `03-mobile-class-list-and-card-actions.md`, `04-desktop-calendar-and-view-mode.md`, `05-class-detail-form-and-cancel-surfaces.md`  
**Enables:** Implementation completion

## Goal

Close the class management slice by hardening mutation reconciliation across list, calendar, detail, and form surfaces; completing English, Hebrew, and Russian copy; and running focused verification for access gates, SDK boundaries, responsive behavior, and user-facing error states.

## Source Artifacts

- `../spec.md`: Data Refresh And Local State, Empty/Loading/Error States, Internationalization, Testing Strategy.
- `../agenda.md`: Question 7 and pressure-test result.
- `../pseudocode/ClassMutationReconciliationFlow.md`
- `../pseudocode/ClassManagementStateAndSdkBoundary.md`
- `src/features/manager/classes/use-managed-classes.ts`
- `src/features/manager/classes/class-management-tab.tsx`
- `src/features/manager/classes/class-list-view.tsx`
- `src/features/manager/classes/class-calendar-view.tsx`
- `src/features/manager/classes/class-detail-panel.tsx`
- `src/features/manager/classes/class-form-dialog.tsx`
- `src/features/manager/classes/class-cancel-dialog.tsx`
- `src/i18n.ts`

## Relationships

- **Depends on:** All read/write manager class surfaces.
- **Enables:** Step 2 class management implementation completion and a move toward public class discovery or manager template/schedule slices.
- **Shared contracts:** mutation result handling, selected detail reconciliation, stale-after-mutation recovery, localized copy completeness.
- **Integration points:** browser smoke on existing dev server, `npm run lint`, optional final `npm run build`.

## File Responsibility Map

**Modify:**
- `src/features/manager/classes/use-managed-classes.ts` - complete mutation reconciliation, moved-out-of-range notice, stale-after-refetch-failure state.
- `src/features/manager/classes/class-management-tab.tsx` - render recovery and moved-selection notices.
- `src/features/manager/classes/class-form-dialog.tsx` - ensure successful create/edit closes only after hook reports success.
- `src/features/manager/classes/class-cancel-dialog.tsx` - ensure cancel stays open on failure and closes on success.
- `src/i18n.ts` - complete all manager class copy in English, Hebrew, and Russian.

**Create:**
- No required new files.

**Test:**
- No automated test file exists. Verification is focused inspection, browser smoke, `npm run lint`, and optional final `npm run build`.

## Implementation Tasks

### Task 1: Harden Refetch And Selection Reconciliation

**Files:**
- Modify: `src/features/manager/classes/use-managed-classes.ts`

- [ ] Add explicit reconciliation state.

```ts
type ReconciliationNotice =
  | { type: 'moved-out-of-range'; classId: string }
  | { type: 'stale-after-mutation' }
  | null

const [reconciliationNotice, setReconciliationNotice] = useState<ReconciliationNotice>(null)
```

- [ ] Make `refreshVisibleRange` return a result so mutation flows can distinguish list failures after successful backend mutation.

```ts
const refreshVisibleRange = useCallback(async () => {
  if (!client) return { ok: false as const, classes: [] as ManagedClass[] }
  const requestId = requestIdRef.current + 1
  requestIdRef.current = requestId
  setLoadStatus('loading')
  setErrorMessage(null)

  try {
    const result = await client.management.classes.list({
      range: visibleRange,
      fields: ['registeredUsersCount', 'pendingRegistrationCount'],
    })
    if (requestIdRef.current !== requestId) return { ok: false as const, classes: [] as ManagedClass[] }
    setClasses(result.classes)
    setLoadStatus('loaded')
    return { ok: true as const, classes: result.classes }
  } catch (error) {
    if (requestIdRef.current !== requestId) return { ok: false as const, classes: [] as ManagedClass[] }
    setErrorMessage(error instanceof Error ? error.message : 'Unable to load classes.')
    setLoadStatus('error')
    return { ok: false as const, classes: [] as ManagedClass[] }
  }
}, [client, visibleRange])
```

- [ ] Reconcile selected class after mutation.

```ts
function reconcileSelectedClass(refreshedClasses: ManagedClass[], mutatedClassId?: string) {
  setSelectedClassId((currentSelectedClassId) => {
    const idToKeep = mutatedClassId ?? currentSelectedClassId
    if (!idToKeep) return currentSelectedClassId
    const existsInRange = refreshedClasses.some((managedClass) => managedClass.id === idToKeep)
    if (existsInRange) {
      setReconciliationNotice(null)
      return idToKeep
    }
    setReconciliationNotice({ type: 'moved-out-of-range', classId: idToKeep })
    return null
  })
}
```

- [ ] Update `performMutation` to set stale notice if refetch fails after successful mutation.

```ts
const refreshResult = await refreshVisibleRange()
if (refreshResult.ok) {
  reconcileSelectedClass(refreshResult.classes, mutatedClassId)
} else {
  setReconciliationNotice({ type: 'stale-after-mutation' })
}
```

This resolves the refetch-failure decision: keep previous visible state, tell the manager the backend action likely succeeded, and expose refresh retry.

### Task 2: Render Recovery Notices

**Files:**
- Modify: `src/features/manager/classes/class-management-tab.tsx`

- [ ] Render clear notices without raw implementation language.

```tsx
{state.reconciliationNotice?.type === 'stale-after-mutation' && (
  <div className="rounded-[1.4rem] border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-sm">
    <p className="font-medium text-[var(--color-foreground)]">{t('manager.recovery.staleTitle')}</p>
    <p className="mt-1 text-[var(--color-muted-foreground)]">{t('manager.recovery.staleBody')}</p>
    <Button type="button" variant="outline" className="mt-3" onClick={actions.refreshVisibleRange}>
      {t('manager.recovery.refresh')}
    </Button>
  </div>
)}
{state.reconciliationNotice?.type === 'moved-out-of-range' && (
  <div className="rounded-[1.4rem] border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-sm text-[var(--color-muted-foreground)]">
    {t('manager.recovery.movedOutOfRange')}
  </div>
)}
```

### Task 3: Complete Localization

**Files:**
- Modify: `src/i18n.ts`

- [ ] Ensure English, Hebrew, and Russian contain every key used by manager class components.

```ts
manager: {
  range: {
    today: 'Today',
    week: 'Week',
    month: 'Month',
    custom: 'Custom',
    previous: 'Previous range',
    next: 'Next range',
    todayButton: 'Today',
  },
  view: { list: 'List', calendar: 'Calendar' },
  classStatus: { draft: 'Draft', published: 'Published' },
  classActions: {
    create: 'Create class',
    edit: 'Edit',
    publish: 'Publish',
    moveToDraft: 'Move to draft',
    cancel: 'Cancel class',
    save: 'Save class',
  },
  classCard: {
    capacity: '{{registered}}/{{count}} registered',
  },
  calendar: {
    listFallback: 'This range is easier to review as a list.',
  },
  detail: {
    eyebrow: 'Class detail',
    time: 'Time',
    status: 'Status',
    capacity: 'Capacity',
    location: 'Location',
    noLocation: 'No location',
    notes: 'Internal notes',
    readOnly: 'Locked',
  },
  readOnlyReason: {
    started: 'Already started',
    ended: 'Already ended',
    cancelled: 'Cancelled',
  },
  form: {
    createTitle: 'Create class',
    editTitle: 'Edit class',
    name: 'Name',
    startsAt: 'Starts',
    endsAt: 'Ends',
    capacity: 'Capacity',
    location: 'Location',
    description: 'Description',
    category: 'Category',
    status: 'Status',
    visibility: 'Visibility',
    registrationPolicy: 'Registration',
    membershipRequirement: 'Membership',
    notes: 'Internal notes',
    advanced: 'Class settings',
  },
  visibility: {
    public: 'Public',
    hidden: 'Hidden',
    membersOnly: 'Members only',
  },
  registrationPolicy: {
    autoApprove: 'Auto approve',
    memberAutoApprove: 'Members auto approve',
    approvalRequired: 'Approval required',
  },
  membershipRequirement: {
    none: 'No membership required',
    required: 'Membership required',
  },
  validation: {
    nameRequired: 'Class name is required.',
    invalidDates: 'Choose a valid start and end time.',
    endAfterStart: 'End time must be after start time.',
    capacity: 'Capacity must be a positive whole number.',
  },
  cancel: {
    title: 'Cancel class',
    body: 'Cancellation keeps the class record but marks it as cancelled.',
    reason: 'Reason',
    exposeReason: 'Show this reason to students',
  },
  recovery: {
    staleTitle: 'Class was updated',
    staleBody: 'The latest class list could not be refreshed. Try refreshing this range.',
    refresh: 'Refresh',
    movedOutOfRange: 'The selected class moved outside the current date range.',
  },
}
```

Translate the same keys in Hebrew and Russian. Keep manager-facing copy concise and avoid the words "permission", "capability", "SDK", or "backend" in visible text.

### Task 4: Inspect SDK Boundary And Access States

**Files:**
- Inspect: `src/features/manager`

- [ ] Confirm all manager class SDK calls are inside `use-managed-classes.ts`.
- [ ] Confirm class UI uses `canManageClasses` to hide create/edit/lifecycle controls.
- [ ] Confirm `App.tsx` still owns unauthorized `/manager` redirect.

Expected inspection signals:

```text
management.classes.list
management.classes.create
management.classes.update
management.classes.publish
management.classes.draft
management.classes.cancel
```

No other `management.*`, `supabase`, `rpc`, or `functions.invoke` calls should exist in this feature.

### Task 5: Final Verification Pass

**Files:**
- Inspect all changed files from chunks `01` through `06`.

- [ ] Before browser smoke, confirm whether a Vite dev server is already running at `http://localhost:5173`. If it is not running, start `npm run dev` and use the URL reported by Vite. Do not assume port `5173` if Vite chooses another port.

- [ ] Run focused searches:

```bash
rtk rg -n "supabase|functions\\.invoke|rpc\\(|management\\.templates|management\\.schedules|client\\.admin" src/features/manager
```

Expected: no matches.

```bash
rtk rg -n "manager\\.(range|view|classStatus|classActions|classCard|calendar|detail|form|validation|cancel|recovery)" src/i18n.ts src/features/manager
```

Expected: every used manager class key is present in all language resource blocks.

- [ ] Browser smoke on existing dev server:
  - Manager user opens `/manager`.
  - Classes tab loads and displays range controls.
  - Mobile width displays list only.
  - Desktop width can switch list/calendar.
  - Create/edit form opens and validates.
  - Publish/draft quick actions call SDK actions and refetch.
  - Cancel opens only from detail and stays confirm-based.
  - Non-class-manager access hides create/edit/lifecycle controls.
  - No raw permission list appears.

- [ ] Run final command-level verification when the full slice is implemented:

```bash
npm run lint
```

Expected: exits `0` or reports only pre-existing lint failures that are documented in the execution report.

```bash
npm run build
```

Expected: exits `0`. Run this once at the end of the full slice, not after each UI edit.

## Verification

This chunk's verification is the final pass above. The key pass signals are: SDK boundary is clean, i18n keys are complete, access states are user-safe, responsive manager workflows smoke correctly, and final lint/build evidence is honestly reported.

## Acceptance Criteria Covered

- Refetch after every successful mutation.
- Selected detail updates, clears, or shows a moved-out-of-range notice.
- Refetch failure after mutation shows recovery state.
- SDK errors appear in active surfaces.
- English, Hebrew, and Russian copy is complete.
- No raw permissions or raw backend details are displayed.
- Final verification matches the repo's real available commands.

## Risks And Rollback

- Risk: build may reveal type drift from SDK exports. Fix the import/type boundary rather than weakening the SDK facade.
- Risk: i18n key gaps can render raw keys. Search both definitions and usages before finishing.
- Rollback: if reconciliation changes cause regressions, restore the previous hook mutation behavior and keep the UI surfaces; then reintroduce reconciliation in a smaller patch.

## Non-Goals

- No new product behavior beyond class management.
- No template or schedule management.
- No public class discovery.
- No new test runner setup.

## Type And Name Consistency

- Hook state exposes `reconciliationNotice`.
- Hook actions expose `refreshVisibleRange`.
- Translation keys are identical across `en`, `he`, and `ru`.
- Final report must distinguish lint/build results from browser smoke results.

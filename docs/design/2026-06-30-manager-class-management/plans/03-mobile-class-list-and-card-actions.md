# Chunk 03: Mobile Class List And Card Actions

**Plan Set:** `../plan.md`  
**Spec:** `../spec.md`  
**Status:** Ready For Implementation  
**Depends on:** `02-class-range-state-and-sdk-loading.md`  
**Enables:** `04-desktop-calendar-and-view-mode.md`, `05-class-detail-form-and-cancel-surfaces.md`, `06-mutation-reconciliation-localization-and-verification.md`

## Goal

Implement the primary manager scanning workflow: a mobile-first, date-grouped class list with compact class cards, status/count/location summaries, class selection, and safe publish/draft quick actions when the manager has class-management capability.

## Source Artifacts

- `../spec.md`: Mobile UX Structure, User-Facing Manager Behavior, Data Refresh And Local State, Permissions And Access.
- `../agenda.md`: Question 6.
- `../pseudocode/ClassRangeAndCalendarFlow.md`
- `../pseudocode/ClassFormAndLifecycleSurfaces.md`
- `../pseudocode/ManagerClassComponentMap.md`
- `src/features/manager/classes/use-managed-classes.ts`
- `src/features/manager/classes/class-management-tab.tsx`

## Relationships

- **Depends on:** `useManagedClasses` must expose loaded classes, selected class id, mutation status placeholders, `publishClass`, and `draftClass`. If chunk `02` left publish/draft as placeholders, this chunk implements those two hook actions.
- **Enables:** Desktop calendar can reuse `class-card.tsx`; detail/form can consume `selectedClass`.
- **Shared contracts:** `ClassCard`, `ClassListView`, grouped class model, publish/draft action calls.
- **Integration points:** `client.management.classes.publish(classId)`, `client.management.classes.draft(classId)`, active range refetch from hook.

## File Responsibility Map

**Create:**
- `src/features/manager/classes/class-card.tsx` - compact class summary and publish/draft quick actions.
- `src/features/manager/classes/class-list-view.tsx` - date-grouped list presentation and empty groups.

**Modify:**
- `src/features/manager/classes/use-managed-classes.ts` - add grouping, `publishClass`, `draftClass`, and card operation error state if not already present.
- `src/features/manager/classes/class-management-tab.tsx` - render `ClassListView` in loaded state.
- `src/i18n.ts` - status, lifecycle, and quick action copy in English, Hebrew, and Russian.

**Test:**
- No automated test file. Verify by inspection and browser smoke.

## Implementation Tasks

### Task 1: Extend Hook With Grouping And Publish/Draft

**Files:**
- Modify: `src/features/manager/classes/use-managed-classes.ts`

- [ ] Add grouped classes and publish/draft commands.

```ts
type ClassDateGroup = {
  dateKey: string
  label: string
  classes: ManagedClass[]
}

function getClassDateKey(managedClass: ManagedClass) {
  return managedClass.starts_at.slice(0, 10)
}

function groupClassesByDate(classes: ManagedClass[], locale: string): ClassDateGroup[] {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'short', day: 'numeric' })
  const groups = new Map<string, ManagedClass[]>()

  for (const managedClass of [...classes].sort((a, b) => a.starts_at.localeCompare(b.starts_at))) {
    const key = getClassDateKey(managedClass)
    groups.set(key, [...(groups.get(key) ?? []), managedClass])
  }

  return [...groups.entries()].map(([dateKey, groupedClasses]) => ({
    dateKey,
    label: formatter.format(new Date(groupedClasses[0].starts_at)),
    classes: groupedClasses,
  }))
}

async function runLifecycleMutation(nextStatus: MutationStatus, command: () => Promise<unknown>) {
  if (mutationStatus !== 'idle') return
  setOperationError(null)
  setMutationStatus(nextStatus)
  try {
    await command()
    await refreshVisibleRange()
  } catch (error) {
    setOperationError(error instanceof Error ? error.message : 'Class action failed.')
  } finally {
    setMutationStatus('idle')
  }
}

const publishClass = useCallback(
  (classId: string) => runLifecycleMutation('publishing', () => client!.management.classes.publish(classId)),
  [client, mutationStatus, refreshVisibleRange]
)

const draftClass = useCallback(
  (classId: string) => runLifecycleMutation('drafting', () => client!.management.classes.draft(classId)),
  [client, mutationStatus, refreshVisibleRange]
)
```

If `client` can be null, guard inside each action and set a displayable operation error instead of using a non-null assertion.

### Task 2: Create Class Card

**Files:**
- Create: `src/features/manager/classes/class-card.tsx`

- [ ] Add a compact, mobile-safe card.

```tsx
import { CalendarClock, MapPin, Send, Undo2 } from 'lucide-react'
import type { ManagedClass } from '@class-kit/react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../../components/ui/button'
import { cn } from '../../../lib/utils'

type ClassCardProps = {
  managedClass: ManagedClass
  canManageClasses: boolean
  isSelected: boolean
  isMutating: boolean
  onSelect: (classId: string) => void
  onPublish: (classId: string) => void
  onDraft: (classId: string) => void
}

export function ClassCard({ managedClass, canManageClasses, isSelected, isMutating, onSelect, onPublish, onDraft }: ClassCardProps) {
  const { t, i18n } = useTranslation()
  const timeFormatter = new Intl.DateTimeFormat(i18n.language, { hour: '2-digit', minute: '2-digit' })
  const startsAt = new Date(managedClass.starts_at)
  const endsAt = new Date(managedClass.ends_at)
  const canPublish = canManageClasses && !managedClass.read_only && managedClass.status === 'draft'
  const canDraft = canManageClasses && !managedClass.read_only && managedClass.status === 'published'

  return (
    <article
      className={cn(
        'rounded-[1.4rem] border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-[var(--shadow-soft)]',
        isSelected && 'border-[var(--color-primary)]'
      )}
    >
      <button type="button" className="block w-full text-start" onClick={() => onSelect(managedClass.id)}>
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
              <CalendarClock className="size-4 shrink-0" aria-hidden="true" />
              <span>{timeFormatter.format(startsAt)} - {timeFormatter.format(endsAt)}</span>
            </p>
            <h3 className="mt-2 break-words font-serif text-xl text-[var(--color-foreground)]">{managedClass.name}</h3>
          </div>
          <span className="shrink-0 rounded-full border border-[var(--color-border)] px-2 py-1 text-[0.7rem] uppercase tracking-[0.16em] text-[var(--color-muted-foreground)]">
            {t(`manager.classStatus.${managedClass.status}`)}
          </span>
        </div>
        {managedClass.location && (
          <p className="mt-3 flex items-start gap-2 text-sm text-[var(--color-muted-foreground)]">
            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span className="break-words">{managedClass.location}</span>
          </p>
        )}
        <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
          {t('manager.classCard.capacity', { count: managedClass.capacity, registered: managedClass.registeredUsersCount ?? 0 })}
        </p>
      </button>
      {(canPublish || canDraft) && (
        <div className="mt-4 flex gap-2">
          {canPublish && (
            <Button type="button" size="sm" disabled={isMutating} onClick={() => onPublish(managedClass.id)}>
              <Send className="size-4" aria-hidden="true" />
              {t('manager.classActions.publish')}
            </Button>
          )}
          {canDraft && (
            <Button type="button" size="sm" variant="outline" disabled={isMutating} onClick={() => onDraft(managedClass.id)}>
              <Undo2 className="size-4" aria-hidden="true" />
              {t('manager.classActions.moveToDraft')}
            </Button>
          )}
        </div>
      )}
    </article>
  )
}
```

This resolves the `class-card.tsx` split decision: create it now because the desktop calendar can reuse the same summary contract or visual vocabulary.

### Task 3: Create Date-Grouped List View

**Files:**
- Create: `src/features/manager/classes/class-list-view.tsx`

- [ ] Render date groups and cards.

```tsx
import type { ManagedClass } from '@class-kit/react'
import { ClassCard } from './class-card'

type ClassDateGroup = {
  dateKey: string
  label: string
  classes: ManagedClass[]
}

type ClassListViewProps = {
  groups: ClassDateGroup[]
  selectedClassId: string | null
  canManageClasses: boolean
  isMutating: boolean
  onSelectClass: (classId: string) => void
  onPublishClass: (classId: string) => void
  onDraftClass: (classId: string) => void
}

export function ClassListView(props: ClassListViewProps) {
  return (
    <div className="flex flex-col gap-5">
      {props.groups.map((group) => (
        <section key={group.dateKey} className="flex flex-col gap-3">
          <h2 className="font-serif text-2xl text-[var(--color-foreground)]">{group.label}</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {group.classes.map((managedClass) => (
              <ClassCard
                key={managedClass.id}
                managedClass={managedClass}
                canManageClasses={props.canManageClasses}
                isSelected={managedClass.id === props.selectedClassId}
                isMutating={props.isMutating}
                onSelect={props.onSelectClass}
                onPublish={props.onPublishClass}
                onDraft={props.onDraftClass}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
```

### Task 4: Wire List Into Class Management Tab

**Files:**
- Modify: `src/features/manager/classes/class-management-tab.tsx`

- [ ] Render `ClassListView` when `loadStatus === 'loaded'` and classes exist.
- [ ] Show `operationError` near the class surface for publish/draft failures.

```tsx
{state.operationError && (
  <p className="rounded-[1.4rem] border border-[var(--color-border)] bg-[var(--color-card)] p-3 text-sm text-blush-strong">
    {state.operationError}
  </p>
)}
{state.loadStatus === 'loaded' && state.classesGroupedByDate.length > 0 && (
  <ClassListView
    groups={state.classesGroupedByDate}
    selectedClassId={state.selectedClassId}
    canManageClasses={state.canManageClasses}
    isMutating={state.mutationStatus !== 'idle'}
    onSelectClass={actions.selectClass}
    onPublishClass={actions.publishClass}
    onDraftClass={actions.draftClass}
  />
)}
```

## Verification

- Run: `rtk rg -n "publish\\(|draft\\(|cancel\\(|update\\(|create\\(" src/features/manager/classes`
  - Expected: `publish(` and `draft(` exist only in `use-managed-classes.ts`; no cancel/create/update in this chunk unless added as typed placeholders without SDK calls.
- Run: `rtk rg -n "manager\\.classStatus|manager\\.classActions|manager\\.classCard" src/i18n.ts src/features/manager/classes`
  - Expected: translation keys exist and are used.
- Browser smoke:
  - Open `/manager` as a manager.
  - Expected: loaded classes render grouped by date when SDK returns data.
  - Expected: mobile width shows cards without horizontal overflow.
  - Expected: draft cards can show Publish, published cards can show Draft, cancelled/read-only cards do not show quick lifecycle actions.
  - Expected: lifecycle errors appear in the class surface, not as raw permission lists.

## Acceptance Criteria Covered

- Mobile-first date-grouped list view.
- Compact class cards with time, name, status, capacity/count, and location.
- Class selection from list.
- Publish/draft quick actions where safe.
- Backend errors displayed through SDK error messages.

## Risks And Rollback

- Risk: count fields may be absent. Display `0` or omit count label when `registeredUsersCount` is undefined; do not crash.
- Risk: quick actions can clutter mobile cards. Keep buttons small and wrap if needed.
- Rollback: remove `class-list-view.tsx` and `class-card.tsx`, remove publish/draft actions from the hook, and restore loaded state to a simple placeholder.

## Non-Goals

- No cancel action.
- No create/edit form.
- No desktop calendar.
- No registration or attendance management.

## Type And Name Consistency

- Export `ClassCard` and `ClassListView`.
- Hook must expose `classesGroupedByDate`, `publishClass`, and `draftClass`.
- Translation keys must use `manager.classStatus`, `manager.classActions`, and `manager.classCard`.

# Chunk 04: Desktop Calendar And View Mode

**Plan Set:** `../plan.md`  
**Spec:** `../spec.md`  
**Status:** Ready For Implementation  
**Depends on:** `02-class-range-state-and-sdk-loading.md`, `03-mobile-class-list-and-card-actions.md`  
**Enables:** `06-mutation-reconciliation-localization-and-verification.md`

## Goal

Add the stronger desktop workflow: a list/calendar view toggle and a select-only calendar for week and month ranges, while preserving mobile list-only behavior. Calendar items select classes; all mutations still happen through card quick actions or the detail/form surfaces.

## Source Artifacts

- `../spec.md`: Desktop UX Structure, Date Scope Model, Planning Boundary Guidance.
- `../agenda.md`: Question 5.
- `../pseudocode/ClassRangeAndCalendarFlow.md`
- `../pseudocode/ManagerClassComponentMap.md`
- `src/features/manager/classes/class-range.ts`
- `src/features/manager/classes/class-list-view.tsx`
- `src/features/manager/classes/class-card.tsx`

## Relationships

- **Depends on:** Range/view state and mobile list/card implementation.
- **Enables:** Final responsive verification and selected-class detail flow.
- **Shared contracts:** `viewMode: 'list' | 'calendar'`, mobile forced-list presentation, desktop calendar select-only behavior.
- **Integration points:** `ClassRangeToolbar`, `ClassManagementTab`, `ClassCalendarView`.

## File Responsibility Map

**Create:**
- `src/features/manager/classes/class-calendar-view.tsx` - desktop week/month calendar grid and selectable class items.

**Modify:**
- `src/features/manager/classes/class-range.ts` - add helpers for calendar days when needed.
- `src/features/manager/classes/class-management-tab.tsx` - choose list or calendar for desktop, list-only for mobile.
- `src/features/manager/classes/class-range-toolbar.tsx` - keep view toggle hidden on mobile and reflect active state.
- `src/i18n.ts` - calendar empty/fallback copy if needed.

**Test:**
- No automated test file. Verify by browser smoke at mobile and desktop widths.

## Implementation Tasks

### Task 1: Add Calendar Range Helpers

**Files:**
- Modify: `src/features/manager/classes/class-range.ts`

- [ ] Add helpers used by calendar rendering.

```ts
export function getCalendarDays(range: LocalDateRange) {
  const days: Date[] = []
  let cursor = startOfLocalDay(range.start)
  const last = startOfLocalDay(range.end)

  while (cursor.getTime() <= last.getTime()) {
    days.push(cursor)
    cursor = addDays(cursor, 1)
  }

  return days
}

export function getLocalDateKey(date: Date) {
  return toDateInput(date)
}
```

For month view, the first implementation may render only the days in the active month range. A padded full-calendar grid is acceptable if it remains readable.

### Task 2: Create Desktop Calendar View

**Files:**
- Create: `src/features/manager/classes/class-calendar-view.tsx`

- [ ] Render select-only day cells.

```tsx
import type { ManagedClass } from '@class-kit/react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../../lib/utils'
import type { LocalDateRange, RangeScope } from './class-range'
import { getCalendarDays, getLocalDateKey } from './class-range'

type ClassCalendarViewProps = {
  rangeScope: RangeScope
  localRange: LocalDateRange
  classes: ManagedClass[]
  selectedClassId: string | null
  onSelectClass: (classId: string) => void
}

export function ClassCalendarView({ rangeScope, localRange, classes, selectedClassId, onSelectClass }: ClassCalendarViewProps) {
  const { t, i18n } = useTranslation()
  const dateFormatter = new Intl.DateTimeFormat(i18n.language, { weekday: 'short', day: 'numeric' })
  const timeFormatter = new Intl.DateTimeFormat(i18n.language, { hour: '2-digit', minute: '2-digit' })

  if (rangeScope === 'today' || rangeScope === 'custom') {
    return (
      <div className="rounded-[1.4rem] border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-sm text-[var(--color-muted-foreground)]">
        {t('manager.calendar.listFallback')}
      </div>
    )
  }

  const days = getCalendarDays(localRange)

  return (
    <div className="hidden gap-2 md:grid md:grid-cols-7">
      {days.map((day) => {
        const dateKey = getLocalDateKey(day)
        const dayClasses = classes.filter((managedClass) => managedClass.starts_at.slice(0, 10) === dateKey)

        return (
          <section key={dateKey} className="min-h-36 rounded-[1.4rem] border border-[var(--color-border)] bg-[var(--color-card)] p-3">
            <h3 className="font-serif text-sm text-[var(--color-foreground)]">{dateFormatter.format(day)}</h3>
            <div className="mt-3 flex flex-col gap-2">
              {dayClasses.map((managedClass) => (
                <button
                  key={managedClass.id}
                  type="button"
                  className={cn(
                    'rounded-xl border border-[var(--color-border)] p-2 text-start text-xs leading-5',
                    managedClass.id === selectedClassId && 'border-[var(--color-primary)]'
                  )}
                  onClick={() => onSelectClass(managedClass.id)}
                >
                  <span className="block font-medium text-[var(--color-foreground)]">{timeFormatter.format(new Date(managedClass.starts_at))}</span>
                  <span className="block break-words text-[var(--color-muted-foreground)]">{managedClass.name}</span>
                </button>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
```

This resolves custom-range calendar behavior: Today and Custom use list fallback copy instead of a cramped calendar grid.

### Task 3: Wire View Mode Into Class Tab

**Files:**
- Modify: `src/features/manager/classes/class-management-tab.tsx`

- [ ] Render calendar only on desktop and only when `viewMode === 'calendar'`.

```tsx
const listView = (
  <ClassListView
    groups={state.classesGroupedByDate}
    selectedClassId={state.selectedClassId}
    canManageClasses={state.canManageClasses}
    isMutating={state.mutationStatus !== 'idle'}
    onSelectClass={actions.selectClass}
    onPublishClass={actions.publishClass}
    onDraftClass={actions.draftClass}
  />
)

{state.loadStatus === 'loaded' && state.classes.length > 0 && (
  <>
    <div className="md:hidden">
      {listView}
    </div>
    <div className="hidden md:block">
      {state.viewMode === 'calendar' ? (
        <ClassCalendarView
          rangeScope={state.rangeScope}
          localRange={state.localRange}
          classes={state.classes}
          selectedClassId={state.selectedClassId}
          onSelectClass={actions.selectClass}
        />
      ) : (
        listView
      )}
    </div>
  </>
)}
```

Do not create a broad abstraction for this one body. Keep the local `listView` variable near the loaded-state JSX.

### Task 4: Make View Toggle State Clear

**Files:**
- Modify: `src/features/manager/classes/class-range-toolbar.tsx`

- [ ] Apply active styling to List and Calendar buttons.
- [ ] Keep these buttons hidden under the `md` breakpoint.
- [ ] Use icons from lucide and existing `Button` styling.

```tsx
<Button
  type="button"
  variant={props.viewMode === 'list' ? 'default' : 'ghost'}
  onClick={() => props.onViewModeChange('list')}
>
  <List className="size-4" aria-hidden="true" />
  {t('manager.view.list')}
</Button>
```

## Verification

- Run: `rtk rg -n "drag|drop|draggable|onDrag" src/features/manager/classes`
  - Expected: no drag/drop calendar mutation behavior.
- Run: `rtk rg -n "ClassCalendarView|viewMode|md:hidden|hidden md" src/features/manager/classes`
  - Expected: calendar is desktop-only and view mode is wired.
- Browser smoke:
  - Mobile width: no calendar toggle visible; list still renders.
  - Desktop width: List/Calendar toggle visible.
  - Week/Month calendar: class items are selectable.
  - Today/Custom calendar mode: fallback message appears or list remains visible; no cramped custom grid.

## Acceptance Criteria Covered

- Desktop list/calendar view toggle.
- Desktop week/month select-only calendar.
- Mobile list-only behavior.
- Drag/drop rescheduling remains out of scope.
- Calendar selection opens/selects class detail state.

## Risks And Rollback

- Risk: seven-column grid can overflow at tablet widths. Keep `md` breakpoint conservative; if cramped, move calendar to `lg`.
- Risk: month grid with many classes can become dense. Cards should remain compact and scroll within the page rather than inside nested scroll regions.
- Rollback: remove `class-calendar-view.tsx`, hide the view toggle, and always render `ClassListView`.

## Non-Goals

- No drag/drop editing.
- No inline rescheduling.
- No custom-range grid if readability is weak.
- No mobile calendar.

## Type And Name Consistency

- Export `ClassCalendarView`.
- Hook state must expose `localRange`, `rangeScope`, `classes`, `selectedClassId`, and `viewMode`.
- Toolbar uses `ViewMode` exactly as `'list' | 'calendar'`.

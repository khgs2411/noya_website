# Chunk 02: Class Range State And SDK Loading

**Plan Set:** `../plan.md`  
**Spec:** `../spec.md`  
**Status:** Ready For Implementation  
**Depends on:** `01-manager-workspace-shell-and-tabs.md`  
**Enables:** `03-mobile-class-list-and-card-actions.md`, `04-desktop-calendar-and-view-mode.md`, `05-class-detail-form-and-cancel-surfaces.md`

## Goal

Add the feature-local state and SDK boundary for manager class data: date range calculation, explicit `management.classes.list` loading, loading/error/empty states, class selection, and a range toolbar contract. This chunk creates the source-of-truth hook that later list, calendar, detail, and form surfaces consume.

## Source Artifacts

- `../spec.md`: ClassKit SDK Evidence, Date Scope Model, Data Refresh And Local State, Permissions And Access, Component Boundary.
- `../agenda.md`: Question 2 and Question 7.
- `../pseudocode/ClassManagementStateAndSdkBoundary.md`
- `../pseudocode/ClassRangeAndCalendarFlow.md`
- `../pseudocode/ClassMutationReconciliationFlow.md`
- `../pseudocode/ManagerClassComponentMap.md`
- `src/features/manager/classes/class-management-tab.tsx`
- `node_modules/@class-kit/react/src/manager/manager-api.ts`
- `node_modules/@class-kit/react/src/client/class-kit-client.ts`

## Relationships

- **Depends on:** Manager shell and Classes tab mount point from chunk `01`.
- **Enables:** Real class list/card rendering, desktop calendar, form/detail surfaces, and lifecycle mutations.
- **Shared contracts:** `useManagedClasses`, `class-range.ts`, `RangeScope`, `ViewMode`, `VisibleRange`, grouped classes by local date, selected class id/detail.
- **Integration points:** `@class-kit/react` product context client, `client.management.classes.list({ range, fields })`, `src/features/manager/classes/class-management-tab.tsx`.

## File Responsibility Map

**Create:**
- `src/features/manager/classes/class-range.ts` - pure range calculations and local-to-ISO conversion.
- `src/features/manager/classes/use-managed-classes.ts` - feature-local hook for range state, class list loading, selection, load errors, and mutation action placeholders.
- `src/features/manager/classes/class-range-toolbar.tsx` - mobile-first toolbar UI for scope, previous/today/next, custom range entry, and desktop view mode switch.

**Modify:**
- `src/features/manager/classes/class-management-tab.tsx` - consume `useManagedClasses`, render toolbar and loading/error/empty shell.
- `src/i18n.ts` - range toolbar and state copy in English, Hebrew, and Russian.

**Test:**
- No automated unit test runner exists. Date utility behavior is verified by focused inspection and browser smoke until the repo adds a test runner.

## Implementation Tasks

### Task 1: Add Range Types And Utilities

**Files:**
- Create: `src/features/manager/classes/class-range.ts`

- [ ] Implement native-date range utilities with a small exported surface.

```ts
export type RangeScope = 'today' | 'week' | 'month' | 'custom'
export type ViewMode = 'list' | 'calendar'

export type LocalDateRange = {
  start: Date
  end: Date
}

export type VisibleRange = {
  start: string
  end: string
}

export type CustomRangeValue = {
  startDate: string
  endDate: string
}

export function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
}

export function endOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

export function getLocalRange(scope: RangeScope, anchorDate: Date, customRange: CustomRangeValue | null): LocalDateRange {
  if (scope === 'custom') {
    if (!customRange) return { start: startOfLocalDay(anchorDate), end: endOfLocalDay(anchorDate) }
    return {
      start: startOfLocalDay(parseDateInput(customRange.startDate)),
      end: endOfLocalDay(parseDateInput(customRange.endDate)),
    }
  }

  if (scope === 'week') {
    const day = anchorDate.getDay()
    const start = startOfLocalDay(addDays(anchorDate, -day))
    return { start, end: endOfLocalDay(addDays(start, 6)) }
  }

  if (scope === 'month') {
    const start = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1, 0, 0, 0, 0)
    const end = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0, 23, 59, 59, 999)
    return { start, end }
  }

  return { start: startOfLocalDay(anchorDate), end: endOfLocalDay(anchorDate) }
}

export function toVisibleRange(range: LocalDateRange): VisibleRange {
  return { start: range.start.toISOString(), end: range.end.toISOString() }
}

export function shiftRange(scope: RangeScope, anchorDate: Date, customRange: CustomRangeValue | null, direction: -1 | 1) {
  if (scope === 'month') return { anchorDate: new Date(anchorDate.getFullYear(), anchorDate.getMonth() + direction, anchorDate.getDate()), customRange }
  if (scope === 'week') return { anchorDate: addDays(anchorDate, direction * 7), customRange }
  if (scope === 'custom' && customRange) {
    const start = parseDateInput(customRange.startDate)
    const end = parseDateInput(customRange.endDate)
    const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1)
    const nextStart = addDays(start, direction * days)
    const nextEnd = addDays(end, direction * days)
    return {
      anchorDate: nextStart,
      customRange: { startDate: toDateInput(nextStart), endDate: toDateInput(nextEnd) },
    }
  }

  return { anchorDate: addDays(anchorDate, direction), customRange }
}

export function parseDateInput(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function toDateInput(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}
```

This resolves the Today behavior reconciliation: `goToToday()` preserves the active scope and changes the anchor to the current local date.

### Task 2: Add Managed Classes Hook

**Files:**
- Create: `src/features/manager/classes/use-managed-classes.ts`

- [ ] Implement the hook using SDK facade methods only.

```ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  CancelManagedClassInput,
  CreateManagedClassInput,
  ManagedClass,
  UpdateManagedClassInput,
} from '@class-kit/react'
import type { ClassKitClient } from '@class-kit/react'
import {
  type CustomRangeValue,
  type RangeScope,
  type ViewMode,
  getLocalRange,
  shiftRange,
  toDateInput,
  toVisibleRange,
} from './class-range'

type LoadStatus = 'idle' | 'loading' | 'loaded' | 'error'
type MutationStatus = 'idle' | 'creating' | 'updating' | 'publishing' | 'drafting' | 'cancelling'

type UseManagedClassesInput = {
  client: ClassKitClient | null
  canManageClasses: boolean
}

export function useManagedClasses({ client, canManageClasses }: UseManagedClassesInput) {
  const [rangeScope, setRangeScope] = useState<RangeScope>('week')
  const [rangeAnchorDate, setRangeAnchorDate] = useState(() => new Date())
  const [customRange, setCustomRangeState] = useState<CustomRangeValue | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [classes, setClasses] = useState<ManagedClass[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [operationError, setOperationError] = useState<string | null>(null)
  const [mutationStatus, setMutationStatus] = useState<MutationStatus>('idle')
  const requestIdRef = useRef(0)

  const localRange = useMemo(() => getLocalRange(rangeScope, rangeAnchorDate, customRange), [rangeScope, rangeAnchorDate, customRange])
  const visibleRange = useMemo(() => toVisibleRange(localRange), [localRange])

  const selectedClass = useMemo(
    () => classes.find((managedClass) => managedClass.id === selectedClassId) ?? null,
    [classes, selectedClassId]
  )

  const refreshVisibleRange = useCallback(async () => {
    if (!client) return
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    setLoadStatus('loading')
    setErrorMessage(null)

    try {
      const result = await client.management.classes.list({
        range: visibleRange,
        fields: ['registeredUsersCount', 'pendingRegistrationCount'],
      })
      if (requestIdRef.current !== requestId) return
      setClasses(result.classes)
      setLoadStatus('loaded')
    } catch (error) {
      if (requestIdRef.current !== requestId) return
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load classes.')
      setLoadStatus('error')
    }
  }, [client, visibleRange])

  useEffect(() => {
    void refreshVisibleRange()
  }, [refreshVisibleRange])

  const setCustomRange = useCallback((startDate: string, endDate: string) => {
    setRangeScope('custom')
    setCustomRangeState({ startDate, endDate })
  }, [])

  const goToPreviousRange = useCallback(() => {
    const next = shiftRange(rangeScope, rangeAnchorDate, customRange, -1)
    setRangeAnchorDate(next.anchorDate)
    setCustomRangeState(next.customRange)
  }, [customRange, rangeAnchorDate, rangeScope])

  const goToNextRange = useCallback(() => {
    const next = shiftRange(rangeScope, rangeAnchorDate, customRange, 1)
    setRangeAnchorDate(next.anchorDate)
    setCustomRangeState(next.customRange)
  }, [customRange, rangeAnchorDate, rangeScope])

  const goToToday = useCallback(() => {
    const today = new Date()
    setRangeAnchorDate(today)
    if (rangeScope === 'custom') {
      setCustomRangeState({ startDate: toDateInput(today), endDate: toDateInput(today) })
    }
  }, [rangeScope])

  return {
    state: {
      rangeScope,
      rangeAnchorDate,
      customRange,
      visibleRange,
      viewMode,
      classes,
      selectedClass,
      selectedClassId,
      loadStatus,
      errorMessage,
      operationError,
      mutationStatus,
      canManageClasses,
    },
    actions: {
      setRangeScope,
      setCustomRange,
      goToPreviousRange,
      goToNextRange,
      goToToday,
      setViewMode,
      selectClass: setSelectedClassId,
      clearSelection: () => setSelectedClassId(null),
      refreshVisibleRange,
      setOperationError,
      setMutationStatus,
    },
  }
}
```

If `ClassKitClient` is not exported under that exact name during implementation, derive the client type from `ReturnType<typeof useProductContext>['client']` locally and keep the hook API unchanged.

### Task 3: Add Range Toolbar

**Files:**
- Create: `src/features/manager/classes/class-range-toolbar.tsx`

- [ ] Add a mobile-first toolbar that receives state/actions from the hook.

```tsx
import { ChevronLeft, ChevronRight, List, CalendarDays } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../../components/ui/button'
import { cn } from '../../../lib/utils'
import type { CustomRangeValue, RangeScope, ViewMode, VisibleRange } from './class-range'

type ClassRangeToolbarProps = {
  rangeScope: RangeScope
  customRange: CustomRangeValue | null
  visibleRange: VisibleRange
  viewMode: ViewMode
  onScopeChange: (scope: RangeScope) => void
  onCustomRangeChange: (startDate: string, endDate: string) => void
  onPrevious: () => void
  onNext: () => void
  onToday: () => void
  onViewModeChange: (viewMode: ViewMode) => void
}

const scopes: RangeScope[] = ['today', 'week', 'month', 'custom']

export function ClassRangeToolbar(props: ClassRangeToolbarProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-3 rounded-[1.4rem] border border-[var(--color-border)] bg-[var(--color-card)] p-3">
      <div className="grid grid-cols-4 gap-1">
        {scopes.map((scope) => (
          <Button
            key={scope}
            type="button"
            variant="ghost"
            className={cn('h-10 px-2 font-serif text-xs', props.rangeScope === scope && 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]')}
            onClick={() => props.onScopeChange(scope)}
          >
            {t(`manager.range.${scope}`)}
          </Button>
        ))}
      </div>
      {props.rangeScope === 'custom' && (
        <div className="grid grid-cols-2 gap-2">
          <input
            className="min-h-11 rounded-[1.4rem] border border-[var(--color-border)] bg-transparent px-3 text-sm"
            type="date"
            value={props.customRange?.startDate ?? ''}
            onChange={(event) => props.onCustomRangeChange(event.target.value, props.customRange?.endDate ?? event.target.value)}
          />
          <input
            className="min-h-11 rounded-[1.4rem] border border-[var(--color-border)] bg-transparent px-3 text-sm"
            type="date"
            value={props.customRange?.endDate ?? ''}
            onChange={(event) => props.onCustomRangeChange(props.customRange?.startDate ?? event.target.value, event.target.value)}
          />
        </div>
      )}
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="icon" onClick={props.onPrevious} aria-label={t('manager.range.previous')}>
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Button>
        <Button type="button" variant="outline" className="min-w-0 flex-1 font-serif text-sm" onClick={props.onToday}>
          {t('manager.range.todayButton')}
        </Button>
        <Button type="button" variant="outline" size="icon" onClick={props.onNext} aria-label={t('manager.range.next')}>
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
      <div className="hidden justify-end gap-2 md:flex">
        <Button type="button" variant="ghost" onClick={() => props.onViewModeChange('list')}>
          <List className="size-4" aria-hidden="true" />
          {t('manager.view.list')}
        </Button>
        <Button type="button" variant="ghost" onClick={() => props.onViewModeChange('calendar')}>
          <CalendarDays className="size-4" aria-hidden="true" />
          {t('manager.view.calendar')}
        </Button>
      </div>
    </div>
  )
}
```

The date range label can be added in this component using localized `Intl.DateTimeFormat`; keep it below the arrow row if it causes mobile overflow.

### Task 4: Wire Classes Tab To Hook And Toolbar

**Files:**
- Modify: `src/features/manager/classes/class-management-tab.tsx`

- [ ] Use `useProductContext()` to get `client`.
- [ ] Render toolbar, loading, error, empty, and no-access states.

```tsx
import { useProductContext } from '@class-kit/react'
import { ClassRangeToolbar } from './class-range-toolbar'
import { useManagedClasses } from './use-managed-classes'

export function ClassManagementTab({ canManageClasses }: ClassManagementTabProps) {
  const { client } = useProductContext()
  const { state, actions } = useManagedClasses({ client, canManageClasses })

  return (
    <section className="flex flex-col gap-4">
      <ClassRangeToolbar
        rangeScope={state.rangeScope}
        customRange={state.customRange}
        visibleRange={state.visibleRange}
        viewMode={state.viewMode}
        onScopeChange={actions.setRangeScope}
        onCustomRangeChange={actions.setCustomRange}
        onPrevious={actions.goToPreviousRange}
        onNext={actions.goToNextRange}
        onToday={actions.goToToday}
        onViewModeChange={actions.setViewMode}
      />
      {state.loadStatus === 'loading' && <ClassSurfaceMessage tone="loading" titleKey="manager.classes.loadingTitle" bodyKey="manager.classes.loadingBody" />}
      {state.loadStatus === 'error' && <ClassSurfaceMessage tone="error" title={state.errorMessage ?? undefined} bodyKey="manager.classes.errorBody" />}
      {state.loadStatus === 'loaded' && state.classes.length === 0 && <ClassSurfaceMessage tone="empty" titleKey="manager.classes.emptyTitle" bodyKey="manager.classes.emptyBody" />}
      {!canManageClasses && <ClassSurfaceMessage tone="access" titleKey="manager.classes.noAccessTitle" bodyKey="manager.classes.noAccessBody" />}
    </section>
  )
}
```

Create `ClassSurfaceMessage` locally in this file for now. Shared extraction is not needed until another surface reuses it.

## Verification

- Run: `rtk rg -n "management\\.classes\\.list|management\\.templates|management\\.schedules|supabase|functions\\.invoke|rpc\\(" src/features/manager`
  - Expected: one `management.classes.list` call in `use-managed-classes.ts`; no template/schedule/raw Supabase calls.
- Run: `rtk rg -n "RangeScope|useManagedClasses|ClassRangeToolbar|fields: \\['registeredUsersCount', 'pendingRegistrationCount'\\]" src/features/manager/classes`
  - Expected: all names exist and are wired from tab to hook.
- Browser smoke:
  - Open `/manager`.
  - Expected: Classes tab shows range controls and a loading/empty/error state without layout shift.
  - Expected: mobile width has no calendar toggle.
  - Expected: Previous/next changes the visible range label based on active scope.

## Acceptance Criteria Covered

- Explicit date scope model exists.
- SDK list call uses explicit ISO range.
- ClassKit SDK remains the only data boundary.
- Loading, empty, error, and no-class-capability states exist.
- Stale range responses are guarded.
- Mobile-first toolbar exists without calendar view by default.

## Risks And Rollback

- Risk: native week start may not match product expectation. This plan uses Sunday because browser `getDay()` is simple; if Noya needs Monday week start, change `getLocalRange('week')` before chunk completion and document it in `plan.md`.
- Risk: `fields` may be rejected by the SDK/backend. If that happens, retry without `fields` and record the observed SDK behavior.
- Rollback: remove the new classes hook/range/toolbar files and restore the chunk `01` Classes placeholder.

## Non-Goals

- No real class list cards.
- No desktop calendar grid.
- No create/edit/cancel forms.
- No template or schedule SDK calls.
- No optimistic mutation state.

## Type And Name Consistency

- Export `RangeScope`, `ViewMode`, `VisibleRange`, `CustomRangeValue`.
- Export `useManagedClasses`.
- Keep action names aligned with pseudocode: `setRangeScope`, `setCustomRange`, `goToPreviousRange`, `goToNextRange`, `goToToday`, `setViewMode`, `selectClass`, `clearSelection`, `refreshVisibleRange`.

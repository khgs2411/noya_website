# Chunk 01: Manager Workspace Shell And Tabs

**Plan Set:** `../plan.md`  
**Spec:** `../spec.md`  
**Status:** Ready For Implementation  
**Depends on:** Current `/manager` route and ClassKit product context integration  
**Enables:** `02-class-range-state-and-sdk-loading.md`, `03-mobile-class-list-and-card-actions.md`, `04-desktop-calendar-and-view-mode.md`, `05-class-detail-form-and-cancel-surfaces.md`

## Goal

Replace the current `/manager` placeholder with a branded, mobile-first manager workspace shell containing three connected tabs: Classes, Templates, and Schedules. Only Classes receives an operational child mount point in this chunk; Templates and Schedules remain honest coming-next panels with no SDK loading or fake controls.

## Source Artifacts

- `../spec.md`: Current Context, User-Facing Manager Behavior, UX Structure, Permissions And Access, Component Boundary, Styling Requirements, Internationalization.
- `../agenda.md`: Questions 1 and 3; documented decisions about the three-tab workspace and Tailwind/shadcn usage.
- `../pseudocode/ManagerWorkspaceShape.md`
- `../pseudocode/ManagerClassComponentMap.md`
- `src/App.tsx`
- `src/features/manager/manager-page.tsx`
- `src/i18n.ts`
- `src/components/ui/button.tsx`
- `src/lib/utils.ts`
- `src/components/site/design-guide.ts`
- `DESIGN_GUIDE.md`

## Relationships

- **Depends on:** Existing `/manager` route in `src/App.tsx`, existing route-level `can_enter` gate, existing `useProductContext()` usage.
- **Enables:** Class range/loading state can be mounted inside the Classes tab in chunk `02`.
- **Shared contracts:** `ManagerPage` receives `loading?: boolean`; `ManagerWorkspace` passes `canManageClasses` to `ClassManagementTab`; tabs are `"classes" | "templates" | "schedules"`.
- **Integration points:** `src/features/manager/manager-page.tsx`, `src/features/manager/manager-tabs.tsx`, `src/features/manager/classes/class-management-tab.tsx`, `src/i18n.ts`.

## File Responsibility Map

**Create:**
- `src/features/manager/manager-tabs.tsx` - tab state UI and coming-next panel copy boundaries.
- `src/features/manager/classes/class-management-tab.tsx` - temporary Classes tab shell and class-capability state. Operational class loading starts in chunk `02`.

**Modify:**
- `src/features/manager/manager-page.tsx` - branded workspace layout, loading shell, manager header, tab composition, and `canManageClasses` pass-through.
- `src/i18n.ts` - manager tab labels, coming-next copy, class capability copy in English, Hebrew, and Russian.

**Test:**
- No automated test file exists for this repo. Verification is focused inspection and browser smoke on the existing dev server.

## Implementation Tasks

### Task 1: Add Manager Tab Copy

**Files:**
- Modify: `src/i18n.ts`

- [ ] Add these keys under `translation.manager` for `en`, `he`, and `ru`.

```ts
manager: {
  // keep existing keys
  tabs: {
    classes: 'Classes',
    templates: 'Templates',
    schedules: 'Schedules',
  },
  classes: {
    title: 'Classes',
    body: 'Create and manage one-off studio classes.',
    noAccessTitle: 'Class management is not enabled',
    noAccessBody: 'Your manager account can enter the workspace, but class controls are not available.',
  },
  templates: {
    title: 'Templates',
    body: 'Reusable class setups will live here once template management is added.',
  },
  schedules: {
    title: 'Schedules',
    body: 'Recurring planning tools will live here once schedule management is added.',
  },
}
```

Hebrew and Russian copy should preserve the same meaning and stay concise. Do not mention raw permissions or capability names in user-facing text.

### Task 2: Create Manager Tabs Component

**Files:**
- Create: `src/features/manager/manager-tabs.tsx`

- [ ] Add a local tab type and a mobile-first tab strip.

```tsx
import { CalendarDays, Layers3, Repeat } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/ui/button'
import { cn } from '../../lib/utils'

export type ManagerTab = 'classes' | 'templates' | 'schedules'

const tabs: Array<{ id: ManagerTab; icon: typeof CalendarDays; labelKey: string }> = [
  { id: 'classes', icon: CalendarDays, labelKey: 'manager.tabs.classes' },
  { id: 'templates', icon: Layers3, labelKey: 'manager.tabs.templates' },
  { id: 'schedules', icon: Repeat, labelKey: 'manager.tabs.schedules' },
]

type ManagerTabsProps = {
  activeTab: ManagerTab
  onChange: (tab: ManagerTab) => void
}

export function ManagerTabs({ activeTab, onChange }: ManagerTabsProps) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-3 gap-2 rounded-[1.4rem] border border-[var(--color-border)] bg-[var(--color-card)] p-1">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const active = tab.id === activeTab

        return (
          <Button
            key={tab.id}
            type="button"
            variant="ghost"
            className={cn(
              'h-11 min-w-0 gap-2 rounded-xl px-2 font-serif text-sm',
              active && 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
            )}
            aria-pressed={active}
            onClick={() => onChange(tab.id)}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{t(tab.labelKey)}</span>
          </Button>
        )
      })}
    </div>
  )
}
```

If the current import aliases differ from this relative path after implementation, use the repo's existing import convention and keep the exported names unchanged.

### Task 3: Create Classes Tab Placeholder

**Files:**
- Create: `src/features/manager/classes/class-management-tab.tsx`

- [ ] Add a capability-aware placeholder that exposes no real class controls yet.

```tsx
import { CalendarPlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type ClassManagementTabProps = {
  canManageClasses: boolean
}

export function ClassManagementTab({ canManageClasses }: ClassManagementTabProps) {
  const { t } = useTranslation()

  return (
    <section className="rounded-[1.4rem] border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)]">
          <CalendarPlus className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="font-serif text-xs uppercase tracking-[0.25em] text-[var(--color-muted-foreground)]">
            {t('manager.tabs.classes')}
          </p>
          <h2 className="mt-2 font-serif text-3xl text-[var(--color-foreground)]">{t('manager.classes.title')}</h2>
          <p className="mt-3 max-w-prose text-sm leading-6 text-[var(--color-muted-foreground)]">
            {canManageClasses ? t('manager.classes.body') : t('manager.classes.noAccessBody')}
          </p>
        </div>
      </div>
    </section>
  )
}
```

Chunk `02` replaces this placeholder body with real range state and loading surfaces.

### Task 4: Replace Manager Page Placeholder With Workspace Shell

**Files:**
- Modify: `src/features/manager/manager-page.tsx`

- [ ] Preserve existing branded styling, loading handling, and back navigation.
- [ ] Add `useProductContext()` inside the page or accept `canManageClasses` from the existing call site. Prefer the smallest change that keeps `App.tsx` route ownership intact.
- [ ] Add active tab state and render the correct tab panel.

```tsx
import { useState } from 'react'
import { useProductContext } from '@class-kit/react'
import { ClassManagementTab } from './classes/class-management-tab'
import { ManagerTabs, type ManagerTab } from './manager-tabs'

function ComingNextPanel({ kind }: { kind: 'templates' | 'schedules' }) {
  const { t } = useTranslation()

  return (
    <section className="rounded-[1.4rem] border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
      <p className="font-serif text-xs uppercase tracking-[0.25em] text-[var(--color-muted-foreground)]">
        {t(`manager.tabs.${kind}`)}
      </p>
      <h2 className="mt-2 font-serif text-3xl text-[var(--color-foreground)]">{t(`manager.${kind}.title`)}</h2>
      <p className="mt-3 max-w-prose text-sm leading-6 text-[var(--color-muted-foreground)]">
        {t(`manager.${kind}.body`)}
      </p>
    </section>
  )
}

export function ManagerPage({ loading = false }: ManagerPageProps) {
  const [activeTab, setActiveTab] = useState<ManagerTab>('classes')
  const { capabilities } = useProductContext()
  const canManageClasses = Boolean(capabilities?.dashboard.can_manage_classes)

  // keep existing loading branch and existing layout wrapper

  return (
    <main className="min-h-screen bg-[var(--color-background)] px-4 py-6 text-[var(--color-foreground)] sm:px-6 lg:px-10">
      {/* keep existing back button/header treatment */}
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        {/* keep branded heading block */}
        <ManagerTabs activeTab={activeTab} onChange={setActiveTab} />
        {activeTab === 'classes' && <ClassManagementTab canManageClasses={canManageClasses} />}
        {activeTab === 'templates' && <ComingNextPanel kind="templates" />}
        {activeTab === 'schedules' && <ComingNextPanel kind="schedules" />}
      </section>
    </main>
  )
}
```

The implementer should merge this with the existing `manager-page.tsx` structure rather than replacing good existing brand/image details.

## Verification

- Run: `rtk rg -n "management\\.templates|management\\.schedules|supabase|functions\\.invoke|rpc\\(" src/features/manager`
  - Expected: no matches introduced by this chunk.
- Run: `rtk rg -n "manager\\.tabs|manager\\.classes|manager\\.templates|manager\\.schedules" src/i18n.ts src/features/manager`
  - Expected: keys exist in `src/i18n.ts` and are consumed by manager components.
- Browser smoke on existing dev server:
  - Open `http://localhost:5173/manager` as a manager.
  - Expected: branded manager shell renders with Classes, Templates, Schedules tabs.
  - Expected: Templates and Schedules show coming-next copy and no operational controls.
  - Expected: mobile width keeps tabs usable without text overflow.

## Acceptance Criteria Covered

- Manager workspace has three connected tabs.
- Classes is the only operational area in this first shell.
- Templates and Schedules do not load SDK data or expose fake controls.
- Manager copy is localized in English, Hebrew, and Russian.
- The page remains branded and mobile-first.

## Risks And Rollback

- Risk: duplicating route access logic inside `ManagerPage`. Keep `/manager` access redirect in `App.tsx`; this chunk only reads `can_manage_classes`.
- Risk: tab labels overflow on mobile. Use truncated labels and icon support.
- Rollback: remove `manager-tabs.tsx` and `classes/class-management-tab.tsx`, restore the previous `manager-page.tsx` placeholder, and remove new `manager` i18n keys.

## Non-Goals

- No class list SDK loading.
- No create/edit/cancel form.
- No calendar.
- No template or schedule data loading.
- No public classes page work.

## Type And Name Consistency

- Export `ManagerTabs`, `ManagerTab`, and `ClassManagementTab`.
- Use tab ids exactly as `'classes' | 'templates' | 'schedules'`.
- Use translation keys under `manager.tabs`, `manager.classes`, `manager.templates`, and `manager.schedules`.

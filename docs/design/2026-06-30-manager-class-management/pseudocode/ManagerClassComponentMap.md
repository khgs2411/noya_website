# ManagerClassComponentMap

Pseudocode artifact. Non-executable reference shape for planning.

## Intended Destination

Likely future source layout:

```text
src/features/manager/
  manager-page.tsx
  manager-tabs.tsx
  classes/
    class-management-tab.tsx
    use-managed-classes.ts
    class-range.ts
    class-range-toolbar.tsx
    class-list-view.tsx
    class-calendar-view.tsx
    class-card.tsx
    class-detail-panel.tsx
    class-form-dialog.tsx
    class-cancel-dialog.tsx
```

This is a shape map, not an implementation plan. Files may merge if a boundary
is too thin, but the ownership rules should remain visible.

## Component Responsibilities

### `manager-page.tsx`

Owns:

- manager page shell;
- branded loading shell;
- pass `canManageClasses` to workspace/classes;
- no class SDK calls.

### `manager-tabs.tsx`

Owns:

- tab UI;
- active tab state handoff;
- responsive mobile/desktop tab styling.

Does not own:

- class loading;
- template/schedule data loading.

### `classes/class-management-tab.tsx`

Owns:

- composing class-management hook and class views;
- choosing mobile list-only versus desktop list/calendar toggle;
- rendering empty/loading/error states;
- creating surface open/close state if not owned by hook.

Depends on:

- `useManagedClasses`;
- range toolbar;
- list/calendar views;
- detail/form/cancel surfaces.

### `classes/use-managed-classes.ts`

Owns:

- SDK calls;
- range state;
- classes state;
- selected class;
- mutation/refetch reconciliation;
- operation errors.

Does not own:

- JSX layout;
- i18n strings beyond machine status names;
- raw Supabase/Edge Functions.

### `classes/class-range.ts`

Owns:

- pure date/range calculations;
- local date to SDK ISO range conversion;
- previous/next/today/custom movement rules.

Review point:

- keep this small and replaceable if a date library becomes necessary.

### `classes/class-range-toolbar.tsx`

Owns:

- range scope controls;
- previous/today/next actions;
- custom range entry;
- desktop view mode toggle.

Does not own:

- SDK loading;
- class grouping.

### `classes/class-list-view.tsx`

Owns:

- date-grouped class presentation;
- empty date/range presentation;
- passing class selection and quick action events.

### `classes/class-calendar-view.tsx`

Owns:

- desktop week/month calendar layout;
- class item selection;
- no drag/drop mutations.

Does not render by default on mobile.

### `classes/class-card.tsx`

Owns:

- compact class summary;
- status/lifecycle pills;
- publish/draft quick action buttons when allowed;
- detail/edit selection affordance.

Does not own:

- cancel action;
- direct SDK calls.

### `classes/class-detail-panel.tsx`

Owns:

- selected class detail display;
- edit trigger;
- cancel trigger;
- operation messages relevant to selected class.

### `classes/class-form-dialog.tsx`

Owns:

- create/edit form fields;
- local validation;
- form-to-hook submit handoff;
- mobile full-screen/drawer and desktop side-panel/dialog adaptation.

Does not own:

- template selector in first slice;
- SDK direct calls.

### `classes/class-cancel-dialog.tsx`

Owns:

- cancellation confirmation;
- reason and expose-reason fields;
- submit handoff to hook;
- explanation that cancellation is not deletion.

## Shared UI Candidates

Only promote to `src/components/ui` or `src/components/site` if reused:

- segmented control/tab primitive;
- drawer/dialog primitive;
- branded empty state;
- status pill.

Do not create shared abstractions before at least two concrete uses or a clear
shadcn primitive need exists.

## Data Direction

```text
ManagerPage
  -> ManagerTabs
  -> ClassManagementTab
  -> useManagedClasses
  -> ClassKit SDK

ClassManagementTab
  -> ClassRangeToolbar
  -> ClassListView / ClassCalendarView
  -> ClassDetailPanel
  -> ClassFormDialog
  -> ClassCancelDialog
```

Events flow upward to `useManagedClasses` actions. Data flows downward as props.

## Review Points

- Confirm whether `class-card.tsx` should be a separate file immediately or
  stay inside `class-list-view.tsx` until calendar also needs it.
- Confirm whether dialog/drawer behavior should be a local responsive component
  or a reusable shadcn-style primitive.

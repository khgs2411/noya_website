# ClassRangeAndCalendarFlow

Pseudocode artifact. Non-executable reference shape for planning.

## Intended Destination

- `src/features/manager/classes/class-range-toolbar.tsx`
- `src/features/manager/classes/class-list-view.tsx`
- `src/features/manager/classes/class-calendar-view.tsx`
- Range utilities may live in `src/features/manager/classes/class-range.ts`.

## Flow Summary

The manager chooses a date scope. The UI converts that local date scope into an
explicit SDK range. The class-management state owner lists managed classes for
that range. The UI presents those classes as a mobile list or desktop
list/calendar.

## Scope Vocabulary

```text
RangeScope = "today" | "week" | "month" | "custom"

ViewMode = "list" | "calendar"

VisibleRange = {
  start: ISOString
  end: ISOString
}
```

## Date Scope Rules

```text
today:
  visible local range = start/end of selected local day
  previous/next = shift anchor by 1 day

week:
  visible local range = start/end of selected local week
  previous/next = shift anchor by 1 week

month:
  visible local range = start/end of selected local month
  previous/next = shift anchor by 1 month

custom:
  visible local range = selected start/end dates
  previous/next = shift both dates by selected range length

today button:
  set anchor to current local date
  preserve active scope unless UX chooses to switch to today scope explicitly
```

Review note: preserving active scope for the Today button means Week jumps to
the current week and Month jumps to the current month. If implementation labels
the control "Today", make the behavior visually clear.

## Range-To-SDK Flow

```text
on range state changes:
  compute local visible start and end
  convert local boundaries to ISO strings
  call client.management.classes.list({
    range: { start: visibleStartIso, end: visibleEndIso },
    fields: ["registeredUsersCount", "pendingRegistrationCount"] when useful
  })
```

The exact `fields` request should stay conservative. If the SDK/backend rejects
count fields for a manager unexpectedly, implementation should fall back to the
default management-safe summaries rather than blocking the whole UI.

## Mobile Presentation

Mobile always uses list view.

```text
if viewport is mobile:
  hide calendar toggle
  force displayed view to list
  show classes grouped by local date
  show compact range toolbar
  show create action as sticky/floating control
```

List grouping:

```text
classes
  sort by starts_at ascending
  group by local date derived from starts_at
  render date section
    render class cards
```

Class card summary:

- local time range;
- name;
- status pill;
- lifecycle/temporal hints;
- capacity and returned registration counts;
- location;
- publish/draft quick action when allowed and meaningful;
- detail/edit affordance.

## Desktop Presentation

Desktop can use list or calendar.

```text
if viewMode == "list":
  render grouped list

if viewMode == "calendar":
  render week or month grid based on active range scope
  class items are selectable
  selecting an item opens detail/edit surface
  no drag/drop mutation in first slice
```

Calendar rules:

- Today scope may render a day agenda/list rather than a full grid.
- Week scope renders a week grid.
- Month scope renders a month grid.
- Custom range may default to list or use a bounded multi-day grid only if it
  remains readable; list fallback is allowed.

## Inputs

- range state and actions from class-management state owner;
- loaded managed classes;
- viewport/breakpoint behavior;
- translation labels.

## Outputs

- toolbar events:
  - scope change;
  - previous/next;
  - today;
  - custom range selection;
  - desktop view mode switch.
- selection events:
  - select class;
  - open create form with optional date/time defaults.

## Failure Posture

- If date range calculation fails or custom range is invalid, do not call SDK;
  show validation in the toolbar.
- If class list loading fails, preserve toolbar and show load error in class
  surface.
- If a class has malformed date values, isolate display failure to that item
  where practical and keep the range UI usable.

## Review Points

- Confirm whether "Today" button preserves current scope or always switches to
  Today scope. The current artifact assumes preserve scope while jumping anchor
  to current date.
- Confirm whether Custom range desktop calendar should ever render as a grid or
  always display list view.

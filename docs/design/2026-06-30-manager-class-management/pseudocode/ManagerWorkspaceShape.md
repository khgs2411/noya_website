# ManagerWorkspaceShape

Pseudocode artifact. Non-executable reference shape for planning.

## Intended Destination

- Extend `src/features/manager/manager-page.tsx`.
- Add `src/features/manager/manager-tabs.tsx` if the tab shell should be split.
- Classes implementation lives under `src/features/manager/classes/`.

## Draft Shape

ManagerPage owns:

- manager page shell;
- branded page heading and optional image/header treatment;
- tab selection state;
- pass-through of class-management capability state;
- loading and denied-access presentation inside the protected route;
- three visible tabs: Classes, Templates, Schedules.

ManagerPage does not own:

- ClassKit class SDK calls;
- class list/date range state;
- class form state;
- template/schedule SDK loading in first slice;
- raw permission lists.

## Conceptual Component Grammar

```text
ManagerPage
  reads product context:
    loading
    capabilities.dashboard.can_enter
    capabilities.dashboard.can_manage_classes

  if loading:
    render branded manager loading shell

  if route-level access has already passed:
    render ManagerWorkspace

ManagerWorkspace
  activeTab: "classes" | "templates" | "schedules"

  render manager header
  render ManagerTabs(activeTab, setActiveTab)

  if activeTab == "classes":
    render ClassManagementTab(canManageClasses)

  if activeTab == "templates":
    render ComingNextPanel(kind="templates")

  if activeTab == "schedules":
    render ComingNextPanel(kind="schedules")
```

## Tab Rules

- The three tabs are visible to managers inside `/manager`.
- Classes is the only operational tab in the first slice.
- Templates and Schedules do not call `management.templates.*` or
  `management.schedules.*` in this slice.
- Templates/Schedules copy should set expectation without pretending there is a
  partial workflow.
- Tab UI should be mobile-first:
  - compact segmented control on mobile;
  - broader toolbar/tab strip on desktop.

## Capability Rules

- `/manager` route access remains owned by `App.tsx` via `can_enter`.
- Class controls inside Classes tab are gated by `can_manage_classes`.
- If `can_manage_classes` is false but `can_enter` is true, Classes tab can
  render read/empty/access state but must not show create/edit/lifecycle actions.
- Backend errors remain authoritative; UI gates are affordance-only.

## Inputs

- `loading`
- `capabilities.dashboard.can_enter`
- `capabilities.dashboard.can_manage_classes`
- translation function

## Outputs

- active tab UI;
- class management child surface;
- coming-next placeholder tabs.

## Failure Posture

- If product context is loading, avoid redirect flicker and render loading shell.
- If manager route access is lost, current route-level behavior should redirect
  home.
- If class capability is absent, do not show raw permissions; show plain manager
  access copy.

## Review Points

- Confirm whether coming-next tabs should use the same branded image shell as
  the manager landing card or a more compact panel.
- Confirm whether class capability absence should show a read-only class list or
  a no-access class-management message. Current design permits hiding controls;
  actual list authorization is backend-owned.

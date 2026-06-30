# Manager Class Management Design

Status: Final design. Approved for implementation planning after user review.

## Goal

Design the first real manager workspace slice for Noya's ClassKit-backed
platform: managing concrete, one-off classes through the ClassKit client SDK.
This slice should replace the current manager placeholder with an operational,
mobile-first management surface while preserving the existing Noya visual
system.

The first implementation is class management only. Templates and schedules are
supported as future-compatible concepts, but they are not implemented as full
management workflows in this slice.

## Current Context

- `/manager` already exists as a protected route and is gated by
  `capabilities.dashboard.can_enter`.
- The current manager page is a branded shell with no operational controls.
- `package.json` pins `@class-kit/react` at `release-v0.1.11`.
- The app uses `ProductProvider`/`useProductContext()` and the SDK facade.
- The app has no router dependency; route state is local and path-based.
- The app uses Tailwind v4, a shadcn-compatible setup, `Button`, `cn`, lucide
  icons, and brand/site primitives.
- The app has new root guidance:
  - `AGENTS.md` for boundaries and implementation conventions.
  - `DESIGN_GUIDE.md` for visual rules and Tailwind/shadcn usage.

## ClassKit SDK Evidence

The implementation must use SDK facade methods only:

- `client.management.classes.list(options?)`
- `client.management.classes.get(classId)`
- `client.management.classes.create(input)`
- `client.management.classes.update(input)`
- `client.management.classes.publish(classId)`
- `client.management.classes.draft(classId)`
- `client.management.classes.cancel(classId, input?)`

The design should not call Supabase, raw Edge Functions, RPCs, or backend action
names directly.

Relevant SDK types from `@class-kit/react`:

- Class list range: `{ range?: { start: string; end: string }, fields?: [...] }`
- Create/update class input:
  - `templateId?: string | null`
  - `name`
  - `description?: string | null`
  - `category?: string | null`
  - `startsAt`
  - `endsAt`
  - `capacity`
  - `location?: string | null`
  - `status?: "draft" | "published"`
  - `visibility?: "public" | "hidden" | "members_only"`
  - `registrationPolicy?: "auto_approve" | "member_auto_approve" | "approval_required"`
  - `membershipRequirement?: "none" | "required"`
  - `publicFieldPolicy?: { registeredUsersCount: boolean, registeredUsersRoster?: boolean }`
  - `notes?: string | null`
  - `customData?: Record<string, unknown>`
- Managed class response includes lifecycle, temporal, registration, count,
  provenance, and read-only fields:
  - `status`, `lifecycle_status`, `temporal_status`
  - `registration_open`
  - `read_only`, `read_only_reason`
  - `template_id`, `schedule_id`, `generated_for_date`, `source_timezone`
  - `registeredUsersCount`, `pendingRegistrationCount`
  - cancellation reason fields

ClassKit model rules:

- A concrete class is the operational entity.
- Templates and schedules create or organize concrete classes.
- A one-off class should be created with `management.classes.create(...)`
  without a schedule.
- `templateId` can seed defaults for a manual class, but the class remains
  standalone.
- Publish, draft, and cancel are explicit lifecycle commands, not hidden inside
  update.
- Backend authorization is authoritative. Frontend capability checks are only UI
  gates.

## User-Facing Manager Behavior

The manager workspace should have three connected tabs:

1. Classes
2. Templates
3. Schedules

For the first implementation, only Classes is operational. Templates and
Schedules should be present enough to establish the workspace model and explain
that they are upcoming management areas, but they should not load SDK data or
expose fake or partial controls.

The Classes tab should support:

- listing managed classes for an explicit visible date range;
- switching date scope between Today, Week, Month, and Custom range;
- moving the active date scope with previous/next arrows;
- returning to Today quickly;
- mobile default list view;
- desktop list and calendar view;
- creating a one-off class;
- editing editable class fields;
- publishing a draft class;
- moving a published class back to draft;
- cancelling a class with optional reason and optional user-visible reason;
- inspecting class details, including status, capacity, location, registration
  counts when returned, and ClassKit read-only state.

The workspace is manager-facing only. It should not look or read like the public
classes page.

## UX Structure

### Mobile

Mobile should default to list view only.

Recommended mobile layout:

- compact branded manager header;
- segmented tabs for Classes, Templates, Schedules;
- date scope controls:
  - Today / Week / Month / Custom as a compact segmented control or select-like
    control;
  - previous, today, next controls in a single row;
  - current range label below or between arrows;
- date-grouped list:
  - section heading per date;
  - class rows/cards with time, class name, status pill, capacity/count summary,
    location, and publish/draft quick actions where safe;
- floating or sticky create action near the bottom, respecting safe area;
- detail/edit/create in a full-screen modal or drawer, not a cramped inline
  panel.

Calendar grid should not be shown on mobile by default because it will be hard
to use and visually cramped.

### Desktop

Desktop can expose a stronger workspace:

- top workspace header and tabs;
- range controls and create button in a toolbar;
- view toggle for List / Calendar;
- calendar month/week grid when selected;
- calendar items can be selected to open detail/edit, but drag/drop
  rescheduling is deferred until after the first management flow is stable;
- list view grouped by date for operational scanning;
- optional side panel for selected class detail while preserving list context;
- create/edit form in a side panel or dialog that preserves workspace context.

### Empty, Loading, And Error States

- Loading should preserve the page shell and show a calm skeleton/spinner.
- Empty range should explain that no classes exist in this date range and offer
  class creation.
- Permission loss or backend `forbidden` should remove operational controls and
  show an access state.
- Mutation errors should display the SDK-thrown message in the active dialog or
  operation surface.

## Date Scope Model

The UI should own date range selection state. ClassKit owns class data.

Scopes:

- Today: range covers the selected local day.
- Week: range covers the selected local week.
- Month: range covers the selected local month.
- Custom: range covers explicit user-selected start/end dates.

Navigation:

- Previous/next arrows shift by the active scope:
  - Today shifts one day.
  - Week shifts one week.
  - Month shifts one month.
  - Custom shifts by the selected range length.
- "Today" resets anchor/range to the current local date.

SDK calls should pass explicit ISO date strings for the visible range. The
implementation must be careful about timezone conversion because ClassKit class
times are ISO instants while manager controls are local calendar concepts.

## Data Refresh And Local State

ClassKit is the source of truth for managed class data.

After every successful create, edit, publish, draft, or cancel mutation, the
workspace should refetch the active visible range. The refreshed result should
drive the list, calendar, and selected class detail:

- if the selected class is still inside the active range, update its detail from
  the refreshed result;
- if the selected class moved outside the active range, clear the selection or
  show a clear "moved outside this range" state;
- if a mutation fails, keep the previous list/detail state and show the SDK error
  message in the active operation surface.

The first implementation should not rely on optimistic local updates for
manager-visible class state.

## Class Form Model

The first create/edit form should focus on fields needed for a real one-off
class:

- name;
- startsAt and endsAt;
- capacity;
- location;
- description;
- category;
- status: draft or published;
- visibility;
- registration policy;
- membership requirement;
- internal notes.

Template behavior should be designed ahead of time:

- `templateId` may be available later as an optional source of defaults.
- The form should be structured so a future "Start from template" selector can
  fill defaults without changing the concrete-class submission model.
- The first implementation should not require templates to create a class and
  should not load templates or show a template selector.

Cancellation should be a distinct confirm flow:

- reason optional;
- toggle for exposing reason to users;
- explain that cancellation is not deletion.
- cancellation should live in class detail rather than as a card-level quick
  action.

Deletion should not be represented as hard delete because ClassKit exposes
cancel, not delete, for concrete classes.

## Permissions And Access

Route entry remains gated by `capabilities.dashboard.can_enter`.

Class-management controls should be gated more specifically by:

- `capabilities.dashboard.can_manage_classes`, and/or
- the SDK/backend response when a caller lacks a specific class permission.

The UI should hide or disable create/edit/lifecycle controls when the user lacks
class management capability. Backend errors still win.

The workspace must not expose raw permission lists to end users.

## Component Boundary

Recommended feature structure for later planning:

```text
src/features/manager/
  manager-page.tsx
  manager-tabs.tsx
  classes/
    class-management-tab.tsx
    class-range-toolbar.tsx
    class-list-view.tsx
    class-calendar-view.tsx
    class-detail-panel.tsx
    class-form-dialog.tsx
    class-cancel-dialog.tsx
    class-management-copy.ts
```

Shared primitives should move to `src/components/ui` or `src/components/site`
only when reused beyond this feature.

## Styling Requirements

- Use Tailwind utilities and existing shadcn-compatible primitives.
- Use `Button` and lucide icons for common controls.
- Use `cn` for conditional classes.
- Preserve the Noya design system:
  - Montserrat body;
  - Cormorant headings/menu-like labels;
  - Story Script brand accents only where appropriate;
  - blush borders and theme tokens;
  - warm card/background surfaces;
  - mobile-first spacing and safe-area handling.
- The manager workspace can be denser than the landing page, but it should not
  turn into a generic gray dashboard.

## Internationalization

All visible copy must be localized in English, Hebrew, and Russian.

Directional icons and date/range labels must remain RTL-safe.

## Testing Strategy

Design-level verification targets for the later implementation:

- focused code inspection that no raw Supabase or Edge Function calls were added;
- manager route still redirects unauthorized users home;
- manager without class capability cannot see operational class controls;
- manager with class capability can load the Classes tab;
- mobile defaults to list view and does not show a cramped calendar;
- desktop can switch between list and calendar views;
- date scope navigation passes the intended explicit range to
  `management.classes.list`;
- create/edit/publish/draft/cancel call the documented SDK methods;
- SDK mutation errors appear in the UI;
- no raw permission lists are displayed.

Do not default to running `npm run build` after every UI edit. For this larger
slice, a final build or lint check may be appropriate once the implementation
is complete.

## Planning Boundary Guidance

Recommended later plan chunks:

1. Manager workspace layout and tab shell
   - Depends on current manager route.
   - Enables all later manager surfaces.
   - Verification focus: access gate, mobile layout, tabs, copy.
2. Class range state and managed class loading
   - Depends on tab shell.
   - Enables list/calendar views.
   - Verification focus: SDK boundary, explicit ranges, loading/error/empty.
3. Mobile-first list view
   - Depends on class loading.
   - Enables real operational scanning.
   - Verification focus: date grouping, text wrapping, status display.
4. Desktop calendar view and view toggle
   - Depends on class loading.
   - Enables stronger desktop workflow.
   - Verification focus: today/week/month layout and no mobile overflow.
5. Class create/edit form
   - Depends on class loading and shell.
   - Enables one-off class creation.
   - Verification focus: SDK create/update calls and error display.
6. Lifecycle actions
   - Depends on class detail/form surfaces.
   - Enables publish, draft, cancel.
   - Verification focus: explicit SDK commands and confirmation states.
7. Placeholder template/schedule tabs
   - Can be implemented with shell, but should not fake operations.
   - Verification focus: connected workspace model without partial controls.

## Assumptions

- `capabilities.dashboard.can_manage_classes` is the intended frontend affordance
  gate for class management controls.
- Backend class permissions remain authoritative for every mutation.
- Date calculations can initially be implemented with native browser date APIs
  unless a date utility becomes clearly necessary.
- No hard delete is available or desirable for managed classes.
- Templates and schedules remain future work, but the class form can be shaped
  to accept template defaults later.

## Design Disposition

The design agenda is complete. No `CONTEXT.md` glossary update is needed because
the resolved terms are either existing ClassKit SDK concepts or ordinary UI
language. No ADR is needed because the decisions are reversible UI, state, and
scope choices rather than hard-to-reverse architectural commitments.

# ClassFormAndLifecycleSurfaces

Pseudocode artifact. Non-executable reference shape for planning.

## Intended Destination

- `src/features/manager/classes/class-form-dialog.tsx`
- `src/features/manager/classes/class-detail-panel.tsx`
- `src/features/manager/classes/class-cancel-dialog.tsx`
- Card quick actions in `class-list-view.tsx` and calendar item actions where
  appropriate.

## Surface Summary

Class create/edit is a responsive form surface:

- mobile: full-screen modal or drawer;
- desktop: side panel or dialog preserving workspace context.

Lifecycle actions are split:

- publish/draft may be quick actions on class cards when safe;
- cancel lives only in detail with confirmation.

## Form State Shape

```text
ClassFormMode = "create" | "edit"

ClassFormFields
  name: string
  description: string
  category: string
  startsLocal: local date/time input
  endsLocal: local date/time input
  capacity: number
  location: string
  status: "draft" | "published"
  visibility: "public" | "hidden" | "members_only"
  registrationPolicy:
    | "auto_approve"
    | "member_auto_approve"
    | "approval_required"
  membershipRequirement: "none" | "required"
  notes: string
```

Template fields:

- no template selector in first slice;
- form shape should allow a future `templateId` and defaults injection point;
- do not call `management.templates.list()` in first slice.

## Form-To-SDK Mapping

```text
create mode:
  CreateManagedClassInput
    templateId omitted or null
    name
    description null if empty
    category null if empty
    startsAt from local input converted to ISO
    endsAt from local input converted to ISO
    capacity
    location null if empty
    status
    visibility
    registrationPolicy
    membershipRequirement
    notes null if empty

edit mode:
  UpdateManagedClassInput
    classId
    same editable fields as above
```

Do not map schedule provenance fields:

```text
schedule_id
generated_for_date
source_timezone
```

Those are schedule-generation owned.

## Validation Shape

UI validation owns:

- required name;
- valid start and end date/time;
- end after start;
- capacity positive integer;
- basic required selects for visibility/policy/membership.

Backend owns:

- authorization;
- final input validation;
- read-only class restrictions;
- lifecycle validity;
- registration/capacity side effects.

## Detail Surface Shape

Detail surface displays:

- name;
- date/time;
- status and lifecycle/temporal state;
- visibility and registration policy;
- capacity and returned registration counts;
- location;
- description/category;
- internal notes for manager only;
- read-only state and reason when returned;
- provenance hints only when useful and not confusing:
  - standalone class;
  - future template-backed/manual class;
  - future schedule-generated class.

Detail surface owns:

- edit button when editable;
- cancel button and cancellation dialog trigger;
- display of operation errors relevant to detail actions.

Detail surface does not own:

- registrations management;
- attendance management;
- template or schedule editing.

## Publish/Draft Quick Actions

Card quick actions may show:

```text
if class.status == "draft" and class is not read_only:
  show Publish

if class.status == "published" and class is not read_only:
  show Draft
```

Quick action behavior:

- disable while mutation pending;
- call state hook `publishClass(classId)` or `draftClass(classId)`;
- after success, state hook refetches active range;
- if action fails, show compact operation error near card or in shared class
  surface.

## Cancel Confirmation

Cancel surface fields:

```text
reason?: string
exposeReasonToUsers: boolean
```

Cancel sequence:

```text
open from detail only
explain cancellation is not deletion
manager confirms
call cancelClass(classId, { reason, exposeReasonToUsers })
after success, refetch active range and reconcile selected detail
```

No hard delete control appears.

## Loading And Error States

- Form submit disables active submit button.
- Publish/draft quick action disables that action while pending.
- Cancel confirm disables while cancelling.
- SDK error appears in the active surface:
  - form error for create/update;
  - card or shared class error for publish/draft;
  - cancel dialog/detail error for cancel.

## Review Points

- Confirm default create status: draft may be safer, published may be faster.
  The design allows a form field; planning should choose an explicit default.
- Confirm whether internal notes should be in the first create form or only in
  detail/edit advanced section.

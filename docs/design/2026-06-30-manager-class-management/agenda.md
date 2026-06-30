# Manager Class Management Design Agenda

## Status

- Spec: `spec.md`
- State: Complete
- Completion gate:
  - Live agenda questions resolved: Yes
  - Pressure test complete: Yes
  - Spec finalized: Yes

## Documented Decisions

- Product websites must use `@class-kit/react`; no raw Supabase, RPC, or Edge
  Function calls belong in this website.
- The next roadmap slice is manager class management, not public class
  discovery.
- The route is manager-facing and already gated by ClassKit capabilities.
- The workspace should have three connected tabs: Classes, Templates, Schedules.
- In the first implementation, Classes is operational while Templates and
  Schedules are branded "coming next" tabs with no partial data loading or fake
  controls.
- The first operational implementation is concrete one-off class creation and
  management; templates and schedules are future operational slices.
- Mobile defaults to list view. Desktop may offer a stronger calendar workflow.
- Concrete classes are the operational entity. Templates and schedules are
  creation tools, not registerable classes.
- Publish, draft, and cancel are explicit lifecycle commands.
- Tailwind and shadcn-compatible primitives are the expected UI implementation
  style for this repo.

## Questions

### Question 1: First-Slice Tab Behavior

- Status: Answered
- Branch type: Initial
- Why it matters: The three-tab workspace can either establish only navigation
  structure or start pulling template/schedule data immediately. This affects
  scope, loading behavior, and whether the first slice risks becoming broader
  than class management.
- Scenario probe: A manager opens `/manager` on mobile expecting to create a
  one-off class. Should Templates and Schedules be visibly present but inactive,
  or should they already load/list existing template and schedule records even
  though those workflows are not editable yet?
- Options:
  - A. Classes operational, Templates/Schedules as branded "coming next" tabs —
    tightest scope, clear workspace model, no partial data behavior.
  - B. Classes operational, Templates/Schedules read-only lists if SDK data
    exists — more connected, but introduces extra loading/error states and may
    imply unsupported actions.
  - C. Only Classes tab for now, add tabs later — simplest first UI, but
    conflicts with the user's requested three connected tabs and weakens the
    workspace model.
- Recommendation: A. It respects the requested three-tab model without creating
  partial template/schedule workflows before their roadmap slices.
- Answer: A. Classes should be operational. Templates and Schedules should be
  present as branded "coming next" tabs without read-only SDK data loading or
  partial controls.
- Answer impact: Confirms branch.
- Spec impact: Confirms the existing first-slice scope and clarifies that
  Templates/Schedules do not load SDK data in this slice.
- Context impact: Not needed yet; no term is being renamed.
- ADR impact: Not needed; this is reversible UI scope.
- Follow-ups: None.

### Question 2: Custom Date Range Navigation

- Status: Answered
- Branch type: Initial
- Why it matters: Previous/next arrows are scope-bound for Today, Week, and
  Month, but custom ranges need a predictable rule or they become surprising.
- Scenario probe: A manager chooses July 10 through July 20 and taps next. Should
  the app move to July 21 through July 31, shift both dates by one day, or
  disable arrows while in custom range?
- Options:
  - A. Shift by the selected range length — powerful and consistent with
    date-window browsing, but slightly more complex to explain.
  - B. Disable previous/next in Custom — simplest and least surprising, but
    weaker for managers comparing custom windows.
  - C. Shift by one day — easy mechanically, but not really scope-bound and can
    feel tedious.
- Recommendation: A. It preserves the "arrows move based on timeframe" rule by
  treating the custom range duration as the timeframe.
- Answer: A. Previous/next in Custom shifts by the selected range length.
- Answer impact: Confirms branch.
- Spec impact: Date scope model now treats custom range duration as the
  timeframe for arrow navigation.
- Context impact: Not needed.
- ADR impact: Not needed; reversible UX behavior.
- Follow-ups: None.

### Question 3: Create/Edit Form Surface

- Status: Answered
- Branch type: Initial
- Why it matters: Mobile-first class creation can be a full-screen flow, drawer,
  or dialog. The choice affects usability, validation space, and how easily the
  manager returns to the selected date range.
- Scenario probe: A manager creates a class on an iPhone while checking the
  weekly list. Should the form cover the page, slide over it, or appear inline
  below the selected date?
- Options:
  - A. Mobile full-screen modal/drawer; desktop side panel/dialog — best space
    for forms on mobile while preserving context on desktop.
  - B. Same centered dialog everywhere — fewer components, but cramped and
    fragile on mobile.
  - C. Inline expandable form in the list — avoids modal state, but increases
    list clutter and makes editing long fields awkward.
- Recommendation: A. It matches mobile-first constraints and gives desktop a
  stronger manager workflow.
- Answer: A. Use a full-screen modal/drawer on mobile and a side panel or
  dialog on desktop.
- Answer impact: Confirms branch.
- Spec impact: The form surface is now a responsive modal/drawer pattern:
  mobile prioritizes form space, desktop preserves workspace context.
- Context impact: Not needed.
- ADR impact: Not needed; UI composition can evolve.
- Follow-ups: None.

### Question 4: Template-Aware Class Creation In First Slice

- Status: Answered
- Branch type: Initial
- Why it matters: The SDK supports optional `templateId` when creating a
  concrete class. We need to decide whether the first class form should already
  include a template selector or only be structured to add one later.
- Scenario probe: Existing templates are present in ClassKit when this site
  ships the first manager class screen. Should a manager be able to choose "Start
  from template" immediately, or is that deferred until template management is
  implemented?
- Options:
  - A. No template selector yet; keep the form manually complete and future-ready
    for template defaults — tight first slice, no partial template dependency.
  - B. Include an optional "Start from template" selector backed by
    `management.templates.list()` — useful if templates already exist, but
    expands scope and loading/error behavior.
  - C. Require templates for creation — conflicts with ClassKit's one-off class
    model and the user's stated first implementation.
- Recommendation: A for first implementation. Add B when template management or
  template read/use is explicitly in scope.
- Answer: A. Do not include a template selector in the first implementation.
  Keep the class form manually complete and structured so template defaults can
  be added later.
- Answer impact: Resolves branch.
- Spec impact: First implementation remains one-off/manual class creation only;
  template-backed class creation is a future enhancement and should not add
  template SDK loading in this slice.
- Context impact: Not needed now; "template-backed manual class" remains a
  ClassKit SDK concept, not a Noya-specific term yet.
- ADR impact: Not needed; reversible feature scope.
- Follow-ups: None.

### Question 5: Calendar View Depth In First Slice

- Status: Answered
- Branch type: Initial
- Why it matters: Calendar UI can range from a simple visual index to drag/drop
  editing. Scope control matters because this slice already includes CRUD and
  lifecycle operations.
- Scenario probe: On desktop month view, a manager sees a class on July 12. Is
  clicking it enough to open detail/edit, or should the manager be able to drag
  it to July 13 to reschedule?
- Options:
  - A. Calendar is read/interact-to-select only; rescheduling happens in edit
    form — useful, safer, lower implementation risk.
  - B. Calendar supports drag/drop rescheduling — powerful but substantially
    more complex, especially with timezones, read-only states, and accidental
    edits.
  - C. Calendar is purely decorative summary, no selection — lower risk but less
    useful than the requested calendar behavior.
- Recommendation: A. It makes calendar useful without adding high-risk editing
  mechanics to the first class-management slice.
- Answer: Start with A. Calendar is read/interact-to-select only in the first
  implementation, and drag/drop rescheduling can be introduced afterward.
- Answer impact: Resolves branch and records a deferred enhancement.
- Spec impact: First slice keeps calendar mutations explicit through the edit
  form. Drag/drop rescheduling is out of first-slice scope but remains a future
  enhancement candidate.
- Context impact: Not needed.
- ADR impact: Not needed unless drag/drop is chosen despite risk.
- Follow-ups: None.

### Question 6: Class Detail And Lifecycle Action Placement

- Status: Answered
- Branch type: Initial
- Why it matters: Publish/draft/cancel actions are operationally important and
  can be destructive or user-visible. Their placement determines accidental
  action risk.
- Scenario probe: A manager taps a class card. Should quick actions appear
  directly on the card, or only inside a detail panel with confirmation for
  cancellation?
- Options:
  - A. Cards show status and maybe edit/detail only; lifecycle commands live in
    detail panel, with cancel confirmation — safest and cleanest.
  - B. Cards expose publish/draft quick actions, cancel only in detail — faster
    for draft review but busier on mobile.
  - C. Cards expose all actions — fastest but highest accidental-action and
    visual-clutter risk.
- Recommendation: A initially. Add quick publish/draft later only if manager
  workflow proves it needs speed.
- Answer: B. Cards may expose publish/draft quick actions. Cancel remains in
  the detail surface with confirmation.
- Answer impact: Changes model from the recommendation and resolves branch.
- Spec impact: Class cards can include safe lifecycle quick actions for
  publish/draft when available. Cancellation remains protected in detail with a
  confirmation flow because it is destructive and can be user-visible.
- Context impact: Not needed.
- ADR impact: Not needed.
- Follow-ups: None.

### Question 7: Mutation Refresh Strategy

- Status: Answered
- Branch type: Pressure-test
- Why it matters: Create, edit, publish, draft, and cancel all change the class
  list and sometimes the selected class detail. Without a defined refresh
  strategy, the UI can show stale status, stale registration counts, or a class
  in the wrong date bucket after time edits.
- Scenario probe: A manager edits a class from July 12 to July 13 while viewing
  July 12-18. Should the app optimistically move it, refetch the current visible
  range, or wait until the user manually refreshes?
- Options:
  - A. Refetch the active visible range after every successful mutation, then
    update/clear selected detail from the fresh result — simplest reliable
    source-of-truth behavior, slightly more network usage.
  - B. Optimistically update local list/detail state, then refetch in the
    background — snappier but more implementation complexity and more ways to
    mis-handle date-bucket moves.
  - C. Only update local detail and require manual refresh/range navigation for
    list changes — lowest effort but weak manager trust.
- Recommendation: A. The manager workspace should prioritize correctness and
  predictable ClassKit-backed state over optimistic complexity in the first
  implementation.
- Answer: A. Refetch the active visible range after every successful mutation,
  then update or clear selected detail from the fresh result.
- Answer impact: Resolves pressure-test branch.
- Spec impact: The workspace treats ClassKit/refetched range data as the source
  of truth after mutations. Optimistic local mutation is deferred.
- Context impact: Not needed.
- ADR impact: Not needed; reversible state strategy.
- Follow-ups: None.

## Pressure-Test Result

- Status: Complete
- Checked categories: lifecycle and interruption, state persistence, handoff
  boundaries, verification evidence, scope control, recovery paths, sequencing,
  and user review points.
- Result: One material pressure-test branch was added and resolved as Question
  7. No further material branches remain.
- Remaining non-blocking risks:
  - Native date handling may become awkward around timezone edge cases; the
    implementation may introduce a date utility if native APIs become brittle.
  - Drag/drop calendar rescheduling is intentionally deferred and should not be
    included in the first implementation plan.

## Artifact Disposition

- Spec: Final design.
- Agenda: Complete.
- `CONTEXT.md`: Skipped. No Noya-specific glossary term was settled; class,
  template, schedule, and template-backed manual class remain ClassKit SDK
  concepts already documented in ClassKit docs.
- ADR: Skipped. Decisions are reversible UI, scope, and local state choices
  rather than durable architectural commitments.

# Chunk 02: Localized Merge Review And Confirmation Surface

**Plan Set:** `../plan.md`
**Approved Source:** `../spec.md`
**Status:** Ready for Review
**Depends on:** Chunk 01
**Enables:** Chunk 03

## Goal

Build the accessible multi-step merge dialog that selects a linked survivor,
previews every returned consequence, collects valid explicit resolutions, and
supports safe typed recovery and non-dismissible idempotent retry, without yet
exposing it from the customer detail panel.

## Source Artifacts And Constraints

- `../spec.md`: complete visible behavior, confirmation, failure, privacy, and
  responsive contract.
- `../agenda.md`: no preselection, exact retry identity, and read/write denial
  decisions.
- Chunk 01 exports from
  `src/features/manager/customers/merge/`.
- `src/features/manager/customers/customer-picker.tsx`: shared paginated
  survivor selection surface with caller-owned availability.
- `src/features/customers/customer-labels.ts`: safe identity labels/contacts.
- `src/i18n.ts`: English, Hebrew, and Russian registry.
- `DESIGN_GUIDE.md`: focus, overlay, mobile, dark, and RTL constraints.
- Render no raw customer/user/grant/class/registration/participant/merge IDs,
  preview tokens, idempotency keys, or raw unknown backend strings.

## Relationships

- Consumes the hook, presentation helpers, and picker seam from Chunk 01.
- Exports one `CustomerMergeDialog` contract for Chunk 03.
- Emits completion/redirect/read-denied/mutation-denied callbacks; it does not
  update the parent directory or selected customer.
- Owns all new locale keys, so Chunk 03 only references stable dialog/action
  keys.

## File Responsibility Map

**Create:**

- `src/features/manager/customers/merge/customer-merge-dialog.tsx` —
  responsive dialog, survivor picker, preview/review sections, resolution
  controls, confirmation, expiry, error recovery, and focus/dismissal rules.

**Modify:**

- `src/i18n.ts` — complete English, Hebrew, and Russian copy for merge entry,
  selection, comparisons, replacements, summaries, confirmation, typed
  failures, recovery, success, accessibility, and disabled reasons.

**Test:**

- No automated component target exists. Verify compile/lint/source structure;
  Chunk 03 owns integrated browser evidence.

## Behavioral And Contract Changes

- `CustomerMergeDialog` receives:
  - open state and eligible source;
  - current ClassKit client and customer-read authority;
  - mutation-denied state;
  - callbacks for close, customer-read forbidden, customer-mutation forbidden,
    merge completion, and already-merged redirect.
- The dialog creates an independent `useCustomerDirectory` for the survivor
  picker. All same-product records on the page remain visible; the availability
  callback disables source, unlinked, and inconsistent candidates with
  localized reasons.
- Before preview, the dialog repeats source and survivor safe labels, available
  contact, linkage, lifecycle, and origin so the manager confirms the intended
  pair without seeing internal IDs.
- Selection defaults to all lifecycle statuses and preserves opaque page/filter
  behavior. It offers no search and makes no automatic choice.
- Preview review contains semantically headed, wrapping-safe sections for:
  identities; all scalar comparisons; carried metadata count and every
  conflict; membership result and returned grant summaries; registration and
  participant movements/collisions/samples/truncation; movement counts; and
  absolute/remaining expiry.
- IDs inside grants/samples remain omitted. Visible sample content is limited
  to localized rule/outcome/stock quantities that help explain consequences.
- Scalar controls show only allowed source/survivor/replacement options.
  Replacement uses field-appropriate input and intentional blank-to-null.
  Metadata replacement is JSON text with parse errors, including valid `null`.
  No selection is initialized on the manager's behalf.
- Carried metadata is summarized but neither editable nor resolution-required.
- Confirmation repeats the resolved final field choices and all material
  membership/collision/movement consequences before the irreversible action.
- Backdrop/Escape/close work outside active/unknown completion. During
  `merging` and `completion_unknown`, user-driven backdrop, Escape, close
  controls, source/pair changes, and ordinary teardown are disabled. Unknown
  completion exposes only **Retry same request**.
- Authoritative customer-read denial or live capability loss overrides that
  dismissal suppression: clear and close protected merge UI even during
  `merging`/`completion_unknown`, knowingly abandoning the in-memory retry
  identity. Subsequent authoritative reads and merged-source redirect behavior
  are the only recovery.
- Focus enters the dialog, stays trapped, returns to the invoking action after
  ordinary close/success, and never escapes behind the overlay.
- Expiry countdown is advisory, updates without rebuilding the preview, and
  disables confirmation at/after local expiry. Server typed stale remains
  authoritative.
- Typed errors receive action-specific localized recovery. Unknown/open enum
  values receive localized generic labels; never interpolate raw values into
  visible copy.
- Generic preview `bad_request`, `not_found`, and `conflict` show classified
  localized guidance and return to pair selection. Unknown/transport preview
  failure keeps the selected pair, remains dismissible, and offers **Retry
  preview**. Neither uses completion-unknown copy or dismissal rules.

## Implementation Tasks

- [ ] Create `customer-merge-dialog.tsx` with a full-screen mobile sheet and
      bounded desktop dialog. Reuse the existing focus/scroll-lock conventions,
      semantic headings, live status regions, logical spacing, and
      wrapping-safe content.
- [ ] Compose an independent survivor directory/picker. Supply the Chunk 01
      availability callback, wire read-forbidden to the parent, and clear
      selection/preview on filter, page, pair, or source changes.
- [ ] Before invoking preview, render the complete safe source/survivor summary:
      labels, available contact, linkage, lifecycle, and origin, with no IDs.
- [ ] Render every preview consequence without raw IDs: scalar and metadata
      comparisons, membership resolution/grants, collision samples and
      truncation, movement counts, and expiry.
- [ ] Build controlled explicit resolution inputs from the current preview.
      Surface email/tel/text replacement validation and JSON parsing errors;
      permit explicit null and prevent any disallowed or incomplete resolution
      from reaching confirmation.
- [ ] Build the irreversible confirmation summary and action. Wire the hook's
      frozen request, typed recovery, countdown, same-request retry, and
      completion/redirect callbacks without duplicating state-machine logic.
- [ ] Render the phase-aware preview failures: generic validation/conflict/
      missing-pair guidance returns to selection, while unknown/transport
      failure retains the pair with dismissible preview retry.
- [ ] Implement dismissal and focus rules for each state, with no in-app close
      path during active or unknown completion except mandatory authoritative
      customer-read/capability teardown.
- [ ] Add all merge locale keys in English, Hebrew, and Russian. Use nested
      closed-key maps for membership/registration outcomes and generic copy for
      SDK open strings. Review Hebrew grammar, RTL ordering, and dense Russian
      wrapping.
- [ ] Inspect rendered strings and JSX for raw IDs/tokens/keys, unescaped
      metadata, hidden default selections, or claims that Noya reconciles
      service history.

## Verification

- `rg -n 'mergeCustomer|customerMerge|merge:' src/i18n.ts`
  — inventories all three locale merge trees; additionally compare the
  consumed merge keys against English, Hebrew, and Russian and require the same
  key set in each.
- `rg -n 'previewToken|idempotencyKey|customerId|userId|mergeId|grantId|classId|registrationId|participantId' src/features/manager/customers/merge/customer-merge-dialog.tsx`
  — inspect each match; identifiers may be used as React/internal keys or
  request state only and must not appear as visible text/labels.
- `rg -n 'allowedSelections|metadata\\.conflicts|membershipResolution|registrations|participants|movementCounts|expiresAt' src/features/manager/customers/merge/customer-merge-dialog.tsx`
  — every preview consequence has a presentation owner.
- `rg -n 'Escape|aria-modal|role=\"dialog\"|overflow|focus|completion_unknown' src/features/manager/customers/merge/customer-merge-dialog.tsx`
  — focus, scroll, modal semantics, and dismissal suppression are present.
- `npm run lint`
  — no lint errors.
- `git diff --check`
  — no whitespace errors.

## Acceptance Criteria Covered

- Explicit survivor selection and no matching.
- Full preview consequence presentation and expiry.
- Explicit allowed scalar/metadata resolutions, replacement, and null handling.
- Irreversible confirmation and safe active/unknown completion behavior.
- Typed actionable recovery and exact same-request retry.
- Generic/unknown preview reset or retry with phase-correct dismissal.
- English, Hebrew, Russian, mobile, desktop, and RTL implementation surface.
- Privacy-safe dense presentation.

## Risks, Rollback, And Isolation

- `src/i18n.ts` is large and conflict-prone. Keep edits within the three
  matching Customers locale trees and preserve adjacent keys.
- Metadata may contain deeply nested JSON. Use bounded pretty text with
  wrapping/scroll constraints; do not recursively invent form fields.
- Collision samples contain mostly internal identity. Show only useful
  non-identifying rules/outcomes/counts and disclose truncation.
- The dialog remains unexposed after this chunk, so it can be reviewed or
  reverted without allowing real merges.

## Non-Goals

- Customer detail action, parent source retirement, survivor fetching,
  directory refresh, backend/SDK work, automatic matching, client
  reconciliation, or starting a development server.

## Consistency Check

- Confirm dialog props exactly match Chunk 03 callbacks.
- Confirm every hook state has one visible/dismissal behavior.
- Confirm every typed error detail has localized, safe recovery.
- Confirm generic and unknown/transport preview errors have distinct localized
  pair-reset/retry behavior and cannot enter completion unknown.
- Confirm locale key paths are identical across English, Hebrew, and Russian.
- Confirm the picker availability callback matches Chunk 01 exactly.
- Confirm no displayed value is an internal ID, token, or untranslated raw
  backend string.

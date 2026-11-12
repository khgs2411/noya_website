# Confirm template change on a recurring lesson

ClassKit now rebuilds a schedule when its template changes (2026-11-12). Every
lesson the schedule generated, past and upcoming, is deleted, booked clients
get their credits back, and fresh lessons are generated from the new
template. The manager must see this before saving.

## Behavior

- In `src/features/manager/schedules/schedule-form-dialog.tsx`, when an
  existing schedule is saved with a `template_id` different from its stored
  one, show a confirmation step before the update request goes out. Creating
  a new schedule is unaffected.
- The confirmation states that every lesson of this recurring lesson, past
  and upcoming, will be deleted and recreated from the new template, and that
  booked clients get their credits back. Cancel returns to the form with the
  edits kept. Confirm sends the update.
- Reuse the confirmation pattern already used by the delete action
  (`src/features/manager/manager-delete-action.tsx`) or the other dialogs.
  Don't add a library. Add Hebrew and English strings in `src/i18n.ts`.
- Pull the "is this a template change" decision into a pure helper and
  test it.

## Done when

- A node test covers the helper: the same template, a changed template, and
  the create case.
- `npm run build` and `node --test tests/*.test.mjs` pass.

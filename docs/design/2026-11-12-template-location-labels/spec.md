# Template labels with location

Client request from 2026-11-12: several templates share a name and differ only
by location, so pickers show identical rows, for example two "ג׳אז לירי"
entries in the create-schedule dialog. ClassKit already returns
`default_location` and `default_location_snapshot` on every template, so
this is a noya-only change.

## Behavior

- One pure helper, for example `getTemplateLabel(template)` in `src/lib/`,
  returns `"<name> - <location>"`. Location is
  `default_location_snapshot?.label`, falling back to `default_location`, both
  trimmed. With neither, it returns the bare name. Use a plain hyphen with
  spaces, so it reads correctly in both RTL and LTR.
- Use it everywhere a template is chosen or listed by name next to similar
  rows:
  - the template picker in `src/features/manager/schedules/schedule-form-dialog.tsx`
    (around line 312);
  - the template picker in `src/features/manager/classes/class-form-dialog.tsx`
    (around line 388);
  - the template names in `src/features/manager/memberships/membership-management-tab.tsx`
    (around lines 157 and 207).
- Leave places that show one template on its own, such as the template card,
  detail panel and deactivate dialog, unchanged. Each of those already shows
  the template's location.

## Done when

- Node tests cover the helper: name with a snapshot label, with free text
  only, with neither, and with whitespace-only values.
- `npm run build` and `node --test tests/*.test.mjs` pass.

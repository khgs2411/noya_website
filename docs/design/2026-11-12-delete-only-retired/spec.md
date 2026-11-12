# Offer delete only on retired records

Client request from 2026-11-12: the delete actions shipped in v1.1.24 appear
on every lesson, schedule and customer the manager has permission to delete.
Show them only on records that are already retired, so deleting is always a
deliberate second step after archiving.

## Rule

A record is deletable in the UI when the manager holds its `<kind>.delete`
permission (unchanged) and it's retired:

| Record | Retired when | Existing source |
| --- | --- | --- |
| Lesson | cancelled | `isCancelledClass` in `src/lib/lifecycle-visibility.ts` |
| Schedule (recurring lesson) | `status === "archived"` | same file's archived predicate |
| Customer | `status === "inactive"` | customer status |

- Put the rule in one pure exported helper in `src/lib/lifecycle-visibility.ts`,
  for example `isDeletableRecord(kind, record)`, next to the predicates it
  reuses.
- `ManagerDeleteAction` renders nothing when the rule fails, so callers pass
  the record or the result. Its three call sites are the detail panels for
  classes, schedules and customers.
- No hint text is needed. The archive, cancel and deactivate actions sit next
  to it in each panel.
- The ClassKit API keeps allowing delete on any record. This rule is noya's
  product choice, enforced in the UI only.

## Done when

- Node tests cover the helper: an active lesson is not deletable, a cancelled
  one is; an active or paused schedule is not, an archived one is; an active
  customer is not, an inactive one is.
- `npm run build` and `node --test tests/*.test.mjs` pass.

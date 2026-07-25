# Manager Customers Workspace Design Agenda

## Status

- Spec: `docs/design/2026-07-24-manager-customers/spec.md`
- State: Ready for Review
- Approval: Not Approved

## Documented Decisions

- The assignment is the approved product direction: customer records are
  service recipients keyed by `customerId`; nullable `userId` is only login and
  access linkage.
- Customers replaces the primary mixed Users directory. Role creation, role
  editing, and permission configuration remain solely in the prerequisite
  Permissions workspace.
- Customers is positively authorized only by the required live
  customer-directory read signal; cached access may preserve the shell but
  cannot expose, mount, or load the workspace.
- The directory uses the v0.1.23 customer facade with All/Active/Inactive
  server filters and an in-memory opaque cursor page stack. It does not offer a
  misleading page-local search field.
- Selection and read-only membership context are keyed by `customerId`.
  `userId` is used only after the selected customer proves it is linked.
- Customer identity, membership context, and linked-access context load and
  fail independently.
- Customer lifecycle presentation is in scope; only lifecycle mutations are
  excluded.
- Ghost customers never trigger user or role calls and never receive login or
  role affordances.
- Linked-user assignment/revocation remains under
  `management.users.roles`; Customers never owns role-definition or permission
  configuration.
- Permissions presents `customers.read` and `memberships.read` as two separate
  one-permission groups, so future custom roles can grant and revoke each
  authority independently. Customers still trusts only the corresponding
  refreshed live dashboard capability for runtime visibility.
- A reusable customer presentation helper supplies safe labels and supporting
  contact values without exposing raw IDs. It contains no client, state,
  capability, or mutation logic.
- Customer lifecycle mutations, membership mutations, registration/attendance
  mutations, matching, backend changes, and SDK changes are excluded.
- Existing membership, registration, and attendance workspaces are not migrated
  in this slice; the customer helper is the seam for those later migrations.
- All visible behavior is localized in English, Russian, and Hebrew and remains
  mobile-first, theme-safe, and RTL-safe.

## Resolved Execution Prerequisites

- Permissions is merged into `version/1.1.5` at `77727b9` and exclusively owns
  role definition and permission configuration.
- The grouped Permissions UI requires one curated group per independently
  assignable customer read key; implementation adds localized
  customer-directory and membership-context groups to its shared presentation
  catalog.
- ClassKit v0.1.23 at `a158bc5` supplies live
  `dashboard.can_read_customers` and `dashboard.can_read_memberships` with
  predicates matching the protected read endpoints.
- Live explicit `users.read` and `product_user_roles.manage` grants remain in
  `capabilities.permissions`; Noya does not infer them.
- `management.users.roles.listAssignable()` is authorized by
  `product_user_roles.manage` without `users.read`, role-definition authority,
  or a level threshold.
- Implementation updates the existing dependency and lockfile from v0.1.22 to
  v0.1.23. This planning branch does not update the pin.

## Questions

No material product questions remain. Repository evidence determines the design,
and the prerequisite conditions above are execution gates rather than choices
this feature may redefine.

## Pressure-Test Result

- Status: Complete
- Categories checked: customer versus login identity; active/inactive and
  linked/unlinked combinations; opaque pagination; selection and refresh;
  independent capability loss; membership context; linked-role mutations;
  prerequisite sequencing; partial failures; privacy; localization;
  responsive/RTL overlay behavior; verification feasibility.
- New questions added: None.
- Blocking findings: None.
- Remaining non-blocking risks:
  - The repository has no automated interaction-test harness.
  - Full browser evidence depends on an already-running approved server and
    suitable linked/ghost, active/inactive, paginated, and capability fixtures.

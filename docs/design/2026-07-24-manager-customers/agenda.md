# Manager Customers Workspace Design Agenda

## Status

- Spec: `docs/design/2026-07-24-manager-customers/spec.md`
- State: Working Draft
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
- The directory uses the v0.1.21 customer facade with All/Active/Inactive
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
- A reusable customer presentation helper supplies safe labels and supporting
  contact values without exposing raw IDs. It contains no client, state,
  capability, or mutation logic.
- Customer lifecycle mutations, membership mutations, registration/attendance
  mutations, matching, backend changes, and SDK changes are excluded.
- Existing membership, registration, and attendance workspaces are not migrated
  in this slice; the customer helper is the seam for those later migrations.
- All visible behavior is localized in English, Russian, and Hebrew and remains
  mobile-first, theme-safe, and RTL-safe.

## Execution Prerequisites

- The current base does not contain the assignment-required Permissions
  workspace. Customer implementation cannot remove the mixed Users composition
  until Permissions owns all role creation/editing and permission
  configuration behavior.
- The accepted backend requires level 75 for customer list/get and read-only
  membership context, `users.read` for linked-user get,
  `product_user_roles.manage` for assignment/revocation, and level 75 or
  `product_role_permissions.manage` for the complete role catalog.
- Current `dashboard.can_manage_users` represents only
  `product_user_roles.manage`. It is neither a valid customer-read signal nor a
  membership-read, user-read, or complete role-catalog signal.
- Before implementation planning resumes, ClassKit must document and test
  independent live customer-read, membership-read, linked-user-read,
  role-mutation, and assignment-catalog signals/facades, and identify the
  consuming SDK version and lockfile commit. The assignment-authorized catalog
  must not grant role-definition mutation authority.
- These are blocking upstream prerequisites. The website must not broaden
  capability requirements, infer level, probe raw endpoints, call a raw
  backend, or degrade the accepted customer/role behavior.

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
- Blocking findings:
  - Permissions is not integrated on the current base.
  - v0.1.21 and current product context do not expose live signals matching the
    accepted backend's customer-read and membership-read policies.
  - The SDK has no role catalog independently authorized for assignment
    managers.
- Remaining non-blocking risks after those blockers are resolved:
  - The repository has no automated interaction-test harness.
  - Full browser evidence depends on an already-running approved server and
    suitable linked/ghost, active/inactive, paginated, and capability fixtures.

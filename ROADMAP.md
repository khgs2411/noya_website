# Noya Website Roadmap

This is the canonical sequence for Noya's remaining ClassKit adoption work. It starts by establishing the current ClassKit SDK baseline, then completes the unfinished outcomes from the previous roadmap before following the audited `noya_website` inventory on the Symphony Trello board.

## Status Guide

- `next`: active work; multiple items may be active in parallel.
- `open`: known future work.
- `done`: completed goal slice.
- `retired`: closed because it left active direction.

## Parallelism Guidance

Parallel task branches are safe only when their write sets are disjoint. Reading the same files is harmless, but two tasks must not edit the same application, shared localization, service, or roadmap files.

Safe or conditionally safe lanes:

- [Fix GitHub Pages signup-link paths](https://trello.com/c/O5lRuivu) may run beside one localized UI task when it remains confined to the signup URL helper and focused verification. It does not require `src/i18n.ts`, the manager shell, profile, documents, or customer-service files.
- [Add a persistent staging deployment](https://trello.com/c/aqMhvPGM) may run beside one application feature only after its topology is decided and only while its write set remains confined to deployment workflows and environment/deployment documentation. If staging requires Vite base-path, service-worker, signup-link, or other application-source changes, it returns to the serial queue.
- Planning-only work may run beside implementation only when it writes a task-specific design directory and leaves `ROADMAP.md` and application files unchanged.

The remaining implementation work is serial by default:

- Registration Terms, class-specific membership eligibility, and structured locations converge on the lessons experience and shared localization.
- Change requests, cancellation settings, Permissions, and the Customers workspace converge on the manager shell, manager navigation, and shared localization.
- Membership template binding, customer-service migration, and manager lesson registration converge on membership, attendance, and customer-selection surfaces.
- Customer workspace, lifecycle, service migration, registration, and merge work build on the same customer boundary and should follow their recorded order.
- The ClassKit 0.1.21 upgrade is a serial gate for every current ClassKit-dependent card. Because most visible features also edit `src/i18n.ts`, only one localized UI task should be active at a time under the no-shared-file rule.

## Always-On Guardrails

- Reusable platform behavior, identity, authorization, policy, and data APIs belong to ClassKit; this website consumes them through `@class-kit/react`.
- Noya owns presentation, page composition, localized copy, routing, and product-specific interaction polish.
- Customer service history uses ClassKit `customerId`; nullable `userId` is reserved for login and access-role concerns.
- Keep customer-facing and manager-only SDK surfaces separate.
- Preserve the mobile-first Noya design, English/Hebrew/Russian localization, and RTL-safe behavior.

## Roadmap Step 1: Establish The ClassKit 0.1.21 Baseline

Goal: Adopt the current SDK contract before beginning any further ClassKit-backed product work.

- [ ] `next` [Upgrade Noya Website to ClassKit v0.1.21](https://trello.com/c/d2p0BxTb)
  - Description: Move the website dependency from `v0.1.19` to `v0.1.21`, retaining the 0.1.20 customer, registration, membership, discovery, cancellation-policy, and location capabilities while adopting the corrected customer cancellation boundary.
  - Why: Every later ClassKit adoption item should begin from one current compatibility baseline.
  - Shape: ClassKit 0.1.21 is wire-compatible with the planned integrations, so this release alignment changes the target version without adding a new Noya feature slice.

## Roadmap Step 2: Finish The Carried-Forward ClassKit Commitments

Goal: Complete the customer-agreement and manager-feedback outcomes carried forward from the previous roadmap against the current SDK baseline.

- [ ] `open` [Add registration Terms agreement and acceptance](https://trello.com/c/OwR4eQp5)
  - Description: Require explicit agreement to the current Terms during class registration and record a registration-context ClassKit acceptance before the registration mutation.
  - Shape: Reuse the existing product-document and health-declaration agreement boundary; ClassKit acceptance snapshots remain the legal record.

- [ ] `open` [Add manager change-request workspace](https://trello.com/c/1xDxLSPn)
  - Description: Give authorized managers a localized workspace to create, revise, review, attach evidence to, and soft-delete product change-request threads.
  - Shape: Status remains read-only in Noya, revisions remain append-only, and the surface is gated by `product_change_requests.manage`.

## Roadmap Step 3: Repair Production Signup-Link Routing

Goal: Ensure generated signup links retain the deployed application base before continuing into broader registration-policy work.

- [ ] `open` [Fix GitHub Pages signup-link paths](https://trello.com/c/O5lRuivu)
  - Description: Generate copied signup links from the deployed application base so production URLs retain `/noya_website/` while local links continue to work.
  - Shape: ClassKit continues to own signup-link creation and resolution; Noya owns the public URL around the returned slug.

## Roadmap Step 4: Align Registration And Membership Policy

Goal: Make customer registration and manager configuration consistently follow ClassKit's class-specific membership and cancellation decisions.

- [ ] `open` [Adopt ClassKit class-specific membership eligibility](https://trello.com/c/SrmACCiS)
  - Description: Remove the product-wide active-membership shortcut from registration actions and rely on each lesson's ClassKit-provided registration state and eligibility.
  - Shape: Noya must not infer template matching, stock, or a specific unavailable reason that the SDK did not return.

- [ ] `open` [Bind membership types to class templates](https://trello.com/c/gh6fCDQd)
  - Description: Let managers keep a membership type product-wide or restrict it to one class template while preserving ClassKit's bind, preserve, clear, and rebind semantics.
  - Shape: ClassKit remains authoritative for validation, discovery, approval, registration, and stock behavior.

- [ ] `open` [Add manager cancellation-window settings](https://trello.com/c/kWAPmouO)
  - Description: Let authorized managers read and update the one product-wide registration cancellation window and understand its effect on approved registrations versus pending requests.
  - Shape: Noya reflects ClassKit's independent read/update permissions, validation, no-op result, and serialized last-write-wins policy without calculating eligibility locally.

## Roadmap Step 5: Separate Access Configuration From Customer Operations

Goal: Establish a clean manager information architecture before replacing the current mixed Users surface with a customer-first workspace.

- [ ] `open` [Split role and permission management into a Permissions page](https://trello.com/c/KJo2Smga)
  - Description: Move role creation, role editing, and grouped permission configuration to a dedicated capability-gated page while keeping linked-user role assignment available to the customer workspace.
  - Why: This removes role-definition concerns from the surface that will become the ClassKit customer directory.

## Roadmap Step 6: Adopt The ClassKit Customer Boundary

Goal: Make ClassKit customers—not login users—the coherent manager-facing identity for service delivery, while preserving linked-user access concerns.

- [ ] `open` [Establish the manager Customers workspace](https://trello.com/c/CTBZkeZM)
  - Description: Replace the mixed Users directory with a paginated customer-first workspace that clearly represents linked and ghost customers, active and inactive lifecycle, and the separate access identity.
  - Shape: Customer operations key by `customerId`; role assignment remains available only when a linked `userId` exists.

- [ ] `open` [Manage customer lifecycle in the Customers workspace](https://trello.com/c/ujTSmOb2)
  - Description: Let authorized managers create, edit, deactivate, and reactivate linked or manager-created customers without creating credentials or conflating lifecycle with access.
  - Shape: Customer-maintained identity includes display name, contact email, and phone; metadata remains untouched unless a dedicated complete-object editor exists.

- [ ] `open` [Migrate manager service workflows to customer IDs](https://trello.com/c/wYFEm9Us)
  - Description: Move manager membership and attendance workflows from deprecated linked-user methods to customer-first ClassKit methods so ghost customers can receive the same supported services.
  - Shape: Membership accounting and attendance lifecycle remain ClassKit-owned; access roles continue to use linked user identity.

- [ ] `open` [Manage customer lesson registrations from class details](https://trello.com/c/rID8pu1r)
  - Description: Show approved customers separately from pending and attendance state, then let authorized managers register or deregister a customer from the lesson detail surface.
  - Shape: Manager registration never forces or bypasses ClassKit capacity, template eligibility, stock, or lifecycle rules.

- [ ] `open` [Merge ghost customers into linked customers](https://trello.com/c/FNLtNmYS)
  - Description: Provide the preview, explicit conflict resolution, irreversible confirmation, and recovery states required to merge a manager-created ghost into its linked customer safely.
  - Why: Merge follows the directory, lifecycle, and service-identity work so every affected customer surface already honors the surviving ClassKit identity.

## Roadmap Step 7: Adopt Structured Lesson Locations

Goal: Improve manager location entry and customer navigation without making an external provider a requirement for saving lessons.

- [ ] `open` [Adopt ClassKit structured lesson locations](https://trello.com/c/7c7hq8tg)
  - Description: Add autocomplete-enhanced lesson and template locations, stable snapshots, permanent free-text fallback, navigation actions, and safe provider attribution.
  - Shape: ClassKit owns provider access and normalized persistence; Noya keeps free text usable through provider degradation and renders only safe attribution links.

## Roadmap Step 8: Extend The Customer Profile

Goal: Add the remaining Noya-specific self-service profile field without creating a new persistence boundary.

- [ ] `open` [Collect an optional birth date in customer profile](https://trello.com/c/z3UMLzkQ)
  - Description: Let signed-in customers save, update, and clear a date-only birth date through the existing customer-safe profile metadata surface.
  - Shape: Preserve unrelated metadata, treat null or malformed values as absent, and keep the field optional and separate from onboarding or eligibility.

## Roadmap Step 9: Establish An Isolated Staging Environment

Goal: Provide a stable review and integration environment that cannot overwrite or mutate the production deployment.

- [ ] `open` [Add a persistent staging deployment](https://trello.com/c/aqMhvPGM)
  - Description: Establish a separately addressable staging deployment with explicit hosting, branch, ClassKit product/backend, origin, OAuth, secret, and promotion boundaries.
  - Why: The hosting topology and environment-isolation decisions remain unresolved and must be settled before implementation; production GitHub Pages behavior stays unchanged.

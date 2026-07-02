# Noya Website Roadmap

This roadmap guides the shift from a polished landing page into Noya's ClassKit-backed class management platform.

Use this file to answer "what are we doing next?" after time away from the project. ClassKit product behavior should follow `/Users/liadgoren/Repositories/class-kit/docs/getting-started.md` and the `@class-kit/react` client SDK boundary; this website owns the visual design, page composition, copy, and product-specific interaction polish.

## How To Use This Roadmap

- Read roadmap steps from top to bottom.
- `next` items are active work. Multiple `next` items are allowed when parallel work is intended.
- `open` items are known future work.
- Mark completed goal slices as `done` only when the roadmap goal is complete.
- Move deferred work to the relevant later step instead of using a `deferred` status.
- Mark abandoned work as `retired` and explain why.
- Add, move, or retire work only when a real goal or sequencing gap appears.
- Do not create a second roadmap, TODO, DONE, or task-list file unless the user explicitly asks.
- Keep items scoped to goals and workload, not one session's conversation.
- Do not record implementation evidence, tests, acceptance criteria, verification transcripts, or touched-file inventories.

Status labels:

- `done`: goal slice completed.
- `next`: active work item.
- `open`: known future work.
- `retired`: removed from active direction.

## Always-On Guardrails

- Product websites consume ClassKit through `@class-kit/react`; this app should not own ClassKit database access, RPC calls, Edge Function action names, or authorization policy.
- Product identity is backend-owned in deployed product contexts. Local development may pass a product key only as a development convenience when ClassKit requires it.
- Preserve the existing Noya brand and landing-page feel while turning the booking and management surfaces into real product workflows.
- Public class discovery, customer registration, profile/auth, and manager operations should be distinct product areas rather than one overloaded page.
- The current read-only lessons/schedule content is external client information, not the ClassKit-managed schedule system; keep it until Noya chooses to remove or reposition it.

## Roadmap Step 0: ClassKit App Foundation

Goal: Establish the application boundary that lets the website consume ClassKit without collapsing product SDK concerns into the visual layer.

- ~~[x] `done` Split the landing-page monolith into domain components~~
  - ~~Description: `App.tsx` has been reduced to route and interaction composition, with landing sections, lessons, shared site primitives, content constants, and design guide concerns separated by domain.~~
  - ~~Why: This creates the structural boundary needed before replacing mock class content with live ClassKit data.~~

- ~~[x] `done` Add the ClassKit client/provider shell~~
  - ~~Description: Introduce the website's ClassKit client setup and provider boundary so customer, auth, and manager pages can read product context and call the SDK facade.~~
  - ~~Shape: Use environment-driven Supabase URL, publishable key, auth redirect URL, and an app-specific auth storage key. Do not pass product identity from the website.~~

- ~~[x] `done` Define the platform route model~~
  - ~~Description: The app direction is named product areas for classes, focused class detail, profile/auth, and manager access, while the existing read-only lessons content moves into the homepage instead of remaining the main class destination.~~
  - ~~Shape: Append the existing read-only lessons/schedule content below Photo Moments and before contact. Public classes and manager pages become separate ClassKit-backed product areas.~~

## Roadmap Step 1: Account, Authentication, And Profile

Goal: Give students and managers a coherent identity surface backed by ClassKit product context.

- ~~[x] `done` Add sign-in and sign-up flows~~
  - ~~Description: Add website-owned auth UI that uses ClassKit/Supabase session state and product policy to show the right email/password and OAuth options.~~
  - ~~Shape: Product policy should control whether sign-up is available, whether email/password is shown, and whether Google sign-in is shown.~~
  - ~~Progress: Sign-in supports the configured password and Google providers, while sign-up is implemented but hidden when the product is invite-only.~~

- ~~[x] `done` Add profile and session controls~~
  - ~~Description: Add a profile surface for signed-in users to understand their current product access, registration status, and sign-out option.~~
  - ~~Shape: Unauthorized or inactive product users need a clear state that explains why they cannot register or manage classes.~~
  - ~~Progress: The account/profile surface is branded, mobile-first, student-facing, and avoids exposing raw ClassKit permissions or backend product language.~~

- ~~[x] `done` Gate manager affordance from the profile surface~~
  - ~~Description: Use ClassKit capabilities only to reveal a future manager workspace affordance for users who can manage the product, while keeping student account and booking language focused.~~
  - ~~Shape: Raw permission lists and internal authorization details should not be shown to students or managers on the profile page.~~

## Roadmap Step 2: Manager Workspace

Goal: Give the product owner the protected workspace needed to create and manage the ClassKit class inventory before exposing it to customers.

- ~~[x] `done` Add manager entry and access states~~
  - ~~Description: Add a manager page that is visible and useful only when ClassKit capabilities allow management.~~
  - ~~Shape: Non-manager users should see a clear denied or unavailable state rather than partial manager controls.~~
  - ~~Progress: Manager access now lives in a dedicated manager route and menu entry, gated by ClassKit dashboard capability, while the profile page remains account-focused.~~

- [x] `done` Add class management
  - Description: Let the manager create, edit, publish, draft, cancel, and inspect classes through the ClassKit management facade.
  - Progress: The manager workspace now supports one-off class inventory management with mobile-first list browsing, desktop calendar/list controls, quick publish/draft actions, create/edit/cancel surfaces, and item details presented through a mobile drawer or desktop dialog overlay instead of expanding inline.

- [x] `done` Add template-backed class setup
  - Description: Let the manager define reusable class templates that make repeated class creation consistent enough for public discovery.
  - Progress: The manager workspace now supports ClassKit-backed template listing, creation, editing, deactivation, and template selection during one-off class creation.

- [x] `done` Add initial schedule-backed class generation
  - Description: Let the manager use ClassKit schedules enough to create real upcoming class availability for the public classes page and landing preview.
  - Why: Public discovery should be downstream of manager-created inventory, not a mock frontend surface that later has to be rewired.
  - Shape: Keep this to manager-side inventory creation. Broader schedule operations remain in the later manager schedule system step.
  - Progress: The manager workspace now supports ClassKit-backed schedule listing, creation, editing, preview, and generation from active templates, while skip/unskip and broader lifecycle tools remain in the later schedule-system step.

## Roadmap Step 3: Public Class Discovery

Goal: Replace mock upcoming-class content with live ClassKit classes after manager-created class inventory exists.

- [x] `done` Extract reusable class views
  - Description: Move the manager class day, week, month, list, calendar, and card presentation into reusable domain components that can support both manager and customer class surfaces.
  - Shape: Shared class views should receive normalized display data and action slots. Manager-only `management.*` fields and actions stay in the manager feature, while the future customer page maps `classes.*` responses into the same presentation model.
  - Progress: Class range, toolbar, list, calendar, and card presentation now live under shared class domain components with manager-specific data mapping and actions kept in the manager feature.

- [x] `done` Create the classes page
  - Description: Add a dedicated classes page for browsing available classes, selecting a class, and entering the customer booking flow from a focused class context.
  - Shape: "View all" should navigate to this page. Clicking a class preview should open the same page with that class focused.
  - Progress: The existing lessons route now serves a public ClassKit-backed class browser with range controls, list/calendar views, selected-class focus, and customer registration actions that prompt unauthenticated users to sign in. It uses customer-safe `classes.*` data, targeted class refreshes, and shared class presentation components.

- [x] `done` Link the landing "Upcoming Classes" section to real classes
  - Description: Use ClassKit class list data for the landing-page preview so the cards reflect actual upcoming classes rather than static May mockups.
  - Shape: The section remains a preview; the full browsing and focused class behavior belongs on the classes page.
  - Progress: The homepage preview now fetches the next three customer-visible upcoming classes through `classes.list`, keeps the existing card image treatment, and links each class to the customer classes page filtered to that class date with the class focused.

- [x] `done` Add class detail focus
  - Description: Give each class a durable focused state that can show richer ClassKit data such as description, category, location, capacity, registration policy, roster visibility, and the user's registration state when available.
  - Progress: Customer class cards now open a focused detail surface as a desktop dialog or mobile drawer, fetch focused class data through `classes.get`, and show customer-safe details and registration state without exposing manager fields.

## Roadmap Step 4: Customer Registration

Goal: Turn class browsing into a real customer booking experience through the ClassKit registration facade.

- [x] `done` Add class registration actions
  - Description: Allow eligible signed-in customers to register for a class, see pending or approved registration state, and cancel when ClassKit says cancellation is allowed.
  - Shape: Registration UI should respect active product membership, membership requirements, manager-user restrictions, temporal class state, and ClassKit-provided register/cancel flags.
  - Progress: Signed-out users are routed to authentication before registering. Signed-in users can register or cancel through `classes.*`, see pending versus approved state, and receive localized toast confirmations and mapped cancellation-cutoff errors.

- [x] `done` Add registration-aware class presentation
  - Description: Show capacity, registration state, membership requirements, and roster/count information when the ClassKit response exposes those fields.
  - Progress: Class cards and details now distinguish approved registrations from pending approval requests, show membership and registration policy context, and only display registered counts when the customer-facing response exposes them.

## Roadmap Step 5: Manager Schedule System

Goal: Expand manager-owned schedule operations after the core manager class workflow and public class flow exist.

- [ ] `next` Expand schedule management
  - Description: Give the manager a fuller schedule workspace for maintaining recurring class patterns, generated availability, skipped dates, and schedule lifecycle state.
  - Why: Schedule management is not a customer-facing feature; it is an owner workflow that supports reliable public availability.

- [ ] `open` Add registration and attendance operations
  - Description: Let the manager review pending and approved registrations, approve or reject where relevant, and manage attendance for classes.

- [ ] `open` Add user and role management
  - Description: Let the manager inspect product users and manage product-scoped roles where the user's ClassKit capabilities allow it.

## Roadmap Step 6: Static Lessons And External Schedule Content

Goal: Preserve the current read-only lessons/schedule content as client-owned information while the ClassKit platform takes over managed classes.

- [x] `done` Append the current read-only lessons content after Photo Moments
  - Description: Move the existing pricing/logistics/read-only schedule content into the homepage below the Photo Moments section and before contact.
  - Why: This content describes Noya's external client schedule and offer structure, not the classes managed inside ClassKit, so it should live as supporting homepage content rather than a ClassKit route.

- [x] `done` Keep static content visually aligned with the platform
  - Description: Make the retained static lessons content feel like part of the same product without confusing it with ClassKit-managed classes or manager-owned schedules.
  - Progress: The static schedule now shares a reusable card between the homepage section and the legacy read-only route.

## Roadmap Step 7: Platform Polish

Goal: Make the platform feel cohesive after the core ClassKit workflows exist.

- [ ] `open` Align copy and localization for platform flows
  - Description: Extend the current Hebrew, English, and Russian language support across class browsing, auth, profile, registration, schedule, and manager states.
  - Progress: Customer class browsing, detail, registration, cancellation, pending approval, and toast states now have localized copy in Hebrew, English, and Russian. Broader platform copy can continue to be tightened as more workflows land.

- [ ] `open` Tighten responsive platform navigation
  - Description: Ensure the landing page, classes page, schedule surface, auth/profile, and manager workspace are easy to move between on mobile and desktop.
  - Progress: The shared site navigation controls now appear across the landing page, classes page, auth/profile, and manager workspace, with a compact header treatment and locale-aware menu behavior.

- [ ] `open` Replace static pricing/logistics with product-aware content
  - Description: Revisit the current static lesson card and pricing table once ClassKit-backed classes and schedules exist, deciding what remains as marketing copy versus live operational data.

# Noya Website Roadmap

This roadmap tracks the next ClassKit-backed product adoption work for Noya's website. The old platform-build roadmap is considered complete; this file now answers what we are doing next after the core class, manager, registration, membership, schedule, and attendance workflows already exist.

Use this file to answer "what are we doing next?" after time away from the project. ClassKit product behavior should follow `/Users/liadgoren/Repositories/class-kit/docs/changelog.md`, `/Users/liadgoren/Repositories/class-kit/docs/sdk/client-sdk.md`, `/Users/liadgoren/Repositories/class-kit/docs/api/class-api-map.md`, and the `@class-kit/react` client SDK boundary; this website owns Noya-specific visual design, page composition, copy, routing, and product-specific interaction polish.

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

- Reusable product-platform behavior belongs in ClassKit first, then this website adopts it through `@class-kit/react`.
- Noya-specific copy, page composition, visual styling, and interaction polish belong in this website.
- Do not call Supabase, raw ClassKit Edge Functions, or ClassKit database objects from this website.
- Do not expose manager-only SDK surfaces to ordinary students.
- Customer-facing legal, profile, signup, waiver, and membership behavior must use customer-safe ClassKit surfaces.
- Product-user metadata is ClassKit-owned product data. This website may use it for Noya-specific flags such as onboarding completion, but must read and write it through the supported ClassKit SDK surface and preserve unrelated metadata keys.
- Keep the existing Noya brand, mobile-first layout, Hebrew/English/Russian localization, and RTL-safe behavior.

## Roadmap Step 1: Signup Links

Goal: Adopt ClassKit-managed signup links for class-specific and filtered class-discovery entry points.

- [ ] `next` Resolve public signup links
  - Description: Support ClassKit signup-link slugs that resolve to either a specific class or a product-controlled filter payload.
  - Why: This is the first active slice because ClassKit v0.1.13 now owns durable signup-link resolution, while this website owns how resolved links route into Noya's public classes experience.
  - Shape: Public resolution should use `client.signupLinks.resolve(slug)` from `/Users/liadgoren/Repositories/class-kit/docs/sdk/client-sdk.md#signup-links`. Link resolution is anonymous-safe and product-scoped by origin or localhost product-key hint. The website should not invent a hash/link store or call raw `class-kit-signup-links`; the ClassKit facade maps to `signupLinks.resolve(slug)` as documented in `/Users/liadgoren/Repositories/class-kit/docs/api/class-api-map.md#capability-map` and `/Users/liadgoren/Repositories/class-kit/docs/api/backend-api.md#edge-function-map`.

- [ ] `open` Route class-target signup links
  - Description: Open the public classes page with the linked class focused and ready for the normal customer registration flow.
  - Shape: Class-target links return `target_type: "class"` and `class_id`. The website should map that response into the existing public class-detail focus and normal `classes.*` registration flow rather than adding a separate signup page or manager-only data path.

- [ ] `open` Route filter-target signup links
  - Description: Open the public classes page with resolved filters applied so promotional links can expose a curated set of classes.
  - Shape: Filter-target links return `target_type: "filter"` and a product-controlled `filters` object. The website should treat those filters as ClassKit-provided routing state for public discovery, not as a local query language with website-owned persistence.

- [ ] `open` Add manager signup-link creation affordance
  - Description: Let managers create class-target and filter-target signup links through the ClassKit management facade.
  - Shape: Use `client.management.signupLinks.create(input)` from manager-owned surfaces only, as documented in `/Users/liadgoren/Repositories/class-kit/docs/sdk/client-sdk.md#signup-links`. Class links pass `targetType: "class"` and `classId`; filter links pass `targetType: "filter"` plus a product-controlled filter object and optional slug. The website decides the manager interaction and copy; ClassKit owns link persistence and resolution.

## Roadmap Step 2: Product User Identity

Goal: Make display name and optional phone number first-class customer identity fields for this product.

- [ ] `next` Add profile identity fields
  - Description: Let signed-in users provide or review their product display name and optional phone number through a customer-safe ClassKit surface.
  - Why: Display name needs a canonical customer-safe source before manager lists and registration surfaces can rely on it.
  - Shape: Load the signed-in user's detailed product profile through `client.profile.get()` as documented in `/Users/liadgoren/Repositories/class-kit/docs/sdk/client-sdk.md#product-profile`. The profile should treat `user.display_name` as the primary human label and email as secondary account information. Product-user metadata and membership-grant details should come from the ClassKit profile response, not from raw Supabase or manager-only membership APIs.

- [ ] `open` Add first-sign-in onboarding
  - Description: Prompt users who have not completed onboarding to provide a required display name and optional phone number.
  - Why: The onboarding prompt creates enough structured product-user identity for later manager-facing lists, attendance, membership, and registration surfaces to show names instead of relying on email addresses.
  - Shape: Read the onboarding state from product-user `metadata`, using a stable Noya-owned flag such as `onboarding_completed`. Keep the prompt small, localized, and non-manager-specific. Explain that the phone number is optional but improves future product workflows.

- [ ] `open` Persist onboarding completion
  - Description: Use product-user metadata as the durable onboarding flag without inventing website-owned identity state.
  - Shape: Persist onboarding completion through the supported ClassKit product-user metadata write surface. Where the SDK contract replaces the metadata object instead of merging partial patches, first preserve existing metadata keys from the current ClassKit profile/user response and then write the full next metadata object. Relevant docs: `/Users/liadgoren/Repositories/class-kit/docs/sdk/client-sdk.md#product-profile`, `/Users/liadgoren/Repositories/class-kit/docs/sdk/client-sdk.md#product-roles-and-users`, and `/Users/liadgoren/Repositories/class-kit/docs/api/class-api-map.md#capability-map`.

## Roadmap Step 3: User Name Presentation

Goal: Prefer human display names across manager and registration surfaces after identity collection exists.

- [ ] `open` Normalize shared user labels
  - Description: Use display name as the primary label and email as supporting detail wherever product users are listed.
  - Why: This should follow the profile identity and onboarding slices so user surfaces have a reliable human label to show.
  - Shape: Normalize labels around ClassKit product-user fields: manager `ProductUserListItem` exposes `display_name`, `email`, `phone_number`, and `metadata`; registration summaries expose `user.displayName` and `user.email`. Prefer display name, then email, then a stable fallback only where needed. Relevant docs: `/Users/liadgoren/Repositories/class-kit/docs/sdk/client-sdk.md#product-roles-and-users` and `/Users/liadgoren/Repositories/class-kit/docs/api/class-api-map.md#capability-map`.

- [ ] `open` Update manager user surfaces
  - Description: Apply the normalized label shape to Users, Memberships, and other manager user-selection surfaces.
  - Shape: Apply the shared label convention to manager-owned surfaces that already use `management.users.*`, including Users and Memberships. Email should remain visible where it helps disambiguation, but should not be the main front-facing value when a display name exists. Profile and metadata edits still follow the Product User Identity step; this step is presentation consistency across existing manager lists.

- [ ] `open` Update class and registration surfaces
  - Description: Apply display names to registered-user, pending-request, attendance, and participant lists where ClassKit responses expose product-user identity.
  - Shape: Use the identity exposed by ClassKit management registration and attendance/class participant surfaces, including `ManagementRegistrationSummary.user.displayName` where available. Keep registration counts, membership context, and manager actions unchanged; this step is presentation and identity clarity, not a registration-behavior change. Do not infer or synthesize identities outside the SDK response.

## Roadmap Step 4: Product Documents

Goal: Adopt ClassKit product documents for terms, policies, and public legal links without hard-coding legal-page infrastructure in this website.

- [ ] `open` Add product document routes
  - Description: Render published ClassKit product documents by document type and locale.
  - Why: Product documents are reusable ClassKit infrastructure with product-specific content, so this website should consume published documents instead of owning the document system.
  - Shape: Use public `client.productDocuments.get(documentType, { locale, fallbackLocale })` for full markdown content and `client.productDocuments.list(options?)` for published summaries, as documented in `/Users/liadgoren/Repositories/class-kit/docs/sdk/client-sdk.md#product-documents`. Public reads are anonymous-safe, product-scoped, and cached by the SDK in memory and `localStorage` for 5 minutes. Do not hard-code legal text into website routes except for temporary content while the product document is not yet published.

- [ ] `open` Add footer and policy links
  - Description: Link to terms, privacy, accessibility, and browser-storage/cookie notices from the Noya website shell.
  - Shape: The footer/site shell should link to ClassKit product document types such as `terms`, `privacy`, `accessibility`, and storage/cookie notice documents. The website owns link placement, page chrome, localization labels, and RTL-safe navigation; ClassKit owns the published document versions, locale fallback, and content retrieval. Relevant docs: `/Users/liadgoren/Repositories/class-kit/docs/sdk/client-sdk.md#product-documents` and `/Users/liadgoren/Repositories/class-kit/docs/api/backend-api.md#edge-function-map`.

- [ ] `open` Add document acceptance where needed
  - Description: Use ClassKit document acceptances only in flows that require agreement snapshots, such as signup, booking, checkout, or future waivers.
  - Shape: Use `client.productDocuments.accept(documentType, { locale, fallbackLocale, context })` only for authenticated active product users and only when a flow needs a durable agreement snapshot. ClassKit snapshots accepted document id, type, locale, version, title, markdown content, and context; later edits do not rewrite historical acceptances. Acceptance should be flow-specific, not a generic blocking wall across the whole public website.

## Roadmap Step 5: Later ClassKit Surfaces

Goal: Track requested Noya features that are waiting on new customer-safe ClassKit behavior.

- [ ] `open` Add customer-safe membership details to profile
  - Description: Show active membership type, remaining stock, and/or validity dates once ClassKit exposes ordinary-user membership details.
  - Why: The current membership management facade is manager-owned and should not be exposed to students.

- [ ] `open` Add health declaration flow
  - Description: Add Noya's health declaration after the required ClassKit document/waiver behavior exists.
  - Why: The health declaration should be handled after product documents and after any additional ClassKit behavior needed for waiver-like flows is available.

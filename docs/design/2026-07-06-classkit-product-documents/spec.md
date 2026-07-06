# ClassKit Product Documents Design

Status: Final design. Approved for implementation planning by non-interactive planner phase.

## Goal

Adopt ClassKit product documents in the Noya website for public Terms of Service reading, flow-specific Terms acceptance, and a health declaration agreement path for class registration. The website owns routing, layout, links, copy, agreement controls, and fallback states. ClassKit owns product-scoped document content, locale fallback, acceptance snapshots, authentication requirements, and authorization.

## Current Context

- `ROADMAP.md` Step 4 already tracks product document routes, footer/policy links, and flow-specific acceptance. Step 5 tracks health declaration as a waiver-like later flow.
- `package.json` already pins `@class-kit/react` `v0.1.17`, which includes product document APIs introduced in ClassKit `v0.1.13`.
- The app uses lightweight path routing in `src/App.tsx`; route path constants and helpers live in `src/content/site-content.ts`.
- Public classes and registration live in `src/features/lessons/lessons-page.tsx`, with `client.classes.register(classId)` as the customer registration mutation.
- Signup lives in `src/features/account/auth-page.tsx`, using `signUp(email, password)` and `signInWithGoogle()` from `useProductContext()`.
- Shared shell/menu/footer surfaces are `src/components/site/site-header.tsx`, `src/features/landing/mobile-menu.tsx`, and `src/features/landing/contact-section.tsx`.
- All visible copy must be localized in `src/i18n.ts` for English, Hebrew, and Russian.
- The repo has no markdown renderer dependency.

## ClassKit Evidence

ClassKit docs define:

- `client.productDocuments.list(options?)`
- `client.productDocuments.get(documentType, { locale, fallbackLocale })`
- `client.productDocuments.accept(documentType, { locale, fallbackLocale, context })`

Relevant documented behavior:

- Public reads are anonymous-safe and product-scoped.
- `list(...)` returns published summaries without markdown content.
- `get(...)` returns the latest published document for the requested type and locale, with fallback locale support.
- Successful public reads are cached by the SDK in memory and `localStorage` for 5 minutes.
- `accept(...)` requires an authenticated active product user.
- Acceptance snapshots the document id, document type, locale, version, title, markdown content, and optional context so later edits do not rewrite historical acceptances.

## User-Facing Behavior

### Public Document Pages

- Visitors can open a Terms page at a stable website route such as `/terms`.
- The Terms page loads the latest published ClassKit `terms` document for the active UI locale.
- The page passes a fallback locale of `"en"` so Hebrew/Russian visitors see a document instead of a crash when their localized document is unpublished.
- A health declaration page exists at a stable route such as `/health-declaration`.
- The health declaration route uses a single exported document-type constant, initially `health_declaration`, so the type can be adjusted if ClassKit product configuration uses a different waiver/agreement type.
- Missing, unpublished, unavailable, or SDK-error states render localized, non-crashing empty/error messages. The website must not embed long legal or health declaration text.

### Links

- The Noya shell exposes a Terms link in appropriate persistent navigation areas without disrupting the visual style:
  - footer/contact area;
  - mobile menu link area.
- The health declaration page can be linked from the class registration agreement UI and optionally from the footer as a policy-style link. It should not become a global blocking wall.

### Signup Terms Acceptance

- Signup mode shows a localized Terms agreement affordance before password signup can submit.
- The affordance links to the public Terms route.
- The checkbox controls local UI readiness; the actual durable acceptance is attempted only when an authenticated active product user exists.
- Password signup should:
  1. require the checkbox before calling `signUp`;
  2. write a small pending Terms acceptance marker before calling the existing `signUp(email, password)`;
  3. let a stable post-auth component complete `client.productDocuments.accept("terms", { locale, fallbackLocale: "en", context: "signup" })` after the session/product user is available.
- Google signup cannot accept before OAuth because the user is not authenticated. The smallest defensible boundary is:
  1. require the checkbox before starting Google signup;
  2. store a small pending acceptance marker in `sessionStorage`;
  3. after OAuth returns and the app has an authenticated active product user, a stable post-auth component completes `accept("terms", { context: "signup" })` and clears the marker.
- `AuthPage` currently redirects to profile as soon as `session` exists, so it must not be the only owner of post-auth acceptance. It may write the pending marker and gate signup, but acceptance completion must live in a component that survives that redirect.
- If post-auth acceptance fails, the user remains signed in but receives a localized recoverable message. Do not silently block the whole public site.

### Class Registration Terms And Health Declaration

- The class registration action remains flow-specific, not global.
- For authenticated users registering for a class, the class detail/register surface shows agreement controls before `client.classes.register(item.id)` is called.
- Existing class card/list register buttons must not submit a hidden agreement-gated mutation. For signed-in eligible users, compact card/list register actions should open or focus the selected class detail surface where the Terms and health declaration controls are visible. The primary action inside the detail surface remains the submit path.
- The registration action must require:
  - Terms agreement via `terms`, context `"registration"`;
  - health declaration agreement via the exported health declaration document type, context `"registration_health_declaration"`.
- On submit, call product document acceptances before `client.classes.register(item.id)`. If an acceptance fails, do not register the class; show a localized error and allow retry.
- The acceptance calls use the active locale and fallback locale `"en"`.
- Existing membership-required, sign-in-required, registration-closed, cancel-registration, signup-link, and pending/approved registration behavior must remain intact.

## Technical Design

### Document Type And Locale Boundary

Create `src/features/documents/product-document-types.ts`:

```ts
export const productDocumentTypes = {
  terms: "terms",
  healthDeclaration: "health_declaration",
} as const;

export const productDocumentFallbackLocale = "en";
```

This file is the only place the health declaration document type should need adjustment if ClassKit product content uses a different type.

### Public Document Page

Create `src/features/documents/product-document-page.tsx`.

Responsibilities:

- receive `documentType`, `titleKey`, `emptyKey`, `onNavigate`;
- load via `client.productDocuments.get(documentType, { locale: i18n.language, fallbackLocale: productDocumentFallbackLocale })`;
- render loading, error, empty, and loaded states;
- render document title, optional effective/version metadata if exposed by SDK response, and markdown content.

Because this repo has no markdown dependency, implement a tiny safe markdown renderer local to the documents feature:

- support headings beginning with `#`, `##`, `###`;
- support paragraphs;
- support unordered list lines beginning with `- `;
- preserve blank-line paragraph boundaries;
- render all content as React text nodes, not `dangerouslySetInnerHTML`;
- ignore unsupported markdown syntax rather than adding a dependency.

This keeps legal/health content external while giving published markdown a readable shape.

### Routing

Add path constants and helpers in `src/content/site-content.ts`:

- `termsPath = "terms"`
- `healthDeclarationPath = "health-declaration"`
- `isTermsPath(pathname)`
- `isHealthDeclarationPath(pathname)`

Add lazy import branches in `src/App.tsx` for the new document page. These routes should use the existing header, install prompt, and browser storage notice behavior.

### Agreement UI Boundary

Create `src/features/documents/document-agreement.tsx`.

Responsibilities:

- render a checkbox, short localized agreement label, link to document route, and optional acceptance error;
- expose `checked`, `onCheckedChange`, `documentType`, `documentPath`, `labelKey`, `linkKey`;
- provide an exported helper `acceptProductDocument(client, documentType, locale, context)` that calls the SDK with fallback locale.

Do not create global agreement state. Keep checkbox state in `AuthPage` and `LessonsPage` because acceptance is flow-specific.

### Pending Signup Acceptance Boundary

Create `src/features/documents/pending-signup-terms-acceptance.tsx`.

Responsibilities:

- own the `sessionStorage` key and helpers for pending signup Terms acceptance intent;
- export `markPendingSignupTermsAcceptance()` for `AuthPage` to call after the user checks Terms and before password or Google signup begins;
- render a `PendingSignupTermsAcceptance` component from `App` so it remains mounted after `AuthPage` redirects to profile;
- watch `client`, `session`, `productUser?.status`, and `i18n.language`;
- call `acceptProductDocument(client, productDocumentTypes.terms, i18n.language, "signup")` only when a pending marker exists and `productUser?.status === "active"`;
- clear the pending marker after a successful acceptance;
- avoid tight retry loops by allowing at most one automatic acceptance attempt per authenticated user/locale/mount transition; additional retry should come from a user action;
- surface a localized recoverable error on authenticated pages when the automatic attempt fails, with a retry button that calls the same acceptance path and clears the marker on success.

The component may render a small fixed toast-style notice using the existing `ToastStack` visual pattern or a local inline notice. It should be visually unobtrusive, RTL-safe, and only visible while a pending signup Terms marker remains unresolved after an authenticated user is present.

### Signup Integration

Modify `src/features/account/auth-page.tsx`:

- show Terms agreement only when `visibleMode === "signup"`;
- require it for password signup and Google signup;
- store a pending signup Terms acceptance marker before password `signUp(...)` and before `signInWithGoogle()`;
- do not attempt post-auth acceptance in `AuthPage` because the existing session redirect can unmount it before `productUser?.status === "active"` is available.

Modify `src/App.tsx` to render `PendingSignupTermsAcceptance` once inside the app shell, outside route-specific lazy pages, so acceptance completion survives navigation from auth to profile.

### Registration Integration

Modify `src/features/lessons/lessons-page.tsx`:

- keep existing `registerForClass(item)` as the single mutation boundary;
- add state for accepted registration Terms and health declaration checkboxes, keyed to the selected class or reset when class detail changes;
- render the agreement controls in the selected class detail surface near the primary register action, and ensure mobile layout wraps safely;
- route signed-in eligible card/list register clicks to the class detail surface instead of calling `registerForClass(item)` directly, so users always see the required agreement controls before a blocked or submitted registration;
- before `client.classes.register(item.id)`, call:

```ts
await acceptProductDocument(client, productDocumentTypes.terms, i18n.language, "registration");
await acceptProductDocument(client, productDocumentTypes.healthDeclaration, i18n.language, "registration_health_declaration");
```

- if either acceptance returns an SDK error or throws, show `classes.documents.acceptanceFailed` and do not call `classes.register`.

Do not add health declaration metadata flags to profile/user metadata. ClassKit acceptance snapshots are the source of truth.

## Permissions / Security / Privacy

- Public document reads are allowed without auth through ClassKit product-scoped APIs.
- Acceptance calls must only happen for authenticated active product users.
- The website must not call Supabase, raw ClassKit Edge Functions, RPCs, or ClassKit tables.
- Do not persist legal/health content in local app state beyond what React needs to render the current page.
- Pending signup acceptance markers in `sessionStorage` must contain only document type/context intent, not document content or personal data.
- No manager-only SDK surface is required for this feature.

## Error Handling

- Missing document: show localized empty state and keep the page usable.
- SDK unavailable: show localized unavailable state.
- Read error: show localized error body and retry button when practical.
- Acceptance failure: block only the current signup/registration action, not the entire site.
- Signup pending acceptance failure after password signup or OAuth return: show a recoverable localized message on the authenticated app shell/profile context, keep the pending marker for explicit retry, and avoid automatic retry loops.

## Testing Strategy

- Focused inspection:
  - no raw Supabase/RPC/Edge Function usage;
  - all visible copy exists in English, Hebrew, and Russian;
  - health declaration document type is centralized.
- Route smoke:
  - `/terms` loads anonymously and handles unpublished state;
  - `/health-declaration` loads anonymously and handles unpublished state;
  - links from footer/menu navigate correctly in all locales.
- Signup smoke:
  - signup submit is blocked until Terms checkbox is checked;
  - password signup attempts `accept("terms", { context: "signup" })` once authenticated;
  - Google signup stores and completes pending acceptance after return when authenticated.
- Registration smoke:
  - signed-out users still route to auth;
  - membership-required users still see membership gate;
  - signed-in register action is blocked until Terms and health declaration checkboxes are checked;
  - acceptance calls happen before `classes.register`;
  - acceptance failure prevents registration and shows a localized message.
- Run `npm run lint` after implementation because new SDK method calls, route branches, and shared components touch TypeScript-heavy surfaces.

## Planning Boundary Guidance

Implementation should be split into these chunks:

1. Public document constants, routes, and page rendering.
2. Shell/menu/footer links and localization.
3. Signup Terms agreement and pending post-auth acceptance.
4. Class registration Terms plus health declaration acceptance and final verification.

## Acceptance Criteria

- Visitors can open Terms and health declaration routes without being signed in.
- Terms route renders the latest ClassKit `terms` document for the active locale with English fallback.
- Health declaration route renders a ClassKit product document through an easy-to-adjust document type constant.
- Footer/menu expose Terms without disrupting Noya mobile-first styling.
- Signup requires Terms agreement before sign-up action and records Terms acceptance for authenticated product users with context `"signup"`.
- Class registration requires Terms and health declaration agreement before registration and records acceptances with distinct contexts.
- No long legal or health declaration content is embedded in the repo.
- All new visible copy is localized in English, Hebrew, and Russian.
- Existing auth, profile, manager, signup-link, and registration behavior is preserved.

## Assumptions

- `health_declaration` is the initial ClassKit document type for Noya's `הצהרת בריאות`; it is intentionally centralized for easy correction.
- English is the fallback locale for product documents.
- The SDK response shape includes a document object with title/content markdown; implementers must verify exact property names from installed SDK types before coding.
- There is no requirement in this task to add manager UI for publishing documents; content is managed elsewhere through ClassKit management/admin tooling.

## Non-Blocking Risks

- Signup acceptance depends on post-redirect/session restoration and must be completed by the stable app-level pending acceptance component, not only by `AuthPage`.
- The exact health declaration document type may differ from `health_declaration`.
- Product-document registration controls must cover both detail-modal and card/list entry points. The chosen boundary is to make card/list register clicks open the detail surface for agreement review before submission.
- The tiny markdown renderer will not support rich legal markdown features such as tables. If published documents require tables, add a markdown dependency only after confirming that need.

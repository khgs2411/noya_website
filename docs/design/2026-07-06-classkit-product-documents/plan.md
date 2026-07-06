# ClassKit Product Documents Implementation Plan Set

**Spec:** `spec.md`  
**Agenda:** `agenda.md`  
**Pseudocode:** Not available; not needed for this bounded UI/API adoption  
**Context:** Not available; no glossary update needed  
**ADRs:** None  
**Status:** Chunk Plans Written

## Goal

Implement ClassKit product-document adoption in the Noya website: public Terms and health declaration document pages, shell links, localized agreement UI, flow-specific Terms acceptance during signup, and Terms plus health declaration acceptance before class registration.

## Source Artifacts

- `docs/design/2026-07-06-classkit-product-documents/spec.md`
- `docs/design/2026-07-06-classkit-product-documents/agenda.md`
- `AGENTS.md`
- `ROADMAP.md`
- `DESIGN_GUIDE.md`
- `/Users/liadgoren/Repositories/class-kit/docs/getting-started.md`
- `/Users/liadgoren/Repositories/class-kit/docs/changelog.md`
- `/Users/liadgoren/Repositories/class-kit/docs/sdk/client-sdk.md`
- Current implementation paths inspected:
  - `src/App.tsx`
  - `src/content/site-content.ts`
  - `src/i18n.ts`
  - `src/components/site/site-header.tsx`
  - `src/features/landing/mobile-menu.tsx`
  - `src/features/landing/contact-section.tsx`
  - `src/features/account/auth-page.tsx`
  - `src/features/lessons/lessons-page.tsx`
  - `src/features/classes/class-card.tsx`
  - `src/features/classes/class-list-view.tsx`
  - `src/features/classes/class-calendar-view.tsx`
  - `src/features/classes/signup-links.ts`
  - `src/features/account/profile-page.tsx`
  - `package.json`
- Validation commands discovered:
  - `npm run lint`
  - `npm run build` exists but should not be default verification for routine UI edits.
  - No repo test script exists in `package.json`.

## Design Readiness Check

- Source artifact paths verified: Pass.
- Pseudocode artifacts: Absent.
- Pseudocode alignment: Not applicable.
- Missing or unavailable artifacts: `CONTEXT.md` and ADRs are absent by design; planning impact: none.
- Open agenda questions or risks: No open material questions. Non-blocking risks are assigned below.
- Spec / agenda / context / ADR consistency: Pass. Context and ADRs are intentionally absent.
- Parent / child spec consistency: Not applicable.
- Accepted planning reconciliations:
  - Use `health_declaration` as the initial health declaration document type because ClassKit docs do not name an exact type and the task asks for an easy-to-adjust boundary.
  - Use a tiny safe markdown renderer instead of adding a dependency unless implementation proves published documents need richer formatting.
  - Use `sessionStorage` only for pending post-auth signup acceptance intent, never for document content or personal data.
  - Complete pending signup Terms acceptance from a stable app-level document feature component rendered by `App`, not from `AuthPage`, because `AuthPage` currently redirects to profile as soon as `session` exists and can unmount before `productUser?.status === "active"`.
  - Use `classKitClient.auth.signUp(...)` and `classKitClient.auth.signInWithGoogle()` for signup initiation inside `AuthPage` because the `useProductContext()` auth wrappers are `Promise<void>` and do not return typed SDK errors for pending-marker cleanup.
- Blockers: None.

## Unresolved Decision Ownership

| Item | Type | Owning Chunk | Must Resolve Before | Notes |
| --- | --- | --- | --- | --- |
| Exact health declaration document type | Non-blocking risk | `01-document-routes-and-rendering.md` | Implementation steps in owning chunk | Start with centralized `health_declaration`; changing it later should require one constant edit. |
| SDK document response property names | Deferred implementation decision | `01-document-routes-and-rendering.md` | Implementation steps in owning chunk | Verify installed SDK types before coding the document page. |
| Tiny markdown renderer sufficiency | Non-blocking risk | `01-document-routes-and-rendering.md` | Implementation steps in owning chunk | Implement headings, paragraphs, unordered lists; avoid dependency unless clearly needed. |
| Signup pending acceptance retry and cleanup | Deferred implementation decision | `03-signup-terms-acceptance.md` | Implementation steps in owning chunk | `AuthPage` writes the marker; an app-level pending acceptance component completes acceptance after auth, avoids repeated loops, and shows recoverable failure UI. Marker must contain no content/personal data. |
| Signup pending marker cleanup after failed signup initiation | Failure-handling invariant | `03-signup-terms-acceptance.md` | Implementation steps in owning chunk | Use direct `classKitClient.auth.*` signup initiation calls, clear the pending marker if password signup or Google OAuth initiation throws or returns a typed error, and call `refreshProductContext()` after successful no-redirect password signup. Do not inspect return values from the `useProductContext()` auth wrappers. |
| Agreement control placement and card/list entry coverage | Deferred implementation decision | `04-registration-health-declaration-acceptance.md` | Implementation steps in owning chunk | Controls must be near the primary register action and reset safely when selected class changes. Compact signed-in eligible card/list register buttons must open/focus detail instead of submitting invisibly. |
| Registration acceptance pending guard | Concurrency invariant | `04-registration-health-declaration-acceptance.md` | Implementation steps in owning chunk | Preserve the existing `registrationMutation`/`actionBusy` duplicate-submit guard by setting a pending mutation before any awaited document acceptance call. |

## Approved Chunks

| Chunk | Purpose | Depends On | Enables | Status |
| --- | --- | --- | --- | --- |
| [`01-document-routes-and-rendering.md`](plans/01-document-routes-and-rendering.md) | Add product document constants, Terms and health declaration routes, and safe anonymous document rendering through `client.productDocuments.get`. | None | `02-shell-links-and-localization.md`, `03-signup-terms-acceptance.md`, `04-registration-health-declaration-acceptance.md` | Ready For Implementation |
| [`02-shell-links-and-localization.md`](plans/02-shell-links-and-localization.md) | Add localized document labels/errors/agreement copy and expose Terms/health declaration links in footer/menu surfaces without changing app behavior. | `01-document-routes-and-rendering.md` | `03-signup-terms-acceptance.md`, `04-registration-health-declaration-acceptance.md` | Ready For Implementation |
| [`03-signup-terms-acceptance.md`](plans/03-signup-terms-acceptance.md) | Add signup-mode Terms agreement, pending marker writing in auth, and stable app-level post-auth Terms acceptance completion. | `01-document-routes-and-rendering.md`, `02-shell-links-and-localization.md` | `04-registration-health-declaration-acceptance.md` | Ready For Implementation |
| [`04-registration-health-declaration-acceptance.md`](plans/04-registration-health-declaration-acceptance.md) | Require Terms and health declaration agreement before class registration, record both acceptances with distinct contexts, and run final focused verification. | `01-document-routes-and-rendering.md`, `02-shell-links-and-localization.md`, `03-signup-terms-acceptance.md` | Implementation completion | Ready For Implementation |

## Dependency Order

1. `01-document-routes-and-rendering.md`
2. `02-shell-links-and-localization.md`
3. `03-signup-terms-acceptance.md`
4. `04-registration-health-declaration-acceptance.md`

Chunk `04` depends on chunk `03` because it reuses `DocumentAgreement` and `acceptProductDocument` from `src/features/documents/document-agreement.tsx`. Final verification belongs in chunk `04`.

## Shared Contracts

- Route constants:
  - `termsPath = "terms"`
  - `healthDeclarationPath = "health-declaration"`
- Document constants:
  - `productDocumentTypes.terms = "terms"`
  - `productDocumentTypes.healthDeclaration = "health_declaration"`
  - `productDocumentFallbackLocale = "en"`
- Acceptance contexts:
  - signup Terms: `"signup"`
  - registration Terms: `"registration"`
  - registration health declaration: `"registration_health_declaration"`
- SDK boundary:
  - public document read: `client.productDocuments.get(documentType, { locale, fallbackLocale })`
  - acceptance: `client.productDocuments.accept(documentType, { locale, fallbackLocale, context })`
  - no Supabase, raw Edge Functions, RPCs, admin APIs, or manager-only document APIs.
- Pending signup acceptance marker:
  - storage: `window.sessionStorage`
  - content: document type/context intent only.
  - writer: `AuthPage` before password signup or Google signup begins.
  - signup initiation boundary: `AuthPage` should import the existing `classKitClient` from `src/lib/class-kit-client.ts` and call `classKitClient.auth.signUp(...)` / `classKitClient.auth.signInWithGoogle()` for signup mode, while still using context state and `refreshProductContext()` from `useProductContext()`.
  - cleanup: clear the marker if direct signup or OAuth initiation fails before an authenticated product user can accept Terms.
  - completion owner: `PendingSignupTermsAcceptance` rendered by `App`, outside route-specific lazy pages.
  - retry policy: at most one automatic attempt per authenticated user/locale/mount transition; explicit retry button after failure.
- Localization:
  - every visible string in English, Hebrew, and Russian under `documents`, `auth.documents`, and `classes.documents` or equivalent existing namespaces.

## Spec Coverage Map

| Spec Requirement | Covered By | Notes |
| --- | --- | --- |
| Public Terms route renders ClassKit `terms` document by active locale with fallback | `plans/01-document-routes-and-rendering.md` | Anonymous-safe read through SDK. |
| Public health declaration route with easy-to-adjust document type | `plans/01-document-routes-and-rendering.md` | Centralized constant owns uncertainty. |
| Missing/unpublished document states are understandable and non-crashing | `plans/01-document-routes-and-rendering.md`, `plans/02-shell-links-and-localization.md` | Localized empty/error states. |
| Footer/menu expose Terms without disrupting style | `plans/02-shell-links-and-localization.md` | Health declaration link may also appear as secondary policy link. |
| Signup shows Terms acceptance before signup action | `plans/03-signup-terms-acceptance.md` | Checkbox gates password and Google signup affordances. |
| Authenticated signup acceptance calls use `terms`, locale/fallback, context `"signup"` | `plans/03-signup-terms-acceptance.md` | Includes stable post-auth completion outside `AuthPage` so the existing session redirect cannot drop acceptance. |
| Registration acceptance calls happen before ClassKit class registration | `plans/04-registration-health-declaration-acceptance.md` | Acceptance failure prevents registration. |
| Registration agreement controls cover existing card/list and detail entry points | `plans/04-registration-health-declaration-acceptance.md` | Compact card/list register actions open detail; detail primary action submits after agreement validation. |
| Health declaration acceptance uses distinct document type and context | `plans/04-registration-health-declaration-acceptance.md` | Uses centralized type constant. |
| Existing auth, profile, manager, signup-link, and class-registration behavior preserved | `plans/03-signup-terms-acceptance.md`, `plans/04-registration-health-declaration-acceptance.md` | Final verification inspects flows. |
| All new visible copy localized in English, Hebrew, Russian | `plans/02-shell-links-and-localization.md`, `plans/03-signup-terms-acceptance.md`, `plans/04-registration-health-declaration-acceptance.md` | Chunk 2 owns base keys; later chunks may add flow-specific keys. |

## Verification Strategy

- Before implementation, inspect `git status --short` and preserve unrelated worktree changes.
- Do not start a dev server without explicit approval. For smoke checks, first check whether a localhost server already exists.
- Use focused `rg` inspection for SDK boundary:
  - no `supabase`, `.rpc(`, `functions.invoke`, or raw ClassKit endpoint calls in document/signup/registration code.
- Use `npm run lint` after all chunks or when TypeScript risk appears.
- Browser smoke on an existing dev server when available:
  - `/terms` and `/health-declaration` anonymous route states;
  - footer/mobile menu links;
  - signup checkbox gating;
  - registration checkbox gating and acceptance-before-register behavior.
- Do not use `npm run build` as routine verification. Consider it only if lint or TypeScript/editor feedback suggests broad type risk.

## Risks And Sequencing Notes

- Document response type names must be checked against installed SDK types before implementing the renderer.
- Health declaration type may need product-configuration correction; keep the constant obvious.
- Signup acceptance has redirect lifecycle risk. Keep `AuthPage` responsible only for gating/writing the marker and direct signup/OAuth initiation; clear the marker when those direct initiation calls fail; call `refreshProductContext()` after successful no-redirect password signup; and keep app-level pending acceptance completion tiny with deterministic cleanup and explicit retry after failure.
- Registration document acceptance must not weaken the existing duplicate-submit guard. Validate unchecked agreement controls synchronously, then set `registrationMutation` before the first awaited `productDocuments.accept(...)` call and keep the existing `finally` cleanup.
- Registration UI should not clutter class cards. Compact card/list register buttons for signed-in eligible users should open/focus the selected class detail surface; only the detail primary action should submit agreement-gated registration.
- The tiny markdown renderer should stay safe and small; do not use `dangerouslySetInnerHTML`.

## Execution Handoff

Recommended next skill: `$pmp-executing-plans`.

Execution should load:

- `docs/design/2026-07-06-classkit-product-documents/plan.md`
- selected chunk plans under `docs/design/2026-07-06-classkit-product-documents/plans/`
- `spec.md`
- `agenda.md`
- source artifacts listed above

Execution must stop on code/spec conflict, missing SDK types, failed verification, unclear document response shape, or unexpected auth/registration behavior.

## User Approval

Roadmap approved by the non-interactive planner phase instructions. Chunk plans have been written and are ready for implementation.

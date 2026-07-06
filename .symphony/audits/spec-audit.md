# Spec Audit: ClassKit Product Documents

## Audit Mode: Full

Rationale: The artifact set covers a multi-chunk, cross-flow feature touching routing, localization, auth signup, document acceptance, and class registration.

## Plan Overview

Objective: Audit `docs/design/2026-07-06-classkit-product-documents/spec.md` and the related agenda/plan/chunk artifacts for readiness to implement ClassKit-backed Terms of Service and health declaration behavior in the Noya website.

Scope: Public Terms and health declaration document routes, shell links, localized agreement UI, signup Terms acceptance, class-registration Terms and health declaration acceptance, and focused verification. Manager document authoring, global legal walls, raw Supabase/Edge Function access, and embedded legal/health content are out of scope.

Target Audience: AI agents and human developers.

Readiness Level: Ready for Development.

Key Technical Decisions:

- Use `@class-kit/react` product document APIs for public reads and authenticated acceptance snapshots.
- Keep health declaration type centralized as `health_declaration` because ClassKit docs do not name a canonical waiver type.
- Use direct `classKitClient.auth.signUp(...)` and `classKitClient.auth.signInWithGoogle()` only for signup initiation error detection, while keeping app-level post-auth Terms acceptance outside `AuthPage`.
- Require class-registration document acceptances before `client.classes.register(...)`, and route compact signed-in register entry points to detail UI so agreements are visible.

## File Path Verification

Verified using local codebase inspection:

| Referenced Path | Status | Notes |
| --- | --- | --- |
| `docs/design/2026-07-06-classkit-product-documents/spec.md` | Exists | Primary audit target. |
| `docs/design/2026-07-06-classkit-product-documents/agenda.md` | Exists | Related spec decisions resolved. |
| `docs/design/2026-07-06-classkit-product-documents/plan.md` | Exists | Chunk index and shared contracts present. |
| `docs/design/2026-07-06-classkit-product-documents/plans/01-document-routes-and-rendering.md` | Exists | Public route/rendering chunk present. |
| `docs/design/2026-07-06-classkit-product-documents/plans/02-shell-links-and-localization.md` | Exists | Links/localization chunk present. |
| `docs/design/2026-07-06-classkit-product-documents/plans/03-signup-terms-acceptance.md` | Exists | Reworked signup chunk present. |
| `docs/design/2026-07-06-classkit-product-documents/plans/04-registration-health-declaration-acceptance.md` | Exists | Registration chunk present. |
| `AGENTS.md` | Exists | Repo instructions read. |
| `ROADMAP.md` | Exists | Step 4/5 product document direction verified. |
| `DESIGN_GUIDE.md` | Exists | UI/localization constraints verified. |
| `src/App.tsx` | Exists | Lightweight route/render shell verified. |
| `src/content/site-content.ts` | Exists | Current path constants/helpers verified. |
| `src/i18n.ts` | Exists | Three locale blocks verified. |
| `src/features/account/auth-page.tsx` | Exists | Current auth wrappers and redirect behavior verified. |
| `src/features/lessons/lessons-page.tsx` | Exists | Current registration mutation and card/detail action paths verified. |
| `src/features/landing/mobile-menu.tsx` | Exists | Mobile shell link surface verified. |
| `src/features/landing/contact-section.tsx` | Exists | Footer/contact link surface verified. |
| `src/lib/class-kit-client.ts` | Exists | Shared ClassKit client instance verified. |
| `node_modules/@class-kit/react` | Not Found | `node_modules` is absent in this worktree; SDK contract was verified against local ClassKit SDK source and docs instead. |
| `/Users/liadgoren/Repositories/class-kit/docs/getting-started.md` | Exists | Required task doc read. |
| `/Users/liadgoren/Repositories/class-kit/docs/changelog.md` | Exists | Product document feature introduction verified. |
| `/Users/liadgoren/Repositories/class-kit/docs/sdk/client-sdk.md` | Exists | Auth/product document contract verified. |
| `/Users/liadgoren/Repositories/class-kit/class-kit-sdk/src/context/product-context-state.ts` | Exists | Provider wrapper return types verified. |
| `/Users/liadgoren/Repositories/class-kit/class-kit-sdk/src/client/class-kit-client.ts` | Exists | Direct client auth and product document response types verified. |

## Strengths

### 1. Prior Rejection Is Directly Addressed

The previous blocking issue was that chunk 03 inspected typed errors from `useProductContext()` auth wrappers even though those wrappers return `Promise<void>`. The revised spec states that signup should use `classKitClient.auth.*` when typed initiation errors are needed (`spec.md:14-15`, `spec.md:60-71`), and chunk 03 gives concrete direct-client snippets for password and Google signup (`plans/03-signup-terms-acceptance.md:393-420`, `plans/03-signup-terms-acceptance.md:422-430+`). This matches the actual SDK evidence: context wrappers are `Promise<void>` while direct client auth methods return `AuthActionResponse` (`product-context-state.ts:17-20`, `class-kit-client.ts:197-203`).

### 2. Flow Ownership Is Clear

The design separates local checkbox gating, pending marker lifecycle, and durable acceptance. `AuthPage` writes/clears pending signup intent; `PendingSignupTermsAcceptance` completes acceptance after an authenticated active product user is available (`spec.md:59-72`, `plans/03-signup-terms-acceptance.md:291-317`). This avoids losing acceptance when `AuthPage` redirects on session.

### 3. Registration Scope Is Bounded And Testable

The spec requires agreement controls only in class registration, not globally, and explicitly prevents compact card/list actions from submitting hidden agreement-gated mutations (`spec.md:74-84`). Chunk 04 maps this to the current `LessonsPage` action structure and preserves the existing duplicate-submit guard by setting `registrationMutation` before awaited acceptance calls (`plan.md:153-155`, `plans/04-registration-health-declaration-acceptance.md`).

### 4. Repository Boundaries Are Respected

The artifacts consistently forbid Supabase, RPCs, raw Edge Functions, manager document APIs, and embedded legal/health content. Verification commands include boundary scans and lint, and the plan follows the repo instruction to avoid routine full builds (`plan.md:135-147`).

## Critical Issues

No critical issues found. The artifact set is specific, internally consistent, and executor-ready for the requested scope.

## Questions for Plan Author

No blocking questions remain. The only unresolved product detail, the exact health declaration document type, is intentionally isolated behind a constant and is acceptable under the task context.

## Recommendations

### Non-Blocking

- During implementation, run dependency installation or otherwise restore `node_modules` before TypeScript/lint verification, because this worktree currently lacks `node_modules`.
- When implementing chunk 03, keep the final Google signup snippet aligned with the same direct-client pattern shown for password signup; the plan already states this requirement, but executor attention should stay on avoiding context-wrapper result inspection.
- Consider adding a very small smoke note after implementation for Google-only signup policy if Noya ever enables Google signup without password signup; the current app’s signup mode visibility appears tied to password signup availability, which is pre-existing and outside this feature’s critical path.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Health declaration document type differs from `health_declaration` | Medium | Medium | Centralized constant in `src/features/documents/product-document-types.ts`. |
| Missing `node_modules` blocks local lint/type verification | Medium | Medium | Install dependencies before implementation verification; do not treat absent deps as product-code failure. |
| Signup pending marker remains after post-auth acceptance failure | Medium | Low | App-level retry notice, one automatic attempt per user/locale/mount, marker cleared only on success. |
| Registration agreement controls crowd mobile detail UI | Low | Low | Chunk 04 scopes controls to detail surface with compact wrapping-safe layout. |

Highest Risk: Signup redirect and pending-marker lifecycle, because it spans pre-auth UI, OAuth/password initiation, provider hydration, and authenticated document acceptance. The revised plan now gives a deterministic boundary for initiation failures and app-level completion.

## Pre-Development Checklist

- [x] All referenced planning artifacts verified.
- [x] Repo instructions, roadmap, and design guide read.
- [x] ClassKit getting-started, changelog, SDK docs, and local SDK source checked.
- [x] Previous rejection addressed by direct `classKitClient.auth.*` initiation in chunk 03.
- [x] Acceptance criteria are testable with focused inspections, lint, and optional browser smoke on an existing dev server.
- [x] AI autonomy boundaries are defined through chunk order, stop conditions, and verification commands.

## Next Steps

1. Execute chunks in plan order: 01, 02, 03, 04.
2. Before coding chunk 01/03, restore dependencies if needed and verify installed SDK exported types.
3. After implementation, run the focused `rg` checks and `npm run lint`; use browser smoke only on an existing approved dev server.

## Evaluation Matrix

| Dimension | Weight | Raw Score | Weighted Score | Notes |
| --- | --- | --- | --- | --- |
| Completeness | x3 | 5/5 | 15/15 | Requirements, target files, edge cases, acceptance criteria, and verification are covered across spec and chunks. |
| Feasibility | x3 | 5/5 | 15/15 | SDK contracts match docs/source; prior direct-auth issue is fixed; no unsupported backend access is proposed. |
| Clarity | x2 | 5/5 | 10/10 | Flow ownership, constants, contexts, and failure states are explicit. |
| Logical Flow | x2 | 5/5 | 10/10 | Chunks progress from document routes to links, signup acceptance, registration acceptance, and final verification. |
| Scope & Risk | x2 | 4/5 | 8/10 | Scope is controlled; remaining health document type and dependency availability risks are identified and mitigated. |
| Developer Experience | x1 | 5/5 | 5/5 | File maps, snippets, commands, and stop conditions are executor-friendly. |
| AI Readiness | x1 | 5/5 | 5/5 | Autonomous execution boundaries, path references, rejection-specific guardrails, and objective checks are present. |

Overall: 68/70 -> Ready for Development

Critical Dimension Check: Pass. Completeness and Feasibility are both 5/5.

## Handoff

PLAN APPROVED FOR IMPLEMENTATION

Key constraints:

- Use `@class-kit/react` only; do not call Supabase, RPCs, raw Edge Functions, or manager/admin document APIs.
- Do not put long legal or health declaration content in the repo.
- Preserve flow-specific acceptance; no global legal wall.
- Keep visible strings in `src/i18n.ts` for English, Hebrew, and Russian.

Suggested starting point: `docs/design/2026-07-06-classkit-product-documents/plans/01-document-routes-and-rendering.md`.

First milestone: Product document constants and anonymous `/terms` plus `/health-declaration` routes render localized non-crashing states.

Verdict: Ready for Development

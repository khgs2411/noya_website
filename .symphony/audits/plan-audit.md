# Plan Audit: ClassKit Product Documents

## Audit Mode: Full

Rationale: Multi-chunk implementation plan spanning routing, shell links, auth/signup lifecycle, registration behavior, SDK calls, localization, and verification.

## Summary

Audited `docs/design/2026-07-06-classkit-product-documents/plan.md` against the approved design/spec at `docs/design/2026-07-06-classkit-product-documents/spec.md`, plus `agenda.md` and all four referenced chunk plans. I also checked repository instructions, current route/auth/registration source files, package metadata, and the referenced ClassKit docs.

The reworked plan addresses the prior blocking review comment. Chunk 03 now explicitly avoids inspecting `useProductContext()` signup wrapper return values, uses the shared `classKitClient.auth.signUp(...)` / `classKitClient.auth.signInWithGoogle()` boundary for signup initiation, clears pending markers on typed SDK errors or thrown initiation failures, and keeps durable acceptance completion in an app-level component that survives the existing auth redirect.

## Plan Overview

Objective: Add ClassKit-backed public Terms and health declaration document pages, localized shell links, signup Terms acceptance, and registration Terms plus health declaration acceptance.

Scope: Includes document route constants/pages, footer/mobile links, localized agreement copy, a reusable agreement helper, pending signup Terms marker lifecycle, app-level post-auth signup acceptance, and registration acceptance-before-register behavior. Excludes manager document authoring, global legal walls, profile metadata waiver flags, raw Supabase/Edge Function calls, and embedded legal/health content.

Target Audience: AI agents and human developers.

Readiness Level: Ready for Development.

Key Technical Decisions:
- Use `client.productDocuments.get(...)` for public document reads and `client.productDocuments.accept(...)` for flow-specific acceptance snapshots.
- Centralize the uncertain health declaration type as `health_declaration`.
- Use a small safe markdown subset instead of adding a markdown dependency.
- Use direct `classKitClient.auth.*` signup initiation only where typed initiation errors are needed, while preserving context auth methods for existing sign-in.

## File Path Verification

Verified using local codebase inspection:

| Referenced Path | Status | Notes |
| --- | --- | --- |
| `docs/design/2026-07-06-classkit-product-documents/spec.md` | Exists | Approved design target. |
| `docs/design/2026-07-06-classkit-product-documents/agenda.md` | Exists | Decisions resolved. |
| `docs/design/2026-07-06-classkit-product-documents/plan.md` | Exists | Primary audit target. |
| `docs/design/2026-07-06-classkit-product-documents/plans/01-document-routes-and-rendering.md` | Exists | Chunk 01. |
| `docs/design/2026-07-06-classkit-product-documents/plans/02-shell-links-and-localization.md` | Exists | Chunk 02. |
| `docs/design/2026-07-06-classkit-product-documents/plans/03-signup-terms-acceptance.md` | Exists | Chunk 03, reworked. |
| `docs/design/2026-07-06-classkit-product-documents/plans/04-registration-health-declaration-acceptance.md` | Exists | Chunk 04. |
| `AGENTS.md` | Exists | Requires `@class-kit/react`, localized copy, Tailwind/shadcn patterns, no direct Supabase/raw Edge Functions. |
| `ROADMAP.md` | Exists | Step 4 product documents and Step 5 health declaration align with plan scope. |
| `DESIGN_GUIDE.md` | Exists | Mobile-first, localized, theme-token UI constraints. |
| `src/App.tsx` | Exists | Lightweight route branches and global notice placement verified. |
| `src/content/site-content.ts` | Exists | Current route constants/helpers verified. |
| `src/i18n.ts` | Exists | Localization target verified. |
| `src/features/account/auth-page.tsx` | Exists | Current signup uses context wrappers and redirects on session; plan updates this correctly. |
| `src/lib/class-kit-client.ts` | Exists | Shared direct SDK client exists and is created from `@class-kit/react`. |
| `src/features/lessons/lessons-page.tsx` | Exists | Registration mutation and class detail action path verified. |
| `src/features/landing/mobile-menu.tsx` | Exists | Shell link target. |
| `src/features/landing/contact-section.tsx` | Exists | Footer/contact link target. |
| `src/components/site/sidebar-link.tsx` | Exists | Mobile menu link primitive. |
| `src/components/ui/button.tsx` | Exists | Planned button usage target. |
| `src/components/ui/toast.tsx` | Exists | Existing visual reference. |
| `src/features/documents/product-document-types.ts` | New File | Planned create. |
| `src/features/documents/product-document-page.tsx` | New File | Planned create. |
| `src/features/documents/document-agreement.tsx` | New File | Planned create. |
| `src/features/documents/pending-signup-terms-acceptance.tsx` | New File | Planned create. |
| `/Users/liadgoren/Repositories/class-kit/docs/getting-started.md` | Exists | Confirms product websites use `@class-kit/react` and not direct ClassKit data access. |
| `/Users/liadgoren/Repositories/class-kit/docs/changelog.md` | Exists | Confirms v0.1.13 product document APIs. |
| `/Users/liadgoren/Repositories/class-kit/docs/sdk/client-sdk.md` | Exists | Confirms auth methods and product document methods/acceptance behavior. |

`CONTEXT.md` and ADR files were searched for under `docs/` and this design folder; none were present, matching the plan's statement that no glossary/ADR artifact is needed.

## Strengths

### 1. Prior Rejection Is Directly Addressed

The top-level plan states that `useProductContext()` auth wrappers are not suitable for typed signup initiation errors and assigns direct `classKitClient.auth.*` use to Chunk 03. Chunk 03 gives concrete implementation snippets for clearing pending markers on returned SDK errors or thrown failures.

Evidence:
- `plan.md:53-59` records the direct-client reconciliation.
- `plan.md:68-69` makes failed-initiation cleanup an invariant.
- `plans/03-signup-terms-acceptance.md:336-347` removes the context `signUp` wrapper from signup mode.
- `plans/03-signup-terms-acceptance.md:393-420` and `:422-430` define deterministic password and Google initiation cleanup.

### 2. Scope Matches Repository Boundaries

The plan uses `@class-kit/react` and the existing shared client, keeps ClassKit as the owner of auth/data/document persistence, localizes visible copy in `src/i18n.ts`, and avoids direct Supabase/RPC/raw Edge Function calls. This matches `AGENTS.md` product boundaries.

### 3. Registration Risk Is Well Controlled

Chunk 04 preserves the existing duplicate-submit guard by validating checkbox state synchronously, setting `registrationMutation` before awaited acceptance calls, and calling `client.classes.register(...)` only after both document acceptances succeed.

Evidence:
- `plans/04-registration-health-declaration-acceptance.md:117-170`
- `plans/04-registration-health-declaration-acceptance.md:264-319`

### 4. Verification Is Focused And Repo-Appropriate

The plan prefers focused `rg` inspections, lint, and browser smoke only when a dev server exists. It does not default to `npm run build`, matching local verification guidance.

## Critical Issues

No critical issues found. The plan is actionable for development.

## Non-Blocking Notes

- `node_modules` is not installed in this worktree, so I could not directly re-check installed SDK source/types during the audit. This is not a blocker because `package.json` pins `@class-kit/react` v0.1.17, ClassKit docs confirm the required APIs, and the plan explicitly instructs implementers to verify installed SDK response/type shapes before coding and stop on missing SDK types.
- Chunk 03's `DocumentAgreement` snippet starts with `import type { ClassKitClient } from "@class-kit/react"`, but includes a fallback instruction to derive the type locally if that export is unavailable. That is sufficient for implementation readiness.

## Questions for Plan Author

No blocking questions.

## Recommendations

- During implementation, run the Chunk 03 verification grep exactly as written to ensure no `AuthPage` code inspects `void` wrapper results.
- If dependencies are absent in the executor worktree, install or otherwise hydrate them before final TypeScript/lint verification so SDK type fallback decisions are based on real package exports.
- Keep the health declaration document type as a single constant edit point until product content configuration confirms the final type.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| SDK response/type shape differs from snippets | Medium | Medium | Chunk 01 and execution handoff require installed SDK type verification before coding. |
| Signup acceptance marker survives a failed initiation | Low | High | Chunk 03 now uses direct SDK calls and clears on returned typed errors or thrown failures. |
| OAuth redirects before cleanup can run | Low | Medium | Marker is intentionally kept only after successful initiation/redirect and resolved post-auth by app-level component. |
| Registration buttons bypass visible agreement controls | Low | High | Chunk 04 changes compact signed-in register actions to open class detail; only primary detail action submits. |
| Health declaration document type differs from `health_declaration` | Medium | Low | Centralized constant makes later correction small. |

Highest Risk: Signup pending-marker lifecycle remains the highest-risk area because it spans unauthenticated UI state, auth initiation, redirects, authenticated product-user hydration, and document acceptance. The revised plan is concrete enough to manage that risk.

## Pre-Development Checklist

- [x] All referenced planning artifacts read.
- [x] Applicable repo instructions, roadmap, and design guide checked.
- [x] Referenced source paths verified or marked new.
- [x] ClassKit docs checked for auth and product document contracts.
- [x] Prior rejection issue checked against the revised plan.
- [x] Acceptance criteria are testable.
- [x] AI autonomy boundaries and stop conditions are defined.

## Next Steps

1. Execute chunks in order: 01, 02, 03, 04.
2. In Chunk 03, verify real SDK types before committing to the `ClassKitClient` import and auth result handling.
3. Run the focused verification commands and `npm run lint`; use browser smoke only on an existing approved dev server.

## Evaluation Matrix

| Dimension | Weight | Raw Score | Weighted Score | Notes |
| --- | --- | --- | --- | --- |
| Completeness | x3 | 5/5 | 15/15 | Covers routes, links, i18n, signup lifecycle, registration acceptances, error states, and verification. |
| Feasibility | x3 | 4/5 | 12/15 | Feasible against repo shape and docs; SDK type check deferred to implementation because dependencies are not hydrated here. |
| Clarity | x2 | 5/5 | 10/10 | Explicit file maps, snippets, contexts, constants, and flow ownership. |
| Logical Flow | x2 | 5/5 | 10/10 | Chunks are dependency-ordered from document primitives to links, signup, then registration/final verification. |
| Scope & Risk | x2 | 5/5 | 10/10 | Avoids global legal wall, manager authoring, direct backend calls, and embedded legal content; risks are named. |
| Developer Experience | x1 | 5/5 | 5/5 | Executor has clear starting points, verification commands, rollback notes, and stop conditions. |
| AI Readiness | x1 | 5/5 | 5/5 | Plan is agent-executable with concrete paths, invariants, forbidden calls, and objectively checkable outcomes. |

Overall: 67/70 -> Ready for Development

Critical Dimension Check: Pass. No x3 dimension scored 1.

## Handoff

PLAN APPROVED FOR IMPLEMENTATION

Key constraints:
- Use `@class-kit/react` and the shared `classKitClient`; do not call Supabase, RPCs, raw Edge Functions, or manager/admin document APIs from website UI.
- Do not inspect return values from `useProductContext()` signup wrappers; use direct `classKitClient.auth.*` calls for signup initiation cleanup.
- Keep document acceptance flow-specific and localized; no global blocking wall.

Suggested starting point: `docs/design/2026-07-06-classkit-product-documents/plans/01-document-routes-and-rendering.md`

First milestone: Anonymous `/terms` and `/health-declaration` routes compile and render non-crashing localized states through `client.productDocuments.get(...)`.

Verdict: Ready for Development

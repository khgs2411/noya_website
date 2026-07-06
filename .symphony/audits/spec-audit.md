# Spec Audit: ClassKit Product Documents

## Audit Mode: Full

Rationale: The target spec is a multi-chunk, AI-executed feature plan touching routing, auth, registration, localization, and SDK integration.

## Plan Overview

Objective: Add ClassKit-backed public Terms and health declaration document pages, expose document links, require Terms agreement during signup, and require Terms plus health declaration acceptance before class registration.

Scope: The planning set includes `spec.md`, `agenda.md`, `plan.md`, and chunks `01` through `04`. It excludes manager-side product document authoring, direct Supabase/Edge Function calls, global legal walls, and embedded legal/health content.

Target Audience: AI agents and human developers.

Readiness Level: Ready for Development.

Key Technical Decisions:
- Centralize document types in `src/features/documents/product-document-types.ts`, including the uncertain initial health declaration type `health_declaration`.
- Use `@class-kit/react` product document APIs for reads and acceptances, with English fallback and flow-specific contexts.
- Complete signup Terms acceptance from an app-level post-auth component because `AuthPage` redirects once a session exists.
- Keep registration acceptance flow-specific and place agreement controls in the selected class detail surface while compact list/card register actions open that surface.

## File Path Verification

Verified using local codebase inspection:

| Referenced Path | Status | Notes |
| --- | --- | --- |
| `docs/design/2026-07-06-classkit-product-documents/spec.md` | Exists | Primary audit target read fully. |
| `docs/design/2026-07-06-classkit-product-documents/agenda.md` | Exists | Decisions are resolved and align with spec. |
| `docs/design/2026-07-06-classkit-product-documents/plan.md` | Exists | Plan index and chunk order read fully. |
| `docs/design/2026-07-06-classkit-product-documents/plans/01-document-routes-and-rendering.md` | Exists | Route/rendering chunk read fully. |
| `docs/design/2026-07-06-classkit-product-documents/plans/02-shell-links-and-localization.md` | Exists | Shell/localization chunk read fully. |
| `docs/design/2026-07-06-classkit-product-documents/plans/03-signup-terms-acceptance.md` | Exists | Signup acceptance chunk read fully. |
| `docs/design/2026-07-06-classkit-product-documents/plans/04-registration-health-declaration-acceptance.md` | Exists | Registration acceptance chunk read fully. |
| `AGENTS.md` | Exists | Confirms ClassKit-only boundary, i18n, design guide, and verification rules. |
| `ROADMAP.md` | Exists | Step 4 covers product documents; Step 5 covers health declaration. |
| `DESIGN_GUIDE.md` | Exists | Confirms mobile-first, Tailwind, tokenized warm styling, RTL-safe copy. |
| `src/App.tsx` | Exists | Lightweight route branches and global notice placement match plan assumptions. |
| `src/content/site-content.ts` | Exists | Current route constants and path predicates match planned extension pattern. |
| `src/i18n.ts` | Exists | English/Hebrew/Russian resource shape exists; new keys can be added there. |
| `src/features/account/auth-page.tsx` | Exists | Redirect-on-session behavior confirms the need for app-level pending acceptance. |
| `src/features/lessons/lessons-page.tsx` | Exists | Direct card/list registration path exists and is correctly addressed by chunk 04. |
| `src/features/landing/mobile-menu.tsx` | Exists | Uses `SidebarLink` and supports planned document links. |
| `src/features/landing/contact-section.tsx` | Exists | Footer area supports planned compact policy links. |
| `src/components/ui/button.tsx` | Exists | Reused by planned document and agreement UI. |
| `src/components/ui/toast.tsx` | Exists | Existing toast visual pattern is available. |
| `src/lib/utils.ts` | Exists | Provides `cn` for planned class composition. |
| `src/components/site/sidebar-link.tsx` | Exists | Referenced by shell-link chunk. |
| `src/features/classes/class-card.tsx` | Exists | Related class card surface exists. |
| `src/features/classes/class-list-view.tsx` | Exists | Related list surface exists. |
| `src/features/classes/class-calendar-view.tsx` | Exists | Related calendar/list fallback surface exists. |
| `src/features/classes/signup-links.ts` | Exists | Signup-link behavior can be preserved. |
| `src/features/account/profile-page.tsx` | Exists | Authenticated app context exists for pending acceptance notice. |
| `/Users/liadgoren/Repositories/class-kit/docs/getting-started.md` | Exists | Referenced external doc path was accessible. |
| `/Users/liadgoren/Repositories/class-kit/docs/changelog.md` | Exists | Product document API introduction verified. |
| `/Users/liadgoren/Repositories/class-kit/docs/sdk/client-sdk.md` | Exists | Product document API behavior verified. |
| `node_modules/@class-kit/react` | Not Found | Dependencies are not installed in this worktree; plan already requires SDK type verification before coding response normalization. |
| `CONTEXT.md` / ADRs under `docs/` | Not Found | Plan states these are intentionally absent; no audit impact. |

## Strengths

### 1. Correct SDK Boundary

The spec and chunks consistently use `@class-kit/react` and explicitly forbid Supabase, raw Edge Functions, RPCs, and manager-only document APIs. This matches `AGENTS.md`, `ROADMAP.md`, and the ClassKit docs.

### 2. Lifecycle-Aware Signup Design

The plan identifies that `AuthPage` redirects after `session` exists and therefore cannot reliably own post-auth acceptance. The app-level pending acceptance component is a sound boundary for password and Google signup.

### 3. Registration Entry Points Are Covered

The current `LessonsPage` lets signed-in eligible card/list actions call `registerForClass(item)` directly. Chunk 04 explicitly changes compact actions to open class detail so agreement controls are visible before registration.

### 4. Health Declaration Uncertainty Is Contained

The exact `הצהרת בריאות` document type is not documented. Centralizing `health_declaration` as a single constant satisfies the task while keeping the eventual product configuration correction cheap.

### 5. Verification Is Repository-Aware

The plan avoids default `npm run build`, calls for `npm run lint` only when the TypeScript-heavy chunks are complete, and uses focused `rg` checks plus browser smoke only when an existing dev server is available.

## Critical Issues

No critical issues found.

## Questions for Plan Author

No blocking questions. The only unresolved implementation detail is SDK declaration shape, and the plan assigns that to chunk 01 before coding.

## Recommendations

### Implementation Notes

- Treat code blocks as implementation sketches, not paste-only final code. For example, `acceptProductDocument` should type the client using the actual installed SDK export; the plan already gives a fallback when `ClassKitClient` export shape differs.
- When implementing the document page, verify whether the installed SDK response is `result.data.document`, a direct returned object, or a destructured object. Local `node_modules` is absent in this audit environment, so this remains an execution-time check.
- Ensure `PendingSignupTermsAcceptance` handles malformed or unavailable `sessionStorage` defensively if the browser blocks storage. This is not a blocker because the repo already has browser storage notice behavior and the marker is only a transient intent.
- For footer links, prefer client-side navigation if adding `onNavigate` is low-churn. The plan allows plain anchors, which is acceptable but slightly less smooth.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Installed SDK response/type shape differs from examples | Medium | Medium | Chunk 01 requires type verification and local normalization before coding. |
| Signup pending marker persists after failed signup initiation | Medium | Medium | Chunk 03 explicitly requires cleanup on typed errors and thrown errors. |
| Registration agreement controls make class detail dense on mobile | Medium | Low | Chunk 04 places controls in a compact block and requires browser smoke when available. |
| Health declaration document type differs from `health_declaration` | Medium | Low | Single exported constant isolates the change. |
| Tiny markdown renderer lacks tables/rich formatting | Medium | Low | Spec scopes the safe subset and defers a dependency until published docs require it. |

Highest Risk: Signup pending acceptance lifecycle. It crosses unauthenticated UI, OAuth/password auth, app-level session restoration, active product-user hydration, storage cleanup, and recoverable failure UI. The plan addresses these states concretely enough for implementation.

## Pre-Development Checklist

Before implementation starts:

- [x] All referenced planning artifacts read.
- [x] Related repository instructions, roadmap, and design guide read.
- [x] Referenced local paths verified or explicitly marked not found.
- [x] External ClassKit docs referenced by the task checked for product document APIs.
- [x] Acceptance criteria are testable.
- [x] AI autonomy boundaries are defined through chunk order, stop conditions, non-goals, and verification commands.
- [ ] Install dependencies or otherwise verify installed `@class-kit/react` type declarations before coding SDK response normalization.

## Next Steps

1. Execute chunk 01 first and verify the installed ClassKit product document response shape before implementing `ProductDocumentPage`.
2. Add localization and shell links in chunk 02, keeping all visible copy in `src/i18n.ts`.
3. Implement signup acceptance lifecycle in chunk 03 before registration acceptance so chunk 04 can reuse the agreement component and helper.

## Evaluation Matrix

| Dimension | Weight | Raw Score | Weighted Score | Notes |
| --- | --- | --- | --- | --- |
| Completeness | x3 | 5/5 | 15/15 | Covers public routes, links, signup, registration, health declaration, localization, failure states, non-goals, and acceptance criteria. |
| Feasibility | x3 | 4/5 | 12/15 | Approach matches current code and ClassKit docs. Minor uncertainty remains around installed SDK type declarations because `node_modules` is absent. |
| Clarity | x2 | 5/5 | 10/10 | Requirements, contexts, routes, document types, and ownership boundaries are explicit. |
| Logical Flow | x2 | 5/5 | 10/10 | Chunk dependency order is correct: routes/constants, copy/links, signup helper, registration integration. |
| Scope & Risk | x2 | 4/5 | 8/10 | Scope is bounded and risks are identified. Signup lifecycle remains inherently risky but has a concrete mitigation. |
| Developer Experience | x1 | 5/5 | 5/5 | File maps, task checklists, snippets, and focused verification commands are actionable. |
| AI Readiness | x1 | 5/5 | 5/5 | The plan defines paths, stop conditions, no-go boundaries, verification checkpoints, and objective criteria. |

Overall: 65/70 -> Ready for Development

Critical Dimension Check: Pass. No x3 dimension scored 1.

## Handoff

PLAN APPROVED FOR IMPLEMENTATION

Key constraints:
- Use `@class-kit/react` only; no Supabase, raw Edge Function, RPC, or manager-only document API calls from this website.
- Keep acceptance flow-specific; do not add a global blocking legal wall.
- Keep legal and health content in ClassKit documents, not embedded in the repo.
- Keep all visible copy in `src/i18n.ts` for English, Hebrew, and Russian.

Suggested starting point: `docs/design/2026-07-06-classkit-product-documents/plans/01-document-routes-and-rendering.md`.

First milestone: Public `/terms` and `/health-declaration` routes render non-crashing ClassKit document states using centralized document type constants.

Verdict: Ready for Development

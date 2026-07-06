# ClassKit Product Documents Plan Audit

## Audit Mode: Standard

Rationale: The target is a multi-chunk implementation plan touching routing, localization, auth/signup lifecycle, document acceptance, and class registration behavior.

## Plan Overview

Objective: Audit `docs/design/2026-07-06-classkit-product-documents/plan.md` and all referenced chunk plans against the approved spec for adding ClassKit-backed Terms and health declaration pages plus flow-specific acceptances.

Scope: Reviewed the approved spec, agenda, implementation plan, all four chunk plans, repository instructions, roadmap/design guide, related source files, and the ClassKit docs cited by the task. No implementation work was performed.

Target Audience: AI agents and human developers.

Readiness Level: Ready for Development.

Key Technical Decisions:

- Public Terms and health declaration routes use `client.productDocuments.get(...)` with active locale and English fallback; long legal or health text remains outside this repo.
- Signup acceptance is split between pre-signup checkbox gating in `AuthPage` and an app-level pending acceptance component that survives the existing post-session redirect.
- Registration acceptance is flow-specific, records Terms and health declaration snapshots before `client.classes.register(...)`, and preserves the existing mutation guard across async acceptance calls.
- `health_declaration` is centralized as an adjustable initial document type because ClassKit docs do not name a canonical health declaration type.

## File Path Verification

Verified using local codebase inspection:

| Referenced Path | Status | Notes |
| --- | --- | --- |
| `docs/design/2026-07-06-classkit-product-documents/spec.md` | Exists | Approved design target read. |
| `docs/design/2026-07-06-classkit-product-documents/agenda.md` | Exists | Decisions are resolved. |
| `docs/design/2026-07-06-classkit-product-documents/plan.md` | Exists | Primary audit target read. |
| `docs/design/2026-07-06-classkit-product-documents/plans/01-document-routes-and-rendering.md` | Exists | Chunk plan read. |
| `docs/design/2026-07-06-classkit-product-documents/plans/02-shell-links-and-localization.md` | Exists | Chunk plan read. |
| `docs/design/2026-07-06-classkit-product-documents/plans/03-signup-terms-acceptance.md` | Exists | Chunk plan read. |
| `docs/design/2026-07-06-classkit-product-documents/plans/04-registration-health-declaration-acceptance.md` | Exists | Chunk plan read. |
| `AGENTS.md` | Exists | Local instructions read. |
| `ROADMAP.md` | Exists | Product document and health declaration roadmap context verified. |
| `DESIGN_GUIDE.md` | Exists | Styling and verification constraints verified. |
| `src/App.tsx` | Exists | Current route model, global notices, and `renderPage` verified. |
| `src/content/site-content.ts` | Exists | Current path constants and path predicates verified. |
| `src/i18n.ts` | Exists | Existing three-language translation object shape verified. |
| `src/components/site/site-header.tsx` | Exists | Shell context exists. |
| `src/features/landing/mobile-menu.tsx` | Exists | Existing `SidebarLink` use verified. |
| `src/features/landing/contact-section.tsx` | Exists | Footer insertion point verified. |
| `src/components/site/sidebar-link.tsx` | Exists | Client navigation behavior verified. |
| `src/components/ui/button.tsx` | Exists | Planned UI primitive exists. |
| `src/components/ui/toast.tsx` | Exists | Toast source artifact exists. |
| `src/lib/utils.ts` | Exists | `cn` helper exists. |
| `src/features/account/auth-page.tsx` | Exists | Current signup flow and session redirect verified. |
| `src/features/lessons/lessons-page.tsx` | Exists | Current class detail, card/list register entry points, and mutation guard verified. |
| `src/features/classes/class-card.tsx` | Exists | Referenced implementation path exists. |
| `src/features/classes/class-list-view.tsx` | Exists | Referenced implementation path exists. |
| `src/features/classes/class-calendar-view.tsx` | Exists | Referenced implementation path exists. |
| `src/features/classes/signup-links.ts` | Exists | Referenced implementation path exists. |
| `src/features/account/profile-page.tsx` | Exists | Referenced implementation path exists. |
| `package.json` | Exists | `@class-kit/react` v0.1.17 dependency and scripts verified. |
| `node_modules/@class-kit/react` | Not Found | Installed SDK types were unavailable in this worker; the plan explicitly requires type verification before coding. |
| `/Users/liadgoren/Repositories/class-kit/docs/getting-started.md` | Exists | Frontend SDK boundary confirmed. |
| `/Users/liadgoren/Repositories/class-kit/docs/changelog.md` | Exists | Product document feature confirmed. |
| `/Users/liadgoren/Repositories/class-kit/docs/sdk/client-sdk.md` | Exists | Product document method contract confirmed. |

No `CONTEXT.md` or ADR files exist in the planning folder; the plan marks them absent by design.

## Strengths

### 1. Strong Boundary Discipline

The plan keeps all product-document behavior behind `@class-kit/react`, forbids Supabase/RPC/raw Edge Function access, and separates website presentation from ClassKit-owned content, authorization, and acceptance persistence.

### 2. Correct Signup Lifecycle Shape

The plan accounts for the current `AuthPage` redirect on `session` and moves durable Terms acceptance to a stable app-level component. That directly addresses the main auth lifecycle risk in the existing code.

### 3. Registration Entry Points Are Covered

The registration chunk recognizes that compact card/list actions currently call `registerForClass(item)` and changes signed-in eligible compact actions to open the detail surface first, so agreement controls are visible before submission.

### 4. Concurrency Guard Is Preserved

The top-level plan and chunk 04 both require setting `registrationMutation` before awaiting `productDocuments.accept(...)`, preserving the existing duplicate-submit guard while adding acceptance calls.

## Critical Issues

No critical issues found. The plan is specific, internally consistent, scoped to the assigned task, and actionable from the current repository context.

## Questions for Plan Author

No author-only questions remain. The remaining uncertainties are implementation-time checks already called out by the plan.

## Recommendations

### Implementation

- Treat the installed SDK type check in chunk 01 as mandatory before writing `ProductDocumentPage` or `acceptProductDocument`, because `node_modules` is absent in this worker and the exact export/response shape could not be verified here.
- When adding the pending signup acceptance component, keep `sessionStorage` reads guarded to browser runtime only. This app is Vite/browser-only today, so this is not blocking.
- Prefer one shared registration document error below the agreement block, as chunk 04 shows, to avoid duplicating the same flow-level failure under both checkboxes.

### Verification

- Follow the repository instruction not to start a dev server without explicit approval. Browser smoke should use an already-running localhost server if available.
- Run `npm run lint` after implementation as planned because the changes introduce new SDK calls, route branches, and shared components.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| SDK response/export shape differs from snippets | Medium | Medium | Verify installed SDK types before coding; normalize response fields in one function. |
| Health declaration document type differs from `health_declaration` | Medium | Low | Keep the centralized constant as the single adjustment point. |
| Signup pending marker survives an unusual auth initiation failure | Low | Medium | Chunk 03 clears the marker on thrown or typed signup/OAuth initiation errors and shows explicit retry after post-auth failure. |
| Tiny markdown renderer misses rich formatting | Low | Low | Start with safe headings/paragraphs/lists; revisit only with real published content evidence. |

Highest Risk: SDK type drift, because local `node_modules` was unavailable for this audit. The plan already makes type verification an implementation gate, so this does not block development readiness.

## Pre-Development Checklist

Before implementation starts:

- [x] All planning artifacts requested by the audit phase were read.
- [x] Referenced repository paths were verified or explicitly marked unavailable.
- [x] ClassKit docs cited by the task were checked.
- [x] Acceptance criteria are testable.
- [x] AI autonomy boundaries and stop conditions are defined in the plan.
- [ ] Verify installed `@class-kit/react` product document types before coding.

## Next Steps

1. Execute chunks in the planned order: 01, 02, 03, 04.
2. Stop if installed SDK types contradict the documented product document contract.
3. Complete focused inspections and lint after implementation; browser smoke only on an existing approved dev server.

## Evaluation Matrix

| Dimension | Weight | Raw Score | Weighted Score | Notes |
| --- | --- | --- | --- | --- |
| Completeness | x3 | 5/5 | 15/15 | Covers document routes, shell links, localization, signup gating/post-auth acceptance, registration Terms plus health declaration acceptance, errors, and verification. |
| Feasibility | x3 | 4/5 | 12/15 | Technically feasible against current code and docs; SDK type verification remains an implementation-time gate. |
| Clarity | x2 | 5/5 | 10/10 | Clear chunk boundaries, file maps, code shapes, contexts, and acceptance criteria. |
| Logical Flow | x2 | 5/5 | 10/10 | Dependency order is sound: routes/constants, links/copy, signup, then registration/final verification. |
| Scope & Risk | x2 | 5/5 | 10/10 | Scope stays within requested Terms and health declaration behavior and avoids global legal walls or manager authoring. |
| Developer Experience | x1 | 5/5 | 5/5 | Executor has concrete paths, snippets, verification commands, and stop conditions. |
| AI Readiness | x1 | 5/5 | 5/5 | Autonomy boundaries, ambiguity handling, path verification, and objective checks are explicit. |

Overall: 67/70 -> Ready for Development

Critical Dimension Check: Pass; no x3 dimension scored 1.

## Handoff

PLAN APPROVED FOR IMPLEMENTATION

Key constraints:

- Use only `@class-kit/react`; do not call Supabase, RPCs, raw Edge Functions, admin APIs, or manager-only document APIs.
- Keep agreement acceptance flow-specific; do not add a global blocking legal wall.
- Keep all visible copy localized in English, Hebrew, and Russian.
- Do not start a dev server without explicit approval; use an existing localhost server for smoke checks when available.

Suggested starting point: `docs/design/2026-07-06-classkit-product-documents/plans/01-document-routes-and-rendering.md`.

First milestone: Terms and health declaration routes load anonymous-safe ClassKit document states without unsafe markdown rendering.

Verdict: Ready for Development

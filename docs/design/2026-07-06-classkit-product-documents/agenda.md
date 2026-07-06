# ClassKit Product Documents Design Agenda

## Status

- Spec: `spec.md`
- State: Complete
- Completion gate:
  - Live agenda questions resolved: Yes
  - Pressure test complete: Yes
  - Spec finalized: Yes

## Documented Decisions

- Product websites must use `@class-kit/react` and must not call Supabase, ClassKit tables, RPCs, or raw Edge Functions directly.
- ClassKit product document APIs are available in the installed SDK tag.
- Public document reads are anonymous-safe and product-scoped.
- Acceptances require an authenticated active product user and snapshot the accepted document/version/content.
- The website owns routes, layout, links, copy, and flow-specific agreement UI.
- ClassKit owns document content, versions, locale fallback, acceptance persistence, and authorization.
- Visible copy belongs in `src/i18n.ts` for English, Hebrew, and Russian.
- The task asks for Terms and an ability to add `הצהרת בריאות`; no manager document authoring UI is in scope.

## Questions

### Question 1: Health Declaration Document Type Boundary

- Status: Answered
- Branch type: Initial
- Why it matters: The task asks for `הצהרת בריאות`, but the supplied ClassKit docs name product documents generically and do not document a canonical health declaration type.
- Scenario probe: Noya later publishes the health declaration in ClassKit using a type different from the first implementation. How much website code should change?
- Options:
  - A. Centralize an initial `health_declaration` type constant and use it everywhere - smallest defensible implementation, easy to adjust.
  - B. Build a configurable runtime mapping in website settings - more flexible, but no repository evidence says this app has settings infrastructure.
  - C. Block until the exact ClassKit document type is confirmed - safest, but the task explicitly allows a smallest defensible UI/API boundary when the exact type is not documented.
- Recommendation: A. It satisfies the request and keeps the uncertain type easy to change.
- Answer: A. Use `health_declaration` as the initial type in a single exported constant.
- Answer impact: Resolves branch.
- Spec impact: Adds `productDocumentTypes.healthDeclaration` as the only adjustment point.
- Context impact: Not needed; no repo glossary exists and this is a local implementation constant.
- ADR impact: Not needed; reversible naming boundary.
- Follow-ups: None.

### Question 2: Markdown Rendering Strategy

- Status: Answered
- Branch type: Initial
- Why it matters: ClassKit returns markdown content, but the repo does not currently depend on a markdown renderer. Adding a dependency for legal pages may be broader than needed.
- Scenario probe: A Terms document uses headings, paragraphs, and bullet lists. Should the app add a full markdown parser or render a small safe subset?
- Options:
  - A. Add a tiny local safe renderer for headings, paragraphs, and unordered lists - no dependency, enough for simple documents, limited formatting.
  - B. Add a markdown dependency - more complete, but increases dependency and security review scope.
  - C. Render markdown as plain pre-wrapped text - safest and smallest, but weak visual quality for legal pages.
- Recommendation: A. It is the simplest sufficient design for first adoption while avoiding `dangerouslySetInnerHTML`.
- Answer: A. Use a tiny local safe renderer and revisit only if published documents require richer markdown.
- Answer impact: Resolves branch.
- Spec impact: Public document page owns a local safe markdown subset.
- Context impact: Not needed.
- ADR impact: Not needed; dependency choice is reversible.
- Follow-ups: None.

### Question 3: Signup Acceptance Timing

- Status: Answered
- Branch type: Dependency
- Why it matters: Terms acceptance requires an authenticated active product user, but signup agreement must be visible before the signup action.
- Scenario probe: A visitor selects Google signup, checks Terms, and leaves for OAuth. The app cannot call `accept(...)` before OAuth because no authenticated product user exists.
- Options:
  - A. Require checkbox before signup, write a small pending marker, and complete acceptance from a stable app-level post-auth component after auth is available - matches SDK constraints and survives the existing auth route redirect.
  - B. Call `accept(...)` before signup - impossible under the documented auth requirement.
  - C. Only show a checkbox and never call acceptance - fails the task.
- Recommendation: A. It respects both user-facing agreement and ClassKit's authenticated acceptance contract.
- Answer: A. Checkbox gates signup; `AuthPage` writes the pending marker before password or Google signup, and a stable app-level pending acceptance component completes durable acceptance after the user is authenticated and active.
- Answer impact: Resolves branch.
- Spec impact: Adds pending post-auth acceptance marker for password and Google signup, and explicitly keeps acceptance completion outside `AuthPage` because `AuthPage` redirects on session and can unmount before product-user hydration.
- Context impact: Not needed.
- ADR impact: Not needed; flow follows SDK constraint.
- Follow-ups: None.

### Question 4: Registration Agreement Scope

- Status: Answered
- Branch type: Initial
- Why it matters: The task asks for Terms and health declaration acceptance without adding a global legal wall.
- Scenario probe: A signed-in user opens the site only to read class times. Should they be blocked by Terms/health declaration before browsing?
- Options:
  - A. Require Terms and health declaration only when submitting class registration - flow-specific and aligned with roadmap.
  - B. Require Terms globally after sign-in - broad legal wall, explicitly disallowed by the task.
  - C. Require only health declaration for class registration - misses Terms acceptance for registration.
- Recommendation: A. It keeps agreement snapshots tied to the action that needs them.
- Answer: A. Registration requires both Terms and health declaration agreement immediately before registration.
- Answer impact: Resolves branch.
- Spec impact: `LessonsPage.registerForClass` must accept product documents before `client.classes.register`.
- Context impact: Not needed.
- ADR impact: Not needed.
- Follow-ups: None.

### Question 5: Acceptance Failure Recovery

- Status: Answered
- Branch type: Pressure-test
- Why it matters: If document acceptance fails but registration/signup otherwise could continue, the UI needs a clear policy to avoid unrecorded agreement snapshots.
- Scenario probe: The user checks both boxes and taps Register, but `accept("health_declaration")` returns an SDK error. Should the app still register them?
- Options:
  - A. Block the current action, show a localized recoverable error, and let retry - preserves acceptance integrity.
  - B. Continue registration and show a warning - creates a registration without required agreement snapshot.
  - C. Sign the user out or globally block the site - excessive and unrelated to the flow.
- Recommendation: A. It is the only option that preserves flow-specific acceptance as a prerequisite.
- Answer: A. Acceptance failure blocks only the current signup/registration action and shows a localized retryable message.
- Answer impact: Resolves branch.
- Spec impact: Registration must not call `classes.register` after an acceptance failure.
- Context impact: Not needed.
- ADR impact: Not needed.
- Follow-ups: None.

## Pressure-Test Result

- Status: Complete
- Checked categories: lifecycle, redirect recovery, authenticated acceptance timing, failure modes, route fallback, localization, SDK boundary, verification handoff, and uncertain health document type.
- Result: The design is ready for chunked implementation planning. All material branches are resolved from task context, ClassKit docs, and repository evidence.
- Remaining non-blocking risks:
  - Exact health declaration document type may need correction after product content is configured.
  - Signup post-auth acceptance requires careful `sessionStorage` cleanup and a stable app-level component to avoid missed acceptance or repeated attempts.
  - Tiny markdown renderer may be insufficient if legal documents rely on tables or rich markdown.
  - Card/list register entry points must remain aligned with the detail agreement controls; compact signed-in eligible register actions should open detail rather than submitting without visible agreements.

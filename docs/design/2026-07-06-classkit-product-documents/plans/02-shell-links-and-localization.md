# Chunk 02: Shell Links And Localization

**Plan Set:** `../plan.md`  
**Spec:** `../spec.md`  
**Status:** Ready For Implementation  
**Depends on:** `01-document-routes-and-rendering.md`  
**Enables:** `03-signup-terms-acceptance.md`, `04-registration-health-declaration-acceptance.md`

## Goal

Expose document navigation in the existing Noya shell and add the localized copy needed for public document pages and agreement controls.

## Source Artifacts

- `../spec.md`: Links, User-Facing Behavior, Testing Strategy.
- `../agenda.md`: Documented decisions.
- `src/features/landing/mobile-menu.tsx`
- `src/features/landing/contact-section.tsx`
- `src/components/site/sidebar-link.tsx`
- `src/content/site-content.ts`
- `src/i18n.ts`
- `DESIGN_GUIDE.md`

## Relationships

- **Depends on:** `termsPath` and `healthDeclarationPath` from chunk 01.
- **Enables:** Agreement UI can use localized labels and document links.
- **Shared contracts:** `documents.*`, `auth.documents.*`, `classes.documents.*` i18n namespaces.
- **Integration points:** footer/contact area, mobile menu, i18n resources.

## File Responsibility Map

**Modify:**
- `src/features/landing/mobile-menu.tsx` - add Terms and health declaration links using existing `SidebarLink`.
- `src/features/landing/contact-section.tsx` - add compact document links near footer copyright.
- `src/i18n.ts` - add all public document and agreement copy for `en`, `he`, `ru`.

**Test:**
- No automated tests. Use `rg` and browser smoke when a dev server exists.

## Implementation Tasks

### Task 1: Add Localized Copy

**Files:**
- Modify: `src/i18n.ts`

- [ ] Add these keys under each language's `translation` object, translated for Hebrew and Russian.

```ts
documents: {
  terms: {
    title: "Terms of Service",
    label: "Terms",
    empty: "Terms are not published yet.",
  },
  healthDeclaration: {
    title: "Health declaration",
    label: "Health declaration",
    empty: "The health declaration is not published yet.",
  },
  loading: "Loading document.",
  unavailable: "Documents are not available right now.",
  errorTitle: "Document could not load",
  errorBody: "Try opening it again in a moment.",
  retry: "Retry",
  version: "Version {{version}}",
  back: "Back",
},
auth: {
  // keep existing keys
  documents: {
    termsRequired: "Confirm the Terms before creating an account.",
    acceptTerms: "I agree to the Terms of Service.",
    acceptanceFailed: "Your account was created, but Terms acceptance could not be recorded. Try again from your profile before registering for a class.",
  },
},
classes: {
  // keep existing keys
  documents: {
    title: "Before registration",
    termsRequired: "Confirm the Terms before registering.",
    healthRequired: "Confirm the health declaration before registering.",
    acceptTerms: "I agree to the Terms of Service.",
    acceptHealthDeclaration: "I confirm the health declaration.",
    acceptanceFailed: "Agreement could not be recorded. Registration was not submitted.",
  },
},
footerLinks: {
  terms: "Terms",
  healthDeclaration: "Health declaration",
},
```

Use natural Hebrew and Russian equivalents. Hebrew should remain RTL-safe and should use `הצהרת בריאות` for the health declaration label.

### Task 2: Add Mobile Menu Links

**Files:**
- Modify: `src/features/landing/mobile-menu.tsx`

- [ ] Import paths:

```ts
import { healthDeclarationPath, lessonsPath, termsPath } from "@/content/site-content";
```

- [ ] Add the links after the main navigation links and before contact/social details:

```tsx
<div className="mt-3 grid gap-2 border-t border-blush/18 pt-3">
  <SidebarLink href={termsPath} onClick={onClose} onNavigate={onNavigate}>
    {t("footerLinks.terms")}
  </SidebarLink>
  <SidebarLink href={healthDeclarationPath} onClick={onClose} onNavigate={onNavigate}>
    {t("footerLinks.healthDeclaration")}
  </SidebarLink>
</div>
```

If the extra divider visually crowds the menu, use the existing menu row style without adding a new card.

### Task 3: Add Footer Links

**Files:**
- Modify: `src/features/landing/contact-section.tsx`

- [ ] Import paths:

```ts
import { healthDeclarationPath, termsPath } from "@/content/site-content";
```

- [ ] Replace the single footer copyright band with a compact stack that keeps the copyright and adds links.

```tsx
<div className="mt-5 rounded-t-md bg-blush px-4 py-3 text-center text-xs text-primary-foreground">
  <p>{t("footer")}</p>
  <nav className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
    <a className="underline-offset-4 hover:underline" href={termsPath}>
      {t("footerLinks.terms")}
    </a>
    <a className="underline-offset-4 hover:underline" href={healthDeclarationPath}>
      {t("footerLinks.healthDeclaration")}
    </a>
  </nav>
</div>
```

The footer links can be plain anchors because the existing app supports direct path routing on load. If implementers want client-side routing, add an `onNavigate` prop only if that matches existing landing component boundaries without churn.

## Verification

- Run: `rtk rg -n "footerLinks|documents:|auth: \\{|classes: \\{" src/i18n.ts`
  - Expected: document and agreement keys exist in all three language blocks.
- Run: `rtk rg -n "termsPath|healthDeclarationPath" src/features/landing`
  - Expected: both shell surfaces reference the paths.
- Browser smoke on existing dev server:
  - Mobile menu shows Terms and health declaration links without text overflow.
  - Footer shows compact policy links.
  - Links navigate to the routes from chunk 01.

## Acceptance Criteria Covered

- Terms link is exposed in shell/footer/menu area.
- Health declaration route is discoverable.
- New user-facing strings are localized.
- Existing mobile-first Noya style is preserved.

## Risks And Rollback

- Risk: Footer plain anchors cause full reload rather than client navigation. This is acceptable for static routes but can be replaced with `onNavigate` if the landing boundary already passes it cleanly.
- Rollback: remove the links and i18n keys.

## Non-Goals

- No new global site footer component.
- No privacy/accessibility/storage document expansion beyond the requested Terms and health declaration scope.

## Type And Name Consistency

Before finalizing, verify that all i18n keys referenced by `mobile-menu.tsx` and `contact-section.tsx` exist in `en`, `he`, and `ru`.

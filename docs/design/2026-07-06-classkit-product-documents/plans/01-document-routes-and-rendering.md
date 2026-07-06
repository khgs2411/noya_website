# Chunk 01: Document Routes And Rendering

**Plan Set:** `../plan.md`  
**Spec:** `../spec.md`  
**Status:** Ready For Implementation  
**Depends on:** Current app route model and ClassKit client context  
**Enables:** `02-shell-links-and-localization.md`, `03-signup-terms-acceptance.md`, `04-registration-health-declaration-acceptance.md`

## Goal

Add the core product-document boundary: centralized document type constants, `/terms` and `/health-declaration` route helpers, lazy document route rendering, and anonymous-safe document loading through `client.productDocuments.get`.

## Source Artifacts

- `../spec.md`: Public Document Pages, Document Type And Locale Boundary, Public Document Page, Routing, Error Handling.
- `../agenda.md`: Questions 1 and 2.
- `src/App.tsx`
- `src/content/site-content.ts`
- `src/i18n.ts`
- `src/components/ui/button.tsx`
- `src/lib/utils.ts`
- `/Users/liadgoren/Repositories/class-kit/docs/sdk/client-sdk.md#product-documents`

## Relationships

- **Depends on:** Existing `navigateTo`, lazy route pattern, and `useProductContext()` provider.
- **Enables:** Shared links and agreement components can reference stable document paths and constants.
- **Shared contracts:** `termsPath`, `healthDeclarationPath`, `productDocumentTypes`, `productDocumentFallbackLocale`.
- **Integration points:** `src/App.tsx`, `src/content/site-content.ts`, `src/features/documents/product-document-page.tsx`, `src/features/documents/product-document-types.ts`.

## File Responsibility Map

**Create:**
- `src/features/documents/product-document-types.ts` - document type constants and fallback locale.
- `src/features/documents/product-document-page.tsx` - public page, SDK read, and tiny safe markdown renderer.

**Modify:**
- `src/content/site-content.ts` - add document route path constants and route predicates.
- `src/App.tsx` - add lazy document page route branches.
- `src/i18n.ts` - add minimal document route loading/error/empty labels if chunk 2 has not already added them.

**Test:**
- No automated tests currently exist for route rendering. Use focused lint and browser smoke when a dev server is available.

## Implementation Tasks

### Task 1: Add Document Constants

**Files:**
- Create: `src/features/documents/product-document-types.ts`

- [ ] Create the constants exactly once.

```ts
export const productDocumentTypes = {
  terms: "terms",
  healthDeclaration: "health_declaration",
} as const;

export type ProductDocumentType =
  (typeof productDocumentTypes)[keyof typeof productDocumentTypes];

export const productDocumentFallbackLocale = "en";
```

### Task 2: Add Route Constants

**Files:**
- Modify: `src/content/site-content.ts`

- [ ] Add route constants next to existing `lessonsPath`, `authPath`, `profilePath`, and `managerPath`.

```ts
export const termsPath = "terms";
export const healthDeclarationPath = "health-declaration";
```

- [ ] Add route helpers next to the existing path predicates.

```ts
export function isTermsPath(pathname: string) {
  return pathname.replace(/\/+$/, "").endsWith("/terms");
}

export function isHealthDeclarationPath(pathname: string) {
  return pathname.replace(/\/+$/, "").endsWith("/health-declaration");
}
```

### Task 3: Create Public Document Page

**Files:**
- Create: `src/features/documents/product-document-page.tsx`

- [ ] Verify exact SDK response property names from installed types before coding. The intended component shape is:

```tsx
import { useProductContext } from "@class-kit/react";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  productDocumentFallbackLocale,
  type ProductDocumentType,
} from "@/features/documents/product-document-types";

type ProductDocumentPageProps = {
  documentType: ProductDocumentType;
  titleKey: string;
  emptyKey: string;
  onNavigate: (path: string) => void;
};

type LoadStatus = "idle" | "loading" | "loaded" | "error";

type LoadedDocument = {
  title: string;
  contentMarkdown: string;
  locale?: string | null;
  version?: number | string | null;
};
```

- [ ] Implement a local normalizer after checking SDK types. ClassKit local source currently defines `ProductDocumentGetResponse = { document: ProductDocument }`, so pass `result.data.document` into this normalizer, not `result.data`. Prefer documented response fields such as `document.title` and `document.content_markdown`; if the installed SDK exposes camelCase fields, normalize them in one function.

```ts
function normalizeDocument(raw: unknown): LoadedDocument | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const title = record.title;
  const content = record.content_markdown ?? record.contentMarkdown;

  if (typeof title !== "string" || typeof content !== "string") return null;

  return {
    title,
    contentMarkdown: content,
    locale: typeof record.locale === "string" ? record.locale : null,
    version:
      typeof record.version === "string" || typeof record.version === "number"
        ? record.version
        : null,
  };
}
```

- [ ] Implement a tiny safe markdown renderer without `dangerouslySetInnerHTML`.

```tsx
function MarkdownBlock({ markdown }: { markdown: string }) {
  const blocks = useMemo(() => markdown.split(/\n{2,}/), [markdown]);

  return (
    <div className="mt-6 grid gap-4 text-sm leading-7 text-foreground/74 sm:text-base sm:leading-8">
      {blocks.map((block, index) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith("### ")) {
          return <h3 key={index} className="font-serif text-2xl text-foreground">{trimmed.slice(4)}</h3>;
        }

        if (trimmed.startsWith("## ")) {
          return <h2 key={index} className="font-serif text-3xl text-foreground">{trimmed.slice(3)}</h2>;
        }

        if (trimmed.startsWith("# ")) {
          return <h1 key={index} className="font-serif text-4xl text-foreground">{trimmed.slice(2)}</h1>;
        }

        const lines = trimmed.split("\n");
        if (lines.every((line) => line.trim().startsWith("- "))) {
          return (
            <ul key={index} className="grid list-disc gap-2 ps-6">
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>{line.trim().slice(2)}</li>
              ))}
            </ul>
          );
        }

        return <p key={index} className="whitespace-pre-line [overflow-wrap:anywhere]">{trimmed}</p>;
      })}
    </div>
  );
}
```

- [ ] Implement `ProductDocumentPage` to call:

```ts
const result = await client.productDocuments.get(documentType, {
  locale: i18n.language,
  fallbackLocale: productDocumentFallbackLocale,
});
```

- [ ] Read the nested response document explicitly:

```ts
const document = normalizeDocument(result.data?.document);
```

- [ ] If `client` is unavailable, show `documents.unavailable`. If the SDK returns an error, show the message or `documents.errorBody`. If `result.data?.document` is missing or normalization returns null, show `emptyKey`.

### Task 4: Add App Route Branches

**Files:**
- Modify: `src/App.tsx`

- [ ] Import route helpers and document constants.

```ts
import {
  healthDeclarationPath,
  isHealthDeclarationPath,
  isTermsPath,
  termsPath,
} from "@/content/site-content";
import { productDocumentTypes } from "@/features/documents/product-document-types";
```

- [ ] Add a lazy import:

```ts
const ProductDocumentPage = lazy(() =>
  import("@/features/documents/product-document-page").then((module) => ({
    default: module.ProductDocumentPage,
  })),
);
```

- [ ] Add route branches before the lessons route:

```tsx
if (isTermsPath(route.pathname)) {
  return renderPage(
    <ProductDocumentPage
      documentType={productDocumentTypes.terms}
      titleKey="documents.terms.title"
      emptyKey="documents.terms.empty"
      onNavigate={navigateTo}
    />,
    true,
  );
}

if (isHealthDeclarationPath(route.pathname)) {
  return renderPage(
    <ProductDocumentPage
      documentType={productDocumentTypes.healthDeclaration}
      titleKey="documents.healthDeclaration.title"
      emptyKey="documents.healthDeclaration.empty"
      onNavigate={navigateTo}
    />,
    true,
  );
}
```

Remove unused imports if route constants are not directly used in `App.tsx`.

## Verification

- Run: `rtk rg -n "productDocumentTypes|termsPath|healthDeclarationPath|isTermsPath|isHealthDeclarationPath" src`
  - Expected: constants and route helpers are present and consumed.
- Run: `rtk rg -n "dangerouslySetInnerHTML|functions\\.invoke|\\.rpc\\(|supabase" src/features/documents src/App.tsx src/content/site-content.ts`
  - Expected: no matches for unsafe markdown or raw backend calls.
- Run: `npm run lint`
  - Expected: passes, or any failures are pre-existing and unrelated.
- Browser smoke only if an existing dev server is available:
  - Open `/terms` and `/health-declaration`.
  - Expected: loading, loaded, error, or empty states render without crashing for anonymous visitors.

## Acceptance Criteria Covered

- Terms route exists.
- Health declaration route exists.
- Product document reads use `client.productDocuments.get`.
- Locale and fallback locale are passed.
- Missing/unpublished states do not crash.
- Health declaration type is easy to adjust.

## Risks And Rollback

- Risk: SDK response fields differ from documented examples. Mitigation: verify installed types first and keep normalization in one function.
- Risk: tiny markdown renderer is too limited. Mitigation: keep it safe and dependency-free for first implementation; escalate only with real document content evidence.
- Rollback: remove the new route branches and document feature files.

## Non-Goals

- No manager UI for editing product documents.
- No long legal or health content in the repo.
- No global agreement wall.

## Type And Name Consistency

Before finalizing, verify that route names, document type constants, import paths, and i18n keys match exactly across all touched files.

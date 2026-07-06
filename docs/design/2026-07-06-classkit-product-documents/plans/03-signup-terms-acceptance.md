# Chunk 03: Signup Terms Acceptance

**Plan Set:** `../plan.md`  
**Spec:** `../spec.md`  
**Status:** Ready For Implementation  
**Depends on:** `01-document-routes-and-rendering.md`, `02-shell-links-and-localization.md`  
**Enables:** Signup Terms acceptance completion and agreement helper reuse

## Goal

Add flow-specific Terms agreement to signup. `AuthPage` must require Terms confirmation before password or Google signup begins and write a small pending marker. Signup-mode initiation must use `classKitClient.auth.signUp(...)` and `classKitClient.auth.signInWithGoogle()` directly so typed SDK initiation errors can clear the marker deterministically. A stable app-level component, rendered outside route-specific lazy pages, must complete ClassKit Terms acceptance with context `"signup"` after the user is authenticated and active.

## Source Artifacts

- `../spec.md`: Signup Terms Acceptance, Agreement UI Boundary, Pending Signup Acceptance Boundary, Permissions / Security / Privacy.
- `../agenda.md`: Question 3 and Question 5.
- `src/App.tsx`
- `src/features/account/auth-page.tsx`
- `src/features/documents/product-document-types.ts`
- `src/content/site-content.ts`
- `src/i18n.ts`
- `src/lib/class-kit-client.ts`
- `src/components/ui/toast.tsx`
- `/Users/liadgoren/Repositories/class-kit/docs/sdk/client-sdk.md#product-documents`
- `/Users/liadgoren/Repositories/class-kit/docs/sdk/client-sdk.md#authentication-methods`

## Relationships

- **Depends on:** document constants, `termsPath`, localized Terms agreement copy, and product document fallback locale.
- **Enables:** reusable acceptance helper for class registration.
- **Shared contracts:** `acceptProductDocument(client, documentType, locale, context)`, `markPendingSignupTermsAcceptance()`, `clearPendingSignupTermsAcceptance()`, `PendingSignupTermsAcceptance`, direct signup initiation through `classKitClient.auth.*`.
- **Integration points:** `AuthPage`, `App`, ClassKit auth context, `sessionStorage`, Terms document route, existing toast visual pattern.

## File Responsibility Map

**Create:**
- `src/features/documents/document-agreement.tsx` - reusable checkbox/link component and acceptance helper.
- `src/features/documents/pending-signup-terms-acceptance.tsx` - pending marker helpers, stable post-auth acceptance effect, retry UI.

**Modify:**
- `src/features/account/auth-page.tsx` - signup checkbox gating, direct signup initiation through the shared ClassKit client, pending marker writing and failed-initiation cleanup before password/Google signup.
- `src/App.tsx` - render the stable pending acceptance component once inside the app shell.
- `src/i18n.ts` - add any missing signup acceptance/retry keys from chunk 2.

**Test:**
- Focused inspection and lint. Browser smoke when an existing dev server and auth test account are available.

## Implementation Tasks

### Task 1: Create Agreement Component And Acceptance Helper

**Files:**
- Create: `src/features/documents/document-agreement.tsx`

- [ ] Add the reusable component and helper.

```tsx
import type { ClassKitClient } from "@class-kit/react";
import { ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  productDocumentFallbackLocale,
  type ProductDocumentType,
} from "@/features/documents/product-document-types";
import { cn } from "@/lib/utils";

export async function acceptProductDocument(
  client: ClassKitClient,
  documentType: ProductDocumentType,
  locale: string,
  context: string,
) {
  return client.productDocuments.accept(documentType, {
    locale,
    fallbackLocale: productDocumentFallbackLocale,
    context,
  });
}

type DocumentAgreementProps = {
  checked: boolean;
  labelKey: string;
  linkLabelKey: string;
  documentPath: string;
  disabled?: boolean;
  error?: string | null;
  className?: string;
  onCheckedChange: (checked: boolean) => void;
};

export function DocumentAgreement({
  checked,
  labelKey,
  linkLabelKey,
  documentPath,
  disabled = false,
  error = null,
  className,
  onCheckedChange,
}: DocumentAgreementProps) {
  const { t } = useTranslation();

  return (
    <div className={cn("grid gap-2 rounded-xl border border-blush/24 bg-background/46 p-3 text-sm", className)}>
      <label className="flex min-w-0 items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 size-4 shrink-0 accent-blush-strong"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onCheckedChange(event.target.checked)}
        />
        <span className="min-w-0 leading-6 text-foreground/72">
          {t(labelKey)}{" "}
          <a
            className="inline-flex items-center gap-1 font-semibold text-blush-strong underline-offset-4 hover:underline"
            href={documentPath}
            target="_blank"
            rel="noreferrer"
          >
            {t(linkLabelKey)}
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
        </span>
      </label>
      {error && <p className="text-sm leading-6 text-blush-strong">{error}</p>}
    </div>
  );
}
```

If the installed SDK does not export `ClassKitClient` with `productDocuments`, derive the client type from `NonNullable<ReturnType<typeof useProductContext>["client"]>` in this local file after checking installed types.

### Task 2: Create Stable Pending Signup Acceptance Component

**Files:**
- Create: `src/features/documents/pending-signup-terms-acceptance.tsx`

- [ ] Add marker helpers and an app-level component. Keep the marker limited to document type/context intent.

```tsx
import { useProductContext } from "@class-kit/react";
import { RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { acceptProductDocument } from "@/features/documents/document-agreement";
import { productDocumentTypes } from "@/features/documents/product-document-types";

const PENDING_SIGNUP_TERMS_ACCEPTANCE_KEY = "noya.pendingSignupTermsAcceptance";

type PendingSignupTermsAcceptanceMarker = {
  documentType: typeof productDocumentTypes.terms;
  context: "signup";
};

export function markPendingSignupTermsAcceptance() {
  window.sessionStorage.setItem(
    PENDING_SIGNUP_TERMS_ACCEPTANCE_KEY,
    JSON.stringify({
      documentType: productDocumentTypes.terms,
      context: "signup",
    } satisfies PendingSignupTermsAcceptanceMarker),
  );
}

export function clearPendingSignupTermsAcceptance() {
  window.sessionStorage.removeItem(PENDING_SIGNUP_TERMS_ACCEPTANCE_KEY);
}

function hasPendingSignupTermsAcceptance() {
  return window.sessionStorage.getItem(PENDING_SIGNUP_TERMS_ACCEPTANCE_KEY) !== null;
}

export function PendingSignupTermsAcceptance() {
  const { t, i18n } = useTranslation();
  const { client, productUser, session } = useProductContext();
  const [failed, setFailed] = useState(false);
  const [submittingRetry, setSubmittingRetry] = useState(false);
  const attemptedKeyRef = useRef<string | null>(null);

  const userId = session?.user.id ?? null;
  const canAttempt =
    Boolean(client) &&
    Boolean(userId) &&
    productUser?.status === "active" &&
    hasPendingSignupTermsAcceptance();

  const acceptPendingTerms = useCallback(async () => {
    if (!client || !userId || productUser?.status !== "active") return false;

    const result = await acceptProductDocument(
      client,
      productDocumentTypes.terms,
      i18n.language,
      "signup",
    );

    if (result.error) return false;

    clearPendingSignupTermsAcceptance();
    setFailed(false);
    attemptedKeyRef.current = null;
    return true;
  }, [client, i18n.language, productUser?.status, userId]);

  useEffect(() => {
    if (!canAttempt || !userId) return;

    const attemptKey = `${userId}:${i18n.language}`;
    if (attemptedKeyRef.current === attemptKey) return;
    attemptedKeyRef.current = attemptKey;

    let cancelled = false;

    async function runAcceptance() {
      try {
        const accepted = await acceptPendingTerms();
        if (!cancelled && !accepted) setFailed(true);
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    void runAcceptance();

    return () => {
      cancelled = true;
    };
  }, [acceptPendingTerms, canAttempt, i18n.language, userId]);

  if (!failed || !session || !hasPendingSignupTermsAcceptance()) return null;

  return (
    <div
      className="fixed inset-x-3 top-3 z-[70] rounded-xl border border-blush-strong/55 bg-card/95 p-4 text-foreground shadow-soft backdrop-blur sm:inset-x-auto sm:w-96 ltr:sm:left-4 rtl:sm:right-4 md:bottom-4 md:top-auto"
      role="status"
      aria-live="polite"
    >
      <div className="grid gap-3">
        <div className="grid gap-1">
          <p className="font-serif text-lg leading-6">
            {t("auth.documents.acceptanceFailedTitle")}
          </p>
          <p className="text-sm leading-5 text-foreground/68">
            {t("auth.documents.acceptanceFailedBody")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            className="rounded-full bg-blush text-primary-foreground hover:bg-blush-strong"
            disabled={submittingRetry}
            onClick={async () => {
              setSubmittingRetry(true);
              try {
                const accepted = await acceptPendingTerms();
                if (!accepted) setFailed(true);
              } catch {
                setFailed(true);
              } finally {
                setSubmittingRetry(false);
              }
            }}
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            {t("actions.retry")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-full"
            onClick={() => setFailed(false)}
          >
            <X className="size-4" aria-hidden="true" />
            {t("actions.close")}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

If `client.productDocuments.accept(...)` throws rather than returning `{ error }`, keep the `try/catch` paths and map failures to the same localized retry notice. If `session.user.id` has a different installed SDK shape, use the stable authenticated user id exposed by the installed `session` type.

### Task 3: Render Pending Acceptance From The App Shell

**Files:**
- Modify: `src/App.tsx`

- [ ] Add a lazy import or direct import. Prefer direct import if the component is small and route-independent.

```ts
import { PendingSignupTermsAcceptance } from "@/features/documents/pending-signup-terms-acceptance";
```

- [ ] Render it once from `renderPage`, outside `Suspense` page content and alongside existing global notices.

```tsx
function renderPage(page: ReactNode, showHeader: boolean) {
  return (
    <>
      {renderWithMenu(page, showHeader)}
      <PendingSignupTermsAcceptance />
      <InstallAppPrompt />
      <BrowserStorageNotice />
    </>
  );
}
```

This placement is required. Do not move the pending acceptance effect into `AuthPage`; the current `AuthPage` redirects to profile when `session` exists and can unmount before `productUser?.status === "active"` is available.

### Task 4: Gate Signup Submission And Write Pending Marker

**Files:**
- Modify: `src/features/account/auth-page.tsx`

- [ ] Add imports:

```ts
import { termsPath } from "@/content/site-content";
import { DocumentAgreement } from "@/features/documents/document-agreement";
import {
  clearPendingSignupTermsAcceptance,
  markPendingSignupTermsAcceptance,
} from "@/features/documents/pending-signup-terms-acceptance";
import { classKitClient } from "@/lib/class-kit-client";
```

- [ ] Update the `useProductContext()` destructuring. Keep `signIn` and `signInWithGoogle` for existing sign-in behavior, add `refreshProductContext`, and stop using the context `signUp` wrapper in signup mode because its contract is `Promise<void>`.

```ts
const {
  product,
  session,
  loading,
  error,
  signIn,
  signInWithGoogle,
  refreshProductContext,
} = useProductContext();
```

- [ ] Add state:

```ts
const [termsAccepted, setTermsAccepted] = useState(false);
const [termsAcceptanceError, setTermsAcceptanceError] = useState<string | null>(null);
const [authActionError, setAuthActionError] = useState<string | null>(null);
```

- [ ] Add a local typed-error extractor inside `AuthPage`, before `handleSubmit`. This avoids truthiness-checking `void` provider wrapper results and works with the direct SDK calls.

```ts
function getSdkErrorMessage(result: unknown) {
  if (!result || typeof result !== "object" || !("error" in result)) {
    return null;
  }

  const { error: sdkError } = result as { error?: unknown };
  if (!sdkError) return null;
  if (typeof sdkError === "string") return sdkError;

  if (
    typeof sdkError === "object" &&
    sdkError !== null &&
    "message" in sdkError &&
    typeof (sdkError as { message?: unknown }).message === "string"
  ) {
    return (sdkError as { message: string }).message;
  }

  return t("auth.unavailable");
}
```

- [ ] In `handleSubmit`, reject unchecked signup before `setSubmitting(true)` and before starting password signup initiation.

```ts
if (visibleMode === "signup" && !termsAccepted) {
  setSubmitted(true);
  setTermsAcceptanceError(t("auth.documents.termsRequired"));
  return;
}
```

- [ ] For password signup, write the pending marker immediately before `classKitClient.auth.signUp(email, password)`, then clear it if that direct SDK call throws or returns a typed error. Keep the marker only when signup initiation succeeds. After successful no-redirect password signup, call `refreshProductContext()` so the provider hydrates the new session/product user and the app-level pending acceptance component can run.

```ts
if (visibleMode === "signup") {
  markPendingSignupTermsAcceptance();
  try {
    const result = await classKitClient.auth.signUp(email, password);
    const sdkErrorMessage = getSdkErrorMessage(result);

    if (sdkErrorMessage) {
      clearPendingSignupTermsAcceptance();
      setAuthActionError(sdkErrorMessage);
      return;
    }

    setAuthActionError(null);
    await refreshProductContext();
  } catch (error) {
    clearPendingSignupTermsAcceptance();
    setAuthActionError(
      error instanceof Error ? error.message : t("auth.unavailable"),
    );
    return;
  }
} else {
  await signIn(email, password);
}
```

- [ ] In `handleGoogle`, require Terms in signup mode and write the pending marker before direct `classKitClient.auth.signInWithGoogle()`. Clear the marker if OAuth initiation throws or returns a typed error before redirecting. Keep the existing context `signInWithGoogle()` call for sign-in mode because no pending marker cleanup is involved there.

```ts
if (visibleMode === "signup" && !termsAccepted) {
  setSubmitted(true);
  setTermsAcceptanceError(t("auth.documents.termsRequired"));
  return;
}

if (visibleMode === "signup") {
  markPendingSignupTermsAcceptance();
  try {
    const result = await classKitClient.auth.signInWithGoogle();
    const sdkErrorMessage = getSdkErrorMessage(result);

    if (sdkErrorMessage) {
      clearPendingSignupTermsAcceptance();
      setAuthActionError(sdkErrorMessage);
      return;
    }

    setAuthActionError(null);
  } catch (error) {
    clearPendingSignupTermsAcceptance();
    setAuthActionError(
      error instanceof Error ? error.message : t("auth.unavailable"),
    );
    return;
  }

  return;
}

await signInWithGoogle();
```

Do not add an acceptance `useEffect` to `AuthPage`.

- [ ] Render direct SDK initiation errors alongside the existing provider error.

```tsx
{submitted && (authActionError || error) && (
  <p className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm leading-6 text-red-700 dark:text-red-200">
    {authActionError ?? error}
  </p>
)}
```

Replace the existing `{submitted && error && (...)}` block with this combined condition.

### Task 5: Render Terms Agreement In Signup Mode

**Files:**
- Modify: `src/features/account/auth-page.tsx`

- [ ] Render before signup buttons/forms submit action when `visibleMode === "signup"`.

```tsx
{visibleMode === "signup" && (
  <DocumentAgreement
    checked={termsAccepted}
    labelKey="auth.documents.acceptTerms"
    linkLabelKey="documents.terms.label"
    documentPath={termsPath}
    disabled={submitting || loading}
    error={termsAcceptanceError}
    onCheckedChange={(checked) => {
      setTermsAccepted(checked);
      if (checked) setTermsAcceptanceError(null);
    }}
  />
)}
```

Place it close enough to both password and Google signup actions that it clearly gates account creation.

### Task 6: Add Missing Localized Retry Copy

**Files:**
- Modify: `src/i18n.ts`

- [ ] Ensure these keys exist in English, Hebrew, and Russian:

```ts
auth: {
  documents: {
    acceptTerms: "...",
    termsRequired: "...",
    acceptanceFailed: "...",
    acceptanceFailedTitle: "...",
    acceptanceFailedBody: "...",
  },
}
```

If `actions.retry` does not already exist in all three locales, add it near existing action labels.

## Verification

- Run: `rtk rg -n "PendingSignupTermsAcceptance|markPendingSignupTermsAcceptance|clearPendingSignupTermsAcceptance|PENDING_SIGNUP_TERMS_ACCEPTANCE_KEY|acceptProductDocument|DocumentAgreement" src/App.tsx src/features/account src/features/documents`
  - Expected: `App` renders `PendingSignupTermsAcceptance`; `AuthPage` imports `markPendingSignupTermsAcceptance` and `clearPendingSignupTermsAcceptance`; marker helpers live only in `pending-signup-terms-acceptance.tsx`; agreement helper exists.
- Run: `rtk rg -n "acceptProductDocument|productDocuments\\.accept" src/features/account/auth-page.tsx`
  - Expected: no matches. `AuthPage` must not own post-auth acceptance.
- Run: `rtk rg -n "const result = await (signUp|signInWithGoogle)\\(|result && \"error\" in result|result\\.error" src/features/account/auth-page.tsx`
  - Expected: no matches. `AuthPage` must not inspect return values from `useProductContext()` auth wrappers.
- Run: `rtk rg -n "classKitClient\\.auth\\.(signUp|signInWithGoogle)|refreshProductContext|authActionError" src/features/account/auth-page.tsx`
  - Expected: signup mode uses `classKitClient.auth.signUp`, Google signup uses `classKitClient.auth.signInWithGoogle`, successful password signup refreshes product context, and direct SDK errors render through `authActionError`.
- Run: `rtk rg -n "sessionStorage" src/features/account src/features/documents`
  - Expected: pending marker only; no document content or personal data stored.
- Run: `rtk rg -n "functions\\.invoke|\\.rpc\\(|supabase|management\\.productDocuments" src/features/account src/features/documents`
  - Expected: no matches.
- Run: `npm run lint`
  - Expected: passes, or failures are reported with pre-existing/new classification.
- Browser smoke on existing dev server with auth configured:
  - Signup submit without checkbox shows localized Terms-required message.
  - Signup with checkbox starts existing password or Google signup flow.
  - After auth redirects to profile, the app-level component attempts Terms acceptance with context `"signup"`.
  - If acceptance fails, a localized retry notice appears without signing the user out or blocking public routes.

## Acceptance Criteria Covered

- Signup flow shows Terms acceptance affordance.
- Signup action is gated before calling ClassKit signup.
- Authenticated product user acceptance uses `terms`, active locale, fallback locale, and context `"signup"`.
- Password and Google signup have a post-auth acceptance recovery path that survives the existing auth redirect.

## Risks And Rollback

- Risk: password signup may not immediately create a session. Mitigation: successful direct password signup calls `refreshProductContext()`, and the pending marker component handles delayed auth if hydration is asynchronous.
- Risk: repeated acceptance attempts if SDK returns a persistent failure. Mitigation: one automatic attempt per authenticated user/locale/mount transition, then explicit retry.
- Risk: pending marker remains after a permanent server-side failure. Mitigation: retry notice keeps the failure visible to the authenticated user; clearing happens only after successful acceptance.
- Risk: pending marker survives a failed signup initiation. Mitigation: signup mode uses direct `classKitClient.auth.*` initiation calls and clears the marker when password signup or Google OAuth initiation throws or returns a typed error.
- Rollback: remove `PendingSignupTermsAcceptance` from `App`, remove agreement rendering and marker import from `AuthPage`, and remove the two documents feature files created in this chunk.

## Non-Goals

- No global Terms wall after sign-in.
- No health declaration acceptance during account creation.
- No manager document authoring.
- No durable legal/health content storage in this website.

## Type And Name Consistency

Before finalizing, verify that `client`, `session`, `productUser`, `i18n`, and `t` are in scope where used; that all i18n keys exist in three languages; that `AuthPage` imports `classKitClient`; that `AuthPage` does not inspect `void` context auth wrapper results; and that `AuthPage` only writes/clears the pending marker while `PendingSignupTermsAcceptance` owns acceptance completion.

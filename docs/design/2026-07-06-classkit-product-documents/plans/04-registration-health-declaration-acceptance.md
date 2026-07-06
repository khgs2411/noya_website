# Chunk 04: Registration Health Declaration Acceptance

**Plan Set:** `../plan.md`  
**Spec:** `../spec.md`  
**Status:** Ready For Implementation  
**Depends on:** `01-document-routes-and-rendering.md`, `02-shell-links-and-localization.md`, `03-signup-terms-acceptance.md`  
**Enables:** Implementation completion

## Goal

Require and record Terms plus health declaration acceptances before class registration. Acceptance failures must prevent registration while preserving existing signed-out, membership-required, pending, approved, cancellation, and duplicate-submit behavior.

## Source Artifacts

- `../spec.md`: Class Registration Terms And Health Declaration, Registration Integration, Error Handling, Testing Strategy.
- `../agenda.md`: Questions 1, 4, and 5.
- `src/features/lessons/lessons-page.tsx`
- `src/features/documents/document-agreement.tsx`
- `src/features/documents/product-document-types.ts`
- `src/content/site-content.ts`
- `src/i18n.ts`
- `/Users/liadgoren/Repositories/class-kit/docs/sdk/client-sdk.md#product-documents`

## Relationships

- **Depends on:** document agreement component and acceptance helper from chunk `03`, plus document constants and localized copy from chunks `01` and `02`.
- **Enables:** Final feature acceptance.
- **Shared contracts:** registration acceptance contexts `"registration"` and `"registration_health_declaration"`; existing `registrationMutation` remains the busy guard before async acceptance and registration calls.
- **Integration points:** `renderClassActions(item, options)`, card/list `ClassCard` actions, selected class detail modal, `registerForClass(item)`, existing registration mutation state.

## File Responsibility Map

**Modify:**
- `src/features/lessons/lessons-page.tsx` - registration agreement state, UI, and acceptance-before-register mutation boundary.
- `src/i18n.ts` - any missing class agreement keys.

**Test:**
- Focused inspection, lint, and browser smoke when an existing dev server is available.

## Implementation Tasks

### Task 1: Add Imports And Agreement State

**Files:**
- Modify: `src/features/lessons/lessons-page.tsx`

- [ ] Add imports:

```ts
import { healthDeclarationPath, authPath, termsPath } from "@/content/site-content";
import { DocumentAgreement, acceptProductDocument } from "@/features/documents/document-agreement";
import { productDocumentTypes } from "@/features/documents/product-document-types";
```

If `authPath` is already imported, merge the new paths into the existing import.

- [ ] Add state near existing registration mutation state:

```ts
const [registrationTermsAccepted, setRegistrationTermsAccepted] = useState(false);
const [healthDeclarationAccepted, setHealthDeclarationAccepted] = useState(false);
const [documentAcceptanceError, setDocumentAcceptanceError] = useState<string | null>(null);
```

- [ ] Reset agreement state when selected class changes:

```ts
useEffect(() => {
  setRegistrationTermsAccepted(false);
  setHealthDeclarationAccepted(false);
  setDocumentAcceptanceError(null);
}, [selectedClassId]);
```

### Task 2: Cover Card/List Register Entry Points

**Files:**
- Modify: `src/features/lessons/lessons-page.tsx`

- [ ] Update the signed-in eligible branch in `renderClassActions` so compact card/list actions open the class detail modal instead of submitting registration without visible agreement controls. The existing detail modal already calls `renderClassActions(selectedClass, { prominence: "primary" })`; keep the primary detail action as the only signed-in eligible path that calls `registerForClass(item)`.

```tsx
if (session && item.canRegister) {
  const handleRegisterClick = primary
    ? () => void registerForClass(item)
    : () => {
        setDocumentAcceptanceError(null);
        openClassDetails(item.id);
      };

  return (
    <Button
      type="button"
      size="sm"
      className={primaryButtonClass}
      disabled={actionBusy}
      onClick={handleRegisterClick}
    >
      {actionBusy ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <CheckCircle2 className="size-4" aria-hidden="true" />
      )}
      {t("classes.register")}
    </Button>
  );
}
```

This preserves signed-out register behavior, cancellation behavior, membership gates, and card/list visual density while ensuring the required agreement controls are visible before a signed-in eligible registration can be blocked or submitted.

### Task 3: Add Agreement Validation And Acceptance Helper For Registration

**Files:**
- Modify: `src/features/lessons/lessons-page.tsx`

- [ ] Add a synchronous validation helper inside `LessonsPage`. This helper runs before setting the busy guard because it does not await network work:

```ts
function validateRegistrationDocumentAgreement() {
  if (!registrationTermsAccepted) {
    setDocumentAcceptanceError(t("classes.documents.termsRequired"));
    return false;
  }

  if (!healthDeclarationAccepted) {
    setDocumentAcceptanceError(t("classes.documents.healthRequired"));
    return false;
  }

  setDocumentAcceptanceError(null);
  return true;
}
```

- [ ] Add a local async helper inside `LessonsPage`. This helper assumes the caller has already set the existing `registrationMutation` busy guard before awaiting it:

```ts
async function acceptRegistrationDocuments() {
  if (!client || !session || productUser?.status !== "active") {
    setOperationError(t("classes.unavailable"));
    return false;
  }

  try {
    const termsResult = await acceptProductDocument(
      client,
      productDocumentTypes.terms,
      i18n.language,
      "registration",
    );

    if (termsResult.error) {
      setDocumentAcceptanceError(t("classes.documents.acceptanceFailed"));
      return false;
    }

    const healthResult = await acceptProductDocument(
      client,
      productDocumentTypes.healthDeclaration,
      i18n.language,
      "registration_health_declaration",
    );

    if (healthResult.error) {
      setDocumentAcceptanceError(t("classes.documents.acceptanceFailed"));
      return false;
    }
  } catch {
    setDocumentAcceptanceError(t("classes.documents.acceptanceFailed"));
    return false;
  }

  setDocumentAcceptanceError(null);
  return true;
}
```

### Task 4: Call Acceptance Before Registering

**Files:**
- Modify: `src/features/lessons/lessons-page.tsx`

- [ ] In `registerForClass(item)`, preserve the existing duplicate-submit guard by validating checkbox state synchronously, then setting `registrationMutation` before the first awaited document acceptance call:

```ts
if (!validateRegistrationDocumentAgreement()) return;

setRegistrationMutation({ type: "register", classId: item.id });

try {
  const documentsAccepted = await acceptRegistrationDocuments();
  if (!documentsAccepted) return;

  const result = await client.classes.register(item.id);

  // Keep the existing result.error, toast, local update, and reconciliation logic unchanged.
} finally {
  setRegistrationMutation(null);
}
```

- [ ] Move the existing `client.classes.register(item.id)` block inside this guarded `try` after document acceptance. This ensures document acceptance failure prevents registration while the existing `registrationMutation`/`actionBusy` guard disables duplicate clicks during both acceptance and registration.

### Task 5: Render Agreement Controls In Class Detail

**Files:**
- Modify: `src/features/lessons/lessons-page.tsx`

- [ ] Add a helper:

```tsx
function renderRegistrationDocuments(item: ClassViewItem) {
  if (!session || !item.canRegister) return null;
  if (item.membershipRequirement === "required" && !productUser?.has_active_membership) return null;

  const disabled = registrationMutation?.classId === item.id;

  return (
    <div className="mt-4 grid gap-3 rounded-xl border border-blush/18 bg-background/34 p-3">
      <p className="font-serif text-xl text-foreground">
        {t("classes.documents.title")}
      </p>
      <div className="grid gap-2">
        <DocumentAgreement
          checked={registrationTermsAccepted}
          labelKey="classes.documents.acceptTerms"
          linkLabelKey="documents.terms.label"
          documentPath={termsPath}
          disabled={disabled}
          onCheckedChange={(checked) => {
            setRegistrationTermsAccepted(checked);
            if (checked) setDocumentAcceptanceError(null);
          }}
        />
        <DocumentAgreement
          checked={healthDeclarationAccepted}
          labelKey="classes.documents.acceptHealthDeclaration"
          linkLabelKey="documents.healthDeclaration.label"
          documentPath={healthDeclarationPath}
          disabled={disabled}
          onCheckedChange={(checked) => {
            setHealthDeclarationAccepted(checked);
            if (checked) setDocumentAcceptanceError(null);
          }}
        />
      </div>
      {documentAcceptanceError && (
        <p className="text-sm leading-6 text-blush-strong">{documentAcceptanceError}</p>
      )}
    </div>
  );
}
```

- [ ] Render this helper in the selected class detail modal before the primary action area or immediately below the header action cluster:

```tsx
{renderRegistrationDocuments(selectedClass)}
```

If the detail header action cluster is cramped, move agreement controls above the facts and keep the register button in the existing action location. The register function still enforces acceptance.

### Task 6: Final Verification And Boundary Inspection

**Files:**
- No additional code files unless verification reveals a missing localized key or import cleanup.

- [ ] Run focused SDK-boundary inspection:

```bash
rtk rg -n "functions\\.invoke|\\.rpc\\(|supabase|management\\.productDocuments|admin\\.productDocuments" src/features/documents src/features/account src/features/lessons src/App.tsx
```

Expected: no matches.

- [ ] Run flow context inspection:

```bash
rtk rg -n "\"signup\"|\"registration\"|\"registration_health_declaration\"|productDocuments\\.accept" src/features
```

Expected: signup and registration contexts are visible at the intended acceptance calls only.

- [ ] Run entry-point inspection:

```bash
rtk rg -n "openClassDetails\\(item\\.id\\)|registerForClass\\(item\\)|renderClassActions\\(selectedClass" src/features/lessons/lessons-page.tsx
```

Expected: compact signed-in eligible register actions open detail, while the selected class detail primary action remains the direct `registerForClass(item)` submit path.

- [ ] Run localization inspection:

```bash
rtk rg -n "documents|footerLinks|auth\\.documents|classes\\.documents" src/i18n.ts src/features
```

Expected: referenced keys exist in all language blocks and are consumed.

- [ ] Run lint:

```bash
npm run lint
```

Expected: passes, or report exact failures and classify pre-existing versus introduced.

## Verification

- Anonymous `/terms` and `/health-declaration` routes render non-crashing states when a dev server is available.
- Signed-out class register still navigates to auth.
- Membership-required users without membership still see the membership gate, not agreement controls.
- Signed-in eligible users see Terms and health declaration agreement controls.
- Signed-in eligible users clicking Register from a class card/list item first see the selected class detail surface with Terms and health declaration controls; they do not hit an invisible agreement validation error.
- Register without either checkbox shows the appropriate localized requirement and does not call `classes.register`.
- Acceptance failure shows `classes.documents.acceptanceFailed` and does not call `classes.register`.
- Acceptance success calls happen before `client.classes.register(item.id)`.
- The existing `registrationMutation`/`actionBusy` guard is active before `productDocuments.accept(...)` awaits, so repeated clicks cannot start parallel acceptance or registration attempts.

## Acceptance Criteria Covered

- Class registration requires Terms agreement.
- Class registration requires health declaration agreement.
- Both acceptances use ClassKit product document APIs with active locale, fallback locale, and distinct contexts.
- Health declaration document type is centralized and easy to adjust.
- Existing registration behavior is preserved outside the new pre-registration gate.
- Final focused verification is performed and reported.

## Risks And Rollback

- Risk: agreement controls make class detail too dense on mobile. Mitigation: place them in a compact bordered block and keep text wrapping safe.
- Risk: card/list register buttons appear to submit but now open detail for agreement review. Mitigation: keep the label unchanged, make the detail primary action prominent, and verify the detail surface opens immediately with agreement controls visible.
- Risk: moving document acceptance ahead of class registration could accidentally allow duplicate submit clicks. Mitigation: validate unchecked controls synchronously, then set `registrationMutation` before awaiting document acceptance and clear it in the existing `finally` block.
- Risk: productUser status is unavailable in some valid registration states. Mitigation: if SDK permits registration with session but productUser is temporarily null, keep acceptance failure localized and do not bypass the authenticated acceptance requirement.
- Rollback: remove agreement controls and the `acceptRegistrationDocuments()` call from `registerForClass`.

## Non-Goals

- No profile metadata flag for health declaration.
- No global health declaration wall.
- No manager review surface for acceptance records.
- No change to cancellation behavior.

## Type And Name Consistency

Before finalizing, verify that import names, route constants, document constants, state names, contexts, and i18n keys are consistent across `LessonsPage`, document helpers, and the plan set.

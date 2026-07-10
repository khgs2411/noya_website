import { productDocumentTypes } from "@/features/documents/product-document-types";

export const PENDING_SIGNUP_TERMS_ACCEPTANCE_KEY =
  "noya.pendingSignupTermsAcceptance";

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

export function hasPendingSignupTermsAcceptance() {
  return (
    window.sessionStorage.getItem(PENDING_SIGNUP_TERMS_ACCEPTANCE_KEY) !== null
  );
}

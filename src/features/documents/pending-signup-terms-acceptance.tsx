import { useProductContext } from "@class-kit/react";
import { RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { acceptProductDocument } from "@/features/documents/product-document-acceptance";
import {
  clearPendingSignupTermsAcceptance,
  hasPendingSignupTermsAcceptance,
} from "@/features/documents/pending-signup-terms";
import { productDocumentTypes } from "@/features/documents/product-document-types";

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

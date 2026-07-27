import { useProductContext } from "@class-kit/react";
import { CheckCircle2, HeartPulse, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  hasAcceptedHealthDeclaration,
  healthDeclarationAcceptanceVersionKey,
} from "@/features/documents/health-declaration-acceptance";
import { MarkdownContent } from "@/features/documents/markdown-content";
import { acceptProductDocument } from "@/features/documents/product-document-acceptance";
import {
  productDocumentFallbackLocale,
  productDocumentTypes,
} from "@/features/documents/product-document-types";

type GateStatus = "idle" | "loading" | "required" | "unavailable" | "error" | "accepted";

type HealthDeclarationDocument = {
  title: string;
  contentMarkdown: string;
  version: number;
};

function normalizeDocument(raw: unknown): HealthDeclarationDocument | null {
  if (!raw || typeof raw !== "object") return null;

  const record = raw as Record<string, unknown>;
  if (
    typeof record.title !== "string" ||
    typeof record.content_markdown !== "string" ||
    !Number.isInteger(record.version)
  ) {
    return null;
  }

  return {
    title: record.title,
    contentMarkdown: record.content_markdown,
    version: record.version as number,
  };
}

export function HealthDeclarationGate() {
  const { t, i18n } = useTranslation();
  const { client, productUser, session } = useProductContext();
  const [status, setStatus] = useState<GateStatus>("idle");
  const [healthDeclaration, setHealthDeclaration] = useState<HealthDeclarationDocument | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const userId = session?.user.id ?? null;
  const isActiveUser = productUser?.status === "active";
  const isBlocking = Boolean(
    userId &&
      isActiveUser &&
      status === "required" &&
      healthDeclaration,
  );

  const loadDeclaration = useCallback(async () => {
    if (!client || !userId || !isActiveUser) return;

    setStatus("loading");
    setHealthDeclaration(null);
    setAgreed(false);
    setErrorMessage(null);

    try {
      const [documentResult, profileResult] = await Promise.all([
        client.productDocuments.get(productDocumentTypes.healthDeclaration, {
          locale: i18n.language,
          fallbackLocale: productDocumentFallbackLocale,
        }),
        client.profile.get(),
      ]);

      if (documentResult.error?.code === "not_found") {
        setStatus("unavailable");
        return;
      }

      if (documentResult.error || profileResult.error) {
        setStatus("error");
        setErrorMessage(
          documentResult.error?.message ??
            profileResult.error?.message ??
            t("documents.healthGate.errorBody"),
        );
        return;
      }

      const loadedDocument = normalizeDocument(documentResult.data?.document);
      const profile = profileResult.data;
      if (!loadedDocument || !profile) {
        setStatus("error");
        setErrorMessage(t("documents.healthGate.errorBody"));
        return;
      }

      setHealthDeclaration(loadedDocument);
      setStatus(
        hasAcceptedHealthDeclaration(profile.user.metadata, loadedDocument.version)
          ? "accepted"
          : "required",
      );
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : t("documents.healthGate.errorBody"),
      );
    }
  }, [client, i18n.language, isActiveUser, t, userId]);

  useEffect(() => {
    if (!client || !userId || !isActiveUser) {
      const timeoutId = window.setTimeout(() => {
        setStatus("idle");
        setHealthDeclaration(null);
        setAgreed(false);
        setErrorMessage(null);
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }

    const timeoutId = window.setTimeout(() => {
      void loadDeclaration();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [client, isActiveUser, loadDeclaration, userId]);

  useEffect(() => {
    if (!isBlocking) return;

    const previouslyFocused = window.document.activeElement instanceof HTMLElement
      ? window.document.activeElement
      : null;
    const dialog = dialogRef.current;
    dialog?.focus();

    function keepFocusInDialog(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        return;
      }

      if (event.key !== "Tab" || !dialog) return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])",
        ),
      ).filter((element) => element.offsetParent !== null);

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && window.document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && window.document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.document.addEventListener("keydown", keepFocusInDialog);
    return () => {
      window.document.removeEventListener("keydown", keepFocusInDialog);
      previouslyFocused?.focus();
    };
  }, [isBlocking]);

  async function acceptDeclaration() {
    if (!client || !healthDeclaration) return;

    if (!agreed) {
      setErrorMessage(t("documents.healthGate.required"));
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const acceptanceResult = await acceptProductDocument(
        client,
        productDocumentTypes.healthDeclaration,
        i18n.language,
        "health_declaration_gate",
      );

      if (acceptanceResult.error) {
        setErrorMessage(acceptanceResult.error.message);
        return;
      }

      const profileResult = await client.profile.update({
        metadata: {
          [healthDeclarationAcceptanceVersionKey]:
            acceptanceResult.data.acceptance.document_version,
        },
      });

      if (profileResult.error) {
        setErrorMessage(profileResult.error.message);
        return;
      }

      setStatus("accepted");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t("documents.healthGate.errorBody"),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!isBlocking) return null;

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-background/88 px-4 py-5 backdrop-blur-sm">
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="health-declaration-gate-title"
        tabIndex={-1}
        className="w-full max-w-2xl rounded-[1.4rem] border border-blush/32 bg-card p-5 text-foreground shadow-2xl sm:p-7"
      >
        {status === "required" && healthDeclaration && (
          <div className="grid gap-5">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-blush text-primary-foreground">
                <HeartPulse className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blush-strong">
                  {t("documents.healthGate.eyebrow")}
                </p>
                <h2 id="health-declaration-gate-title" className="mt-1 font-serif text-3xl sm:text-4xl">
                  {t("documents.healthGate.title")}
                </h2>
                <p className="mt-2 text-sm leading-6 text-foreground/72">
                  {t("documents.healthGate.body")}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-blush/24 bg-background/45 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blush/18 pb-3">
                <p className="font-serif text-2xl text-foreground">{healthDeclaration.title}</p>
                <span className="text-sm text-foreground/56">
                  {t("documents.version", { version: healthDeclaration.version })}
                </span>
              </div>
              <div className="mt-4 max-h-[42vh] overflow-y-auto pe-2">
                <MarkdownContent markdown={healthDeclaration.contentMarkdown} />
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-blush/28 bg-background/45 p-4 text-sm leading-6 text-foreground/78">
              <input
                type="checkbox"
                className="mt-1 size-4 shrink-0 accent-blush-strong"
                checked={agreed}
                disabled={submitting}
                onChange={(event) => {
                  setAgreed(event.target.checked);
                  if (event.target.checked) setErrorMessage(null);
                }}
              />
              {t("documents.healthGate.agreement")}
            </label>

            {errorMessage && (
              <p className="text-sm leading-6 text-blush-strong">{errorMessage}</p>
            )}

            <Button
              type="button"
              className="h-12 w-full rounded-full bg-blush text-primary-foreground hover:bg-blush-strong"
              disabled={!agreed || submitting}
              onClick={() => void acceptDeclaration()}
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="size-4" aria-hidden="true" />
              )}
              {submitting
                ? t("documents.healthGate.signing")
                : t("documents.healthGate.accept")}
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

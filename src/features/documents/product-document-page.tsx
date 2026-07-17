import { useProductContext } from "@class-kit/react";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { MarkdownContent } from "@/features/documents/markdown-content";
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
  locale: string | null;
  version: number | string | null;
};

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

export function ProductDocumentPage({
  documentType,
  titleKey,
  emptyKey,
  onNavigate,
}: ProductDocumentPageProps) {
  const { t, i18n } = useTranslation();
  const { client } = useProductContext();
  const [document, setDocument] = useState<LoadedDocument | null>(null);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadDocument = useCallback(async () => {
    if (!client) {
      setDocument(null);
      setLoadStatus("error");
      setErrorMessage(t("documents.unavailable"));
      return;
    }

    setLoadStatus("loading");
    setErrorMessage(null);

    try {
      const result = await client.productDocuments.get(documentType, {
        locale: i18n.language,
        fallbackLocale: productDocumentFallbackLocale,
      });

      if (result.error) {
        if (result.error.code === "not_found") {
          setDocument(null);
          setLoadStatus("loaded");
          return;
        }

        setDocument(null);
        setLoadStatus("error");
        setErrorMessage(result.error.message);
        return;
      }

      setDocument(normalizeDocument(result.data?.document));
      setLoadStatus("loaded");
    } catch (error) {
      setDocument(null);
      setLoadStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : t("documents.errorBody"),
      );
    }
  }, [client, documentType, i18n.language, t]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadDocument();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadDocument]);

  return (
    <main className="min-h-screen bg-background px-5 pb-12 pt-6 text-foreground sm:px-8">
      <div className="mx-auto max-w-4xl">
        <button
          type="button"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blush-strong underline-offset-4 hover:underline"
          onClick={() => onNavigate("./")}
        >
          <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
          {t("documents.back")}
        </button>

        <section className="mt-7 rounded-[1.4rem] border border-blush/28 bg-card/78 p-5 shadow-soft sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blush-strong">
            {t("documents.eyebrow")}
          </p>
          <h1 className="mt-2 font-serif text-4xl text-foreground sm:text-5xl">
            {document?.title ?? t(titleKey)}
          </h1>

          {document?.version !== null && document?.version !== undefined && (
            <p className="mt-3 text-sm text-foreground/56">
              {t("documents.version", { version: document.version })}
            </p>
          )}

          {loadStatus === "loading" && (
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-blush/24 bg-background/46 p-4 text-sm text-foreground/68">
              <Loader2
                className="size-4 animate-spin text-blush-strong"
                aria-hidden="true"
              />
              {t("documents.loading")}
            </div>
          )}

          {loadStatus === "error" && (
            <div className="mt-6 rounded-xl border border-blush/24 bg-background/46 p-4">
              <p className="font-serif text-2xl text-foreground">
                {t("documents.errorTitle")}
              </p>
              <p className="mt-2 text-sm leading-6 text-foreground/68">
                {errorMessage ?? t("documents.errorBody")}
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-4 rounded-full border-blush/38 bg-background/42 text-foreground hover:bg-blush/10"
                onClick={() => void loadDocument()}
              >
                <RefreshCw className="size-4" aria-hidden="true" />
                {t("documents.retry")}
              </Button>
            </div>
          )}

          {loadStatus === "loaded" && !document && (
            <p className="mt-6 rounded-xl border border-blush/24 bg-background/46 p-4 text-sm leading-6 text-foreground/68">
              {t(emptyKey)}
            </p>
          )}

          {loadStatus === "loaded" && document && (
            <div className="mt-6">
              <MarkdownContent markdown={document.contentMarkdown} />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

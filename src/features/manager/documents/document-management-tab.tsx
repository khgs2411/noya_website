import { useProductContext, type ProductDocument, type ProductDocumentStatus } from "@class-kit/react";
import { AlertCircle, Archive, FileText, Loader2, RefreshCw, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { productDocumentTypes } from "@/features/documents/product-document-types";

type DocumentManagementTabProps = {
  canManageDocuments: boolean;
};

type LoadStatus = "idle" | "loading" | "loaded" | "error";
type MutationStatus = "idle" | "saving" | "archiving";

type DocumentFormState = {
  title: string;
  contentMarkdown: string;
  status: Exclude<ProductDocumentStatus, "archived">;
  effectiveAt: string;
};

const supportedDocumentLocales = ["en", "he", "ru"] as const;

const emptyForm: DocumentFormState = {
  title: "",
  contentMarkdown: "",
  status: "published",
  effectiveAt: "",
};

function toDateTimeLocal(value: string | null | undefined) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 16);
}

function toEffectiveAt(value: string) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
}

function getMarkdownTitle(contentMarkdown: string) {
  const heading = contentMarkdown.match(/^#\s+(.+)$/m);
  return heading?.[1]?.trim() ?? "";
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function DocumentManagementTab({
  canManageDocuments,
}: DocumentManagementTabProps) {
  const { t, i18n } = useTranslation();
  const { client } = useProductContext();
  const [document, setDocument] = useState<ProductDocument | null>(null);
  const [form, setForm] = useState<DocumentFormState>(emptyForm);
  const [locale, setLocale] = useState(i18n.language);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("idle");
  const [mutationStatus, setMutationStatus] = useState<MutationStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadDocument = useCallback(async () => {
    if (!canManageDocuments) return;

    if (!client) {
      setDocument(null);
      setLoadStatus("error");
      setErrorMessage(t("manager.documents.unavailable"));
      return;
    }

    setLoadStatus("loading");
    setErrorMessage(null);
    setNotice(null);

    try {
      const result = await client.productDocuments.get(
        productDocumentTypes.terms,
        {
          locale,
        },
      );

      if (result.error) {
        if (result.error.code === "not_found") {
          setDocument(null);
          setForm(emptyForm);
          setLoadStatus("loaded");
          return;
        }

        setDocument(null);
        setLoadStatus("error");
        setErrorMessage(result.error.message);
        return;
      }

      const loadedDocument = result.data?.document ?? null;
      setDocument(loadedDocument);
      setForm(
        loadedDocument
          ? {
              title: loadedDocument.title,
              contentMarkdown: loadedDocument.content_markdown,
              status:
                loadedDocument.status === "draft" ? "draft" : "published",
              effectiveAt: toDateTimeLocal(loadedDocument.effective_at),
            }
          : emptyForm,
      );
      setLoadStatus("loaded");
    } catch (error) {
      setDocument(null);
      setLoadStatus("error");
      setErrorMessage(getErrorMessage(error, t("manager.documents.errorBody")));
    }
  }, [canManageDocuments, client, locale, t]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadDocument();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadDocument]);

  async function saveDocument() {
    const title = form.title.trim() || getMarkdownTitle(form.contentMarkdown);
    const contentMarkdown = form.contentMarkdown.trim();

    if (!title || !contentMarkdown) {
      setErrorMessage(t("manager.documents.validation"));
      return;
    }

    setMutationStatus("saving");
    setErrorMessage(null);
    setNotice(null);

    try {
      if (!client) throw new Error(t("manager.documents.unavailable"));

      const result = await client.management.productDocuments.upsert({
        documentType: productDocumentTypes.terms,
        locale,
        title,
        contentMarkdown,
        status: form.status,
        effectiveAt: toEffectiveAt(form.effectiveAt),
      });

      setDocument(result.document);
      setForm({
        title: result.document.title,
        contentMarkdown: result.document.content_markdown,
        status: result.document.status === "draft" ? "draft" : "published",
        effectiveAt: toDateTimeLocal(result.document.effective_at),
      });
      setNotice(t("manager.documents.saved"));
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, t("manager.documents.actionFailed")),
      );
    } finally {
      setMutationStatus("idle");
    }
  }

  async function archiveDocument() {
    if (!document) return;

    setMutationStatus("archiving");
    setErrorMessage(null);
    setNotice(null);

    try {
      if (!client) throw new Error(t("manager.documents.unavailable"));

      await client.management.productDocuments.archive(document.id);
      setDocument(null);
      setForm(emptyForm);
      setNotice(t("manager.documents.archived"));
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, t("manager.documents.actionFailed")),
      );
    } finally {
      setMutationStatus("idle");
    }
  }

  return (
    <section className="rounded-[1.4rem] border border-blush/24 bg-card/78 p-5 shadow-soft sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-blush-strong text-background">
          <FileText className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="font-serif text-xs uppercase tracking-[0.25em] text-foreground/48">
            {t("manager.tabs.documents")}
          </p>
          <h2 className="mt-2 font-serif text-3xl text-foreground">
            {t("manager.documents.title")}
          </h2>
          <p className="mt-3 max-w-prose text-sm leading-6 text-foreground/68">
            {canManageDocuments
              ? t("manager.documents.body")
              : t("manager.documents.noAccessBody")}
          </p>
        </div>
      </div>

      {canManageDocuments ? (
        <div className="mt-5 grid gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={loadStatus === "loading" || mutationStatus !== "idle"}
              onClick={() => void loadDocument()}
            >
              <RefreshCw
                className={[
                  "size-4",
                  loadStatus === "loading" ? "animate-spin" : "",
                ].join(" ")}
                aria-hidden="true"
              />
              {t("manager.documents.refresh")}
            </Button>
            <Button
              type="button"
              className="rounded-full"
              disabled={mutationStatus !== "idle"}
              onClick={() => void saveDocument()}
            >
              {mutationStatus === "saving" ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="size-4" aria-hidden="true" />
              )}
              {t("manager.documents.save")}
            </Button>
          </div>

          {loadStatus === "loading" && (
            <div className="rounded-xl border border-blush/24 bg-background/46 p-5">
              <div className="flex items-center gap-3 text-sm text-foreground/68">
                <Loader2
                  className="size-4 shrink-0 animate-spin text-blush-strong"
                  aria-hidden="true"
                />
                {t("manager.documents.loading")}
              </div>
            </div>
          )}

          {loadStatus === "error" && (
            <div className="rounded-xl border border-blush/24 bg-background/46 p-5">
              <div className="flex items-start gap-3">
                <AlertCircle
                  className="mt-0.5 size-5 shrink-0 text-blush-strong"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="font-serif text-xl text-foreground">
                    {t("manager.documents.errorTitle")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-foreground/68">
                    {errorMessage ?? t("manager.documents.errorBody")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {errorMessage && loadStatus !== "error" && (
            <p className="rounded-xl border border-blush/24 bg-background/46 p-3 text-sm leading-6 text-blush-strong">
              {errorMessage}
            </p>
          )}

          {notice && (
            <p className="rounded-xl border border-blush/24 bg-background/46 p-3 text-sm leading-6 text-foreground/68">
              {notice}
            </p>
          )}

          <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="grid gap-4 rounded-xl border border-blush/24 bg-background/46 p-4">
              <label className="grid gap-2 text-sm font-semibold text-foreground/76">
                {t("manager.documents.documentType")}
                <p className="flex h-11 items-center rounded-xl border border-blush/24 bg-card/60 px-3 text-sm text-foreground/62">
                  {t("documents.terms.label")}
                </p>
              </label>

              <label className="grid gap-2 text-sm font-semibold text-foreground/76">
                {t("manager.documents.locale")}
                <select
                  value={locale}
                  className="h-11 rounded-xl border border-blush/24 bg-card/60 px-3 text-sm text-foreground outline-none focus:border-blush-strong"
                  disabled={loadStatus === "loading" || mutationStatus !== "idle"}
                  onChange={(event) => setLocale(event.target.value)}
                >
                  {supportedDocumentLocales.map((documentLocale) => (
                    <option key={documentLocale} value={documentLocale}>
                      {t(`manager.documents.localeOptions.${documentLocale}`)}
                    </option>
                  ))}
                </select>
              </label>

              <p className="text-xs leading-5 text-foreground/56">
                {t("manager.documents.documentTypeHint")}
              </p>

              <label className="grid gap-2 text-sm font-semibold text-foreground/76">
                {t("manager.documents.status")}
                <select
                  value={form.status}
                  className="h-11 rounded-xl border border-blush/24 bg-card/60 px-3 text-sm text-foreground outline-none focus:border-blush-strong"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value === "draft" ? "draft" : "published",
                    }))
                  }
                >
                  <option value="published">
                    {t("manager.documentStatus.published")}
                  </option>
                  <option value="draft">{t("manager.documentStatus.draft")}</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold text-foreground/76">
                {t("manager.documents.effectiveAt")}
                <input
                  type="datetime-local"
                  value={form.effectiveAt}
                  className="h-11 rounded-xl border border-blush/24 bg-card/60 px-3 text-sm text-foreground outline-none focus:border-blush-strong"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      effectiveAt: event.target.value,
                    }))
                  }
                />
              </label>

              {document && (
                <dl className="grid gap-2 border-t border-blush/18 pt-4 text-sm text-foreground/64">
                  <div className="flex items-center justify-between gap-3">
                    <dt>{t("manager.documents.currentVersion")}</dt>
                    <dd className="font-semibold text-foreground">
                      {document.version}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt>{t("manager.documents.currentStatus")}</dt>
                    <dd className="font-semibold text-foreground">
                      {t(`manager.documentStatus.${document.status}`)}
                    </dd>
                  </div>
                </dl>
              )}

              <Button
                type="button"
                variant="outline"
                className="rounded-full border-blush/38 bg-background/42 text-foreground hover:bg-blush/10"
                disabled={!document || mutationStatus !== "idle"}
                onClick={() => void archiveDocument()}
              >
                {mutationStatus === "archiving" ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Archive className="size-4" aria-hidden="true" />
                )}
                {t("manager.documents.archive")}
              </Button>
            </div>

            <div className="grid gap-4 rounded-xl border border-blush/24 bg-background/46 p-4">
              <label className="grid gap-2 text-sm font-semibold text-foreground/76">
                {t("manager.documents.titleField")}
                <input
                  value={form.title}
                  className="h-11 rounded-xl border border-blush/24 bg-card/60 px-3 text-sm text-foreground outline-none focus:border-blush-strong"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-foreground/76">
                {t("manager.documents.content")}
                <textarea
                  value={form.contentMarkdown}
                  rows={18}
                  className="min-h-[22rem] resize-y rounded-xl border border-blush/24 bg-card/60 px-3 py-3 font-mono text-sm leading-6 text-foreground outline-none focus:border-blush-strong"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      contentMarkdown: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-blush/24 bg-background/46 p-5">
          <p className="font-serif text-xl text-foreground">
            {t("manager.documents.noAccessTitle")}
          </p>
          <p className="mt-2 text-sm leading-6 text-foreground/68">
            {t("manager.documents.noAccessBody")}
          </p>
        </div>
      )}
    </section>
  );
}

import {
  ClassKitManagerApiError,
  useProductContext,
  type ProductDocumentDraft,
  type ProductDocumentVersion,
  type ProductDocumentVersionSummary,
} from "@class-kit/react";
import {
  AlertCircle,
  Archive,
  FileText,
  HeartPulse,
  History,
  Loader2,
  RefreshCw,
  RotateCcw,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  productDocumentTypes,
  type ProductDocumentType,
} from "@/features/documents/product-document-types";

type DocumentManagementTabProps = {
  canManageDocuments: boolean;
};

type LoadStatus = "idle" | "loading" | "loaded" | "error";
type MutationStatus =
  | "idle"
  | "saving"
  | "discarding"
  | "publishing"
  | "archiving"
  | "restoring";

type DocumentFormState = {
  title: string;
  contentMarkdown: string;
  effectiveAt: string;
};

const supportedDocumentLocales = ["en", "he", "ru"] as const;
const managedDocumentTypes = [
  {
    type: productDocumentTypes.terms,
    labelKey: "documents.terms.label",
    descriptionKey: "manager.documents.types.terms",
    Icon: FileText,
  },
  {
    type: productDocumentTypes.healthDeclaration,
    labelKey: "documents.healthDeclaration.label",
    descriptionKey: "manager.documents.types.healthDeclaration",
    Icon: HeartPulse,
  },
] as const satisfies ReadonlyArray<{
  type: ProductDocumentType;
  labelKey: string;
  descriptionKey: string;
  Icon: typeof FileText;
}>;

const emptyForm: DocumentFormState = {
  title: "",
  contentMarkdown: "",
  effectiveAt: "",
};

function toDateTimeLocal(value: string | null | undefined) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
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

function toForm(document: Pick<ProductDocumentDraft, "title" | "content_markdown" | "effective_at">): DocumentFormState {
  return {
    title: document.title,
    contentMarkdown: document.content_markdown,
    effectiveAt: toDateTimeLocal(document.effective_at),
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function countWords(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function DocumentManagementTab({
  canManageDocuments,
}: DocumentManagementTabProps) {
  const { t, i18n } = useTranslation();
  const { client } = useProductContext();
  const [documentType, setDocumentType] = useState<ProductDocumentType>(
    productDocumentTypes.terms,
  );
  const [locale, setLocale] = useState(i18n.language);
  const [draft, setDraft] = useState<ProductDocumentDraft | null>(null);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [versions, setVersions] = useState<ProductDocumentVersionSummary[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<ProductDocumentVersion | null>(null);
  const [form, setForm] = useState<DocumentFormState>(emptyForm);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("idle");
  const [mutationStatus, setMutationStatus] = useState<MutationStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const selectedDocument = managedDocumentTypes.find(
    (document) => document.type === documentType,
  ) ?? managedDocumentTypes[0];
  const activeVersion = versions.find(
    (version) => version.id === activeVersionId || version.is_active,
  ) ?? null;
  const wordCount = countWords(form.contentMarkdown);

  const loadDocument = useCallback(async () => {
    if (!canManageDocuments) return;

    if (!client) {
      setLoadStatus("error");
      setErrorMessage(t("manager.documents.unavailable"));
      return;
    }

    setLoadStatus("loading");
    setErrorMessage(null);
    setNotice(null);

    try {
      const [draftResult, versionsResult] = await Promise.all([
        client.management.productDocuments.getDraft(documentType, {
          locale,
        }),
        client.management.productDocuments.listVersions(
          documentType,
          { locale },
        ),
      ]);
      const activeVersionSummary = versionsResult.versions.find(
        (version) => version.id === versionsResult.active_version_id,
      );
      let activeVersionPreview: ProductDocumentVersion | null = null;

      if (!draftResult.draft && activeVersionSummary) {
        try {
          const versionResult = await client.management.productDocuments.getVersion(
            activeVersionSummary.id,
          );
          activeVersionPreview = versionResult.version;
        } catch {
          // The summary still identifies the live document if its full preview cannot load.
        }
      }

      setDraft(draftResult.draft);
      setActiveVersionId(versionsResult.active_version_id);
      setVersions(versionsResult.versions);
      setSelectedVersion(activeVersionPreview);
      setForm(draftResult.draft ? toForm(draftResult.draft) : emptyForm);
      setLoadStatus("loaded");
    } catch (error) {
      setLoadStatus("error");
      setErrorMessage(getErrorMessage(error, t("manager.documents.errorBody")));
    }
  }, [canManageDocuments, client, documentType, locale, t]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadDocument();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadDocument]);

  function handleMutationError(error: unknown) {
    setErrorMessage(
      error instanceof ClassKitManagerApiError && error.code === "conflict"
        ? t("manager.documents.conflict")
        : getErrorMessage(error, t("manager.documents.actionFailed")),
    );
  }

  async function saveDraft() {
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

      const result = await client.management.productDocuments.saveDraft({
        documentType,
        locale,
        title,
        contentMarkdown,
        effectiveAt: toEffectiveAt(form.effectiveAt),
        expectedRevision: draft?.revision ?? null,
      });

      setDraft(result.draft);
      setForm(toForm(result.draft));
      setNotice(t("manager.documents.draftSaved"));
    } catch (error) {
      handleMutationError(error);
    } finally {
      setMutationStatus("idle");
    }
  }

  async function discardDraft() {
    if (!draft || !client) return;

    setMutationStatus("discarding");
    setErrorMessage(null);
    setNotice(null);

    try {
      await client.management.productDocuments.discardDraft(
        documentType,
        { locale, expectedRevision: draft.revision },
      );
      setDraft(null);
      setForm(emptyForm);
      setNotice(t("manager.documents.draftDiscarded"));
    } catch (error) {
      handleMutationError(error);
    } finally {
      setMutationStatus("idle");
    }
  }

  async function publishDraft() {
    if (!draft || !client) return;

    setMutationStatus("publishing");
    setErrorMessage(null);
    setNotice(null);

    try {
      const result = await client.management.productDocuments.publishDraft({
        documentType,
        locale,
        expectedDraftRevision: draft.revision,
        expectedActiveVersionId: activeVersionId,
      });

      setDraft(null);
      setActiveVersionId(result.version.id);
      setVersions((current) => [
        {
          ...result.version,
          is_active: true,
        },
        ...current.map((version) => ({
          ...version,
          is_active: false,
        })),
      ]);
      setForm(emptyForm);
      setNotice(t("manager.documents.published"));
    } catch (error) {
      handleMutationError(error);
    } finally {
      setMutationStatus("idle");
    }
  }

  async function archiveActiveVersion() {
    if (!activeVersionId || !client) return;

    setMutationStatus("archiving");
    setErrorMessage(null);
    setNotice(null);

    try {
      await client.management.productDocuments.archiveActiveVersion({
        documentType,
        locale,
        expectedActiveVersionId: activeVersionId,
      });
      setActiveVersionId(null);
      setVersions((current) =>
        current.map((version) => ({ ...version, is_active: false })),
      );
      setNotice(t("manager.documents.archived"));
    } catch (error) {
      handleMutationError(error);
    } finally {
      setMutationStatus("idle");
    }
  }

  async function viewVersion(versionId: string) {
    if (!client) return;

    setErrorMessage(null);
    setNotice(null);

    try {
      const result = await client.management.productDocuments.getVersion(versionId);
      setSelectedVersion(result.version);
    } catch (error) {
      handleMutationError(error);
    }
  }

  async function restoreVersionAsDraft() {
    if (!selectedVersion || draft || !client) return;

    setMutationStatus("restoring");
    setErrorMessage(null);
    setNotice(null);

    try {
      const result = await client.management.productDocuments.saveDraft({
        documentType,
        locale,
        title: selectedVersion.title,
        contentMarkdown: selectedVersion.content_markdown,
        effectiveAt: selectedVersion.effective_at,
        expectedRevision: null,
      });

      setDraft(result.draft);
      setForm(toForm(result.draft));
      setNotice(t("manager.documents.versionLoaded"));
    } catch (error) {
      handleMutationError(error);
    } finally {
      setMutationStatus("idle");
    }
  }

  const isMutating = mutationStatus !== "idle";

  return (
    <section className="w-full rounded-[1.4rem] border border-blush/24 bg-card/78 p-5 shadow-soft sm:p-6">
      <div className="flex flex-col gap-5 border-b border-blush/18 pb-5 lg:flex-row lg:items-start lg:justify-between">
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
            <p className="mt-2 max-w-prose text-sm leading-6 text-foreground/68">
              {canManageDocuments
                ? t("manager.documents.body")
                : t("manager.documents.noAccessBody")}
            </p>
          </div>
        </div>

        {canManageDocuments && (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={loadStatus === "loading" || isMutating}
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
              variant="outline"
              className="rounded-full"
              disabled={isMutating}
              onClick={() => void saveDraft()}
            >
              {mutationStatus === "saving" ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="size-4" aria-hidden="true" />
              )}
              {t("manager.documents.saveDraft")}
            </Button>
            <Button
              type="button"
              className="rounded-full"
              disabled={!draft || isMutating}
              onClick={() => void publishDraft()}
            >
              {mutationStatus === "publishing" ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="size-4" aria-hidden="true" />
              )}
              {t("manager.documents.publishDraft")}
            </Button>
          </div>
        )}
      </div>

      {!canManageDocuments ? (
        <div className="mt-5 rounded-xl border border-blush/24 bg-background/46 p-5">
          <p className="font-serif text-xl text-foreground">
            {t("manager.documents.noAccessTitle")}
          </p>
          <p className="mt-2 text-sm leading-6 text-foreground/68">
            {t("manager.documents.noAccessBody")}
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-5 xl:grid-cols-[18rem_minmax(0,1fr)]">
          <aside className="grid content-start gap-3 rounded-xl border border-blush/24 bg-background/38 p-3 xl:sticky xl:top-6 xl:self-start">
            <div className="px-1">
              <p className="text-sm font-semibold text-foreground/76">
                {t("manager.documents.documentType")}
              </p>
              <p className="mt-1 text-xs leading-5 text-foreground/56">
                {t("manager.documents.documentTypeHint")}
              </p>
            </div>

            <div className="grid gap-2" role="list" aria-label={t("manager.documents.documentType")}>
              {managedDocumentTypes.map((document) => {
                const selected = document.type === documentType;
                const Icon = document.Icon;

                return (
                  <div key={document.type} role="listitem">
                    <button
                      type="button"
                      className={[
                        "grid w-full gap-3 rounded-xl border p-4 text-start transition-colors",
                        selected
                          ? "border-blush-strong/65 bg-blush/16 shadow-[inset_3px_0_0_0_hsl(var(--blush-strong))]"
                          : "border-blush/18 bg-card/32 hover:border-blush/42 hover:bg-card/56",
                      ].join(" ")}
                      disabled={loadStatus === "loading" || isMutating}
                      onClick={() => setDocumentType(document.type)}
                    >
                      <span className="flex items-center gap-3">
                        <span className="grid size-11 shrink-0 place-items-center rounded-full border border-blush/30 text-blush-strong">
                          <Icon className="size-5" aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-serif text-xl text-foreground">
                            {t(document.labelKey)}
                          </span>
                          {selected && activeVersion && (
                            <span className="mt-1 inline-flex rounded-full bg-blush-strong/18 px-2 py-0.5 text-xs font-semibold text-foreground">
                              {t("manager.documents.active")}
                            </span>
                          )}
                        </span>
                      </span>
                      <span className="text-xs leading-5 text-foreground/60">
                        {t(document.descriptionKey)}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>

            <p className="border-t border-blush/18 px-1 pt-4 text-xs leading-5 text-foreground/56">
              {t("manager.documents.draftHint")}
            </p>
          </aside>

          <div className="min-w-0 rounded-xl border border-blush/24 bg-background/30 p-4 sm:p-5">
            {loadStatus === "loading" && (
              <div className="flex items-center gap-3 rounded-xl border border-blush/18 bg-card/36 p-4 text-sm text-foreground/68">
                <Loader2 className="size-4 animate-spin text-blush-strong" aria-hidden="true" />
                {t("manager.documents.loading")}
              </div>
            )}

            {loadStatus === "error" && (
              <div className="flex items-start gap-3 rounded-xl border border-blush/24 bg-card/36 p-4">
                <AlertCircle className="mt-0.5 size-5 shrink-0 text-blush-strong" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="font-serif text-xl text-foreground">
                    {t("manager.documents.errorTitle")}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-foreground/68">
                    {errorMessage ?? t("manager.documents.errorBody")}
                  </p>
                </div>
              </div>
            )}

            {errorMessage && loadStatus !== "error" && (
              <p className="rounded-xl border border-blush/24 bg-card/36 p-3 text-sm leading-6 text-blush-strong">
                {errorMessage}
              </p>
            )}

            {notice && (
              <p className="rounded-xl border border-blush/24 bg-card/36 p-3 text-sm leading-6 text-foreground/68">
                {notice}
              </p>
            )}

            <div className="grid gap-5">
              <div className="border-b border-blush/18 pb-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full border border-blush/24 text-blush-strong">
                      <selectedDocument.Icon className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-serif text-3xl text-foreground">
                        {activeVersion?.title ?? t(selectedDocument.labelKey)}
                      </h3>
                      <p className="mt-1 text-sm leading-5 text-foreground/62">
                        {t(selectedDocument.descriptionKey)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-foreground/68">
                    <label className="flex items-center gap-2">
                      <span className="font-semibold text-foreground/76">
                        {t("manager.documents.locale")}
                      </span>
                      <select
                        value={locale}
                        className="h-9 rounded-lg border border-blush/24 bg-card/60 px-2 text-sm text-foreground outline-none focus:border-blush-strong"
                        disabled={loadStatus === "loading" || isMutating}
                        onChange={(event) => setLocale(event.target.value)}
                      >
                        {supportedDocumentLocales.map((documentLocale) => (
                          <option key={documentLocale} value={documentLocale}>
                            {t(`manager.documents.localeOptions.${documentLocale}`)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <span className="hidden h-7 w-px bg-blush/20 sm:block" />
                    <span className="flex items-center gap-2">
                      <span className="font-semibold text-foreground/76">
                        {t("manager.documents.liveVersion")}
                      </span>
                      <span className={activeVersion ? "rounded-full bg-blush-strong/18 px-2 py-1 text-foreground" : "text-foreground/56"}>
                        {activeVersion
                          ? t("manager.documents.active")
                          : t("manager.documents.noActiveVersion")}
                      </span>
                    </span>
                    {activeVersion && (
                      <>
                        <span className="hidden h-7 w-px bg-blush/20 sm:block" />
                        <span>
                          {t("manager.documents.version", {
                            version: activeVersion.version,
                          })}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
                <div className="min-w-0">
                  {selectedVersion && !draft ? (
                    <div className="overflow-hidden rounded-xl border border-blush/24 bg-card/46">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blush/18 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">
                            {t("manager.documents.content")}
                          </p>
                          <span className="rounded-full bg-background/58 px-2.5 py-1 text-xs font-semibold text-foreground/64">
                            Markdown
                          </span>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          className="rounded-full"
                          disabled={isMutating}
                          onClick={() => void restoreVersionAsDraft()}
                        >
                          {mutationStatus === "restoring" ? (
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                          ) : (
                            <RotateCcw className="size-4" aria-hidden="true" />
                          )}
                          {t("manager.documents.loadAsDraft")}
                        </Button>
                      </div>
                      <pre
                        dir="auto"
                        className="min-h-[29rem] overflow-auto whitespace-pre-wrap px-4 py-4 font-mono text-sm leading-6 text-foreground"
                      >
                        {selectedVersion.content_markdown}
                      </pre>
                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-blush/18 px-4 py-3 text-xs text-foreground/56">
                        <span>
                          {t("manager.documents.version", {
                            version: selectedVersion.version,
                          })}
                        </span>
                        <span>{selectedVersion.content_markdown.length} · {countWords(selectedVersion.content_markdown)}</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_13rem]">
                        <label className="grid gap-2 text-sm font-semibold text-foreground/76">
                          {t("manager.documents.titleField")}
                          <input
                            value={form.title}
                            className="h-11 rounded-xl border border-blush/24 bg-card/46 px-3 text-sm text-foreground outline-none focus:border-blush-strong"
                            onChange={(event) => {
                              const title = event.currentTarget.value;
                              setForm((current) => ({ ...current, title }));
                            }}
                          />
                        </label>

                        <label className="grid gap-2 text-sm font-semibold text-foreground/76">
                          {t("manager.documents.effectiveAt")}
                          <input
                            type="datetime-local"
                            value={form.effectiveAt}
                            className="h-11 rounded-xl border border-blush/24 bg-card/46 px-3 text-sm text-foreground outline-none focus:border-blush-strong"
                            onInput={(event) => {
                              const effectiveAt = event.currentTarget.value;
                              setForm((current) => ({ ...current, effectiveAt }));
                            }}
                          />
                        </label>
                      </div>

                      <div className="mt-4 overflow-hidden rounded-xl border border-blush/24 bg-card/46">
                        <div className="flex items-center justify-between gap-3 border-b border-blush/18 px-4 py-3">
                          <p className="font-semibold text-foreground">
                            {t("manager.documents.content")}
                          </p>
                          <span className="rounded-full bg-background/58 px-2.5 py-1 text-xs font-semibold text-foreground/64">
                            Markdown
                          </span>
                        </div>
                        <textarea
                          value={form.contentMarkdown}
                          rows={18}
                          className="min-h-[29rem] w-full resize-y bg-transparent px-4 py-4 font-mono text-sm leading-6 text-foreground outline-none placeholder:text-foreground/36"
                          onChange={(event) => {
                            const contentMarkdown = event.currentTarget.value;
                            setForm((current) => ({ ...current, contentMarkdown }));
                          }}
                        />
                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-blush/18 px-4 py-3 text-xs text-foreground/56">
                          <span>
                            {draft
                              ? t("manager.documents.draftRevision", { revision: draft.revision })
                              : t("manager.documents.noDraft")}
                          </span>
                          <span>{form.contentMarkdown.length} · {wordCount}</span>
                        </div>
                      </div>

                      {draft && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="mt-3 rounded-full"
                          disabled={isMutating}
                          onClick={() => void discardDraft()}
                        >
                          {mutationStatus === "discarding" ? (
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                          ) : (
                            <Trash2 className="size-4" aria-hidden="true" />
                          )}
                          {t("manager.documents.discardDraft")}
                        </Button>
                      )}
                    </>
                  )}
                </div>

                <section className="grid content-start gap-4 rounded-xl border border-blush/24 bg-card/40 p-4">
                  <div className="flex items-center gap-2">
                    <History className="size-4 text-blush-strong" aria-hidden="true" />
                    <h4 className="font-serif text-2xl text-foreground">
                      {t("manager.documents.history")}
                    </h4>
                  </div>

                  {versions.length === 0 ? (
                    <p className="text-sm leading-6 text-foreground/68">
                      {t("manager.documents.noVersions")}
                    </p>
                  ) : (
                    <div className="grid gap-3">
                      {versions.map((version) => (
                        <div key={version.id} className="border-s border-blush/28 ps-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground">
                                {t("manager.documents.version", { version: version.version })}
                              </p>
                              <p className="truncate text-sm text-foreground/64">{version.title}</p>
                              {version.is_active && (
                                <span className="mt-1 inline-flex rounded-full bg-blush-strong/18 px-2 py-0.5 text-xs font-semibold text-foreground">
                                  {t("manager.documents.active")}
                                </span>
                              )}
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="shrink-0 rounded-full"
                              disabled={isMutating}
                              onClick={() => void viewVersion(version.id)}
                            >
                              {t("manager.documents.viewVersion")}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeVersion && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      disabled={isMutating}
                      onClick={() => void archiveActiveVersion()}
                    >
                      {mutationStatus === "archiving" ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Archive className="size-4" aria-hidden="true" />
                      )}
                      {t("manager.documents.archiveActive")}
                    </Button>
                  )}
                </section>
              </div>

            </div>
          </div>
        </div>
      )}
    </section>
  );
}

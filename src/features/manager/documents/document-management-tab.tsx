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
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
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
type DocumentLocale = (typeof supportedDocumentLocales)[number];

type DocumentSelection = {
  documentType: ProductDocumentType;
  locale: DocumentLocale;
};

type ScopedVersion = {
  selection: DocumentSelection;
  version: ProductDocumentVersion;
};

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

function getDocumentLocale(language: string): DocumentLocale {
  const locale = language.split("-")[0];
  return supportedDocumentLocales.includes(locale as DocumentLocale)
    ? (locale as DocumentLocale)
    : "en";
}

function sameSelection(left: DocumentSelection, right: DocumentSelection) {
  return left.documentType === right.documentType && left.locale === right.locale;
}

function selectionKey(selection: DocumentSelection) {
  return `${selection.documentType}:${selection.locale}`;
}

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

function toForm(
  document: Pick<ProductDocumentDraft | ProductDocumentVersion, "title" | "content_markdown" | "effective_at">,
): DocumentFormState {
  return {
    title: document.title,
    contentMarkdown: document.content_markdown,
    effectiveAt: toDateTimeLocal(document.effective_at),
  };
}

function sameForm(left: DocumentFormState, right: DocumentFormState) {
  return left.title === right.title
    && left.contentMarkdown === right.contentMarkdown
    && left.effectiveAt === right.effectiveAt;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function countWords(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function formatPublishedDate(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function DocumentContent({ content }: { content: string }) {
  return (
    <pre dir="auto" className="max-h-[34rem] overflow-auto whitespace-pre-wrap px-4 py-4 font-mono text-sm leading-7 text-foreground/82">
      {content}
    </pre>
  );
}

export function DocumentManagementTab({
  canManageDocuments,
}: DocumentManagementTabProps) {
  const { t, i18n } = useTranslation();
  const { client } = useProductContext();
  const [selection, setSelection] = useState<DocumentSelection>(() => ({
    documentType: productDocumentTypes.terms,
    locale: getDocumentLocale(i18n.language),
  }));
  const [pendingSelection, setPendingSelection] = useState<DocumentSelection | null>(null);
  const [draft, setDraft] = useState<ProductDocumentDraft | null>(null);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [versions, setVersions] = useState<ProductDocumentVersionSummary[]>([]);
  const [liveVersion, setLiveVersion] = useState<ScopedVersion | null>(null);
  const [historyPreview, setHistoryPreview] = useState<ScopedVersion | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState<DocumentFormState>(emptyForm);
  const [formBaseline, setFormBaseline] = useState<DocumentFormState>(emptyForm);
  const [loadedSelectionKey, setLoadedSelectionKey] = useState<string | null>(null);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("idle");
  const [mutationStatus, setMutationStatus] = useState<MutationStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const selectionRef = useRef(selection);
  const loadRequestRef = useRef(0);
  const versionRequestRef = useRef(0);
  const currentSelectionKey = selectionKey(selection);
  const isCurrentWorkspace = loadedSelectionKey === currentSelectionKey;
  const selectedDocument = managedDocumentTypes.find(
    (document) => document.type === selection.documentType,
  ) ?? managedDocumentTypes[0];
  const activeVersion = versions.find(
    (version) => version.id === activeVersionId || version.is_active,
  ) ?? null;
  const timelineVersions = [...versions].sort((left, right) => {
    const leftIsActive = left.id === activeVersionId || left.is_active;
    const rightIsActive = right.id === activeVersionId || right.is_active;

    if (leftIsActive !== rightIsActive) return leftIsActive ? -1 : 1;
    return new Date(right.published_at).getTime() - new Date(left.published_at).getTime();
  });
  const wordCount = countWords(form.contentMarkdown);
  const isMutating = mutationStatus !== "idle";
  const isEditing = Boolean(draft) || editorOpen;
  const hasUnsavedChanges = isEditing && !sameForm(form, formBaseline);

  const resetWorkspace = useCallback(() => {
    setDraft(null);
    setActiveVersionId(null);
    setVersions([]);
    setLiveVersion(null);
    setHistoryPreview(null);
    setEditorOpen(false);
    setForm(emptyForm);
    setFormBaseline(emptyForm);
    setLoadedSelectionKey(null);
    setErrorMessage(null);
    setNotice(null);
  }, []);

  const loadDocument = useCallback(async (requestedSelection: DocumentSelection) => {
    const requestId = ++loadRequestRef.current;
    versionRequestRef.current += 1;
    resetWorkspace();

    if (!canManageDocuments) return;

    if (!client) {
      if (requestId === loadRequestRef.current && sameSelection(requestedSelection, selectionRef.current)) {
        setLoadStatus("error");
        setErrorMessage(t("manager.documents.unavailable"));
      }
      return;
    }

    setLoadStatus("loading");

    try {
      const [draftResult, versionsResult] = await Promise.all([
        client.management.productDocuments.getDraft(requestedSelection.documentType, {
          locale: requestedSelection.locale,
        }),
        client.management.productDocuments.listVersions(requestedSelection.documentType, {
          locale: requestedSelection.locale,
        }),
      ]);
      const activeVersionSummary = versionsResult.versions.find(
        (version) => version.id === versionsResult.active_version_id,
      );
      let activeVersionPreview: ProductDocumentVersion | null = null;

      if (activeVersionSummary) {
        try {
          const versionResult = await client.management.productDocuments.getVersion(
            activeVersionSummary.id,
          );
          activeVersionPreview = versionResult.version;
        } catch {
          // Version metadata remains available even when its read-only preview cannot load.
        }
      }

      if (requestId !== loadRequestRef.current || !sameSelection(requestedSelection, selectionRef.current)) {
        return;
      }

      const nextForm = draftResult.draft ? toForm(draftResult.draft) : emptyForm;
      setDraft(draftResult.draft);
      setActiveVersionId(versionsResult.active_version_id);
      setVersions(versionsResult.versions);
      setLiveVersion(activeVersionPreview
        ? { selection: requestedSelection, version: activeVersionPreview }
        : null);
      setForm(nextForm);
      setFormBaseline(nextForm);
      setLoadedSelectionKey(selectionKey(requestedSelection));
      setLoadStatus("loaded");
    } catch (error) {
      if (requestId !== loadRequestRef.current || !sameSelection(requestedSelection, selectionRef.current)) {
        return;
      }

      setLoadStatus("error");
      setErrorMessage(getErrorMessage(error, t("manager.documents.errorBody")));
    }
  }, [canManageDocuments, client, resetWorkspace, t]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadDocument(selection);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadDocument, selection]);

  function applySelection(nextSelection: DocumentSelection) {
    if (sameSelection(nextSelection, selectionRef.current)) return;

    selectionRef.current = nextSelection;
    loadRequestRef.current += 1;
    versionRequestRef.current += 1;
    setSelection(nextSelection);
    setLoadStatus("loading");
    resetWorkspace();
  }

  function requestSelection(nextSelection: DocumentSelection) {
    if (sameSelection(nextSelection, selectionRef.current) || isMutating) return;

    if (hasUnsavedChanges) {
      setPendingSelection(nextSelection);
      return;
    }

    applySelection(nextSelection);
  }

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

    const mutationSelection = selectionRef.current;
    const expectedRevision = draft?.revision ?? null;
    setMutationStatus("saving");
    setErrorMessage(null);
    setNotice(null);

    try {
      if (!client) throw new Error(t("manager.documents.unavailable"));

      const result = await client.management.productDocuments.saveDraft({
        documentType: mutationSelection.documentType,
        locale: mutationSelection.locale,
        title,
        contentMarkdown,
        effectiveAt: toEffectiveAt(form.effectiveAt),
        expectedRevision,
      });

      if (!sameSelection(mutationSelection, selectionRef.current)) return;

      const nextForm = toForm(result.draft);
      setDraft(result.draft);
      setForm(nextForm);
      setFormBaseline(nextForm);
      setNotice(t("manager.documents.draftSaved"));
    } catch (error) {
      handleMutationError(error);
    } finally {
      setMutationStatus("idle");
    }
  }

  async function discardDraft() {
    if (!draft || !client) return;

    const mutationSelection = selectionRef.current;
    const draftRevision = draft.revision;
    setMutationStatus("discarding");
    setErrorMessage(null);
    setNotice(null);

    try {
      await client.management.productDocuments.discardDraft(
        mutationSelection.documentType,
        { locale: mutationSelection.locale, expectedRevision: draftRevision },
      );

      if (!sameSelection(mutationSelection, selectionRef.current)) return;

      setDraft(null);
      setForm(emptyForm);
      setFormBaseline(emptyForm);
      setEditorOpen(false);
      setNotice(t("manager.documents.draftDiscarded"));
    } catch (error) {
      handleMutationError(error);
    } finally {
      setMutationStatus("idle");
    }
  }

  async function publishDraft() {
    if (!draft || !client) return;

    const mutationSelection = selectionRef.current;
    const draftRevision = draft.revision;
    const expectedActiveVersionId = activeVersionId;
    versionRequestRef.current += 1;
    setMutationStatus("publishing");
    setErrorMessage(null);
    setNotice(null);

    try {
      const result = await client.management.productDocuments.publishDraft({
        documentType: mutationSelection.documentType,
        locale: mutationSelection.locale,
        expectedDraftRevision: draftRevision,
        expectedActiveVersionId,
      });

      if (!sameSelection(mutationSelection, selectionRef.current)) return;

      setDraft(null);
      setActiveVersionId(result.version.id);
      setVersions((current) => [
        { ...result.version, is_active: true },
        ...current.map((version) => ({ ...version, is_active: false })),
      ]);
      setLiveVersion({ selection: mutationSelection, version: result.version });
      setHistoryPreview(null);
      setForm(emptyForm);
      setFormBaseline(emptyForm);
      setEditorOpen(false);
      setNotice(t("manager.documents.published"));
    } catch (error) {
      handleMutationError(error);
    } finally {
      setMutationStatus("idle");
    }
  }

  async function archiveActiveVersion() {
    if (!activeVersionId || !client) return;

    const mutationSelection = selectionRef.current;
    const expectedActiveVersionId = activeVersionId;
    versionRequestRef.current += 1;
    setMutationStatus("archiving");
    setErrorMessage(null);
    setNotice(null);

    try {
      await client.management.productDocuments.archiveActiveVersion({
        documentType: mutationSelection.documentType,
        locale: mutationSelection.locale,
        expectedActiveVersionId,
      });

      if (!sameSelection(mutationSelection, selectionRef.current)) return;

      setActiveVersionId(null);
      setVersions((current) => current.map((version) => ({ ...version, is_active: false })));
      setLiveVersion(null);
      setHistoryPreview(null);
      setNotice(t("manager.documents.archived"));
    } catch (error) {
      handleMutationError(error);
    } finally {
      setMutationStatus("idle");
    }
  }

  async function viewVersion(versionId: string) {
    if (!client) return;

    const requestedSelection = selectionRef.current;
    const requestId = ++versionRequestRef.current;
    setErrorMessage(null);
    setNotice(null);

    try {
      const result = await client.management.productDocuments.getVersion(versionId);
      if (requestId !== versionRequestRef.current || !sameSelection(requestedSelection, selectionRef.current)) {
        return;
      }

      const nextVersion = { selection: requestedSelection, version: result.version };
      if (result.version.id === activeVersionId) {
        setLiveVersion(nextVersion);
        setHistoryPreview(null);
      } else {
        setHistoryPreview(nextVersion);
      }
    } catch (error) {
      if (requestId === versionRequestRef.current && sameSelection(requestedSelection, selectionRef.current)) {
        handleMutationError(error);
      }
    }
  }

  async function restoreVersionAsDraft(source: ScopedVersion) {
    if (!client || draft || !sameSelection(source.selection, selectionRef.current)) return;

    const sourceSelection = source.selection;
    versionRequestRef.current += 1;
    setMutationStatus("restoring");
    setErrorMessage(null);
    setNotice(null);

    try {
      const result = await client.management.productDocuments.saveDraft({
        documentType: sourceSelection.documentType,
        locale: sourceSelection.locale,
        title: source.version.title,
        contentMarkdown: source.version.content_markdown,
        effectiveAt: source.version.effective_at,
        expectedRevision: null,
      });

      if (!sameSelection(sourceSelection, selectionRef.current)) return;

      const nextForm = toForm(result.draft);
      setDraft(result.draft);
      setForm(nextForm);
      setFormBaseline(nextForm);
      setEditorOpen(true);
      setHistoryPreview(null);
      setNotice(t("manager.documents.versionLoaded"));
    } catch (error) {
      handleMutationError(error);
    } finally {
      setMutationStatus("idle");
    }
  }

  function cancelLocalChanges() {
    if (draft) {
      setForm(toForm(draft));
      setFormBaseline(toForm(draft));
    } else {
      setForm(emptyForm);
      setFormBaseline(emptyForm);
      setEditorOpen(false);
    }
    setErrorMessage(null);
  }

  const previewedVersion = historyPreview
    && sameSelection(historyPreview.selection, selection)
    ? historyPreview
    : null;
  const currentLiveVersion = liveVersion
    && sameSelection(liveVersion.selection, selection)
    ? liveVersion
    : null;

  return (
    <section className="mx-auto w-full max-w-6xl rounded-[1.4rem] border border-blush/24 bg-card/78 p-5 shadow-soft sm:p-6">
      <header className="flex flex-col gap-4 border-b border-blush/18 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-blush-strong text-background">
            <FileText className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-serif text-xs uppercase tracking-[0.25em] text-foreground/48">
              {t("manager.tabs.documents")}
            </p>
            <h2 className="mt-2 font-serif text-3xl text-foreground">
              {t("manager.documents.title")}
            </h2>
          </div>
        </div>
        {canManageDocuments && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="self-start rounded-full"
            disabled={loadStatus === "loading" || isMutating}
            onClick={() => void loadDocument(selectionRef.current)}
          >
            <RefreshCw className={loadStatus === "loading" ? "size-4 animate-spin" : "size-4"} aria-hidden="true" />
            {t("manager.documents.refresh")}
          </Button>
        )}
      </header>

      {!canManageDocuments ? (
        <div className="mt-5 rounded-xl border border-blush/24 bg-background/46 p-5">
          <p className="font-serif text-xl text-foreground">{t("manager.documents.noAccessTitle")}</p>
          <p className="mt-2 text-sm leading-6 text-foreground/68">{t("manager.documents.noAccessBody")}</p>
        </div>
      ) : (
        <div className="mt-5 grid gap-5">
          {loadStatus === "loading" && (
            <div className="flex items-center gap-3 rounded-xl border border-blush/24 bg-background/46 p-4 text-sm text-foreground/68">
              <Loader2 className="size-4 animate-spin text-blush-strong" aria-hidden="true" />
              {t("manager.documents.loading")}
            </div>
          )}

          {loadStatus === "error" && (
            <div className="flex items-start gap-3 rounded-xl border border-blush/24 bg-background/46 p-4">
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-blush-strong" aria-hidden="true" />
              <div>
                <p className="font-serif text-xl text-foreground">{t("manager.documents.errorTitle")}</p>
                <p className="mt-1 text-sm leading-6 text-foreground/68">{errorMessage ?? t("manager.documents.errorBody")}</p>
              </div>
            </div>
          )}

          {errorMessage && loadStatus !== "error" && (
            <p className="rounded-xl border border-blush/24 bg-background/46 p-3 text-sm leading-6 text-blush-strong">{errorMessage}</p>
          )}

          {notice && (
            <p className="rounded-xl border border-blush/24 bg-background/46 p-3 text-sm leading-6 text-foreground/68">{notice}</p>
          )}

          {pendingSelection && (
            <section className="rounded-xl border border-blush-strong/45 bg-blush/10 p-4" role="alert">
              <p className="font-semibold text-foreground">{t("manager.documents.unsavedChangesTitle")}</p>
              <p className="mt-1 text-sm leading-6 text-foreground/68">{t("manager.documents.unsavedChangesBody")}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={() => setPendingSelection(null)}>
                  {t("manager.documents.keepEditing")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full"
                  onClick={() => {
                    applySelection(pendingSelection);
                    setPendingSelection(null);
                  }}
                >
                  <X className="size-4" aria-hidden="true" />
                  {t("manager.documents.discardAndContinue")}
                </Button>
              </div>
            </section>
          )}

          <div className="grid gap-3 sm:grid-cols-2" role="list" aria-label={t("manager.documents.documentType")}>
            {managedDocumentTypes.map((document) => {
              const selected = document.type === selection.documentType;
              const Icon = document.Icon;

              return (
                <div key={document.type} role="listitem">
                  <button
                    type="button"
                    className={[
                      "flex w-full items-center gap-3 rounded-xl border p-4 text-start transition-colors",
                      selected ? "border-blush-strong/70 bg-blush/16" : "border-blush/20 bg-background/36 hover:border-blush/44 hover:bg-card/50",
                    ].join(" ")}
                    disabled={loadStatus === "loading" || isMutating}
                    onClick={() => requestSelection({ ...selectionRef.current, documentType: document.type })}
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-full border border-blush/30 text-blush-strong">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-serif text-2xl text-foreground">{t(document.labelKey)}</span>
                      <span className="mt-1 block text-sm leading-5 text-foreground/62">{t(document.descriptionKey)}</span>
                    </span>
                  </button>
                </div>
              );
            })}
          </div>

          <section className="rounded-xl border border-blush/24 bg-background/40 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/52">
                  {t("manager.documents.selectedWorkspace")}
                </p>
                <h3 className="mt-1 font-serif text-3xl text-foreground">{t(selectedDocument.labelKey)}</h3>
                <p className="mt-2 text-sm leading-6 text-foreground/68">{t(selectedDocument.descriptionKey)}</p>
              </div>
              <label className="grid gap-2 text-sm font-semibold text-foreground/76">
                {t("manager.documents.locale")}
                <select
                  value={selection.locale}
                  className="h-10 min-w-36 rounded-xl border border-blush/24 bg-card/60 px-3 text-sm text-foreground outline-none focus:border-blush-strong"
                  disabled={loadStatus === "loading" || isMutating}
                  onChange={(event) => requestSelection({
                    ...selectionRef.current,
                    locale: event.target.value as DocumentLocale,
                  })}
                >
                  {supportedDocumentLocales.map((documentLocale) => (
                    <option key={documentLocale} value={documentLocale}>
                      {t(`manager.documents.localeOptions.${documentLocale}`)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          {isCurrentWorkspace && (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start">
              <div className="grid gap-5">
                <div className={isEditing && activeVersion ? "grid gap-5 2xl:grid-cols-2" : "grid gap-5"}>
                  <section className="overflow-hidden rounded-xl border border-blush/24 bg-background/34">
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-blush/18 px-4 py-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/52">{t("manager.documents.liveVersion")}</p>
                        <p className="mt-1 font-semibold text-foreground">
                          {activeVersion?.title ?? t("manager.documents.noActiveVersion")}
                        </p>
                      </div>
                      {activeVersion && (
                        <span className="rounded-full bg-blush/18 px-2.5 py-1 text-xs font-semibold text-blush-strong">
                          {t("manager.documents.version", { version: activeVersion.version })}
                        </span>
                      )}
                    </div>
                    {currentLiveVersion ? (
                      <DocumentContent content={currentLiveVersion.version.content_markdown} />
                    ) : (
                      <p className="px-4 py-5 text-sm leading-6 text-foreground/62">
                        {activeVersion ? t("manager.documents.livePreviewUnavailable") : t("manager.documents.notLiveMessage")}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 border-t border-blush/18 px-4 py-3">
                      {currentLiveVersion && !draft && (
                        <Button type="button" size="sm" className="rounded-full" disabled={isMutating} onClick={() => void restoreVersionAsDraft(currentLiveVersion)}>
                          {mutationStatus === "restoring" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <RotateCcw className="size-4" aria-hidden="true" />}
                          {t("manager.documents.startEditing")}
                        </Button>
                      )}
                      {!activeVersion && !draft && !editorOpen && (
                        <Button type="button" size="sm" className="rounded-full" disabled={isMutating} onClick={() => setEditorOpen(true)}>
                          <FileText className="size-4" aria-hidden="true" />
                          {t("manager.documents.writeDocument")}
                        </Button>
                      )}
                    </div>
                  </section>

                  {isEditing && (
                    <section className="rounded-xl border border-blush-strong/40 bg-blush/8 p-5">
                      <div className="flex flex-col gap-3 border-b border-blush/18 pb-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/52">{t("manager.documents.draftWorkspace")}</p>
                          <h3 className="mt-1 font-serif text-3xl text-foreground">{t("manager.documents.editingTitle")}</h3>
                          <p className="mt-1 text-sm leading-6 text-foreground/68">{t("manager.documents.editingHint")}</p>
                        </div>
                        <p className="rounded-full bg-background/56 px-3 py-1 text-sm font-semibold text-foreground/76">
                          {draft ? t("manager.documents.draftRevision", { revision: draft.revision }) : t("manager.documents.unsavedDraft")}
                        </p>
                      </div>

                      <div className="mt-5 grid gap-4">
                        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_13rem]">
                          <label className="grid gap-2 text-sm font-semibold text-foreground/76">
                            {t("manager.documents.titleField")}
                            <input value={form.title} className="h-11 rounded-xl border border-blush/24 bg-card/60 px-3 text-sm text-foreground outline-none focus:border-blush-strong" onChange={(event) => setForm((current) => ({ ...current, title: event.currentTarget.value }))} />
                          </label>
                          <label className="grid gap-2 text-sm font-semibold text-foreground/76">
                            {t("manager.documents.effectiveAt")}
                            <input type="datetime-local" value={form.effectiveAt} className="h-11 rounded-xl border border-blush/24 bg-card/60 px-3 text-sm text-foreground outline-none focus:border-blush-strong" onInput={(event) => setForm((current) => ({ ...current, effectiveAt: event.currentTarget.value }))} />
                          </label>
                        </div>

                        <label className="grid gap-2 text-sm font-semibold text-foreground/76">
                          {t("manager.documents.content")}
                          <textarea value={form.contentMarkdown} rows={18} className="min-h-[28rem] resize-y rounded-xl border border-blush/24 bg-card/60 px-4 py-4 font-mono text-sm leading-6 text-foreground outline-none focus:border-blush-strong" onChange={(event) => setForm((current) => ({ ...current, contentMarkdown: event.currentTarget.value }))} />
                        </label>

                        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-foreground/62">
                          <span>{form.contentMarkdown.length} · {wordCount}</span>
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" size="sm" variant="outline" className="rounded-full border-blush-strong/60 bg-card/90 text-foreground hover:bg-blush/16" disabled={isMutating} onClick={() => void saveDraft()}>
                              {mutationStatus === "saving" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
                              {t("manager.documents.saveForLater")}
                            </Button>
                            <Button type="button" size="sm" className="rounded-full" disabled={!draft || isMutating} onClick={() => void publishDraft()}>
                              {mutationStatus === "publishing" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
                              {t("manager.documents.publishForCustomers")}
                            </Button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 border-t border-blush/18 pt-4">
                          <Button type="button" size="sm" variant="outline" className="rounded-full" disabled={isMutating || !hasUnsavedChanges} onClick={cancelLocalChanges}>
                            <X className="size-4" aria-hidden="true" />
                            {t("manager.documents.cancelChanges")}
                          </Button>
                          {draft && (
                            <Button type="button" size="sm" variant="outline" className="rounded-full border-blush/36 text-foreground/76 hover:bg-blush/12" disabled={isMutating} onClick={() => void discardDraft()}>
                              {mutationStatus === "discarding" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}
                              {t("manager.documents.discardDraft")}
                            </Button>
                          )}
                        </div>
                      </div>
                    </section>
                  )}
                </div>

                {previewedVersion && (
                  <section className="overflow-hidden rounded-xl border border-blush/24 bg-background/34">
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-blush/18 px-4 py-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/52">{t("manager.documents.historyPreview")}</p>
                        <p className="mt-1 font-semibold text-foreground">{previewedVersion.version.title}</p>
                      </div>
                      <span className="rounded-full bg-background/64 px-2.5 py-1 text-xs font-semibold text-foreground/70">
                        {t("manager.documents.version", { version: previewedVersion.version.version })}
                      </span>
                    </div>
                    <DocumentContent content={previewedVersion.version.content_markdown} />
                    <div className="flex flex-wrap gap-2 border-t border-blush/18 px-4 py-3">
                      {!draft && (
                        <Button type="button" size="sm" className="rounded-full" disabled={isMutating} onClick={() => void restoreVersionAsDraft(previewedVersion)}>
                          {mutationStatus === "restoring" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <RotateCcw className="size-4" aria-hidden="true" />}
                          {t("manager.documents.loadAsDraft")}
                        </Button>
                      )}
                      <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={() => setHistoryPreview(null)}>
                        {t("manager.documents.closePreview")}
                      </Button>
                    </div>
                  </section>
                )}

                {activeVersion && (
                  <details className="rounded-xl border border-blush/20 bg-background/30 p-4">
                    <summary className="cursor-pointer font-semibold text-foreground">{t("manager.documents.moreOptions")}</summary>
                    <div className="mt-3">
                      <Button type="button" size="sm" variant="outline" className="rounded-full" disabled={isMutating} onClick={() => void archiveActiveVersion()}>
                        {mutationStatus === "archiving" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Archive className="size-4" aria-hidden="true" />}
                        {t("manager.documents.archiveActive")}
                      </Button>
                    </div>
                  </details>
                )}
              </div>

              <aside className="rounded-xl border border-blush/24 bg-background/34 p-5 xl:sticky xl:top-6">
                <div className="flex items-center gap-2">
                  <History className="size-4 text-blush-strong" aria-hidden="true" />
                  <h3 className="font-serif text-2xl text-foreground">{t("manager.documents.history")}</h3>
                </div>
                <p className="mt-2 text-sm leading-6 text-foreground/62">{t("manager.documents.olderVersionsHint")}</p>

                {timelineVersions.length === 0 ? (
                  <p className="mt-5 text-sm leading-6 text-foreground/62">{t("manager.documents.noVersions")}</p>
                ) : (
                  <div className="mt-5 max-h-[32rem] overflow-auto pe-1">
                    <div className="ms-2 border-s border-blush/28 ps-5">
                      {timelineVersions.map((version) => {
                        const isActive = version.id === activeVersionId || version.is_active;
                        const isPreviewed = previewedVersion?.version.id === version.id;

                        return (
                          <button key={version.id} type="button" className={[
                            "relative block w-full pb-5 text-start last:pb-0",
                            isPreviewed ? "text-blush-strong" : "",
                          ].join(" ")} disabled={isMutating} onClick={() => void viewVersion(version.id)}>
                            <span className={[
                              "absolute -start-[1.78rem] top-1 size-3 rounded-full border-2",
                              isActive ? "border-blush-strong bg-blush-strong" : "border-foreground/55 bg-background",
                            ].join(" ")} aria-hidden="true" />
                            <span className="block rounded-lg px-2 py-1.5 transition-colors hover:bg-card/56">
                              <span className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-foreground">{t("manager.documents.version", { version: version.version })}</span>
                                {isActive && <span className="rounded-full bg-blush/18 px-2 py-0.5 text-xs font-semibold text-blush-strong">{t("manager.documents.active")}</span>}
                              </span>
                              <span className="mt-1 block text-sm leading-5 text-foreground/70">{version.title}</span>
                              <span className="mt-1 block text-xs text-foreground/52">{formatPublishedDate(version.published_at, selection.locale)}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </aside>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

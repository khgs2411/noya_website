import type {
  ProductChangeRequest,
  ProductChangeRequestAttachment,
} from "@class-kit/react";
import {
  AlertTriangle,
  Edit3,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { getChangeRequestStatusPresentation } from "@/features/manager/change-requests/change-request-status";

type ChangeRequestDetailPanelProps = {
  request: ProductChangeRequest;
  busy: boolean;
  errorMessage: string | null;
  refreshFailed: boolean;
  onClose: () => void;
  onRevise: () => void;
  onDelete: () => Promise<{ ok: boolean }>;
  onUpload: (file: File) => Promise<{ ok: boolean }>;
  onRetryRefresh: () => Promise<unknown>;
};

function dateLabel(value: string, language: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(language, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

function contextLabel(context: Record<string, unknown>, unavailable: string) {
  try {
    return JSON.stringify(context, null, 2) || unavailable;
  } catch {
    return unavailable;
  }
}

function requestTypeLabel(type: unknown, t: (key: string) => string) {
  if (type === "issue") return t("manager.changeRequests.type.issue");
  if (type === "feature_request") {
    return t("manager.changeRequests.type.featureRequest");
  }
  return String(type);
}

function attachmentLabel(
  attachment: ProductChangeRequestAttachment,
  language: string,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  const size =
    attachment.size_bytes == null
      ? t("manager.changeRequests.attachment.unknownSize")
      : new Intl.NumberFormat(language, {
          style: "unit",
          unit: "byte",
          unitDisplay: "narrow",
        }).format(attachment.size_bytes);
  const contentType =
    attachment.content_type ??
    t("manager.changeRequests.attachment.unknownType");
  return `${contentType} · ${size} · ${dateLabel(attachment.created_at, language)}`;
}

export function ChangeRequestDetailPanel({
  request,
  busy,
  errorMessage,
  refreshFailed,
  onClose,
  onRevise,
  onDelete,
  onUpload,
  onRetryRefresh,
}: ChangeRequestDetailPanelProps) {
  const { t, i18n } = useTranslation();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);
  const revisions = useMemo(
    () =>
      [...request.revisions].sort(
        (left, right) =>
          left.version_number - right.version_number ||
          left.created_at.localeCompare(right.created_at),
      ),
    [request.revisions],
  );

  useEffect(() => {
    const focusTimer = window.setTimeout(() => dialogRef.current?.focus(), 0);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy && !confirmingDelete) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [busy, confirmingDelete, onClose]);

  const typeValue = requestTypeLabel(request.type, t);
  const statusKey =
    request.status === "open" ||
    request.status === "in_progress" ||
    request.status === "done" ||
    request.status === "closed"
      ? `manager.changeRequests.status.${request.status}`
      : null;
  const statusValue = statusKey ? t(statusKey) : String(request.status);
  const statusPresentation = getChangeRequestStatusPresentation(request.status);

  async function deleteRequest() {
    const result = await onDelete();
    if (result.ok) onClose();
  }

  async function uploadFile(file: File | undefined) {
    if (!file) return;
    await onUpload(file);
    if (fileInput.current) fileInput.current.value = "";
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-black/50 p-0 md:place-items-center md:p-6"
      onClick={() => !busy && !confirmingDelete && onClose()}
    >
      <aside
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        aria-label={request.title ?? t("manager.changeRequests.untitled")}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-[1.4rem] border border-blush/24 bg-background p-5 text-foreground shadow-soft md:max-w-2xl md:rounded-[1.4rem] md:bg-card/95"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-serif text-xs uppercase tracking-[0.25em] text-foreground/48">
              {t("manager.changeRequests.detail.eyebrow")}
            </p>
            <h2 className="mt-2 break-words font-serif text-3xl">
              {request.title ?? t("manager.changeRequests.untitled")}
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            disabled={busy}
            onClick={onClose}
            aria-label={t("actions.close")}
          >
            <X className="size-5" aria-hidden="true" />
          </Button>
        </header>

        <dl className="mt-5 grid gap-3 text-sm">
          <div className="grid gap-1 rounded-xl border border-blush/24 bg-background/46 p-3 sm:grid-cols-[8rem_1fr]">
            <dt className="font-semibold uppercase tracking-[0.16em] text-foreground/48">
              {t("manager.changeRequests.detail.type")}
            </dt>
            <dd className="break-words text-foreground/72">{typeValue}</dd>
          </div>
          <div className="grid gap-1 rounded-xl border border-blush/24 bg-background/46 p-3 sm:grid-cols-[8rem_1fr]">
            <dt className="font-semibold uppercase tracking-[0.16em] text-foreground/48">
              {t("manager.changeRequests.detail.status")}
            </dt>
            <dd>
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${statusPresentation.badgeClassName}`}
              >
                {statusValue}
              </span>
            </dd>
          </div>
          <div className="grid gap-1 rounded-xl border border-blush/24 bg-background/46 p-3 sm:grid-cols-[8rem_1fr]">
            <dt className="font-semibold uppercase tracking-[0.16em] text-foreground/48">
              {t("manager.changeRequests.detail.description")}
            </dt>
            <dd className="whitespace-pre-wrap break-words text-foreground/72">
              {request.description}
            </dd>
          </div>
        </dl>

        <section className="mt-5">
          <h3 className="font-serif text-xl">
            {t("manager.changeRequests.detail.context")}
          </h3>
          <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-blush/24 bg-background/46 p-3 text-sm text-foreground/72">
            {contextLabel(
              request.context,
              t("manager.changeRequests.contextUnavailable"),
            )}
          </pre>
        </section>
        <section className="mt-5">
          <h3 className="font-serif text-xl">
            {t("manager.changeRequests.detail.history")}
          </h3>
          <div className="mt-2 grid gap-3">
            {revisions.map((revision) => (
              <article
                key={revision.id}
                className="rounded-xl border border-blush/24 bg-background/46 p-3 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong>
                    {t("manager.changeRequests.detail.version", {
                      version: revision.version_number,
                    })}
                  </strong>
                  <span className="text-foreground/56">
                    {dateLabel(revision.created_at, i18n.language)}
                  </span>
                </div>
                <p className="mt-2 break-words font-medium">
                  {revision.title ?? t("manager.changeRequests.untitled")}
                </p>
                <p className="mt-1 text-foreground/56">
                  {requestTypeLabel(revision.type, t)}
                </p>
                <p className="mt-1 whitespace-pre-wrap break-words text-foreground/72">
                  {revision.description}
                </p>
                <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-foreground/56">
                  {contextLabel(
                    revision.context,
                    t("manager.changeRequests.contextUnavailable"),
                  )}
                </pre>
              </article>
            ))}
          </div>
        </section>
        <section className="mt-5">
          <h3 className="font-serif text-xl">
            {t("manager.changeRequests.detail.attachments")}
          </h3>
          {request.attachments.length === 0 ? (
            <p className="mt-2 text-sm text-foreground/68">
              {t("manager.changeRequests.attachment.empty")}
            </p>
          ) : (
            <ul className="mt-2 grid gap-2">
              {request.attachments.map((attachment) => (
                <li
                  key={attachment.id}
                  className="rounded-xl border border-blush/24 bg-background/46 p-3"
                >
                  <p className="break-words text-sm font-medium">
                    {attachment.file_name}
                  </p>
                  <p className="mt-1 break-words text-xs text-foreground/56">
                    {attachmentLabel(attachment, i18n.language, t)}
                  </p>
                  <p className="mt-1 text-xs text-foreground/56">
                    {attachment.status === "pending" ||
                    attachment.status === "uploaded"
                      ? t(
                          `manager.changeRequests.attachment.status.${attachment.status}`,
                        )
                      : String(attachment.status)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {refreshFailed && (
          <section className="mt-4 rounded-xl border border-blush-strong/35 bg-background/46 p-3">
            <p className="text-sm leading-6 text-blush-strong">
              {t("manager.changeRequests.refreshFailed")}
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-3 rounded-full"
              disabled={busy}
              onClick={() => void onRetryRefresh()}
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              {t("manager.changeRequests.retry")}
            </Button>
          </section>
        )}
        {errorMessage && (
          <p className="mt-4 text-sm leading-6 text-blush-strong">
            {errorMessage}
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            type="button"
            className="rounded-full"
            disabled={busy || confirmingDelete}
            onClick={onRevise}
          >
            <Edit3 className="size-4" aria-hidden="true" />
            {t("manager.changeRequests.actions.revise")}
          </Button>
          <input
            ref={fileInput}
            className="sr-only"
            type="file"
            onChange={(event) => void uploadFile(event.target.files?.[0])}
          />
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={busy || confirmingDelete}
            onClick={() => fileInput.current?.click()}
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Upload className="size-4" aria-hidden="true" />
            )}
            {t("manager.changeRequests.actions.attach")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={busy || confirmingDelete}
            onClick={() => setConfirmingDelete(true)}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            {t("manager.changeRequests.actions.delete")}
          </Button>
        </div>

        {confirmingDelete && (
          <section className="mt-5 rounded-xl border border-blush-strong/35 bg-background/46 p-4">
            <div className="flex gap-3">
              <AlertTriangle
                className="mt-0.5 size-5 shrink-0 text-blush-strong"
                aria-hidden="true"
              />
              <div>
                <h3 className="font-serif text-xl">
                  {t("manager.changeRequests.delete.title")}
                </h3>
                <p className="mt-1 text-sm leading-6 text-foreground/68">
                  {t("manager.changeRequests.delete.body")}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                disabled={busy}
                onClick={() => setConfirmingDelete(false)}
              >
                {t("manager.changeRequests.delete.keep")}
              </Button>
              <Button
                type="button"
                className="rounded-full"
                disabled={busy}
                onClick={() => void deleteRequest()}
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 className="size-4" aria-hidden="true" />
                )}
                {t("manager.changeRequests.delete.confirm")}
              </Button>
            </div>
          </section>
        )}
      </aside>
    </div>
  );
}

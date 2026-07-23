import type {
  CreateProductChangeRequestInput,
  ProductChangeRequest,
  ProductChangeRequestType,
  UpdateProductChangeRequestInput,
} from "@class-kit/react";
import { X } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

type FormMode = "create" | "revise";
type FormFields = {
  type: ProductChangeRequestType;
  title: string;
  description: string;
};

type ChangeRequestFormDialogProps = {
  mode: FormMode;
  request: ProductChangeRequest | null;
  busy: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onCreate: (
    input: CreateProductChangeRequestInput,
  ) => Promise<{ ok: boolean }>;
  onRevise: (
    input: UpdateProductChangeRequestInput,
  ) => Promise<{ ok: boolean }>;
};

function fieldsFor(
  mode: FormMode,
  request: ProductChangeRequest | null,
): FormFields {
  if (mode === "revise" && request) {
    return {
      type: request.type,
      title: request.title ?? "",
      description: request.description,
    };
  }
  return { type: "issue", title: "", description: "" };
}

export function ChangeRequestFormDialog({
  mode,
  request,
  busy,
  errorMessage,
  onClose,
  onCreate,
  onRevise,
}: ChangeRequestFormDialogProps) {
  const { t } = useTranslation();
  const [fields, setFields] = useState(() => fieldsFor(mode, request));
  const [validationError, setValidationError] = useState<string | null>(null);
  const initialFocus = useRef<HTMLSelectElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => initialFocus.current?.focus(), 0);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [busy, onClose]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const description = fields.description.trim();
    if (!description) {
      setValidationError(t("manager.changeRequests.validation.description"));
      return;
    }

    const title = fields.title.trim();
    const input = {
      type: fields.type,
      description,
      ...(title ? { title } : {}),
    };
    const result =
      mode === "revise" && request
        ? await onRevise({
            ...input,
            requestId: request.id,
            context: request.context,
          })
        : await onCreate(input);
    if (result.ok) onClose();
  }

  const title =
    mode === "revise"
      ? t("manager.changeRequests.form.reviseTitle")
      : t("manager.changeRequests.form.createTitle");

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-end bg-black/50 p-0 md:place-items-center md:p-6"
      onClick={() => !busy && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-[1.4rem] border border-blush/24 bg-background p-5 text-foreground shadow-soft md:max-w-xl md:rounded-[1.4rem] md:bg-card/95"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-serif text-xs uppercase tracking-[0.25em] text-foreground/48">
              {t("manager.tabs.changeRequests")}
            </p>
            <h2 className="mt-2 font-serif text-3xl">{title}</h2>
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
        <form className="mt-5 grid gap-4" onSubmit={submit}>
          <label className="text-sm text-foreground/68">
            <span>{t("manager.changeRequests.form.type")}</span>
            <select
              ref={initialFocus}
              className="mt-2 min-h-11 w-full rounded-xl border border-blush/24 bg-background/70 px-3 text-foreground outline-none focus:border-blush-strong"
              value={fields.type}
              disabled={busy}
              onChange={(event) =>
                setFields((current) => ({
                  ...current,
                  type: event.target.value as ProductChangeRequestType,
                }))
              }
            >
              <option value="issue">
                {t("manager.changeRequests.type.issue")}
              </option>
              <option value="feature_request">
                {t("manager.changeRequests.type.featureRequest")}
              </option>
            </select>
          </label>
          <label className="text-sm text-foreground/68">
            <span>{t("manager.changeRequests.form.title")}</span>
            <input
              className="mt-2 min-h-11 w-full rounded-xl border border-blush/24 bg-background/70 px-3 text-foreground outline-none focus:border-blush-strong"
              value={fields.title}
              disabled={busy}
              onChange={(event) =>
                setFields((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
            />
          </label>
          <label className="text-sm text-foreground/68">
            <span>{t("manager.changeRequests.form.description")}</span>
            <textarea
              className="mt-2 min-h-32 w-full rounded-xl border border-blush/24 bg-background/70 p-3 text-foreground outline-none focus:border-blush-strong"
              value={fields.description}
              disabled={busy}
              onChange={(event) =>
                setFields((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </label>
          {(validationError || errorMessage) && (
            <p className="text-sm leading-6 text-blush-strong">
              {validationError ?? errorMessage}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={busy}
              onClick={onClose}
            >
              {t("actions.close")}
            </Button>
            <Button type="submit" className="rounded-full" disabled={busy}>
              {busy
                ? t("manager.changeRequests.saving")
                : mode === "revise"
                  ? t("manager.changeRequests.form.revise")
                  : t("manager.changeRequests.form.create")}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}

import type { ClassTemplate } from "@class-kit/react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

type TemplateDeactivateDialogProps = {
  open: boolean;
  template: ClassTemplate | null;
  submitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onConfirm: (templateId: string) => Promise<{ ok: boolean }>;
};

export function TemplateDeactivateDialog({
  open,
  template,
  submitting,
  errorMessage,
  onClose,
  onConfirm,
}: TemplateDeactivateDialogProps) {
  const { t } = useTranslation();

  if (!open || !template) return null;

  async function confirmDeactivate() {
    if (!template) return;
    const result = await onConfirm(template.id);
    if (result.ok) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-black/50 p-0 sm:place-items-center sm:p-6"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={t("manager.templateDeactivate.title")}
        className="w-full rounded-t-[1.4rem] border border-blush/24 bg-background p-5 text-foreground shadow-soft sm:max-w-lg sm:rounded-[1.4rem]"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="font-serif text-3xl">
          {t("manager.templateDeactivate.title")}
        </h2>
        <p className="mt-3 text-sm leading-6 text-foreground/68">
          {t("manager.templateDeactivate.body")}
        </p>
        <p className="mt-4 rounded-xl border border-blush/24 bg-background/46 p-3 font-serif text-xl">
          {template.name}
        </p>
        {errorMessage && (
          <p className="mt-4 text-sm leading-6 text-blush-strong">
            {errorMessage}
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={onClose}
          >
            {t("actions.close")}
          </Button>
          <Button
            type="button"
            className="rounded-full"
            disabled={submitting}
            onClick={() => void confirmDeactivate()}
          >
            {t("manager.templateActions.deactivate")}
          </Button>
        </div>
      </section>
    </div>
  );
}

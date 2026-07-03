import type { CancelManagedClassInput, ManagedClass } from "@class-kit/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

type ClassCancelDialogProps = {
  open: boolean;
  managedClass: ManagedClass | null;
  submitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onConfirm: (
    classId: string,
    input: CancelManagedClassInput,
  ) => Promise<{ ok: boolean }>;
};

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function ClassCancelDialog({
  open,
  managedClass,
  ...props
}: ClassCancelDialogProps) {
  if (!open || !managedClass) return null;

  return (
    <ClassCancelDialogContent
      key={managedClass.id}
      managedClass={managedClass}
      {...props}
    />
  );
}

function ClassCancelDialogContent({
  managedClass,
  submitting,
  errorMessage,
  onClose,
  onConfirm,
}: Omit<ClassCancelDialogProps, "open"> & { managedClass: ManagedClass }) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [exposeReasonToUsers, setExposeReasonToUsers] = useState(false);

  const classId = managedClass.id;

  async function confirmCancel() {
    const result = await onConfirm(classId, {
      reason: emptyToNull(reason),
      exposeReasonToUsers,
    });
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
        aria-label={t("manager.cancel.title")}
        className="w-full rounded-t-[1.4rem] border border-blush/24 bg-background p-5 text-foreground shadow-soft sm:max-w-lg sm:rounded-[1.4rem]"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="font-serif text-3xl">{t("manager.cancel.title")}</h2>
        <p className="mt-3 text-sm leading-6 text-foreground/68">
          {t("manager.cancel.body")}
        </p>
        <label className="mt-5 block text-sm text-foreground/68">
          <span>{t("manager.cancel.reason")}</span>
          <textarea
            className="mt-2 min-h-24 w-full rounded-xl border border-blush/24 bg-background/70 p-3 text-foreground outline-none focus:border-blush-strong"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </label>
        <label className="mt-4 flex items-start gap-3 text-sm text-foreground/68">
          <input
            className="mt-1"
            type="checkbox"
            checked={exposeReasonToUsers}
            onChange={(event) => setExposeReasonToUsers(event.target.checked)}
          />
          <span>{t("manager.cancel.exposeReason")}</span>
        </label>
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
            onClick={() => void confirmCancel()}
          >
            {t("manager.classActions.cancel")}
          </Button>
        </div>
      </section>
    </div>
  );
}

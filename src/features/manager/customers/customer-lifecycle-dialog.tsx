import type { Customer } from "@class-kit/react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { getCustomerLabel } from "@/features/customers/customer-labels";

type LifecycleAction = "deactivate" | "reactivate";

export function CustomerLifecycleDialog({
  open,
  action,
  customer,
  submitting,
  canSubmit,
  errorMessage,
  onClose,
  onConfirm,
}: {
  open: boolean;
  action: LifecycleAction;
  customer: Customer | null;
  submitting: boolean;
  canSubmit: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onConfirm: () => Promise<{ ok: boolean }>;
}) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open || !customer) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusId = window.setTimeout(() => {
      dialogRef.current
        ?.querySelector<HTMLElement>("button:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], input:not([disabled])")
        ?.focus();
    }, 0);
    return () => {
      window.clearTimeout(focusId);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [customer, open]);

  useEffect(() => {
    if (!open || !customer) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (!submitting) onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        "button:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], input:not([disabled])",
      );
      if (!focusable?.length) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [customer, onClose, open, submitting]);

  if (!open || !customer) return null;

  const title = t(`manager.customerActions.lifecycle.${action}.title`);

  async function confirm() {
    const result = await onConfirm();
    if (result.ok) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-end bg-black/50 p-0 sm:place-items-center sm:p-6"
      onMouseDown={submitting ? undefined : onClose}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full rounded-t-[1.4rem] border border-blush/24 bg-background p-5 text-foreground shadow-soft sm:max-w-lg sm:rounded-[1.4rem]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 className="font-serif text-3xl">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-foreground/68">
          {t(`manager.customerActions.lifecycle.${action}.body`)}
        </p>
        <p className="mt-4 rounded-xl border border-blush/24 bg-background/46 p-3 font-serif text-xl">
          {getCustomerLabel(customer, t("manager.customers.unnamed"))}
        </p>
        {errorMessage && <p role="alert" className="mt-4 text-sm leading-6 text-blush-strong">{errorMessage}</p>}
        <div className="mt-6 flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="rounded-full" disabled={submitting} onClick={onClose}>
            {t("manager.customerActions.lifecycle.keep")}
          </Button>
          <Button type="button" className="rounded-full" disabled={submitting || !canSubmit} onClick={() => void confirm()}>
            {submitting ? t("manager.customerActions.lifecycle.saving") : t(`manager.customerActions.lifecycle.${action}.confirm`)}
          </Button>
        </div>
      </section>
    </div>
  );
}

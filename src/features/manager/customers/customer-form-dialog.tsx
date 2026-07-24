import type { CreateCustomerInput, Customer, UpdateCustomerInput } from "@class-kit/react";
import { X } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

type CustomerFormMode = "create" | "edit";

type CustomerFormDialogProps = {
  open: boolean;
  mode: CustomerFormMode;
  customer: Customer | null;
  submitting: boolean;
  canSubmit: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onCreate: (input: CreateCustomerInput) => Promise<{ ok: boolean }>;
  onUpdate: (input: UpdateCustomerInput) => Promise<{ ok: boolean }>;
};

type CustomerFields = {
  displayName: string;
  contactEmail: string;
  phoneNumber: string;
};

const emptyFields: CustomerFields = {
  displayName: "",
  contactEmail: "",
  phoneNumber: "",
};

function fieldsFromCustomer(customer: Customer | null): CustomerFields {
  if (!customer) return emptyFields;

  return {
    displayName: customer.displayName,
    contactEmail: customer.contactEmail ?? "",
    phoneNumber: customer.phoneNumber ?? "",
  };
}

function optionalValue(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function CustomerFormDialog({
  open,
  mode,
  customer,
  ...props
}: CustomerFormDialogProps) {
  if (!open) return null;

  return (
    <CustomerFormDialogContent
      key={`${mode}-${customer?.customerId ?? "new"}`}
      mode={mode}
      customer={customer}
      {...props}
    />
  );
}

function CustomerFormDialogContent({
  mode,
  customer,
  submitting,
  canSubmit,
  errorMessage,
  onClose,
  onCreate,
  onUpdate,
}: Omit<CustomerFormDialogProps, "open">) {
  const { t } = useTranslation();
  const [fields, setFields] = useState<CustomerFields>(() =>
    mode === "edit" ? fieldsFromCustomer(customer) : emptyFields,
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  function updateField(key: keyof CustomerFields, value: string) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const displayName = fields.displayName.trim();
    if (!displayName) {
      setValidationError(t("manager.customerActions.form.displayNameRequired"));
      return;
    }

    setValidationError(null);
    const contactEmail = optionalValue(fields.contactEmail);
    const phoneNumber = optionalValue(fields.phoneNumber);
    const result = mode === "edit" && customer
      ? await onUpdate({
          customerId: customer.customerId,
          displayName,
          contactEmail,
          phoneNumber,
        })
      : await onCreate({
          displayName,
          ...(contactEmail ? { contactEmail } : {}),
          ...(phoneNumber ? { phoneNumber } : {}),
        });

    if (result.ok) onClose();
  }

  const title = t(
    mode === "edit"
      ? "manager.customerActions.form.editTitle"
      : "manager.customerActions.form.createTitle",
  );

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/50 p-0 sm:grid sm:place-items-center sm:p-6"
      onMouseDown={submitting ? undefined : onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex h-full w-full flex-col overflow-hidden bg-background text-foreground sm:h-auto sm:max-h-[92vh] sm:max-w-lg sm:rounded-[1.4rem] sm:border sm:border-blush/24 sm:bg-card/95 sm:shadow-soft"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-blush/24 p-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/48">
              {t("manager.customers.detailEyebrow")}
            </p>
            <h2 className="mt-1 font-serif text-3xl">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-foreground/68">
              {t("manager.customerActions.form.description")}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={submitting}
            onClick={onClose}
            aria-label={t("actions.close")}
          >
            <X className="size-5" aria-hidden="true" />
          </Button>
        </header>

        <form className="flex-1 overflow-y-auto p-5" onSubmit={submit}>
          <div className="grid gap-4">
            <label className="block text-sm text-foreground/68">
              <span>{t("manager.customerActions.form.displayName")}</span>
              <input
                className="mt-2 min-h-11 w-full rounded-xl border border-blush/24 bg-background/70 px-3 text-foreground outline-none focus:border-blush-strong"
                value={fields.displayName}
                autoComplete="name"
                disabled={submitting || !canSubmit}
                onChange={(event) => updateField("displayName", event.target.value)}
              />
            </label>
            <label className="block text-sm text-foreground/68">
              <span>{t("manager.customerActions.form.contactEmail")}</span>
              <input
                className="mt-2 min-h-11 w-full rounded-xl border border-blush/24 bg-background/70 px-3 text-foreground outline-none focus:border-blush-strong"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={fields.contactEmail}
                disabled={submitting || !canSubmit}
                onChange={(event) => updateField("contactEmail", event.target.value)}
              />
            </label>
            <label className="block text-sm text-foreground/68">
              <span>{t("manager.customerActions.form.phoneNumber")}</span>
              <input
                className="mt-2 min-h-11 w-full rounded-xl border border-blush/24 bg-background/70 px-3 text-foreground outline-none focus:border-blush-strong"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={fields.phoneNumber}
                disabled={submitting || !canSubmit}
                onChange={(event) => updateField("phoneNumber", event.target.value)}
              />
            </label>
          </div>

          <p className="mt-3 text-sm leading-6 text-foreground/58">
            {t("manager.customerActions.form.contactHint")}
          </p>
          {(validationError || errorMessage) && (
            <p role="alert" className="mt-5 rounded-xl border border-blush/24 bg-background/46 p-3 text-sm leading-6 text-blush-strong">
              {validationError ?? errorMessage}
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-2">
            <Button type="button" variant="outline" className="rounded-full" disabled={submitting} onClick={onClose}>
              {t("actions.close")}
            </Button>
            <Button type="submit" className="rounded-full" disabled={submitting || !canSubmit}>
              {submitting
                ? t("manager.customerActions.form.saving")
                : t(mode === "edit" ? "manager.customerActions.form.save" : "manager.customerActions.form.create")}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}

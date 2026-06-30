import type {
  ClassTemplate,
  CreateClassTemplateInput,
  UpdateClassTemplateInput,
} from "@class-kit/react";
import { X } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

type TemplateFormMode = "create" | "edit";

type TemplateFormDialogProps = {
  open: boolean;
  mode: TemplateFormMode;
  template: ClassTemplate | null;
  submitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onCreate: (input: CreateClassTemplateInput) => Promise<{ ok: boolean }>;
  onUpdate: (input: UpdateClassTemplateInput) => Promise<{ ok: boolean }>;
};

type TemplateFormFields = {
  name: string;
  description: string;
  category: string;
  defaultCapacity: string;
  defaultLocation: string;
  defaultVisibility: "public" | "hidden" | "members_only";
  defaultRegistrationPolicy:
    | "auto_approve"
    | "member_auto_approve"
    | "approval_required";
  defaultMembershipRequirement: "none" | "required";
  defaultNotes: string;
};

const createDefaults: TemplateFormFields = {
  name: "",
  description: "",
  category: "",
  defaultCapacity: "12",
  defaultLocation: "",
  defaultVisibility: "public",
  defaultRegistrationPolicy: "auto_approve",
  defaultMembershipRequirement: "none",
  defaultNotes: "",
};

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function fieldsFromTemplate(template: ClassTemplate | null): TemplateFormFields {
  if (!template) return createDefaults;

  return {
    name: template.name,
    description: template.description ?? "",
    category: template.category ?? "",
    defaultCapacity: String(template.default_capacity),
    defaultLocation: template.default_location ?? "",
    defaultVisibility: template.default_visibility,
    defaultRegistrationPolicy: template.default_registration_policy,
    defaultMembershipRequirement: template.default_membership_requirement,
    defaultNotes: template.default_notes ?? "",
  };
}

function toTemplateInput(fields: TemplateFormFields): CreateClassTemplateInput {
  return {
    name: fields.name.trim(),
    description: emptyToNull(fields.description),
    category: emptyToNull(fields.category),
    defaultCapacity: Number(fields.defaultCapacity),
    defaultLocation: emptyToNull(fields.defaultLocation),
    defaultVisibility: fields.defaultVisibility,
    defaultRegistrationPolicy: fields.defaultRegistrationPolicy,
    defaultMembershipRequirement: fields.defaultMembershipRequirement,
    defaultNotes: emptyToNull(fields.defaultNotes),
  };
}

function validateTemplateForm(
  fields: TemplateFormFields,
  t: (key: string) => string,
) {
  const errors: string[] = [];
  const capacity = Number(fields.defaultCapacity);

  if (!fields.name.trim()) errors.push(t("manager.templateValidation.nameRequired"));
  if (!Number.isInteger(capacity) || capacity <= 0) {
    errors.push(t("manager.templateValidation.capacity"));
  }

  return errors;
}

type TextFieldProps = {
  label: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
};

function TextField({
  label,
  value,
  type = "text",
  onChange,
}: TextFieldProps) {
  return (
    <label className="block text-sm text-foreground/68">
      <span>{label}</span>
      <input
        className="mt-2 min-h-11 w-full rounded-xl border border-blush/24 bg-background/70 px-3 text-foreground outline-none focus:border-blush-strong"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

type SelectFieldProps = {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
};

function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  return (
    <label className="block text-sm text-foreground/68">
      <span>{label}</span>
      <select
        className="mt-2 min-h-11 w-full rounded-xl border border-blush/24 bg-background/70 px-3 text-foreground outline-none focus:border-blush-strong"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function TemplateFormDialog({
  open,
  mode,
  template,
  ...props
}: TemplateFormDialogProps) {
  if (!open) return null;

  return (
    <TemplateFormDialogContent
      key={`${mode}-${template?.id ?? "new"}`}
      mode={mode}
      template={template}
      {...props}
    />
  );
}

function TemplateFormDialogContent({
  mode,
  template,
  submitting,
  errorMessage,
  onClose,
  onCreate,
  onUpdate,
}: Omit<TemplateFormDialogProps, "open">) {
  const { t } = useTranslation();
  const [fields, setFields] = useState<TemplateFormFields>(() =>
    mode === "edit" ? fieldsFromTemplate(template) : createDefaults,
  );
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const updateField = <K extends keyof TemplateFormFields>(
    key: K,
    value: TemplateFormFields[K],
  ) => {
    setFields((current) => ({ ...current, [key]: value }));
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateTemplateForm(fields, t);
    setValidationErrors(errors);
    if (errors.length > 0) return;

    const input = toTemplateInput(fields);
    const result =
      mode === "edit" && template
        ? await onUpdate({ ...input, templateId: template.id })
        : await onCreate(input);

    if (result.ok) onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 p-0 sm:grid sm:place-items-center sm:p-6">
      <section className="flex h-full w-full flex-col overflow-hidden bg-background text-foreground sm:h-auto sm:max-h-[92vh] sm:max-w-2xl sm:rounded-[1.4rem] sm:border sm:border-blush/24 sm:bg-card/95 sm:shadow-soft">
        <header className="flex items-center justify-between gap-3 border-b border-blush/24 p-5">
          <div className="min-w-0">
            <p className="font-serif text-xs uppercase tracking-[0.25em] text-foreground/48">
              {t("manager.tabs.templates")}
            </p>
            <h2 className="mt-1 font-serif text-3xl">
              {mode === "edit"
                ? t("manager.templateForm.editTitle")
                : t("manager.templateForm.createTitle")}
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label={t("actions.close")}
          >
            <X className="size-5" aria-hidden="true" />
          </Button>
        </header>

        <form className="flex-1 overflow-y-auto p-5" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <TextField
                label={t("manager.templateForm.name")}
                value={fields.name}
                onChange={(value) => updateField("name", value)}
              />
            </div>
            <TextField
              label={t("manager.templateForm.defaultCapacity")}
              type="number"
              value={fields.defaultCapacity}
              onChange={(value) => updateField("defaultCapacity", value)}
            />
            <TextField
              label={t("manager.templateForm.defaultLocation")}
              value={fields.defaultLocation}
              onChange={(value) => updateField("defaultLocation", value)}
            />
            <TextField
              label={t("manager.templateForm.category")}
              value={fields.category}
              onChange={(value) => updateField("category", value)}
            />
            <SelectField
              label={t("manager.templateForm.defaultVisibility")}
              value={fields.defaultVisibility}
              onChange={(value) =>
                updateField(
                  "defaultVisibility",
                  value as TemplateFormFields["defaultVisibility"],
                )
              }
              options={[
                { value: "public", label: t("manager.visibility.public") },
                { value: "hidden", label: t("manager.visibility.hidden") },
                {
                  value: "members_only",
                  label: t("manager.visibility.membersOnly"),
                },
              ]}
            />
            <SelectField
              label={t("manager.templateForm.defaultRegistrationPolicy")}
              value={fields.defaultRegistrationPolicy}
              onChange={(value) =>
                updateField(
                  "defaultRegistrationPolicy",
                  value as TemplateFormFields["defaultRegistrationPolicy"],
                )
              }
              options={[
                {
                  value: "auto_approve",
                  label: t("manager.registrationPolicy.autoApprove"),
                },
                {
                  value: "member_auto_approve",
                  label: t("manager.registrationPolicy.memberAutoApprove"),
                },
                {
                  value: "approval_required",
                  label: t("manager.registrationPolicy.approvalRequired"),
                },
              ]}
            />
            <SelectField
              label={t("manager.templateForm.defaultMembershipRequirement")}
              value={fields.defaultMembershipRequirement}
              onChange={(value) =>
                updateField(
                  "defaultMembershipRequirement",
                  value as TemplateFormFields["defaultMembershipRequirement"],
                )
              }
              options={[
                { value: "none", label: t("manager.membershipRequirement.none") },
                {
                  value: "required",
                  label: t("manager.membershipRequirement.required"),
                },
              ]}
            />
            <label className="block text-sm text-foreground/68 sm:col-span-2">
              <span>{t("manager.templateForm.description")}</span>
              <textarea
                className="mt-2 min-h-24 w-full rounded-xl border border-blush/24 bg-background/70 p-3 text-foreground outline-none focus:border-blush-strong"
                value={fields.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
              />
            </label>
            <label className="block text-sm text-foreground/68 sm:col-span-2">
              <span>{t("manager.templateForm.defaultNotes")}</span>
              <textarea
                className="mt-2 min-h-24 w-full rounded-xl border border-blush/24 bg-background/70 p-3 text-foreground outline-none focus:border-blush-strong"
                value={fields.defaultNotes}
                onChange={(event) =>
                  updateField("defaultNotes", event.target.value)
                }
              />
            </label>
          </div>

          {(validationErrors.length > 0 || errorMessage) && (
            <div className="mt-5 rounded-xl border border-blush/24 bg-background/46 p-4 text-sm leading-6 text-blush-strong">
              {validationErrors.map((error) => (
                <p key={error}>{error}</p>
              ))}
              {errorMessage && <p>{errorMessage}</p>}
            </div>
          )}

          <footer className="sticky bottom-0 -mx-5 mt-6 flex gap-2 border-t border-blush/24 bg-background/95 p-5 sm:static sm:mx-0 sm:bg-transparent sm:p-0">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={onClose}
            >
              {t("actions.close")}
            </Button>
            <Button type="submit" className="rounded-full" disabled={submitting}>
              {mode === "edit"
                ? t("manager.templateActions.save")
                : t("manager.templateActions.create")}
            </Button>
          </footer>
        </form>
      </section>
    </div>
  );
}

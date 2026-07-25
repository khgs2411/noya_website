import type {
  ClassTemplate,
  CreateManagedClassInput,
  ManagedClass,
  UpdateManagedClassInput,
} from "@class-kit/react";
import { X } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

type ClassFormMode = "create" | "edit";

type ClassFormDialogProps = {
  open: boolean;
  mode: ClassFormMode;
  managedClass: ManagedClass | null;
  templates: ClassTemplate[];
  submitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onCreate: (input: CreateManagedClassInput) => Promise<{ ok: boolean }>;
  onUpdate: (
    classId: string,
    input: Omit<UpdateManagedClassInput, "classId">,
  ) => Promise<{ ok: boolean }>;
};

type ClassFormFields = {
  templateId: string;
  name: string;
  description: string;
  category: string;
  startsLocal: string;
  endsLocal: string;
  capacity: string;
  location: string;
  status: "draft" | "published";
  visibility: "public" | "hidden" | "members_only";
  registrationPolicy:
    | "auto_approve"
    | "member_auto_approve"
    | "approval_required";
  membershipRequirement: "none" | "required";
  notes: string;
};

const createDefaults: ClassFormFields = {
  templateId: "",
  name: "",
  description: "",
  category: "",
  startsLocal: "",
  endsLocal: "",
  capacity: "12",
  location: "",
  status: "published",
  visibility: "public",
  registrationPolicy: "auto_approve",
  membershipRequirement: "none",
  notes: "",
};

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toLocalDateTimeInput(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function addOneHourLocal(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  date.setHours(date.getHours() + 1);
  return toLocalDateTimeInput(date.toISOString());
}

function fieldsFromClass(managedClass: ManagedClass | null): ClassFormFields {
  if (!managedClass) return createDefaults;

  return {
    templateId: "",
    name: managedClass.name,
    description: managedClass.description ?? "",
    category: managedClass.category ?? "",
    startsLocal: toLocalDateTimeInput(managedClass.starts_at),
    endsLocal: toLocalDateTimeInput(managedClass.ends_at),
    capacity: String(managedClass.capacity),
    location: managedClass.location ?? "",
    status: managedClass.status,
    visibility: managedClass.visibility,
    registrationPolicy: managedClass.registration_policy,
    membershipRequirement: managedClass.membership_requirement,
    notes: managedClass.notes ?? "",
  };
}

function fieldsFromTemplate(
  template: ClassTemplate,
  current: ClassFormFields,
): ClassFormFields {
  return {
    ...current,
    templateId: template.id,
    name: template.name,
    description: template.description ?? "",
    category: template.category ?? "",
    capacity: String(template.default_capacity),
    location: template.default_location ?? "",
    visibility: template.default_visibility,
    registrationPolicy: template.default_registration_policy,
    membershipRequirement: template.default_membership_requirement,
    notes: template.default_notes ?? "",
  };
}

function toClassInput(fields: ClassFormFields): CreateManagedClassInput {
  const input: CreateManagedClassInput = {
    name: fields.name.trim(),
    description: emptyToNull(fields.description),
    category: emptyToNull(fields.category),
    startsAt: new Date(fields.startsLocal).toISOString(),
    endsAt: new Date(fields.endsLocal).toISOString(),
    capacity: Number(fields.capacity),
    location: emptyToNull(fields.location),
    status: fields.status,
    visibility: fields.visibility,
    registrationPolicy: fields.registrationPolicy,
    membershipRequirement: fields.membershipRequirement,
    notes: emptyToNull(fields.notes),
  };

  if (fields.templateId) input.templateId = fields.templateId;

  return input;
}

function validateClassForm(fields: ClassFormFields, t: (key: string) => string) {
  const errors: string[] = [];
  const startsAt = new Date(fields.startsLocal);
  const endsAt = new Date(fields.endsLocal);
  const capacity = Number(fields.capacity);

  if (!fields.name.trim()) errors.push(t("manager.validation.nameRequired"));
  if (
    !fields.startsLocal ||
    !fields.endsLocal ||
    Number.isNaN(startsAt.getTime()) ||
    Number.isNaN(endsAt.getTime())
  ) {
    errors.push(t("manager.validation.invalidDates"));
  } else if (endsAt.getTime() <= startsAt.getTime()) {
    errors.push(t("manager.validation.endAfterStart"));
  }
  if (!Number.isInteger(capacity) || capacity <= 0) {
    errors.push(t("manager.validation.capacity"));
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

export function ClassFormDialog({
  open,
  mode,
  managedClass,
  ...props
}: ClassFormDialogProps) {
  if (!open) return null;

  return (
    <ClassFormDialogContent
      key={`${mode}-${managedClass?.id ?? "new"}`}
      mode={mode}
      managedClass={managedClass}
      {...props}
    />
  );
}

function ClassFormDialogContent({
  mode,
  managedClass,
  templates,
  submitting,
  errorMessage,
  onClose,
  onCreate,
  onUpdate,
}: Omit<ClassFormDialogProps, "open">) {
  const { t } = useTranslation();
  const [fields, setFields] = useState<ClassFormFields>(() =>
    mode === "edit" ? fieldsFromClass(managedClass) : createDefaults,
  );
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const updateField = <K extends keyof ClassFormFields>(
    key: K,
    value: ClassFormFields[K],
  ) => {
    setFields((current) => ({ ...current, [key]: value }));
  };

  const updateTemplateId = (templateId: string) => {
    setFields((current) => {
      const template = templates.find((item) => item.id === templateId);
      if (!template) return { ...current, templateId: "" };
      return fieldsFromTemplate(template, current);
    });
  };

  const updateStartsLocal = (value: string) => {
    setFields((current) => {
      const startsAt = new Date(value);
      const endsAt = new Date(current.endsLocal);
      const shouldUpdateEnds =
        Boolean(value) &&
        (!current.endsLocal ||
          Number.isNaN(endsAt.getTime()) ||
          endsAt.getTime() <= startsAt.getTime());

      return {
        ...current,
        startsLocal: value,
        endsLocal: shouldUpdateEnds ? addOneHourLocal(value) : current.endsLocal,
      };
    });
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateClassForm(fields, t);
    setValidationErrors(errors);
    if (errors.length > 0) return;

    const input = toClassInput(fields);
    const result =
      mode === "edit" && managedClass
        ? await onUpdate(managedClass.id, input)
        : await onCreate(input);

    if (result.ok) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 p-0 sm:grid sm:place-items-center sm:p-6"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={
          mode === "edit"
            ? t("manager.form.editTitle")
            : t("manager.form.createTitle")
        }
        className="flex h-full w-full flex-col overflow-hidden bg-background text-foreground sm:h-auto sm:max-h-[92vh] sm:max-w-2xl sm:rounded-[1.4rem] sm:border sm:border-blush/24 sm:bg-card/95 sm:shadow-soft"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 border-b border-blush/24 p-5">
          <div className="min-w-0">
            <p className="font-serif text-xs uppercase tracking-[0.25em] text-foreground/48">
              {t("manager.tabs.classes")}
            </p>
            <h2 className="mt-1 font-serif text-3xl">
              {mode === "edit"
                ? t("manager.form.editTitle")
                : t("manager.form.createTitle")}
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
            {mode === "create" && templates.length > 0 && (
              <div className="sm:col-span-2">
                <SelectField
                  label={t("manager.form.template")}
                  value={fields.templateId}
                  onChange={updateTemplateId}
                  options={[
                    { value: "", label: t("manager.form.noTemplate") },
                    ...templates.map((template) => ({
                      value: template.id,
                      label: template.name,
                    })),
                  ]}
                />
                <p className="mt-2 text-xs leading-5 text-foreground/56">
                  {t("manager.form.templateHint")}
                </p>
              </div>
            )}
            <div className="sm:col-span-2">
              <TextField
                label={t("manager.form.name")}
                value={fields.name}
                onChange={(value) => updateField("name", value)}
              />
            </div>
            <TextField
              label={t("manager.form.startsAt")}
              type="datetime-local"
              value={fields.startsLocal}
              onChange={updateStartsLocal}
            />
            <TextField
              label={t("manager.form.endsAt")}
              type="datetime-local"
              value={fields.endsLocal}
              onChange={(value) => updateField("endsLocal", value)}
            />
            <TextField
              label={t("manager.form.capacity")}
              type="number"
              value={fields.capacity}
              onChange={(value) => updateField("capacity", value)}
            />
            <TextField
              label={t("manager.form.location")}
              value={fields.location}
              onChange={(value) => updateField("location", value)}
            />
            <TextField
              label={t("manager.form.category")}
              value={fields.category}
              onChange={(value) => updateField("category", value)}
            />
            <SelectField
              label={t("manager.form.status")}
              value={fields.status}
              onChange={(value) =>
                updateField("status", value as ClassFormFields["status"])
              }
              options={[
                { value: "draft", label: t("manager.classStatus.draft") },
                { value: "published", label: t("manager.classStatus.published") },
              ]}
            />
            <SelectField
              label={t("manager.form.visibility")}
              value={fields.visibility}
              onChange={(value) =>
                updateField("visibility", value as ClassFormFields["visibility"])
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
              label={t("manager.form.registrationPolicy")}
              value={fields.registrationPolicy}
              onChange={(value) =>
                updateField(
                  "registrationPolicy",
                  value as ClassFormFields["registrationPolicy"],
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
              label={t("manager.form.membershipRequirement")}
              value={fields.membershipRequirement}
              onChange={(value) =>
                updateField(
                  "membershipRequirement",
                  value as ClassFormFields["membershipRequirement"],
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
              <span>{t("manager.form.description")}</span>
              <textarea
                className="mt-2 min-h-24 w-full rounded-xl border border-blush/24 bg-background/70 p-3 text-foreground outline-none focus:border-blush-strong"
                value={fields.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
              />
            </label>
          </div>

          <details className="mt-5 rounded-xl border border-blush/24 bg-background/46 p-4">
            <summary className="cursor-pointer font-serif text-lg text-foreground">
              {t("manager.form.advanced")}
            </summary>
            <label className="mt-4 block text-sm text-foreground/68">
              <span>{t("manager.form.notes")}</span>
              <textarea
                className="mt-2 min-h-24 w-full rounded-xl border border-blush/24 bg-background/70 p-3 text-foreground outline-none focus:border-blush-strong"
                value={fields.notes}
                onChange={(event) => updateField("notes", event.target.value)}
              />
            </label>
          </details>

          {(validationErrors.length > 0 || errorMessage) && (
            <div className="mt-5 rounded-xl border border-blush/24 bg-background/46 p-4 text-sm leading-6 text-blush-strong">
              {validationErrors.map((error) => (
                <p key={error}>{error}</p>
              ))}
              {errorMessage && <p>{errorMessage}</p>}
            </div>
          )}

          <footer className="sticky bottom-0 -mx-5 mt-6 flex gap-2 border-t border-blush/24 bg-background/95 p-5 sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-5">
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
                ? t("manager.classActions.save")
                : t("manager.classActions.create")}
            </Button>
          </footer>
        </form>
      </section>
    </div>
  );
}

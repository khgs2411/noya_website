import type {
  ClassTemplate,
  CreateScheduleInput,
  Schedule,
  UpdateScheduleInput,
} from "@class-kit/react";
import { X } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  createScheduleDefaults,
  DEFAULT_TIMEZONE,
  WEEKDAYS,
} from "@/features/manager/schedules/schedule-utils";

type ScheduleFormMode = "create" | "edit";

type ScheduleFormDialogProps = {
  open: boolean;
  mode: ScheduleFormMode;
  schedule: Schedule | null;
  activeTemplates: ClassTemplate[];
  submitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onCreate: (input: CreateScheduleInput) => Promise<{ ok: boolean }>;
  onUpdate: (input: UpdateScheduleInput) => Promise<{ ok: boolean }>;
};

type ScheduleFormFields = {
  templateId: string;
  name: string;
  status: "draft" | "active" | "paused" | "archived";
  recurrenceType: "weekly" | "one_time";
  weekdays: number[];
  startsOn: string;
  endsOn: string;
  startTime: string;
  durationMinutes: string;
  timezone: string;
  generationCount: string;
};

function fieldsFromSchedule(
  schedule: Schedule | null,
  activeTemplates: ClassTemplate[],
): ScheduleFormFields {
  if (!schedule) {
    const defaults = createScheduleDefaults(activeTemplates);
    return {
      templateId: defaults.templateId,
      name: defaults.name,
      status: defaults.status,
      recurrenceType: defaults.recurrenceType,
      weekdays: defaults.weekdays,
      startsOn: defaults.startsOn,
      endsOn: defaults.endsOn ?? "",
      startTime: defaults.startTime,
      durationMinutes: String(defaults.durationMinutes),
      timezone: defaults.timezone,
      generationCount: "",
    };
  }

  return {
    templateId: schedule.template_id,
    name: schedule.name,
    status: schedule.status,
    recurrenceType: schedule.recurrence_type,
    weekdays: schedule.weekdays,
    startsOn: schedule.starts_on,
    endsOn: schedule.ends_on ?? "",
    startTime: schedule.start_time.slice(0, 5),
    durationMinutes: String(schedule.duration_minutes),
    timezone: schedule.timezone,
    generationCount: "",
  };
}

function toScheduleInput(fields: ScheduleFormFields): CreateScheduleInput {
  const recurrenceType = fields.recurrenceType;
  const generationCount = fields.generationCount
    ? Number(fields.generationCount)
    : null;

  return {
    templateId: fields.templateId,
    name: fields.name.trim(),
    status: fields.status,
    recurrenceType,
    weekdays: recurrenceType === "weekly" ? fields.weekdays : [],
    startsOn: fields.startsOn,
    endsOn:
      recurrenceType === "weekly" && fields.endsOn ? fields.endsOn : null,
    startTime: fields.startTime,
    durationMinutes: Number(fields.durationMinutes),
    timezone: fields.timezone.trim() || DEFAULT_TIMEZONE,
    generationCount,
  };
}

function validateScheduleForm(
  fields: ScheduleFormFields,
  t: (key: string) => string,
) {
  const errors: string[] = [];
  const duration = Number(fields.durationMinutes);
  const generationCount = fields.generationCount
    ? Number(fields.generationCount)
    : null;

  if (!fields.templateId) errors.push(t("manager.scheduleValidation.template"));
  if (!fields.name.trim()) errors.push(t("manager.scheduleValidation.name"));
  if (!fields.startsOn) errors.push(t("manager.scheduleValidation.startsOn"));
  if (!fields.startTime) errors.push(t("manager.scheduleValidation.startTime"));
  if (fields.recurrenceType === "weekly" && fields.weekdays.length === 0) {
    errors.push(t("manager.scheduleValidation.weekdays"));
  }
  if (!Number.isInteger(duration) || duration < 1 || duration > 1440) {
    errors.push(t("manager.scheduleValidation.duration"));
  }
  if (
    generationCount !== null &&
    (!Number.isInteger(generationCount) ||
      generationCount < 1 ||
      generationCount > 52)
  ) {
    errors.push(t("manager.scheduleValidation.generationCount"));
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

export function ScheduleFormDialog({
  open,
  mode,
  schedule,
  ...props
}: ScheduleFormDialogProps) {
  if (!open) return null;

  return (
    <ScheduleFormDialogContent
      key={`${mode}-${schedule?.id ?? "new"}`}
      mode={mode}
      schedule={schedule}
      {...props}
    />
  );
}

function ScheduleFormDialogContent({
  mode,
  schedule,
  activeTemplates,
  submitting,
  errorMessage,
  onClose,
  onCreate,
  onUpdate,
}: Omit<ScheduleFormDialogProps, "open">) {
  const { t } = useTranslation();
  const [fields, setFields] = useState<ScheduleFormFields>(() =>
    fieldsFromSchedule(mode === "edit" ? schedule : null, activeTemplates),
  );
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const updateField = <K extends keyof ScheduleFormFields>(
    key: K,
    value: ScheduleFormFields[K],
  ) => {
    setFields((current) => ({ ...current, [key]: value }));
  };

  const toggleWeekday = (weekday: number) => {
    setFields((current) => {
      const weekdays = current.weekdays.includes(weekday)
        ? current.weekdays.filter((day) => day !== weekday)
        : [...current.weekdays, weekday].sort((a, b) => a - b);

      return { ...current, weekdays };
    });
  };

  const updateTemplate = (templateId: string) => {
    setFields((current) => {
      const template = activeTemplates.find((item) => item.id === templateId);
      return {
        ...current,
        templateId,
        name: template?.name || "",
      };
    });
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateScheduleForm(fields, t);
    setValidationErrors(errors);
    if (errors.length > 0) return;

    const input = toScheduleInput(fields);
    const result =
      mode === "edit" && schedule
        ? await onUpdate({ ...input, scheduleId: schedule.id })
        : await onCreate(input);

    if (result.ok) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 p-0 sm:grid sm:place-items-center sm:p-6"
      onClick={onClose}
    >
      <section
        className="flex h-full w-full flex-col overflow-hidden bg-background text-foreground sm:h-auto sm:max-h-[92vh] sm:max-w-2xl sm:rounded-[1.4rem] sm:border sm:border-blush/24 sm:bg-card/95 sm:shadow-soft"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 border-b border-blush/24 p-5">
          <div className="min-w-0">
            <p className="font-serif text-xs uppercase tracking-[0.25em] text-foreground/48">
              {t("manager.tabs.schedules")}
            </p>
            <h2 className="mt-1 font-serif text-3xl">
              {mode === "edit"
                ? t("manager.scheduleForm.editTitle")
                : t("manager.scheduleForm.createTitle")}
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
              <SelectField
                label={t("manager.scheduleForm.template")}
                value={fields.templateId}
                onChange={updateTemplate}
                options={activeTemplates.map((template) => ({
                  value: template.id,
                  label: template.name,
                }))}
              />
            </div>
            <div className="sm:col-span-2">
              <TextField
                label={t("manager.scheduleForm.name")}
                value={fields.name}
                onChange={(value) => updateField("name", value)}
              />
            </div>
            <SelectField
              label={t("manager.scheduleForm.status")}
              value={fields.status}
              onChange={(value) =>
                updateField("status", value as ScheduleFormFields["status"])
              }
              options={[
                { value: "draft", label: t("manager.scheduleStatus.draft") },
                { value: "active", label: t("manager.scheduleStatus.active") },
                { value: "paused", label: t("manager.scheduleStatus.paused") },
                { value: "archived", label: t("manager.scheduleStatus.archived") },
              ]}
            />
            <SelectField
              label={t("manager.scheduleForm.recurrenceType")}
              value={fields.recurrenceType}
              onChange={(value) =>
                updateField(
                  "recurrenceType",
                  value as ScheduleFormFields["recurrenceType"],
                )
              }
              options={[
                { value: "weekly", label: t("manager.recurrence.weekly") },
                { value: "one_time", label: t("manager.recurrence.one_time") },
              ]}
            />
            {fields.recurrenceType === "weekly" && (
              <div className="sm:col-span-2">
                <p className="text-sm text-foreground/68">
                  {t("manager.scheduleForm.weekdays")}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-7">
                  {WEEKDAYS.map((weekday) => {
                    const selected = fields.weekdays.includes(weekday);

                    return (
                      <Button
                        key={weekday}
                        type="button"
                        variant={selected ? "default" : "outline"}
                        className="rounded-full"
                        onClick={() => toggleWeekday(weekday)}
                      >
                        {t(`manager.weekdays.short.${weekday}`)}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
            <TextField
              label={t("manager.scheduleForm.startsOn")}
              type="date"
              value={fields.startsOn}
              onChange={(value) => updateField("startsOn", value)}
            />
            {fields.recurrenceType === "weekly" && (
              <TextField
                label={t("manager.scheduleForm.endsOn")}
                type="date"
                value={fields.endsOn}
                onChange={(value) => updateField("endsOn", value)}
              />
            )}
            <TextField
              label={t("manager.scheduleForm.startTime")}
              type="time"
              value={fields.startTime}
              onChange={(value) => updateField("startTime", value)}
            />
            <TextField
              label={t("manager.scheduleForm.durationMinutes")}
              type="number"
              value={fields.durationMinutes}
              onChange={(value) => updateField("durationMinutes", value)}
            />
            <TextField
              label={t("manager.scheduleForm.timezone")}
              value={fields.timezone}
              onChange={(value) => updateField("timezone", value)}
            />
            <TextField
              label={t("manager.scheduleForm.generationCount")}
              type="number"
              value={fields.generationCount}
              onChange={(value) => updateField("generationCount", value)}
            />
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
                ? t("manager.scheduleActions.save")
                : t("manager.scheduleActions.create")}
            </Button>
          </footer>
        </form>
      </section>
    </div>
  );
}

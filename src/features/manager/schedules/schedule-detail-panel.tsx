import type {
  ClassTemplate,
  Schedule,
  ScheduleGenerationResult,
  SchedulePreviewOccurrence,
} from "@class-kit/react";
import { Archive, CalendarOff, CalendarSearch, Edit3, Pause, Play, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  getTemplateName,
  toDateInput,
  WEEKDAYS,
} from "@/features/manager/schedules/schedule-utils";

type ScheduleDetailPanelProps = {
  schedule: Schedule | null;
  templates: ClassTemplate[];
  preview: { scheduleId: string; occurrences: SchedulePreviewOccurrence[] } | null;
  generationResult: ScheduleGenerationResult | null;
  submitting: boolean;
  onClose: () => void;
  onEdit: () => void;
  onPreview: (scheduleId: string, from: string, through: string) => void;
  onGenerate: (scheduleId: string, generationCount: number) => void;
  onPause: (scheduleId: string) => void;
  onArchive: (scheduleId: string) => void;
  onSkipDate: (scheduleId: string, date: string, reason?: string | null) => void;
  onUnskipDate: (scheduleId: string, date: string) => void;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-xl border border-blush/24 bg-background/46 p-3 sm:grid-cols-[8rem_1fr]">
      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
        {label}
      </dt>
      <dd className="break-words text-foreground/72">{value}</dd>
    </div>
  );
}

function getPreviewDefaults(schedule: Schedule) {
  const from = schedule.starts_on;
  const throughDate = new Date(`${from}T00:00:00`);
  throughDate.setDate(throughDate.getDate() + 30);
  const through = schedule.ends_on ?? toDateInput(throughDate);

  return { from, through };
}

function formatWeekdays(weekdays: number[], t: (key: string) => string) {
  if (weekdays.length === 0) return t("manager.scheduleCard.oneTimeDate");

  return WEEKDAYS
    .filter((day) => weekdays.includes(day))
    .map((day) => t(`manager.weekdays.long.${day}`))
    .join(", ");
}

export function ScheduleDetailPanel({
  schedule,
  templates,
  preview,
  generationResult,
  submitting,
  onClose,
  onEdit,
  onPreview,
  onGenerate,
  onPause,
  onArchive,
  onSkipDate,
  onUnskipDate,
}: ScheduleDetailPanelProps) {
  const { t } = useTranslation();
  const [generationCount, setGenerationCount] = useState("8");
  const [skipDate, setSkipDate] = useState("");
  const [skipReason, setSkipReason] = useState("");

  if (!schedule) return null;

  const previewDefaults = getPreviewDefaults(schedule);
  const skipDateValue = skipDate || previewDefaults.from;
  const currentPreview =
    preview?.scheduleId === schedule.id ? preview.occurrences : [];
  const generateDisabled =
    submitting ||
    schedule.status !== "active" ||
    !Number.isInteger(Number(generationCount)) ||
    Number(generationCount) < 1 ||
    Number(generationCount) > 52;
  const pauseDisabled = submitting || schedule.status !== "active";
  const archiveDisabled = submitting || schedule.status === "archived";
  const skipDisabled = submitting || schedule.status === "archived" || !skipDateValue;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-black/50 p-0 md:place-items-center md:p-6"
      onClick={onClose}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`${t("manager.scheduleDetail.eyebrow")}: ${schedule.name}`}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-[1.4rem] border border-blush/24 bg-background p-5 text-foreground shadow-soft md:max-w-2xl md:rounded-[1.4rem] md:bg-card/95"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-serif text-xs uppercase tracking-[0.25em] text-foreground/48">
              {t("manager.scheduleDetail.eyebrow")}
            </p>
            <h2 className="mt-2 break-words font-serif text-3xl text-foreground">
              {schedule.name}
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={onClose}
            aria-label={t("actions.close")}
          >
            <X className="size-5" aria-hidden="true" />
          </Button>
        </header>

        <dl className="mt-5 grid gap-3 text-sm">
          <DetailRow
            label={t("manager.scheduleDetail.status")}
            value={t(`manager.scheduleStatus.${schedule.status}`)}
          />
          <DetailRow
            label={t("manager.scheduleDetail.template")}
            value={getTemplateName(
              schedule.template_id,
              templates,
              t("manager.scheduleCard.unknownTemplate"),
            )}
          />
          <DetailRow
            label={t("manager.scheduleDetail.recurrence")}
            value={t(`manager.recurrence.${schedule.recurrence_type}`)}
          />
          <DetailRow
            label={t("manager.scheduleDetail.weekdays")}
            value={formatWeekdays(schedule.weekdays, t)}
          />
          <DetailRow
            label={t("manager.scheduleDetail.dates")}
            value={
              schedule.ends_on
                ? `${schedule.starts_on} - ${schedule.ends_on}`
                : schedule.starts_on
            }
          />
          <DetailRow
            label={t("manager.scheduleDetail.time")}
            value={`${schedule.start_time.slice(0, 5)} · ${t(
              "manager.scheduleCard.duration",
              { count: schedule.duration_minutes },
            )}`}
          />
          <DetailRow
            label={t("manager.scheduleDetail.timezone")}
            value={schedule.timezone}
          />
        </dl>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="button" className="rounded-full" onClick={onEdit}>
            <Edit3 className="size-4" aria-hidden="true" />
            {t("manager.scheduleActions.edit")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={submitting}
            onClick={() =>
              onPreview(schedule.id, previewDefaults.from, previewDefaults.through)
            }
          >
            <CalendarSearch className="size-4" aria-hidden="true" />
            {t("manager.scheduleActions.preview")}
          </Button>
        </div>

        <section className="mt-5 rounded-xl border border-blush/24 bg-background/46 p-4">
          <p className="font-serif text-xl text-foreground">
            {t("manager.scheduleLifecycle.title")}
          </p>
          <p className="mt-2 text-sm leading-6 text-foreground/68">
            {t("manager.scheduleLifecycle.body")}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={pauseDisabled}
              onClick={() => onPause(schedule.id)}
            >
              <Pause className="size-4" aria-hidden="true" />
              {t("manager.scheduleActions.pause")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={archiveDisabled}
              onClick={() => onArchive(schedule.id)}
            >
              <Archive className="size-4" aria-hidden="true" />
              {t("manager.scheduleActions.archive")}
            </Button>
          </div>
        </section>

        <section className="mt-5 rounded-xl border border-blush/24 bg-background/46 p-4">
          <p className="font-serif text-xl text-foreground">
            {t("manager.scheduleSkips.title")}
          </p>
          <p className="mt-2 text-sm leading-6 text-foreground/68">
            {t("manager.scheduleSkips.body")}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[10rem_1fr_auto] sm:items-end">
            <label className="block text-sm text-foreground/68">
              <span>{t("manager.scheduleSkips.date")}</span>
              <input
                className="mt-2 min-h-11 w-full rounded-xl border border-blush/24 bg-background/70 px-3 text-foreground outline-none focus:border-blush-strong"
                type="date"
                value={skipDateValue}
                onChange={(event) => setSkipDate(event.target.value)}
              />
            </label>
            <label className="block text-sm text-foreground/68">
              <span>{t("manager.scheduleSkips.reason")}</span>
              <input
                className="mt-2 min-h-11 w-full rounded-xl border border-blush/24 bg-background/70 px-3 text-foreground outline-none focus:border-blush-strong"
                value={skipReason}
                onChange={(event) => setSkipReason(event.target.value)}
              />
            </label>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={skipDisabled}
              onClick={() => {
                onSkipDate(
                  schedule.id,
                  skipDateValue,
                  skipReason.trim() || null,
                );
                setSkipReason("");
              }}
            >
              <CalendarOff className="size-4" aria-hidden="true" />
              {t("manager.scheduleActions.skipDate")}
            </Button>
          </div>
        </section>

        <section className="mt-5 rounded-xl border border-blush/24 bg-background/46 p-4">
          <p className="font-serif text-xl text-foreground">
            {t("manager.scheduleGenerate.title")}
          </p>
          <p className="mt-2 text-sm leading-6 text-foreground/68">
            {schedule.status === "active"
              ? t("manager.scheduleGenerate.body")
              : t("manager.scheduleGenerate.inactiveBody")}
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="block text-sm text-foreground/68">
              <span>{t("manager.scheduleForm.generationCount")}</span>
              <input
                className="mt-2 min-h-11 w-full rounded-xl border border-blush/24 bg-background/70 px-3 text-foreground outline-none focus:border-blush-strong sm:w-32"
                type="number"
                min="1"
                max="52"
                value={generationCount}
                onChange={(event) => setGenerationCount(event.target.value)}
              />
            </label>
            <Button
              type="button"
              className="rounded-full"
              disabled={generateDisabled}
              onClick={() => onGenerate(schedule.id, Number(generationCount))}
            >
              <Play className="size-4" aria-hidden="true" />
              {t("manager.scheduleActions.generate")}
            </Button>
          </div>

          {generationResult && (
            <p className="mt-4 rounded-xl border border-blush/24 bg-card/72 p-3 text-sm leading-6 text-foreground/72">
              {t("manager.scheduleGenerate.result", {
                created: generationResult.created_count,
                existing: generationResult.existing_count,
                skipped: generationResult.skipped_count,
              })}
            </p>
          )}
        </section>

        {currentPreview.length > 0 && (
          <section className="mt-5 rounded-xl border border-blush/24 bg-background/46 p-4">
            <p className="font-serif text-xl text-foreground">
              {t("manager.schedulePreview.title")}
            </p>
            <div className="mt-3 grid gap-2">
              {currentPreview.slice(0, 8).map((occurrence) => (
                <div
                  key={`${occurrence.date}-${occurrence.starts_at}`}
                  className="flex flex-col gap-3 rounded-xl border border-blush/24 bg-card/72 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-foreground">
                      {occurrence.date}
                    </p>
                    <p className="mt-1 text-foreground/68">
                      {occurrence.local_start.slice(11, 16)} ·{" "}
                      {occurrence.timezone}
                    </p>
                    {occurrence.skipped && (
                      <p className="mt-2 inline-flex rounded-full border border-blush/24 px-2 py-1 text-xs font-semibold text-foreground/68">
                        {t("manager.schedulePreview.skipped")}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    disabled={submitting || schedule.status === "archived"}
                    onClick={() =>
                      occurrence.skipped
                        ? onUnskipDate(schedule.id, occurrence.date)
                        : onSkipDate(schedule.id, occurrence.date, null)
                    }
                  >
                    {occurrence.skipped ? (
                      <RotateCcw className="size-4" aria-hidden="true" />
                    ) : (
                      <CalendarOff className="size-4" aria-hidden="true" />
                    )}
                    {occurrence.skipped
                      ? t("manager.scheduleActions.unskipDate")
                      : t("manager.scheduleActions.skipDate")}
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}
      </aside>
    </div>
  );
}

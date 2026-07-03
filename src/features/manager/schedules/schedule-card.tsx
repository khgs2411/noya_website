import type { ClassTemplate, Schedule } from "@class-kit/react";
import { CalendarClock, Clock, Layers3, Repeat } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  getTemplateName,
  WEEKDAYS,
} from "@/features/manager/schedules/schedule-utils";

type ScheduleCardProps = {
  schedule: Schedule;
  templates: ClassTemplate[];
  isSelected: boolean;
  onSelect: (scheduleId: string) => void;
};

function formatWeekdays(
  weekdays: number[],
  t: (key: string) => string,
) {
  if (weekdays.length === 0) return t("manager.scheduleCard.oneTimeDate");

  return WEEKDAYS
    .filter((day) => weekdays.includes(day))
    .map((day) => t(`manager.weekdays.short.${day}`))
    .join(", ");
}

export function ScheduleCard({
  schedule,
  templates,
  isSelected,
  onSelect,
}: ScheduleCardProps) {
  const { t } = useTranslation();

  return (
    <article
      className={`rounded-[1.4rem] border bg-card/78 p-4 shadow-soft ${
        isSelected ? "border-blush-strong" : "border-blush/24"
      } ${schedule.status === "archived" ? "opacity-60" : ""}`}
    >
      <button
        type="button"
        className="block w-full min-w-0 text-start"
        aria-pressed={isSelected}
        onClick={() => onSelect(schedule.id)}
      >
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs text-foreground/56">
              <Repeat className="size-4 shrink-0" aria-hidden="true" />
              <span>{t(`manager.recurrence.${schedule.recurrence_type}`)}</span>
            </p>
            <h3 className="mt-2 break-words font-serif text-xl text-foreground">
              {schedule.name}
            </h3>
          </div>
          <span className="shrink-0 rounded-full border border-blush/24 px-2 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-foreground/56">
            {t(`manager.scheduleStatus.${schedule.status}`)}
          </span>
        </div>

        <p className="mt-3 flex items-start gap-2 text-sm text-foreground/68">
          <Layers3 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span className="break-words">
            {getTemplateName(
              schedule.template_id,
              templates,
              t("manager.scheduleCard.unknownTemplate"),
            )}
          </span>
        </p>

        <p className="mt-3 flex items-start gap-2 text-sm text-foreground/68">
          <CalendarClock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{formatWeekdays(schedule.weekdays, t)}</span>
        </p>

        <p className="mt-3 flex items-center gap-2 text-sm text-foreground/68">
          <Clock className="size-4 shrink-0" aria-hidden="true" />
          {schedule.start_time.slice(0, 5)} ·{" "}
          {t("manager.scheduleCard.duration", {
            count: schedule.duration_minutes,
          })}
        </p>

        <p className="sr-only">{t("manager.scheduleCard.select")}</p>
      </button>
    </article>
  );
}

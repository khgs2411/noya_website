import type {
  ClassTemplate,
  CreateScheduleInput,
  Schedule,
} from "@class-kit/react";

export const DEFAULT_TIMEZONE = "Asia/Jerusalem";
export const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;

export type WeekdayValue = (typeof WEEKDAYS)[number];

export function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTodayDateInput() {
  return toDateInput(new Date());
}

export function getTemplateName(
  templateId: string,
  templates: ClassTemplate[],
  fallback: string,
) {
  return templates.find((template) => template.id === templateId)?.name ?? fallback;
}

export function sortSchedules(schedules: Schedule[]) {
  const statusRank: Record<Schedule["status"], number> = {
    active: 0,
    draft: 1,
    paused: 2,
    archived: 3,
  };

  return [...schedules].sort((a, b) => {
    const statusDelta = statusRank[a.status] - statusRank[b.status];
    if (statusDelta !== 0) return statusDelta;
    return a.name.localeCompare(b.name);
  });
}

export function createScheduleDefaults(
  activeTemplates: ClassTemplate[],
): CreateScheduleInput {
  return {
    templateId: activeTemplates[0]?.id ?? "",
    name: activeTemplates[0]?.name ?? "",
    status: "active",
    recurrenceType: "weekly",
    weekdays: [1],
    startsOn: getTodayDateInput(),
    endsOn: null,
    startTime: "09:00",
    durationMinutes: 60,
    timezone: DEFAULT_TIMEZONE,
    generationCount: null,
  };
}

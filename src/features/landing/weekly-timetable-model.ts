import type { ClassSummary } from "@class-kit/react";

export type TimetableTime = { time: string; next: Date; classId: string };
type TimetableRow = { name: string; type: string; times: TimetableTime[] };
export type TimetableLocation = {
  key: string;
  name: string;
  count: number;
  days: { weekday: number; rows: TimetableRow[] }[];
};

type Lesson = Pick<ClassSummary, "id" | "name" | "category" | "startsAt" | "location" | "locationSnapshot" | "temporalStatus">;

export function deriveTimetable(lessons: Lesson[], now: Date, unknownLocation: string, locale: string): TimetableLocation[] {
  const locations = new Map<string, {
    labels: Map<string, number>;
    rows: Map<string, { weekday: number; name: string; type: string; times: Map<string, TimetableTime> }>;
  }>();

  for (const lesson of lessons) {
    const start = new Date(lesson.startsAt);
    if (lesson.temporalStatus === "cancelled" || start < now) continue;
    const label = lesson.locationSnapshot?.label || lesson.location?.trim() || unknownLocation;
    const key = label.replace(/[\s\p{P}]+/gu, "").toLocaleLowerCase(locale);
    let location = locations.get(key);
    if (!location) {
      location = { labels: new Map(), rows: new Map() };
      locations.set(key, location);
    }
    location.labels.set(label, (location.labels.get(label) ?? 0) + 1);
    const weekday = start.getDay();
    const rowKey = JSON.stringify([weekday, lesson.name]);
    let row = location.rows.get(rowKey);
    if (!row) {
      row = { weekday, name: lesson.name, type: lesson.category?.trim() || lesson.name, times: new Map() };
      location.rows.set(rowKey, row);
    }
    const time = `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`;
    const existing = row.times.get(time);
    if (!existing || start < existing.next) {
      row.times.set(time, { time, next: start, classId: lesson.id });
    }
  }

  return [...locations].map(([key, location]) => {
    const name = [...location.labels].sort((a, b) => b[1] - a[1])[0][0];
    const rows = [...location.rows.values()].map((row) => ({
      ...row, times: [...row.times.values()].sort((a, b) => a.time.localeCompare(b.time)),
    })).sort((a, b) => a.weekday - b.weekday || a.times[0].time.localeCompare(b.times[0].time));
    const days: TimetableLocation["days"] = [];
    for (const row of rows) {
      const last = days.at(-1);
      if (last?.weekday === row.weekday) last.rows.push(row);
      else days.push({ weekday: row.weekday, rows: [row] });
    }
    return { key, name, days, count: rows.reduce((count, row) => count + row.times.length, 0) };
  }).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, locale));
}

export function calendarDaysUntil(date: Date, now: Date) {
  // Calendar dates, rather than elapsed hours, keep relative labels correct across DST.
  return (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000;
}

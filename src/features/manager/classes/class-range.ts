export type RangeScope = "today" | "week" | "month" | "custom";
export type ViewMode = "list" | "calendar";

export type LocalDateRange = {
  start: Date;
  end: Date;
};

export type VisibleRange = {
  start: string;
  end: string;
};

export type CustomRangeValue = {
  startDate: string;
  endDate: string;
};

const dayMs = 24 * 60 * 60 * 1000;

export function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function endOfLocalDay(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function parseDateInput(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) return startOfLocalDay(new Date());

  return new Date(year, month - 1, day);
}

export function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getLocalRange(
  scope: RangeScope,
  anchorDate: Date,
  customRange: CustomRangeValue | null,
): LocalDateRange {
  if (scope === "custom") {
    if (!customRange) {
      return { start: startOfLocalDay(anchorDate), end: endOfLocalDay(anchorDate) };
    }

    const start = parseDateInput(customRange.startDate);
    const end = parseDateInput(customRange.endDate);

    if (start.getTime() > end.getTime()) {
      return { start: startOfLocalDay(end), end: endOfLocalDay(start) };
    }

    return { start: startOfLocalDay(start), end: endOfLocalDay(end) };
  }

  if (scope === "week") {
    const start = startOfLocalDay(addDays(anchorDate, -anchorDate.getDay()));
    return { start, end: endOfLocalDay(addDays(start, 6)) };
  }

  if (scope === "month") {
    return {
      start: new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1),
      end: new Date(
        anchorDate.getFullYear(),
        anchorDate.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      ),
    };
  }

  return { start: startOfLocalDay(anchorDate), end: endOfLocalDay(anchorDate) };
}

export function toVisibleRange(range: LocalDateRange): VisibleRange {
  return { start: range.start.toISOString(), end: range.end.toISOString() };
}

export function getVisibleRangeLabel(range: LocalDateRange) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const startLabel = formatter.format(range.start);
  const endLabel = formatter.format(range.end);

  return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
}

export function getCalendarDays(range: LocalDateRange) {
  const days: Date[] = [];
  let cursor = startOfLocalDay(addDays(range.start, -range.start.getDay()));
  const end = startOfLocalDay(range.end);
  const last = startOfLocalDay(addDays(end, 6 - end.getDay()));

  while (cursor.getTime() <= last.getTime()) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return days;
}

export function getLocalDateKey(date: Date) {
  return toDateInput(date);
}

export function shiftRange(
  scope: RangeScope,
  anchorDate: Date,
  customRange: CustomRangeValue | null,
  direction: -1 | 1,
) {
  if (scope === "month") {
    return {
      anchorDate: new Date(
        anchorDate.getFullYear(),
        anchorDate.getMonth() + direction,
        anchorDate.getDate(),
      ),
      customRange,
    };
  }

  if (scope === "week") {
    return { anchorDate: addDays(anchorDate, direction * 7), customRange };
  }

  if (scope === "custom" && customRange) {
    const start = parseDateInput(customRange.startDate);
    const end = parseDateInput(customRange.endDate);
    const days = Math.max(
      1,
      Math.round((end.getTime() - start.getTime()) / dayMs) + 1,
    );
    const nextStart = addDays(start, direction * days);
    const nextEnd = addDays(end, direction * days);

    return {
      anchorDate: nextStart,
      customRange: {
        startDate: toDateInput(nextStart),
        endDate: toDateInput(nextEnd),
      },
    };
  }

  return { anchorDate: addDays(anchorDate, direction), customRange };
}

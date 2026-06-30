import type { ManagedClass } from "@class-kit/react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import {
  getCalendarDays,
  getLocalDateKey,
  type LocalDateRange,
  type RangeScope,
} from "@/features/manager/classes/class-range";

type ClassCalendarViewProps = {
  rangeScope: RangeScope;
  localRange: LocalDateRange;
  classes: ManagedClass[];
  selectedClassId: string | null;
  onSelectClass: (classId: string) => void;
};

export function ClassCalendarView({
  rangeScope,
  localRange,
  classes,
  selectedClassId,
  onSelectClass,
}: ClassCalendarViewProps) {
  const { t, i18n } = useTranslation();
  const dateFormatter = new Intl.DateTimeFormat(i18n.language, {
    weekday: "short",
    day: "numeric",
  });
  const timeFormatter = new Intl.DateTimeFormat(i18n.language, {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (rangeScope === "today" || rangeScope === "custom") {
    return (
      <div className="rounded-[1.4rem] border border-blush/24 bg-background/46 p-4 text-sm leading-6 text-foreground/68">
        {t("manager.calendar.listFallback")}
      </div>
    );
  }

  const days = getCalendarDays(localRange);

  return (
    <div className="hidden gap-2 md:grid md:grid-cols-7">
      {days.map((day) => {
        const dateKey = getLocalDateKey(day);
        const dayClasses = classes.filter(
          (managedClass) => getLocalDateKey(new Date(managedClass.starts_at)) === dateKey,
        );

        return (
          <section
            key={dateKey}
            className="min-h-36 rounded-[1.4rem] border border-blush/24 bg-card/78 p-3"
          >
            <h3 className="font-serif text-sm text-foreground">
              {dateFormatter.format(day)}
            </h3>
            <div className="mt-3 flex flex-col gap-2">
              {dayClasses.map((managedClass) => (
                <button
                  key={managedClass.id}
                  type="button"
                  className={cn(
                    "rounded-xl border border-blush/24 bg-background/46 p-2 text-start text-xs leading-5 transition-colors hover:border-blush-strong",
                    managedClass.id === selectedClassId &&
                      "border-blush-strong bg-background/70",
                  )}
                  onClick={() => onSelectClass(managedClass.id)}
                >
                  <span className="block font-semibold text-foreground">
                    {timeFormatter.format(new Date(managedClass.starts_at))}
                  </span>
                  <span className="block break-words text-foreground/68">
                    {managedClass.name}
                  </span>
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

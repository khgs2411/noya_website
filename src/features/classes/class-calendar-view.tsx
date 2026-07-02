import { type ReactNode, useMemo, useState } from "react";
import { Clock3, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { ClassViewItem } from "@/features/classes/class-types";
import {
  getCalendarDays,
  getLocalDateKey,
  type LocalDateRange,
  type RangeScope,
} from "@/features/classes/class-range";
import { cn } from "@/lib/utils";

type ClassCalendarViewProps = {
  rangeScope: RangeScope;
  localRange: LocalDateRange;
  items: ClassViewItem[];
  selectedClassId: string | null;
  loadingClassId?: string | null;
  labelPrefix?: string;
  onSelectClass: (classId: string) => void;
  renderItemActions?: (item: ClassViewItem) => ReactNode;
};

type CalendarClassButtonProps = {
  item: ClassViewItem;
  selectedClassId: string | null;
  isLoading: boolean;
  pendingLabel: string;
  timeFormatter: Intl.DateTimeFormat;
  onSelect: () => void;
  actions?: ReactNode;
};

function CalendarClassButton({
  item,
  selectedClassId,
  isLoading,
  pendingLabel,
  timeFormatter,
  onSelect,
  actions,
}: CalendarClassButtonProps) {
  const countLabel =
    item.registeredUsersCount === undefined
      ? `${item.capacity}`
      : `${item.registeredUsersCount}/${item.capacity}`;

  const isActiveClass =
    item.lifecycleStatus === "in_progress" || item.temporalStatus === "started";

  return (
    <article
      className={cn(
        "rounded-xl border border-blush/24 bg-background/46 p-2.5 text-xs leading-5 transition-colors hover:border-blush-strong hover:bg-blush-strong/10 hover:shadow-soft",
        isActiveClass &&
          "border-blush-strong/70 bg-blush-strong/12 ring-1 ring-blush-strong/25",
        item.id === selectedClassId && "border-blush-strong bg-background/70",
      )}
    >
      <button
        type="button"
        disabled={isLoading}
        aria-busy={isLoading}
        className="block w-full text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blush-strong/55"
        onClick={onSelect}
      >
        <span className="flex items-center justify-between gap-2 font-semibold text-foreground">
          <span>{timeFormatter.format(new Date(item.startsAt))}</span>
          {isLoading && (
            <Loader2
              className="size-3.5 shrink-0 animate-spin text-blush-strong"
              aria-hidden="true"
            />
          )}
        </span>
        <span className="block break-words text-foreground/68">{item.name}</span>
        {item.statusLabel && (
          <span
            className={cn(
              "mt-1 inline-flex rounded-full border border-blush/24 px-2 py-0.5 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-foreground/56",
              isActiveClass &&
                "border-blush-strong/55 bg-blush-strong/18 text-blush-strong",
            )}
          >
            {item.statusLabel}
          </span>
        )}
        <span className="mt-1 block text-[0.68rem] font-semibold text-foreground/52 xl:text-xs">
          {countLabel}
        </span>
        {item.pendingRegistrationCount !== undefined &&
          item.pendingRegistrationCount > 0 && (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-blush-strong/35 px-2 py-0.5 text-[0.66rem] font-semibold text-blush-strong">
              <Clock3 className="size-3 shrink-0" aria-hidden="true" />
              {pendingLabel}
            </span>
          )}
      </button>
      {actions && (
        <div
          className="mt-2 flex flex-wrap gap-2"
          onClick={(event) => event.stopPropagation()}
        >
          {actions}
        </div>
      )}
    </article>
  );
}

export function ClassCalendarView({
  rangeScope,
  localRange,
  items,
  selectedClassId,
  loadingClassId = null,
  labelPrefix = "classes",
  onSelectClass,
  renderItemActions,
}: ClassCalendarViewProps) {
  const { t, i18n } = useTranslation();
  const [expandedDateKey, setExpandedDateKey] = useState<string | null>(null);
  const dateFormatter = new Intl.DateTimeFormat(i18n.language, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const fullDateFormatter = new Intl.DateTimeFormat(i18n.language, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const timeFormatter = new Intl.DateTimeFormat(i18n.language, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const days = useMemo(() => getCalendarDays(localRange), [localRange]);
  const classesByDate = useMemo(() => {
    const groups = new Map<string, ClassViewItem[]>();

    items.forEach((item) => {
      const dateKey = getLocalDateKey(new Date(item.startsAt));
      const dayClasses = groups.get(dateKey) ?? [];
      dayClasses.push(item);
      groups.set(dateKey, dayClasses);
    });

    return groups;
  }, [items]);
  const collapsedClassLimit = rangeScope === "month" ? 2 : 4;
  const rangeStartKey = getLocalDateKey(localRange.start);
  const rangeEndKey = getLocalDateKey(localRange.end);
  const todayKey = getLocalDateKey(new Date());

  if (rangeScope === "today" || rangeScope === "custom") {
    return (
      <div className="rounded-[1.4rem] border border-blush/24 bg-background/46 p-4 text-sm leading-6 text-foreground/68">
        {t(`${labelPrefix}.calendar.listFallback`)}
      </div>
    );
  }

  return (
    <div className="hidden gap-2 md:grid md:grid-cols-7 xl:gap-3">
      {days.map((day) => {
        const dateKey = getLocalDateKey(day);
        const dayClasses = classesByDate.get(dateKey) ?? [];
        const outsideRange = dateKey < rangeStartKey || dateKey > rangeEndKey;
        const isToday = dateKey === todayKey;
        const expanded = expandedDateKey === dateKey;
        const visibleClasses = expanded
          ? dayClasses
          : dayClasses.slice(0, collapsedClassLimit);
        const hiddenCount = dayClasses.length - visibleClasses.length;
        const hasOverflow = dayClasses.length > collapsedClassLimit;

        return (
          <section
            key={dateKey}
            className={cn(
              "min-h-44 rounded-[1.5rem] border border-blush/24 bg-card/78 p-3 transition-colors hover:border-blush-strong/60 hover:bg-blush-strong/10 hover:shadow-soft",
              outsideRange && "bg-background/24 opacity-55",
              isToday && "border-blush-strong ring-1 ring-blush-strong/45",
              expanded && "border-blush-strong/70 bg-card/90",
            )}
          >
            <h3
              className={cn(
                "font-serif text-sm text-foreground xl:text-base",
                isToday && "font-semibold text-blush-strong",
              )}
            >
              {dateFormatter.format(day)}
            </h3>
            <div className="mt-3 flex flex-col gap-2">
              {visibleClasses.map((item) => (
                <CalendarClassButton
                  key={item.id}
                  item={item}
                  selectedClassId={selectedClassId}
                  isLoading={item.id === loadingClassId}
                  pendingLabel={t("classes.pendingBadge", {
                    count: item.pendingRegistrationCount ?? 0,
                  })}
                  timeFormatter={timeFormatter}
                  onSelect={() => onSelectClass(item.id)}
                  actions={renderItemActions?.(item)}
                />
              ))}
              {hasOverflow && (
                <button
                  type="button"
                  className="rounded-xl border border-blush/18 bg-background/30 px-2.5 py-2 text-start text-xs font-semibold text-foreground/72 transition-colors hover:border-blush-strong hover:bg-blush-strong/10 hover:text-foreground hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blush-strong/55 xl:text-sm"
                  onClick={() => setExpandedDateKey(expanded ? null : dateKey)}
                  aria-expanded={expanded}
                  aria-label={
                    expanded
                      ? t(`${labelPrefix}.calendar.lessAria`, {
                          date: fullDateFormatter.format(day),
                        })
                      : t(`${labelPrefix}.calendar.moreAria`, {
                          count: hiddenCount,
                          date: fullDateFormatter.format(day),
                        })
                  }
                >
                  {expanded
                    ? t(`${labelPrefix}.calendar.less`)
                    : t(`${labelPrefix}.calendar.more`, { count: hiddenCount })}
                </button>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

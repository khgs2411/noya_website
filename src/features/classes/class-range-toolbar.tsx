import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  List,
  RefreshCw,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import type {
  CustomRangeValue,
  RangeScope,
  ViewMode,
} from "@/features/classes/class-range";
import { cn } from "@/lib/utils";

type ClassRangeToolbarProps = {
  rangeScope: RangeScope;
  customRange: CustomRangeValue | null;
  visibleRangeLabel: string;
  viewMode: ViewMode;
  isRefreshing?: boolean;
  labelPrefix?: string;
  onScopeChange: (scope: RangeScope) => void;
  onCustomRangeChange: (startDate: string, endDate: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onRefresh?: () => void;
  onViewModeChange: (viewMode: ViewMode) => void;
};

const scopes: RangeScope[] = ["today", "week", "month", "custom"];

export function ClassRangeToolbar({
  rangeScope,
  customRange,
  visibleRangeLabel,
  viewMode,
  isRefreshing = false,
  labelPrefix = "classes",
  onScopeChange,
  onCustomRangeChange,
  onPrevious,
  onNext,
  onToday,
  onRefresh,
  onViewModeChange,
}: ClassRangeToolbarProps) {
  const { t } = useTranslation();
  const canUseCalendar = rangeScope !== "custom";

  return (
    <div className="flex flex-col gap-3 rounded-[1.4rem] border border-blush/24 bg-background/46 p-3">
      <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
        {scopes.map((scope) => (
          <Button
            key={scope}
            type="button"
            variant="ghost"
            className={cn(
              "h-10 min-w-0 px-2 font-serif text-sm",
              rangeScope === scope &&
                "bg-blush-strong text-background hover:bg-blush-strong/90 hover:text-background",
            )}
            onClick={() => onScopeChange(scope)}
          >
            <span className="whitespace-normal leading-tight">
              {t(`${labelPrefix}.range.${scope}`)}
            </span>
          </Button>
        ))}
      </div>

      {rangeScope === "custom" && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="min-w-0 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
            {t(`${labelPrefix}.range.startDate`)}
            <input
              className="mt-2 min-h-11 w-full rounded-xl border border-blush/24 bg-background/70 px-3 text-sm font-normal normal-case tracking-normal text-foreground"
              type="date"
              value={customRange?.startDate ?? ""}
              onChange={(event) =>
                onCustomRangeChange(
                  event.target.value,
                  customRange?.endDate ?? event.target.value,
                )
              }
            />
          </label>
          <label className="min-w-0 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
            {t(`${labelPrefix}.range.endDate`)}
            <input
              className="mt-2 min-h-11 w-full rounded-xl border border-blush/24 bg-background/70 px-3 text-sm font-normal normal-case tracking-normal text-foreground"
              type="date"
              value={customRange?.endDate ?? ""}
              onChange={(event) =>
                onCustomRangeChange(
                  customRange?.startDate ?? event.target.value,
                  event.target.value,
                )
              }
            />
          </label>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onPrevious}
          aria-label={t(`${labelPrefix}.range.previous`)}
        >
          <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-w-0 flex-1 font-serif text-sm"
          onClick={onToday}
        >
          <span className="truncate">{t(`${labelPrefix}.range.todayButton`)}</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onNext}
          aria-label={t(`${labelPrefix}.range.next`)}
        >
          <ChevronRight className="size-4 rtl:rotate-180" aria-hidden="true" />
        </Button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 flex-1 font-serif text-lg text-foreground">
          {visibleRangeLabel}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          {onRefresh && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              disabled={isRefreshing}
              onClick={onRefresh}
              aria-label={t(`${labelPrefix}.refresh`)}
            >
              <RefreshCw
                className={cn("size-4", isRefreshing && "animate-spin")}
                aria-hidden="true"
              />
              <span className="hidden sm:inline">
                {t(`${labelPrefix}.refresh`)}
              </span>
            </Button>
          )}
          <div className="hidden shrink-0 gap-1 rounded-xl border border-blush/24 bg-card/78 p-1 md:flex">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "font-serif",
                viewMode === "list" &&
                  "bg-blush-strong text-background hover:bg-blush-strong/90 hover:text-background",
              )}
              onClick={() => onViewModeChange("list")}
            >
              <List className="size-4" aria-hidden="true" />
              {t(`${labelPrefix}.view.list`)}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "font-serif",
                viewMode === "calendar" &&
                  "bg-blush-strong text-background hover:bg-blush-strong/90 hover:text-background",
              )}
              disabled={!canUseCalendar}
              onClick={() => {
                if (canUseCalendar) onViewModeChange("calendar");
              }}
            >
              <CalendarDays className="size-4" aria-hidden="true" />
              {t(`${labelPrefix}.view.calendar`)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

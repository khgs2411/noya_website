import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  List,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  CustomRangeValue,
  RangeScope,
  ViewMode,
} from "@/features/manager/classes/class-range";

type ClassRangeToolbarProps = {
  rangeScope: RangeScope;
  customRange: CustomRangeValue | null;
  visibleRangeLabel: string;
  viewMode: ViewMode;
  onScopeChange: (scope: RangeScope) => void;
  onCustomRangeChange: (startDate: string, endDate: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewModeChange: (viewMode: ViewMode) => void;
};

const scopes: RangeScope[] = ["today", "week", "month", "custom"];

export function ClassRangeToolbar({
  rangeScope,
  customRange,
  visibleRangeLabel,
  viewMode,
  onScopeChange,
  onCustomRangeChange,
  onPrevious,
  onNext,
  onToday,
  onViewModeChange,
}: ClassRangeToolbarProps) {
  const { t } = useTranslation();
  const canUseCalendar = rangeScope !== "custom";

  return (
    <div className="flex flex-col gap-3 rounded-[1.4rem] border border-blush/24 bg-background/46 p-3">
      <div className="grid grid-cols-4 gap-1">
        {scopes.map((scope) => (
          <Button
            key={scope}
            type="button"
            variant="ghost"
            className={cn(
              "h-10 min-w-0 px-2 font-serif text-xs sm:text-sm",
              rangeScope === scope &&
                "bg-blush-strong text-background hover:bg-blush-strong/90 hover:text-background",
            )}
            onClick={() => onScopeChange(scope)}
          >
            <span className="truncate">{t(`manager.range.${scope}`)}</span>
          </Button>
        ))}
      </div>

      {rangeScope === "custom" && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="min-w-0 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
            {t("manager.range.startDate")}
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
            {t("manager.range.endDate")}
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
          aria-label={t("manager.range.previous")}
        >
          <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-w-0 flex-1 font-serif text-sm"
          onClick={onToday}
        >
          <span className="truncate">{t("manager.range.todayButton")}</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onNext}
          aria-label={t("manager.range.next")}
        >
          <ChevronRight className="size-4 rtl:rotate-180" aria-hidden="true" />
        </Button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 flex-1 font-serif text-lg text-foreground">
          {visibleRangeLabel}
        </p>
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
            {t("manager.view.list")}
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
            {t("manager.view.calendar")}
          </Button>
        </div>
      </div>
    </div>
  );
}

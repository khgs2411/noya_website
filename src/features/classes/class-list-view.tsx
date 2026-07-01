import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { ClassCard } from "@/features/classes/class-card";
import type {
  ClassViewDateGroup,
  ClassViewItem,
} from "@/features/classes/class-types";
import { getLocalDateKey } from "@/features/classes/class-range";
import { cn } from "@/lib/utils";

type ClassListViewProps = {
  groups: ClassViewDateGroup[];
  selectedClassId: string | null;
  loadingClassId?: string | null;
  selectLabel: string;
  onSelectClass: (classId: string) => void;
  renderCardMeta?: (item: ClassViewItem) => ReactNode;
  renderCardActions?: (item: ClassViewItem) => ReactNode;
};

export function ClassListView({
  groups,
  selectedClassId,
  loadingClassId = null,
  selectLabel,
  onSelectClass,
  renderCardMeta,
  renderCardActions,
}: ClassListViewProps) {
  const { i18n } = useTranslation();
  const todayKey = getLocalDateKey(new Date());
  const isRtl = i18n.dir() === "rtl";

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => {
        const isToday = group.dateKey === todayKey;

        return (
          <section
            key={group.dateKey}
            dir={isRtl ? "rtl" : "ltr"}
            className={cn(
              "flex flex-col gap-4 rounded-[1.6rem] border border-blush/18 bg-background/24 p-3 transition-colors hover:border-blush-strong/50 hover:bg-blush-strong/10 sm:p-4 lg:items-stretch",
              "lg:flex-row",
              isToday && "border-blush-strong/85 ring-1 ring-blush-strong/35",
            )}
          >
            <div
              className={cn(
                "flex shrink-0 items-center justify-between gap-3 rounded-[1.25rem] border border-blush/18 bg-card/64 p-4 lg:w-52 lg:flex-col lg:items-start lg:justify-start",
                isToday && "border-blush-strong/65",
              )}
            >
              <div className="min-w-0">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-foreground/42">
                  {group.dateKey}
                </p>
                <h2
                  className={cn(
                    "mt-1 break-words font-serif text-2xl leading-tight text-foreground",
                    isToday && "font-semibold text-blush-strong",
                  )}
                >
                  {group.label}
                </h2>
              </div>
              <span className="shrink-0 rounded-full border border-blush/24 px-3 py-1 text-xs font-semibold text-foreground/60">
                {group.items.length}
              </span>
            </div>

            <div className="grid min-w-0 flex-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {group.items.map((item) => (
                <ClassCard
                  key={item.id}
                  item={item}
                  isSelected={item.id === selectedClassId}
                  isLoading={item.id === loadingClassId}
                  selectLabel={selectLabel}
                  onSelect={onSelectClass}
                  renderMeta={renderCardMeta}
                  renderActions={renderCardActions}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

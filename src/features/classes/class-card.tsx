import type { ReactNode } from "react";
import { CalendarClock, Clock3, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ClassRegistrationStatus } from "@/features/classes/class-registration-status";
import type { ClassViewItem } from "@/features/classes/class-types";
import { LocationDisplay } from "@/features/locations/location-display";
import { cn } from "@/lib/utils";

type ClassCardProps = {
  item: ClassViewItem;
  isSelected: boolean;
  isLoading?: boolean;
  selectLabel: string;
  onSelect: (classId: string) => void;
  renderMeta?: (item: ClassViewItem) => ReactNode;
  renderActions?: (item: ClassViewItem) => ReactNode;
};

export function ClassCard({
  item,
  isSelected,
  isLoading = false,
  selectLabel,
  onSelect,
  renderMeta,
  renderActions,
}: ClassCardProps) {
  const { t, i18n } = useTranslation();
  const timeFormatter = new Intl.DateTimeFormat(i18n.language, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const startsAt = new Date(item.startsAt);
  const endsAt = new Date(item.endsAt);
  const actions = renderActions?.(item);
  const isActiveClass =
    item.lifecycleStatus === "in_progress" || item.temporalStatus === "started";

  return (
    <article
      className={cn(
        "rounded-[1.4rem] border border-blush/24 bg-card/78 p-4 shadow-soft transition-colors hover:border-blush-strong hover:bg-blush-strong/10",
        isActiveClass &&
          "border-blush-strong/80 bg-blush-strong/12 ring-1 ring-blush-strong/30",
        isSelected && "border-blush-strong",
      )}
    >
      <button
        type="button"
        className="block w-full min-w-0 text-start"
        disabled={isLoading}
        aria-busy={isLoading}
        aria-pressed={isSelected}
        aria-label={`${selectLabel}: ${item.name}`}
        onClick={() => onSelect(item.id)}
      >
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs text-foreground/56">
              <CalendarClock className="size-4 shrink-0" aria-hidden="true" />
              <span>
                {timeFormatter.format(startsAt)} - {timeFormatter.format(endsAt)}
              </span>
            </p>
            <h3 className="mt-2 break-words font-serif text-xl text-foreground">
              {item.name}
            </h3>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {isLoading && (
              <Loader2
                className="size-4 animate-spin text-blush-strong"
                aria-hidden="true"
              />
            )}
            {item.statusLabel && (
              <span
                className={cn(
                  "rounded-full border border-blush/24 px-2 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-foreground/56",
                  isActiveClass &&
                    "border-blush-strong/60 bg-blush-strong/18 text-blush-strong",
                )}
              >
                {item.statusLabel}
              </span>
            )}
          </div>
        </div>

        <LocationDisplay
          text={item.location}
          snapshot={item.locationSnapshot}
          variant="compact"
          className="mt-3 flex items-start gap-2 text-sm text-foreground/68"
        />

        {item.capacityLabel && (
          <p className="mt-3 text-sm text-foreground/68">{item.capacityLabel}</p>
        )}

        <ClassRegistrationStatus
          status={item.userRegistrationState?.status}
          className="mt-3"
        />

        {item.pendingRegistrationCount !== undefined &&
          item.pendingRegistrationCount > 0 && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-blush-strong/45 bg-blush-strong/10 px-3 py-1 text-xs font-semibold text-blush-strong">
              <Clock3 className="size-3.5 shrink-0" aria-hidden="true" />
              <span>
                {t("classes.pendingBadge", {
                  count: item.pendingRegistrationCount,
                })}
              </span>
            </p>
          )}

        {renderMeta?.(item)}
      </button>

      {actions && <div className="mt-4 flex flex-wrap gap-2">{actions}</div>}
    </article>
  );
}

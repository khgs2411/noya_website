import type { ManagedClass } from "@class-kit/react";
import { CalendarClock, MapPin, Send, Undo2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ClassCardProps = {
  managedClass: ManagedClass;
  canManageClasses: boolean;
  isSelected: boolean;
  isMutating: boolean;
  onSelect: (classId: string) => void;
  onPublish: (classId: string) => void;
  onDraft: (classId: string) => void;
};

export function ClassCard({
  managedClass,
  canManageClasses,
  isSelected,
  isMutating,
  onSelect,
  onPublish,
  onDraft,
}: ClassCardProps) {
  const { t, i18n } = useTranslation();
  const timeFormatter = new Intl.DateTimeFormat(i18n.language, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const startsAt = new Date(managedClass.starts_at);
  const endsAt = new Date(managedClass.ends_at);
  const canPublish =
    canManageClasses && !managedClass.read_only && managedClass.status === "draft";
  const canDraft =
    canManageClasses &&
    !managedClass.read_only &&
    managedClass.status === "published";
  const registeredCount = managedClass.registeredUsersCount ?? 0;

  return (
    <article
      className={cn(
        "rounded-[1.4rem] border border-blush/24 bg-card/78 p-4 shadow-soft transition-colors hover:border-blush-strong hover:bg-blush-strong/10",
        isSelected && "border-blush-strong",
      )}
    >
      <button
        type="button"
        className="block w-full min-w-0 text-start"
        onClick={() => onSelect(managedClass.id)}
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
              {managedClass.name}
            </h3>
          </div>
          <span className="shrink-0 rounded-full border border-blush/24 px-2 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-foreground/56">
            {t(`manager.classStatus.${managedClass.status}`)}
          </span>
        </div>

        {managedClass.location && (
          <p className="mt-3 flex items-start gap-2 text-sm text-foreground/68">
            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span className="break-words">{managedClass.location}</span>
          </p>
        )}

        <p className="mt-3 text-sm text-foreground/68">
          {t("manager.classCard.capacity", {
            count: managedClass.capacity,
            registered: registeredCount,
          })}
        </p>
        <p className="sr-only">{t("manager.classCard.select")}</p>
      </button>

      {(canPublish || canDraft) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {canPublish && (
            <Button
              type="button"
              size="sm"
              className="rounded-full"
              disabled={isMutating}
              onClick={() => onPublish(managedClass.id)}
            >
              <Send className="size-4" aria-hidden="true" />
              {t("manager.classActions.publish")}
            </Button>
          )}
          {canDraft && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full"
              disabled={isMutating}
              onClick={() => onDraft(managedClass.id)}
            >
              <Undo2 className="size-4" aria-hidden="true" />
              {t("manager.classActions.moveToDraft")}
            </Button>
          )}
        </div>
      )}
    </article>
  );
}

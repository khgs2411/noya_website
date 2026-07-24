import type { ClassTemplate } from "@class-kit/react";
import { Layers3, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { LocationDisplay } from "@/features/locations/location-display";

type TemplateCardProps = {
  template: ClassTemplate;
  isSelected: boolean;
  onSelect: (templateId: string) => void;
};

export function TemplateCard({
  template,
  isSelected,
  onSelect,
}: TemplateCardProps) {
  const { t } = useTranslation();
  const inactive = template.status === "inactive";

  return (
    <article
      className={cn(
        "rounded-[1.4rem] border border-blush/24 bg-card/78 p-4 shadow-soft",
        isSelected && "border-blush-strong",
        inactive && "opacity-60",
      )}
    >
      <button
        type="button"
        className="block w-full min-w-0 text-start"
        aria-pressed={isSelected}
        onClick={() => onSelect(template.id)}
      >
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs text-foreground/56">
              <Layers3 className="size-4 shrink-0" aria-hidden="true" />
              <span>{template.category ?? t("manager.templateCard.noCategory")}</span>
            </p>
            <h3 className="mt-2 break-words font-serif text-xl text-foreground">
              {template.name}
            </h3>
          </div>
          <span className="shrink-0 rounded-full border border-blush/24 px-2 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-foreground/56">
            {t(`manager.templateStatus.${template.status}`)}
          </span>
        </div>

        <LocationDisplay
          text={template.default_location}
          snapshot={template.default_location_snapshot}
          variant="compact"
          className="mt-3 flex items-start gap-2 text-sm text-foreground/68"
        />

        <p className="mt-3 flex items-center gap-2 text-sm text-foreground/68">
          <Users className="size-4 shrink-0" aria-hidden="true" />
          {t("manager.templateCard.capacity", {
            count: template.default_capacity,
          })}
        </p>
        <p className="sr-only">{t("manager.templateCard.select")}</p>
      </button>
    </article>
  );
}

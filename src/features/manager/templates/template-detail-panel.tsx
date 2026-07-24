import type { ClassTemplate } from "@class-kit/react";
import type { ReactNode } from "react";
import { Ban, Edit3, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { LocationDisplay } from "@/features/locations/location-display";

type TemplateDetailPanelProps = {
  template: ClassTemplate | null;
  onClose: () => void;
  onEdit: () => void;
  onDeactivate: () => void;
};

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-1 rounded-xl border border-blush/24 bg-background/46 p-3 sm:grid-cols-[8rem_1fr]">
      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
        {label}
      </dt>
      <dd className="break-words text-foreground/72">{value}</dd>
    </div>
  );
}

export function TemplateDetailPanel({
  template,
  onClose,
  onEdit,
  onDeactivate,
}: TemplateDetailPanelProps) {
  const { t } = useTranslation();

  if (!template) return null;

  const active = template.status === "active";

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-black/50 p-0 md:place-items-center md:p-6"
      onClick={onClose}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`${t("manager.templateDetail.eyebrow")}: ${template.name}`}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-[1.4rem] border border-blush/24 bg-background p-5 text-foreground shadow-soft md:max-w-xl md:rounded-[1.4rem] md:bg-card/95"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-serif text-xs uppercase tracking-[0.25em] text-foreground/48">
              {t("manager.templateDetail.eyebrow")}
            </p>
            <h2 className="mt-2 break-words font-serif text-3xl text-foreground">
              {template.name}
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={onClose}
            aria-label={t("actions.close")}
          >
            <X className="size-5" aria-hidden="true" />
          </Button>
        </header>

        {template.description && (
          <p className="mt-4 text-sm leading-6 text-foreground/68">
            {template.description}
          </p>
        )}

        <dl className="mt-5 grid gap-3 text-sm">
          <DetailRow
            label={t("manager.templateDetail.status")}
            value={t(`manager.templateStatus.${template.status}`)}
          />
          <DetailRow
            label={t("manager.templateDetail.category")}
            value={template.category ?? t("manager.templateDetail.noCategory")}
          />
          <DetailRow
            label={t("manager.templateDetail.capacity")}
            value={String(template.default_capacity)}
          />
          <DetailRow
            label={t("manager.templateDetail.location")}
            value={template.default_location?.trim() || template.default_location_snapshot?.label ? (
              <LocationDisplay
                text={template.default_location}
                snapshot={template.default_location_snapshot}
                variant="detailed"
              />
            ) : t("manager.detail.noLocation")}
          />
          <DetailRow
            label={t("manager.templateDetail.visibility")}
            value={t(`manager.visibility.${template.default_visibility === "members_only" ? "membersOnly" : template.default_visibility}`)}
          />
          <DetailRow
            label={t("manager.templateDetail.registrationPolicy")}
            value={t(`manager.registrationPolicy.${template.default_registration_policy === "auto_approve" ? "autoApprove" : template.default_registration_policy === "member_auto_approve" ? "memberAutoApprove" : "approvalRequired"}`)}
          />
          <DetailRow
            label={t("manager.templateDetail.membershipRequirement")}
            value={t(`manager.membershipRequirement.${template.default_membership_requirement}`)}
          />
          {template.default_notes && (
            <DetailRow
              label={t("manager.templateDetail.notes")}
              value={template.default_notes}
            />
          )}
        </dl>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="button" className="rounded-full" onClick={onEdit}>
            <Edit3 className="size-4" aria-hidden="true" />
            {t("manager.templateActions.edit")}
          </Button>
          {active && (
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={onDeactivate}
            >
              <Ban className="size-4" aria-hidden="true" />
              {t("manager.templateActions.deactivate")}
            </Button>
          )}
        </div>
      </aside>
    </div>
  );
}

import type { ManagedClass } from "@class-kit/react";
import { Ban, Edit3 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

type ClassDetailPanelProps = {
  managedClass: ManagedClass | null;
  canManageClasses: boolean;
  onEdit: () => void;
  onCancel: () => void;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-xl border border-blush/24 bg-background/46 p-3 sm:grid-cols-[8rem_1fr]">
      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
        {label}
      </dt>
      <dd className="break-words text-foreground/72">{value}</dd>
    </div>
  );
}

export function ClassDetailPanel({
  managedClass,
  canManageClasses,
  onEdit,
  onCancel,
}: ClassDetailPanelProps) {
  const { t, i18n } = useTranslation();

  if (!managedClass) return null;

  const formatter = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const editable = canManageClasses && !managedClass.read_only;

  return (
    <aside className="rounded-[1.4rem] border border-blush/24 bg-card/78 p-5 shadow-soft">
      <p className="font-serif text-xs uppercase tracking-[0.25em] text-foreground/48">
        {t("manager.detail.eyebrow")}
      </p>
      <h2 className="mt-2 break-words font-serif text-3xl text-foreground">
        {managedClass.name}
      </h2>
      <dl className="mt-5 grid gap-3 text-sm">
        <DetailRow
          label={t("manager.detail.time")}
          value={`${formatter.format(new Date(managedClass.starts_at))} - ${formatter.format(new Date(managedClass.ends_at))}`}
        />
        <DetailRow
          label={t("manager.detail.status")}
          value={t(`manager.classStatus.${managedClass.status}`)}
        />
        <DetailRow
          label={t("manager.detail.capacity")}
          value={`${managedClass.registeredUsersCount ?? 0}/${managedClass.capacity}`}
        />
        <DetailRow
          label={t("manager.detail.location")}
          value={managedClass.location ?? t("manager.detail.noLocation")}
        />
        {managedClass.notes && (
          <DetailRow label={t("manager.detail.notes")} value={managedClass.notes} />
        )}
        {managedClass.read_only_reason && (
          <DetailRow
            label={t("manager.detail.readOnly")}
            value={t(`manager.readOnlyReason.${managedClass.read_only_reason}`)}
          />
        )}
      </dl>
      {editable && (
        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="button" className="rounded-full" onClick={onEdit}>
            <Edit3 className="size-4" aria-hidden="true" />
            {t("manager.classActions.edit")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={onCancel}
          >
            <Ban className="size-4" aria-hidden="true" />
            {t("manager.classActions.cancel")}
          </Button>
        </div>
      )}
    </aside>
  );
}

import type { ClassKitClient, ManagedClass } from "@class-kit/react";
import type { ReactNode } from "react";
import { Ban, Edit3, Link2, Loader2, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { ClassAttendanceForm } from "@/features/manager/attendance/class-attendance-form";
import { PendingRegistrationsPanel } from "@/features/manager/registrations/pending-registrations-panel";
import { LocationDisplay } from "@/features/locations/location-display";

type ClassDetailPanelProps = {
  client: ClassKitClient | null;
  managedClass: ManagedClass | null;
  canManageClasses: boolean;
  canManageRegistrations: boolean;
  canManageAttendance: boolean;
  onClose: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onCreateSignupLink: (classId: string) => void;
  onRegistrationsChanged: () => void | Promise<void>;
  onClassChanged: () => void | Promise<void>;
  signupLinkBusy: boolean;
  signupLinkNotice: string | null;
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

export function ClassDetailPanel({
  client,
  managedClass,
  canManageClasses,
  canManageRegistrations,
  canManageAttendance,
  onClose,
  onEdit,
  onCancel,
  onCreateSignupLink,
  onRegistrationsChanged,
  onClassChanged,
  signupLinkBusy,
  signupLinkNotice,
}: ClassDetailPanelProps) {
  const { t, i18n } = useTranslation();

  if (!managedClass) return null;

  const formatter = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const editable = canManageClasses && !managedClass.read_only;
  const description = managedClass.description?.trim();
  const notes = managedClass.notes?.trim();

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-black/50 p-0 md:place-items-center md:p-6"
      onClick={onClose}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`${t("manager.detail.eyebrow")}: ${managedClass.name}`}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-[1.4rem] border border-blush/24 bg-background p-5 text-foreground shadow-soft md:max-w-xl md:rounded-[1.4rem] md:bg-card/95"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-serif text-xs uppercase tracking-[0.25em] text-foreground/48">
              {t("manager.detail.eyebrow")}
            </p>
            <h2 className="mt-2 break-words font-serif text-3xl text-foreground">
              {managedClass.name}
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
            value={managedClass.location?.trim() || managedClass.location_snapshot?.label ? (
              <LocationDisplay
                text={managedClass.location}
                snapshot={managedClass.location_snapshot}
                variant="detailed"
              />
            ) : t("manager.detail.noLocation")}
          />
          {description && (
            <DetailRow
              label={t("manager.detail.description")}
              value={description}
            />
          )}
          {notes && (
            <DetailRow label={t("manager.detail.notes")} value={notes} />
          )}
          {managedClass.read_only_reason && (
            <DetailRow
              label={t("manager.detail.readOnly")}
              value={t(`manager.readOnlyReason.${managedClass.read_only_reason}`)}
            />
          )}
        </dl>
        <section className="mt-5 rounded-[1.2rem] border border-blush/24 bg-card/50 p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-serif text-xl text-foreground">
              {t("manager.pending.classTitle")}
            </h3>
            {managedClass.pendingRegistrationCount !== undefined &&
              managedClass.pendingRegistrationCount > 0 && (
                <span className="rounded-full border border-blush-strong/35 px-3 py-1 text-xs font-semibold text-blush-strong">
                  {t("classes.pendingBadge", {
                    count: managedClass.pendingRegistrationCount,
                  })}
                </span>
              )}
          </div>
          <PendingRegistrationsPanel
            client={client}
            canManageRegistrations={canManageRegistrations}
            classId={managedClass.id}
            compact
            onChanged={onRegistrationsChanged}
          />
        </section>
        <ClassAttendanceForm
          client={client}
          managedClass={managedClass}
          canManageAttendance={canManageAttendance}
          canManageRegistrations={canManageRegistrations}
          onClassChanged={onClassChanged}
        />
        {canManageClasses && (
          <section className="mt-5 rounded-[1.2rem] border border-blush/24 bg-card/50 p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h3 className="font-serif text-xl text-foreground">
                  {t("manager.signupLinks.detailTitle")}
                </h3>
                <p className="mt-1 text-sm leading-6 text-foreground/68">
                  {t("manager.signupLinks.detailBody")}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full shrink-0 rounded-full sm:w-auto"
                disabled={signupLinkBusy}
                onClick={() => onCreateSignupLink(managedClass.id)}
              >
                {signupLinkBusy ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Link2 className="size-4" aria-hidden="true" />
                )}
                {t("manager.signupLinks.classAction")}
              </Button>
            </div>
            {signupLinkNotice && (
              <p className="mt-3 rounded-xl border border-blush/24 bg-background/46 p-3 text-sm leading-6 text-foreground/68">
                {signupLinkNotice}
              </p>
            )}
          </section>
        )}
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
    </div>
  );
}

import { useProductContext } from "@class-kit/react";
import { AlertCircle, CalendarPlus, Loader2, Plus, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { ScheduleCard } from "@/features/manager/schedules/schedule-card";
import { ScheduleDetailPanel } from "@/features/manager/schedules/schedule-detail-panel";
import { ScheduleFormDialog } from "@/features/manager/schedules/schedule-form-dialog";
import { useManagedSchedules } from "@/features/manager/schedules/use-managed-schedules";
import { useManagedTemplates } from "@/features/manager/templates/use-managed-templates";

type ScheduleManagementTabProps = {
  canManageSchedules: boolean;
};

type FormSurface =
  | { mode: "create"; scheduleId?: never }
  | { mode: "edit"; scheduleId: string }
  | null;

export function ScheduleManagementTab({
  canManageSchedules,
}: ScheduleManagementTabProps) {
  const { t } = useTranslation();
  const { client } = useProductContext();
  const [formSurface, setFormSurface] = useState<FormSurface>(null);
  const managedSchedules = useManagedSchedules({ client, canManageSchedules });
  const managedTemplates = useManagedTemplates({
    client,
    canManageTemplates: canManageSchedules,
  });
  const { state, actions } = managedSchedules;
  const activeTemplates = managedTemplates.state.activeTemplates;
  const canCreateSchedule = activeTemplates.length > 0;
  const formSchedule =
    formSurface?.mode === "edit"
      ? state.schedules.find((schedule) => schedule.id === formSurface.scheduleId) ??
        state.selectedSchedule
      : null;

  return (
    <section className="rounded-[1.4rem] border border-blush/24 bg-card/78 p-5 shadow-soft sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-blush-strong text-background">
          <CalendarPlus className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="font-serif text-xs uppercase tracking-[0.25em] text-foreground/48">
            {t("manager.tabs.schedules")}
          </p>
          <h2 className="mt-2 font-serif text-3xl text-foreground">
            {t("manager.schedules.title")}
          </h2>
          <p className="mt-3 max-w-prose text-sm leading-6 text-foreground/68">
            {canManageSchedules
              ? t("manager.schedules.body")
              : t("manager.schedules.noAccessBody")}
          </p>
        </div>
      </div>

      {canManageSchedules ? (
        <div className="mt-5 flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {!canCreateSchedule && (
              <p className="rounded-xl border border-blush/24 bg-background/46 p-3 text-sm leading-6 text-foreground/68">
                {t("manager.schedules.noTemplates")}
              </p>
            )}
            <div className="flex flex-col gap-2 sm:ms-auto sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                disabled={
                  state.loadStatus === "loading" ||
                  managedTemplates.state.loadStatus === "loading"
                }
                onClick={() => {
                  void actions.refreshSchedules();
                  void managedTemplates.actions.refreshTemplates();
                }}
              >
                <RefreshCw
                  className={[
                    "size-4",
                    state.loadStatus === "loading" ||
                    managedTemplates.state.loadStatus === "loading"
                      ? "animate-spin"
                      : "",
                  ].join(" ")}
                  aria-hidden="true"
                />
                {t("manager.schedules.refresh")}
              </Button>
              <Button
                type="button"
                className="rounded-full"
                disabled={!canCreateSchedule}
                onClick={() => setFormSurface({ mode: "create" })}
              >
                <Plus className="size-4" aria-hidden="true" />
                {t("manager.scheduleActions.create")}
              </Button>
            </div>
          </div>

          {state.loadStatus === "loading" && (
            <div className="rounded-xl border border-blush/24 bg-background/46 p-5">
              <div className="flex items-center gap-3 text-sm text-foreground/68">
                <Loader2
                  className="size-4 shrink-0 animate-spin text-blush-strong"
                  aria-hidden="true"
                />
                {t("manager.schedules.loading")}
              </div>
            </div>
          )}

          {state.loadStatus === "error" && (
            <div className="rounded-xl border border-blush/24 bg-background/46 p-5">
              <div className="flex items-start gap-3">
                <AlertCircle
                  className="mt-0.5 size-5 shrink-0 text-blush-strong"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="font-serif text-xl text-foreground">
                    {t("manager.schedules.errorTitle")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-foreground/68">
                    {state.errorMessage ?? t("manager.schedules.errorBody")}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4 rounded-full"
                    onClick={() => void actions.refreshSchedules()}
                  >
                    <RefreshCw className="size-4" aria-hidden="true" />
                    {t("manager.schedules.retry")}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {managedTemplates.state.loadStatus === "error" && (
            <p className="rounded-xl border border-blush/24 bg-background/46 p-3 text-sm leading-6 text-blush-strong">
              {managedTemplates.state.errorMessage ??
                t("manager.templates.errorBody")}
            </p>
          )}

          {state.operationError && (
            <p className="rounded-xl border border-blush/24 bg-background/46 p-3 text-sm leading-6 text-blush-strong">
              {state.operationError}
            </p>
          )}

          {state.loadStatus === "loaded" && state.sortedSchedules.length === 0 && (
            <div className="rounded-xl border border-blush/24 bg-background/46 p-5">
              <p className="font-serif text-xl text-foreground">
                {t("manager.schedules.emptyTitle")}
              </p>
              <p className="mt-2 text-sm leading-6 text-foreground/68">
                {t("manager.schedules.emptyBody")}
              </p>
            </div>
          )}

          {state.loadStatus === "loaded" && state.sortedSchedules.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {state.sortedSchedules.map((schedule) => (
                <ScheduleCard
                  key={schedule.id}
                  schedule={schedule}
                  templates={managedTemplates.state.templates}
                  isSelected={schedule.id === state.selectedScheduleId}
                  onSelect={actions.selectSchedule}
                />
              ))}
            </div>
          )}

          <ScheduleDetailPanel
            schedule={state.selectedSchedule}
            templates={managedTemplates.state.templates}
            preview={state.preview}
            generationResult={state.generationResult}
            submitting={
              state.mutationStatus === "previewing" ||
              state.mutationStatus === "generating" ||
              state.mutationStatus === "pausing" ||
              state.mutationStatus === "archiving" ||
              state.mutationStatus === "skipping" ||
              state.mutationStatus === "unskipping"
            }
            onClose={() => {
              actions.clearSelection();
              actions.clearPreview();
              actions.clearGenerationResult();
            }}
            onEdit={() => {
              if (!state.selectedSchedule) return;
              setFormSurface({
                mode: "edit",
                scheduleId: state.selectedSchedule.id,
              });
              actions.clearSelection();
            }}
            onPreview={(scheduleId, from, through) => {
              void actions.previewSchedule(scheduleId, from, through);
            }}
            onGenerate={(scheduleId, generationCount) => {
              void actions.generateSchedule(scheduleId, generationCount);
            }}
            onPause={(scheduleId) => {
              void actions.pauseSchedule(scheduleId);
            }}
            onArchive={(scheduleId) => {
              void actions.archiveSchedule(scheduleId);
            }}
            onSkipDate={(scheduleId, date, reason) => {
              void actions.skipScheduleDate(scheduleId, date, reason);
            }}
            onUnskipDate={(scheduleId, date) => {
              void actions.unskipScheduleDate(scheduleId, date);
            }}
          />

          <ScheduleFormDialog
            open={formSurface !== null}
            mode={formSurface?.mode ?? "create"}
            schedule={formSchedule}
            activeTemplates={activeTemplates}
            submitting={
              state.mutationStatus === "creating" ||
              state.mutationStatus === "updating"
            }
            errorMessage={state.operationError}
            onClose={() => setFormSurface(null)}
            onCreate={actions.createSchedule}
            onUpdate={actions.updateSchedule}
          />
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-blush/24 bg-background/46 p-5">
          <p className="font-serif text-xl text-foreground">
            {t("manager.schedules.noAccessTitle")}
          </p>
          <p className="mt-2 text-sm leading-6 text-foreground/68">
            {t("manager.schedules.noAccessBody")}
          </p>
        </div>
      )}
    </section>
  );
}

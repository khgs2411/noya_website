import { useProductContext } from "@class-kit/react";
import { AlertCircle, CalendarPlus, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { ClassCalendarView } from "@/features/manager/classes/class-calendar-view";
import { ClassCancelDialog } from "@/features/manager/classes/class-cancel-dialog";
import { ClassDetailPanel } from "@/features/manager/classes/class-detail-panel";
import { ClassFormDialog } from "@/features/manager/classes/class-form-dialog";
import { ClassListView } from "@/features/manager/classes/class-list-view";
import { ClassRangeToolbar } from "@/features/manager/classes/class-range-toolbar";
import { useManagedClasses } from "@/features/manager/classes/use-managed-classes";
import { useManagedTemplates } from "@/features/manager/templates/use-managed-templates";

type ClassManagementTabProps = {
  canManageClasses: boolean;
};

type FormSurface =
  | { mode: "create"; classId?: never }
  | { mode: "edit"; classId: string }
  | null;

export function ClassManagementTab({
  canManageClasses,
}: ClassManagementTabProps) {
  const { t } = useTranslation();
  const [formSurface, setFormSurface] = useState<FormSurface>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const { client } = useProductContext();
  const managedClasses = useManagedClasses({ client, canManageClasses });
  const managedTemplates = useManagedTemplates({
    client,
    canManageTemplates: canManageClasses,
  });
  const { state, actions } = managedClasses;
  const formClass =
    formSurface?.mode === "edit"
      ? state.classes.find((managedClass) => managedClass.id === formSurface.classId) ?? state.selectedClass
      : null;
  const listView = (
    <ClassListView
      groups={state.classesGroupedByDate}
      selectedClassId={state.selectedClassId}
      canManageClasses={state.canManageClasses}
      isMutating={state.mutationStatus !== "idle"}
      onSelectClass={actions.selectClass}
      onPublishClass={actions.publishClass}
      onDraftClass={actions.draftClass}
    />
  );

  return (
    <section className="rounded-[1.4rem] border border-blush/24 bg-card/78 p-5 shadow-soft sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-blush-strong text-background">
          <CalendarPlus className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="font-serif text-xs uppercase tracking-[0.25em] text-foreground/48">
            {t("manager.tabs.classes")}
          </p>
          <h2 className="mt-2 font-serif text-3xl text-foreground">
            {t("manager.classes.title")}
          </h2>
          <p className="mt-3 max-w-prose text-sm leading-6 text-foreground/68">
            {canManageClasses
              ? t("manager.classes.body")
              : t("manager.classes.noAccessBody")}
          </p>
        </div>
      </div>

      {canManageClasses ? (
        <div className="mt-5 flex flex-col gap-4">
          <div className="flex justify-end">
            <Button
              type="button"
              className="rounded-full"
              onClick={() => setFormSurface({ mode: "create" })}
            >
              <CalendarPlus className="size-4" aria-hidden="true" />
              {t("manager.classActions.create")}
            </Button>
          </div>

          <ClassRangeToolbar
            rangeScope={state.rangeScope}
            customRange={state.customRange}
            visibleRangeLabel={state.visibleRangeLabel}
            viewMode={state.viewMode}
            onScopeChange={actions.setRangeScope}
            onCustomRangeChange={actions.setCustomRange}
            onPrevious={actions.goToPreviousRange}
            onNext={actions.goToNextRange}
            onToday={actions.goToToday}
            onViewModeChange={actions.setViewMode}
          />

          {state.loadStatus === "loading" && (
            <div className="rounded-xl border border-blush/24 bg-background/46 p-5">
              <div className="flex items-center gap-3 text-sm text-foreground/68">
                <Loader2
                  className="size-4 shrink-0 animate-spin text-blush-strong"
                  aria-hidden="true"
                />
                {t("manager.classes.loading")}
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
                    {t("manager.classes.errorTitle")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-foreground/68">
                    {state.errorMessage ?? t("manager.classes.errorBody")}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4 rounded-full"
                    onClick={() => void actions.refreshVisibleRange()}
                  >
                    <RefreshCw className="size-4" aria-hidden="true" />
                    {t("manager.classes.retry")}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {state.operationError && (
            <p className="rounded-xl border border-blush/24 bg-background/46 p-3 text-sm leading-6 text-blush-strong">
              {state.operationError}
            </p>
          )}

          {state.reconciliationNotice?.type === "stale-after-mutation" && (
            <div className="rounded-xl border border-blush/24 bg-background/46 p-4 text-sm">
              <p className="font-serif text-xl text-foreground">
                {t("manager.recovery.staleTitle")}
              </p>
              <p className="mt-2 leading-6 text-foreground/68">
                {t("manager.recovery.staleBody")}
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-4 rounded-full"
                onClick={() => void actions.refreshVisibleRange()}
              >
                <RefreshCw className="size-4" aria-hidden="true" />
                {t("manager.recovery.refresh")}
              </Button>
            </div>
          )}

          {state.reconciliationNotice?.type === "moved-out-of-range" && (
            <p className="rounded-xl border border-blush/24 bg-background/46 p-4 text-sm leading-6 text-foreground/68">
              {t("manager.recovery.movedOutOfRange")}
            </p>
          )}

          {state.loadStatus === "loaded" && state.classes.length === 0 && (
            <div className="rounded-xl border border-blush/24 bg-background/46 p-5">
              <p className="font-serif text-xl text-foreground">
                {t("manager.classes.emptyTitle")}
              </p>
              <p className="mt-2 text-sm leading-6 text-foreground/68">
                {t("manager.classes.emptyBody")}
              </p>
            </div>
          )}

          {state.loadStatus === "loaded" && state.classes.length > 0 && (
            <>
              <div className="md:hidden">{listView}</div>
              <div className="hidden md:block">
                {state.viewMode === "calendar" ? (
                  <ClassCalendarView
                    rangeScope={state.rangeScope}
                    localRange={state.localRange}
                    classes={state.classes}
                    selectedClassId={state.selectedClassId}
                    onSelectClass={actions.selectClass}
                  />
                ) : (
                  listView
                )}
              </div>
            </>
          )}

          <ClassDetailPanel
            managedClass={state.selectedClass}
            canManageClasses={state.canManageClasses}
            onClose={actions.clearSelection}
            onEdit={() => {
              if (!state.selectedClass) return;
              setFormSurface({ mode: "edit", classId: state.selectedClass.id });
              actions.clearSelection();
            }}
            onCancel={() => setCancelOpen(true)}
          />

          <ClassFormDialog
            open={formSurface !== null}
            mode={formSurface?.mode ?? "create"}
            managedClass={formClass}
            templates={managedTemplates.state.activeTemplates}
            submitting={
              state.mutationStatus === "creating" ||
              state.mutationStatus === "updating"
            }
            errorMessage={state.operationError}
            onClose={() => setFormSurface(null)}
            onCreate={actions.createClass}
            onUpdate={actions.updateClass}
          />

          <ClassCancelDialog
            open={cancelOpen}
            managedClass={state.selectedClass}
            submitting={state.mutationStatus === "cancelling"}
            errorMessage={state.operationError}
            onClose={() => setCancelOpen(false)}
            onConfirm={actions.cancelClass}
          />
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-blush/24 bg-background/46 p-5">
          <p className="font-serif text-xl text-foreground">
            {t("manager.classes.noAccessTitle")}
          </p>
          <p className="mt-2 text-sm leading-6 text-foreground/68">
            {t("manager.classes.noAccessBody")}
          </p>
        </div>
      )}
    </section>
  );
}

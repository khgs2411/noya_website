import { useProductContext } from "@class-kit/react";
import type { ClassKitClient, ManagedClass } from "@class-kit/react";
import {
  AlertCircle,
  CalendarPlus,
  CheckCircle2,
  FileText,
  Link2,
  Loader2,
  Play,
  RefreshCw,
  Send,
  X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { ClassCalendarView } from "@/features/classes/class-calendar-view";
import { ClassListView } from "@/features/classes/class-list-view";
import { ClassRangeToolbar } from "@/features/classes/class-range-toolbar";
import {
  getRangeSignupFilters,
  getSignupLinkUrl,
} from "@/features/classes/signup-links";
import type {
  ClassViewDateGroup,
  ClassViewItem,
} from "@/features/classes/class-types";
import { ClassCancelDialog } from "@/features/manager/classes/class-cancel-dialog";
import { ClassDetailPanel } from "@/features/manager/classes/class-detail-panel";
import { ClassFormDialog } from "@/features/manager/classes/class-form-dialog";
import { ClassAttendanceForm } from "@/features/manager/attendance/class-attendance-form";
import { useManagedClasses } from "@/features/manager/classes/use-managed-classes";
import { useManagedTemplates } from "@/features/manager/templates/use-managed-templates";
import { captureActiveElement, restoreFocus } from "@/lib/focus";

type ClassManagementTabProps = {
  canManageClasses: boolean;
  canManageRegistrations: boolean;
  canManageAttendance: boolean;
};

type FormSurface =
  | { mode: "create"; classId?: never }
  | { mode: "edit"; classId: string }
  | null;

type AttendanceSurface = { classId: string } | null;

function getManagerStatusLabel(
  managedClass: {
    status: string;
    temporal_status: string;
    lifecycle_status?: string;
  },
  t: (key: string) => string,
) {
  if (managedClass.lifecycle_status === "in_progress") {
    return t("manager.attendance.lifecycle.inProgress");
  }

  if (managedClass.lifecycle_status === "completed") {
    return t("manager.attendance.lifecycle.completed");
  }

  if (managedClass.temporal_status !== "upcoming") {
    return t(`classes.temporalStatus.${managedClass.temporal_status}`);
  }

  return t(`manager.classStatus.${managedClass.status}`);
}

function getAttendanceAction(
  managedClass: ManagedClass,
  canManageAttendance: boolean,
) {
  if (!canManageAttendance || managedClass.status !== "published") return null;
  if (managedClass.lifecycle_status === "in_progress") return "manage";
  if (managedClass.lifecycle_status === "completed") return "report";
  if (
    managedClass.lifecycle_status === "created" &&
    managedClass.temporal_status !== "ended" &&
    managedClass.temporal_status !== "cancelled" &&
    managedClass.read_only_reason !== "ended"
  ) {
    return "start";
  }

  return null;
}

function AttendanceSurfaceDialog({
  client,
  managedClass,
  canManageAttendance,
  canManageRegistrations,
  onClose,
  onClassChanged,
}: {
  client: ClassKitClient | null;
  managedClass: ManagedClass | null;
  canManageAttendance: boolean;
  canManageRegistrations: boolean;
  onClose: () => void;
  onClassChanged: () => void | Promise<void>;
}) {
  const { t } = useTranslation();

  if (!managedClass) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-black/50 p-0 md:place-items-center md:p-6"
      onClick={onClose}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`${t("manager.attendance.surfaceEyebrow")}: ${managedClass.name}`}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-[1.4rem] border border-blush/24 bg-background p-5 text-foreground shadow-soft md:max-w-xl md:rounded-[1.4rem] md:bg-card/95"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-serif text-xs uppercase tracking-[0.25em] text-foreground/48">
              {t("manager.attendance.surfaceEyebrow")}
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
        <ClassAttendanceForm
          client={client}
          managedClass={managedClass}
          canManageAttendance={canManageAttendance}
          canManageRegistrations={canManageRegistrations}
          className="mt-5"
          onClassChanged={onClassChanged}
        />
      </aside>
    </div>
  );
}

export function ClassManagementTab({
  canManageClasses,
  canManageRegistrations,
  canManageAttendance,
}: ClassManagementTabProps) {
  const { t } = useTranslation();
  const [formSurface, setFormSurface] = useState<FormSurface>(null);
  const [attendanceSurface, setAttendanceSurface] =
    useState<AttendanceSurface>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [signupLinkBusyKey, setSignupLinkBusyKey] = useState<string | null>(null);
  const [signupLinkNotice, setSignupLinkNotice] = useState<string | null>(null);
  const classDetailFocusReturnRef = useRef<HTMLElement | null>(null);
  const attendanceFocusReturnRef = useRef<HTMLElement | null>(null);
  const formFocusReturnRef = useRef<HTMLElement | null>(null);
  const cancelFocusReturnRef = useRef<HTMLElement | null>(null);
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
  const attendanceClass =
    attendanceSurface?.classId
      ? state.classes.find(
          (managedClass) => managedClass.id === attendanceSurface.classId,
        ) ?? null
      : null;
  const classById = useMemo(
    () =>
      new Map(state.classes.map((managedClass) => [managedClass.id, managedClass])),
    [state.classes],
  );
  const classViewGroups = useMemo<ClassViewDateGroup[]>(
    () =>
      state.classesGroupedByDate.map((group) => ({
        dateKey: group.dateKey,
        label: group.label,
        items: group.classes.map((managedClass) => ({
          id: managedClass.id,
          name: managedClass.name,
          description: managedClass.description,
          category: managedClass.category,
          startsAt: managedClass.starts_at,
          endsAt: managedClass.ends_at,
          location: managedClass.location,
          capacity: managedClass.capacity,
          registeredUsersCount: managedClass.registeredUsersCount,
          pendingRegistrationCount: managedClass.pendingRegistrationCount,
          registrationOpen: managedClass.registration_open,
          temporalStatus: managedClass.temporal_status,
          lifecycleStatus: managedClass.lifecycle_status,
          statusLabel: getManagerStatusLabel(managedClass, t),
          capacityLabel: t("manager.classCard.capacity", {
            count: managedClass.capacity,
            registered: managedClass.registeredUsersCount ?? 0,
          }),
        })),
      })),
    [state.classesGroupedByDate, t],
  );
  const classViewItems = useMemo(
    () => classViewGroups.flatMap((group) => group.items),
    [classViewGroups],
  );

  function selectManagedClass(classId: string) {
    classDetailFocusReturnRef.current = captureActiveElement();
    actions.selectClass(classId);
  }

  function closeManagedClassDetail() {
    actions.clearSelection();
    restoreFocus(classDetailFocusReturnRef.current);
  }

  function openCreateForm() {
    formFocusReturnRef.current = captureActiveElement();
    setFormSurface({ mode: "create" });
  }

  function closeFormSurface() {
    setFormSurface(null);
    restoreFocus(formFocusReturnRef.current);
  }

  function openAttendanceSurface(classId: string) {
    attendanceFocusReturnRef.current = captureActiveElement();
    setAttendanceSurface({ classId });
  }

  function closeAttendanceSurface() {
    setAttendanceSurface(null);
    restoreFocus(attendanceFocusReturnRef.current);
  }

  function openCancelDialog() {
    cancelFocusReturnRef.current = captureActiveElement();
    setCancelOpen(true);
  }

  function closeCancelDialog() {
    setCancelOpen(false);
    restoreFocus(cancelFocusReturnRef.current);
  }

  async function copySignupLink(slug: string) {
    await navigator.clipboard.writeText(getSignupLinkUrl(slug));
    setSignupLinkNotice(t("manager.signupLinks.copied"));
  }

  async function createClassSignupLink(classId: string) {
    if (!client || !canManageClasses) {
      setSignupLinkNotice(t("manager.signupLinks.unavailable"));
      return;
    }

    setSignupLinkBusyKey(`class:${classId}`);
    setSignupLinkNotice(null);

    try {
      const result = await client.management.signupLinks.create({
        targetType: "class",
        classId,
      });
      await copySignupLink(result.link.slug);
    } catch (error) {
      setSignupLinkNotice(
        error instanceof Error ? error.message : t("manager.signupLinks.failed"),
      );
    } finally {
      setSignupLinkBusyKey(null);
    }
  }

  async function createRangeSignupLink() {
    if (!client || !canManageClasses) {
      setSignupLinkNotice(t("manager.signupLinks.unavailable"));
      return;
    }

    setSignupLinkBusyKey("range");
    setSignupLinkNotice(null);

    try {
      const result = await client.management.signupLinks.create({
        targetType: "filter",
        filters: getRangeSignupFilters(state.visibleRange),
      });
      await copySignupLink(result.link.slug);
    } catch (error) {
      setSignupLinkNotice(
        error instanceof Error ? error.message : t("manager.signupLinks.failed"),
      );
    } finally {
      setSignupLinkBusyKey(null);
    }
  }

  const renderManagerClassActions = (item: ClassViewItem) => {
    const managedClass = classById.get(item.id);
    if (!managedClass) return null;

    const canCreateSignupLink = state.canManageClasses;
    const canPublish =
      state.canManageClasses &&
      !managedClass.read_only &&
      managedClass.status === "draft";
    const attendanceAction = getAttendanceAction(
      managedClass,
      canManageAttendance,
    );

    if (!canPublish && !attendanceAction && !canCreateSignupLink) return null;

    return (
      <>
        {canCreateSignupLink && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-full"
            disabled={signupLinkBusyKey !== null}
            onClick={() => void createClassSignupLink(item.id)}
          >
            {signupLinkBusyKey === `class:${item.id}` ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Link2 className="size-4" aria-hidden="true" />
            )}
            {t("manager.signupLinks.classAction")}
          </Button>
        )}
        {canPublish && (
          <Button
            type="button"
            size="sm"
            className="rounded-full"
            disabled={state.mutationStatus !== "idle"}
            onClick={() => actions.publishClass(item.id)}
          >
            <Send className="size-4" aria-hidden="true" />
            {t("manager.classActions.publish")}
          </Button>
        )}
        {attendanceAction && (
          <Button
            type="button"
            size="sm"
            className="rounded-full"
            variant={attendanceAction === "start" ? "default" : "outline"}
            onClick={() => openAttendanceSurface(item.id)}
          >
            {attendanceAction === "start" && (
              <Play className="size-4" aria-hidden="true" />
            )}
            {attendanceAction === "manage" && (
              <CheckCircle2 className="size-4" aria-hidden="true" />
            )}
            {attendanceAction === "report" && (
              <FileText className="size-4" aria-hidden="true" />
            )}
            {t(`manager.attendance.cardAction.${attendanceAction}`)}
          </Button>
        )}
      </>
    );
  };
  const listView = (
    <ClassListView
      groups={classViewGroups}
      selectedClassId={state.selectedClassId}
      selectLabel={t("manager.classCard.select")}
      onSelectClass={selectManagedClass}
      renderCardActions={renderManagerClassActions}
    />
  );

  return (
    <section className="rounded-[1.4rem] border border-blush/24 bg-card/78 p-4 shadow-soft sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-1 grid size-9 shrink-0 place-items-center rounded-full bg-blush-strong text-background">
            <CalendarPlus className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-serif text-[0.68rem] uppercase tracking-[0.25em] text-foreground/48">
              {t("manager.tabs.classes")}
            </p>
            <h2 className="mt-1 font-serif text-3xl text-foreground sm:text-4xl">
              {t("manager.classes.title")}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-foreground/68">
              {canManageClasses
                ? t("manager.classes.body")
                : t("manager.classes.noAccessBody")}
            </p>
          </div>
        </div>
        {canManageClasses && (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-full sm:w-auto"
              disabled={signupLinkBusyKey !== null}
              onClick={() => void createRangeSignupLink()}
            >
              {signupLinkBusyKey === "range" ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Link2 className="size-4" aria-hidden="true" />
              )}
              {t("manager.signupLinks.rangeAction")}
            </Button>
            <Button
              type="button"
              className="w-full rounded-full sm:w-auto"
              onClick={openCreateForm}
            >
              <CalendarPlus className="size-4" aria-hidden="true" />
              {t("manager.classActions.create")}
            </Button>
          </div>
        )}
      </div>

      {canManageClasses ? (
        <div className="mt-4 flex flex-col gap-4">
          <ClassRangeToolbar
            rangeScope={state.rangeScope}
            customRange={state.customRange}
            visibleRangeLabel={state.visibleRangeLabel}
            viewMode={state.viewMode}
            isRefreshing={state.loadStatus === "loading"}
            labelPrefix="manager"
            onScopeChange={actions.setRangeScope}
            onCustomRangeChange={actions.setCustomRange}
            onPrevious={actions.goToPreviousRange}
            onNext={actions.goToNextRange}
            onToday={actions.goToToday}
            onRefresh={() => void actions.refreshVisibleRange()}
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

          {signupLinkNotice && (
            <p className="rounded-xl border border-blush/24 bg-background/46 p-3 text-sm leading-6 text-foreground/68">
              {signupLinkNotice}
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
                    items={classViewItems}
                    selectedClassId={state.selectedClassId}
                    labelPrefix="manager"
                    selectLabel={t("manager.classCard.select")}
                    onSelectClass={selectManagedClass}
                    renderItemActions={renderManagerClassActions}
                  />
                ) : (
                  listView
                )}
              </div>
            </>
          )}

          <ClassDetailPanel
            client={client}
            managedClass={state.selectedClass}
            canManageClasses={state.canManageClasses}
            canManageRegistrations={canManageRegistrations}
            canManageAttendance={canManageAttendance}
            onClose={closeManagedClassDetail}
            onEdit={() => {
              if (!state.selectedClass) return;
              formFocusReturnRef.current =
                classDetailFocusReturnRef.current ?? captureActiveElement();
              setFormSurface({ mode: "edit", classId: state.selectedClass.id });
              actions.clearSelection();
            }}
            onCancel={openCancelDialog}
            onCreateSignupLink={(classId) => void createClassSignupLink(classId)}
            onRegistrationsChanged={async () => {
              await actions.refreshVisibleRange({
                preserveExistingOnFailure: true,
                silent: true,
              });
            }}
            onClassChanged={async () => {
              await actions.refreshVisibleRange({
                preserveExistingOnFailure: true,
                silent: true,
              });
            }}
            signupLinkBusy={
              state.selectedClass
                ? signupLinkBusyKey === `class:${state.selectedClass.id}`
                : false
            }
            signupLinkNotice={signupLinkNotice}
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
            onClose={closeFormSurface}
            onCreate={actions.createClass}
            onUpdate={actions.updateClass}
          />

          <ClassCancelDialog
            open={cancelOpen}
            managedClass={state.selectedClass}
            submitting={state.mutationStatus === "cancelling"}
            errorMessage={state.operationError}
            onClose={closeCancelDialog}
            onConfirm={actions.cancelClass}
          />

          <AttendanceSurfaceDialog
            client={client}
            managedClass={attendanceClass}
            canManageAttendance={canManageAttendance}
            canManageRegistrations={canManageRegistrations}
            onClose={closeAttendanceSurface}
            onClassChanged={async () => {
              await actions.refreshVisibleRange({
                preserveExistingOnFailure: true,
                silent: true,
              });
            }}
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

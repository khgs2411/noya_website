import type {
  AttendanceStatus,
  ClassKitClient,
  ClassParticipant,
  ManagedClass,
  ManagementRegistrationSummary,
  ProductUserListItem,
} from "@class-kit/react";
import {
  CheckCircle2,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  UserCheck,
  XCircle,
} from "lucide-react";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  getUserDisplayName,
  getUserSupportingEmail,
} from "@/features/users/user-labels";
import { cn } from "@/lib/utils";

type LoadStatus = "idle" | "loading" | "loaded" | "error";
type MutationState = {
  starting: boolean;
  completing: boolean;
  addingWalkIn: boolean;
  addingTrial: boolean;
  updatingParticipants: Record<string, AttendanceStatus>;
};

type ClassAttendanceFormProps = {
  client: ClassKitClient | null;
  managedClass: ManagedClass;
  canManageAttendance: boolean;
  canManageRegistrations: boolean;
  className?: string;
  onClassChanged: () => void | Promise<void>;
};

function getUserLabel(user?: ProductUserListItem | null) {
  return getUserDisplayName(user);
}

function getRegistrationLabel(registration?: ManagementRegistrationSummary) {
  return getUserDisplayName(registration?.user);
}

function getAttendanceErrorMessage(
  error: unknown,
  t: (key: string) => string,
  fallbackKey: string,
) {
  const message = error instanceof Error ? error.message : "";

  if (message === "walk_in_has_live_registration") {
    return t("manager.attendance.errors.walkInHasLiveRegistration");
  }

  if (message === "participant_already_exists") {
    return t("manager.attendance.errors.participantAlreadyExists");
  }

  if (message === "class_lifecycle_not_startable") {
    return t("manager.attendance.errors.classNotStartable");
  }

  if (message === "class_lifecycle_not_completable") {
    return t("manager.attendance.errors.classNotCompletable");
  }

  return t(fallbackKey);
}

function ParticipantRow({
  participant,
  label,
  disabled,
  updatingStatus,
  onUpdate,
}: {
  participant: ClassParticipant;
  label: string;
  disabled: boolean;
  updatingStatus?: AttendanceStatus;
  onUpdate: (participantId: string, status: AttendanceStatus) => void;
}) {
  const { t } = useTranslation();
  const present = participant.attendance_status === "present";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-blush/24 bg-background/46 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="break-words font-semibold text-foreground">
          {label || t("manager.attendance.unknownParticipant")}
        </p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
          {t(`manager.attendance.participantKind.${participant.participant_kind}`)}
          {" · "}
          {t(`manager.attendance.status.${participant.attendance_status}`)}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          className="rounded-full"
          variant={present ? "default" : "outline"}
          disabled={disabled}
          onClick={() => onUpdate(participant.id, "present")}
        >
          {updatingStatus === "present" ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="size-4" aria-hidden="true" />
          )}
          {t("manager.attendance.markPresent")}
        </Button>
        <Button
          type="button"
          size="sm"
          className="rounded-full"
          variant={!present ? "default" : "outline"}
          disabled={disabled}
          onClick={() => onUpdate(participant.id, "absent")}
        >
          {updatingStatus === "absent" ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <XCircle className="size-4" aria-hidden="true" />
          )}
          {t("manager.attendance.markAbsent")}
        </Button>
      </div>
    </div>
  );
}

export function ClassAttendanceForm({
  client,
  managedClass,
  canManageAttendance,
  canManageRegistrations,
  className,
  onClassChanged,
}: ClassAttendanceFormProps) {
  const { t } = useTranslation();
  const [lifecycleOverride, setLifecycleOverride] = useState<{
    classId: string;
    lifecycleStatus: ManagedClass["lifecycle_status"];
  } | null>(null);
  const [participants, setParticipants] = useState<ClassParticipant[]>([]);
  const [registered, setRegistered] = useState<ManagementRegistrationSummary[]>([]);
  const [users, setUsers] = useState<ProductUserListItem[]>([]);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mutationState, setMutationState] = useState<MutationState>({
    starting: false,
    completing: false,
    addingWalkIn: false,
    addingTrial: false,
    updatingParticipants: {},
  });
  const [walkInUserId, setWalkInUserId] = useState("");
  const [trialName, setTrialName] = useState("");
  const [trialContact, setTrialContact] = useState("");

  const userById = useMemo(
    () => new Map(users.map((user) => [user.user_id, user])),
    [users],
  );
  const registrationById = useMemo(
    () => new Map(registered.map((registration) => [registration.id, registration])),
    [registered],
  );
  const registeredParticipants = participants.filter(
    (participant) => participant.participant_kind === "registered",
  );
  const walkInParticipants = participants.filter(
    (participant) => participant.participant_kind === "walk_in",
  );
  const trialParticipants = participants.filter(
    (participant) => participant.participant_kind === "trial",
  );
  const presentCount = participants.filter(
    (participant) => participant.attendance_status === "present",
  ).length;
  const absentCount = participants.filter(
    (participant) => participant.attendance_status === "absent",
  ).length;
  const lifecycleStatus =
    lifecycleOverride?.classId === managedClass.id
      ? lifecycleOverride.lifecycleStatus
      : managedClass.lifecycle_status;
  const isCompleted = lifecycleStatus === "completed";
  const isCancelled = lifecycleStatus === "cancelled";
  const isInProgress = lifecycleStatus === "in_progress";
  const isEnded =
    managedClass.temporal_status === "ended" ||
    managedClass.read_only_reason === "ended";
  const attendanceLifecycleBusy =
    mutationState.starting || mutationState.completing;
  const canStartAttendance =
    canManageAttendance &&
    !attendanceLifecycleBusy &&
    lifecycleStatus === "created" &&
    !isEnded &&
    !isCancelled;
  const canEditAttendance =
    canManageAttendance &&
    !attendanceLifecycleBusy &&
    isInProgress &&
    !isCompleted &&
    !isCancelled;

  const getParticipantLabel = useCallback(
    (participant: ClassParticipant) => {
      if (participant.participant_kind === "trial") {
        return participant.trial_name ?? participant.trial_contact ?? "";
      }

      const registration = participant.registration_id
        ? registrationById.get(participant.registration_id)
        : undefined;
      const registrationLabel = getRegistrationLabel(registration);
      if (registrationLabel) return registrationLabel;

      return getUserLabel(
        participant.user_id ? userById.get(participant.user_id) : null,
      );
    },
    [registrationById, userById],
  );

  const loadAttendance = useCallback(async (options?: { silent?: boolean }) => {
    if (!client || !canManageAttendance) {
      setParticipants([]);
      setRegistered([]);
      setUsers([]);
      setLoadStatus("idle");
      setErrorMessage(null);
      return;
    }

    if (!options?.silent) {
      setLoadStatus("loading");
      setErrorMessage(null);
    }

    try {
      const [attendanceResult, usersResult, registeredResult] = await Promise.all([
        client.management.attendance.listForClass(managedClass.id),
        client.management.users.list().catch(() => ({ users: [] })),
        canManageRegistrations
          ? client.management.registrations
              .listRegistered({ classId: managedClass.id })
              .catch(() => ({ registrations: [] }))
          : Promise.resolve({ registrations: [] }),
      ]);

      setParticipants(attendanceResult.participants);
      setUsers(usersResult.users);
      setRegistered(registeredResult.registrations);
      setLoadStatus("loaded");
    } catch (error) {
      if (options?.silent) return;

      setErrorMessage(
        getAttendanceErrorMessage(error, t, "manager.attendance.errorBody"),
      );
      setLoadStatus("error");
    }
  }, [
    canManageAttendance,
    canManageRegistrations,
    client,
    managedClass.id,
    t,
  ]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadAttendance();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadAttendance]);

  function reconcileAttendance() {
    void loadAttendance({ silent: true });
    void Promise.resolve(onClassChanged()).catch(() => {
      // The local attendance mutation succeeded; broader class refresh can retry later.
    });
  }

  async function startAttendance() {
    if (!client || !canStartAttendance) return;

    setMutationState((current) => ({ ...current, starting: true }));
    setErrorMessage(null);

    try {
      const result = await client.management.attendance.start(managedClass.id, {
        defaultAttendanceStatus: "present",
      });
      setLifecycleOverride({
        classId: result.class.id,
        lifecycleStatus: result.class.lifecycle_status,
      });
      setLoadStatus((current) => (current === "idle" ? "loaded" : current));
      reconcileAttendance();
    } catch (error) {
      setErrorMessage(
        getAttendanceErrorMessage(error, t, "manager.attendance.actionFailed"),
      );
    } finally {
      setMutationState((current) => ({ ...current, starting: false }));
    }
  }

  async function updateParticipant(
    participantId: string,
    attendanceStatus: AttendanceStatus,
  ) {
    if (
      !client ||
      !canEditAttendance ||
      mutationState.updatingParticipants[participantId]
    ) {
      return;
    }

    setMutationState((current) => ({
      ...current,
      updatingParticipants: {
        ...current.updatingParticipants,
        [participantId]: attendanceStatus,
      },
    }));
    setErrorMessage(null);

    try {
      const result = await client.management.attendance.updateParticipant(
        participantId,
        {
          participantId,
          attendanceStatus,
        },
      );

      setParticipants((current) =>
        current.map((participant) =>
          participant.id === result.participant.id ? result.participant : participant,
        ),
      );
      void loadAttendance({ silent: true });
    } catch (error) {
      setErrorMessage(
        getAttendanceErrorMessage(error, t, "manager.attendance.actionFailed"),
      );
    } finally {
      setMutationState((current) => {
        const updatingParticipants = { ...current.updatingParticipants };
        delete updatingParticipants[participantId];
        return { ...current, updatingParticipants };
      });
    }
  }

  async function addWalkIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client || !canEditAttendance || !walkInUserId || mutationState.addingWalkIn) {
      return;
    }

    setMutationState((current) => ({ ...current, addingWalkIn: true }));
    setErrorMessage(null);

    try {
      const result = await client.management.attendance.addWalkIn(managedClass.id, {
        userId: walkInUserId,
        attendanceStatus: "present",
      });
      setParticipants((current) => [...current, result.participant]);
      setWalkInUserId("");
      void loadAttendance({ silent: true });
    } catch (error) {
      setErrorMessage(
        getAttendanceErrorMessage(error, t, "manager.attendance.actionFailed"),
      );
    } finally {
      setMutationState((current) => ({ ...current, addingWalkIn: false }));
    }
  }

  async function addTrial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = trialName.trim();
    if (!client || !canEditAttendance || !name || mutationState.addingTrial) {
      return;
    }

    setMutationState((current) => ({ ...current, addingTrial: true }));
    setErrorMessage(null);

    try {
      const result = await client.management.attendance.addTrial(managedClass.id, {
        name,
        contact: trialContact.trim() || null,
      });
      setParticipants((current) => [...current, result.participant]);
      setTrialName("");
      setTrialContact("");
      void loadAttendance({ silent: true });
    } catch (error) {
      setErrorMessage(
        getAttendanceErrorMessage(error, t, "manager.attendance.actionFailed"),
      );
    } finally {
      setMutationState((current) => ({ ...current, addingTrial: false }));
    }
  }

  async function completeAttendance() {
    if (!client || !canEditAttendance || mutationState.completing) return;

    setMutationState((current) => ({ ...current, completing: true }));
    setErrorMessage(null);

    try {
      const result = await client.management.attendance.complete(managedClass.id);
      setLifecycleOverride({
        classId: result.class.id,
        lifecycleStatus: result.class.lifecycle_status,
      });
      reconcileAttendance();
    } catch (error) {
      setErrorMessage(
        getAttendanceErrorMessage(error, t, "manager.attendance.actionFailed"),
      );
    } finally {
      setMutationState((current) => ({ ...current, completing: false }));
    }
  }

  if (!canManageAttendance) return null;

  return (
    <section
      className={cn(
        "mt-5 rounded-[1.2rem] border border-blush/24 bg-card/50 p-3",
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="font-serif text-xl text-foreground">
            {t("manager.attendance.title")}
          </h3>
          <p className="mt-1 text-sm leading-6 text-foreground/68">
            {isCompleted
              ? t("manager.attendance.reportBody")
              : t("manager.attendance.body")}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          disabled={loadStatus === "loading"}
          onClick={() => void loadAttendance()}
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          {t("manager.attendance.refresh")}
        </Button>
      </div>

      {loadStatus === "loading" && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-blush/24 bg-background/46 p-3 text-sm text-foreground/68">
          <Loader2 className="size-4 animate-spin text-blush-strong" aria-hidden="true" />
          {t("manager.attendance.loading")}
        </div>
      )}

      {errorMessage && (
        <p className="mt-4 rounded-xl border border-blush/24 bg-background/46 p-3 text-sm leading-6 text-blush-strong">
          {errorMessage}
        </p>
      )}

      {canStartAttendance && (
        <Button
          type="button"
          className="mt-4 rounded-full"
          disabled={mutationState.starting}
          onClick={startAttendance}
        >
          {mutationState.starting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Play className="size-4" aria-hidden="true" />
          )}
          {t("manager.attendance.start")}
        </Button>
      )}

      {loadStatus === "loaded" && (
        <>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-blush/24 bg-background/46 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
                {t("manager.attendance.total")}
              </p>
              <p className="mt-1 font-serif text-2xl text-foreground">
                {participants.length}
              </p>
            </div>
            <div className="rounded-xl border border-blush/24 bg-background/46 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
                {t("manager.attendance.present")}
              </p>
              <p className="mt-1 font-serif text-2xl text-foreground">
                {presentCount}
              </p>
            </div>
            <div className="rounded-xl border border-blush/24 bg-background/46 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
                {t("manager.attendance.absent")}
              </p>
              <p className="mt-1 font-serif text-2xl text-foreground">
                {absentCount}
              </p>
            </div>
          </div>

          {participants.length === 0 ? (
            <p className="mt-4 rounded-xl border border-blush/24 bg-background/46 p-3 text-sm leading-6 text-foreground/68">
              {t("manager.attendance.empty")}
            </p>
          ) : (
            <div className="mt-4 grid gap-4">
              {([
                ["registered", registeredParticipants],
                ["walk_in", walkInParticipants],
                ["trial", trialParticipants],
              ] as Array<[string, ClassParticipant[]]>).map(([kind, items]) =>
                items.length > 0 ? (
                  <div key={kind} className="grid gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
                      {t(`manager.attendance.participantKind.${kind}`)}
                    </p>
                    {items.map((participant) => (
                      <ParticipantRow
                        key={participant.id}
                        participant={participant}
                        label={getParticipantLabel(participant)}
                        disabled={
                          !canEditAttendance ||
                          Boolean(
                            mutationState.updatingParticipants[participant.id],
                          )
                        }
                        updatingStatus={
                          mutationState.updatingParticipants[participant.id]
                        }
                        onUpdate={updateParticipant}
                      />
                    ))}
                  </div>
                ) : null,
              )}
            </div>
          )}

          {isInProgress && (
            <div className="mt-4 grid gap-3 border-t border-blush/24 pt-4">
              <form className="grid gap-2" onSubmit={addWalkIn}>
                <label className="grid gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
                    {t("manager.attendance.chooseWalkIn")}
                  </span>
                  <select
                    className="min-h-11 min-w-0 rounded-xl border border-blush/24 bg-background/70 px-3 text-foreground outline-none focus:border-blush-strong"
                    value={walkInUserId}
                    onChange={(event) => setWalkInUserId(event.target.value)}
                  >
                    <option value="">
                      {t("manager.attendance.chooseWalkIn")}
                    </option>
                    {users.map((user) => (
                      <option key={user.user_id} value={user.user_id}>
                        {[
                          getUserLabel(user),
                          getUserSupportingEmail(user),
                        ].filter(Boolean).join(" · ")}
                      </option>
                    ))}
                  </select>
                </label>
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full rounded-full"
                  disabled={
                    !canEditAttendance ||
                    !walkInUserId ||
                    mutationState.addingWalkIn
                  }
                >
                  {mutationState.addingWalkIn ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Plus className="size-4" aria-hidden="true" />
                  )}
                  {t("manager.attendance.addWalkIn")}
                </Button>
              </form>

              <form className="grid gap-2" onSubmit={addTrial}>
                <label className="grid gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
                    {t("manager.attendance.trialName")}
                  </span>
                  <input
                    className="min-h-11 min-w-0 rounded-xl border border-blush/24 bg-background/70 px-3 text-foreground outline-none focus:border-blush-strong"
                    value={trialName}
                    onChange={(event) => setTrialName(event.target.value)}
                    placeholder={t("manager.attendance.trialName")}
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
                    {t("manager.attendance.trialContact")}
                  </span>
                  <input
                    className="min-h-11 min-w-0 rounded-xl border border-blush/24 bg-background/70 px-3 text-foreground outline-none focus:border-blush-strong"
                    value={trialContact}
                    onChange={(event) => setTrialContact(event.target.value)}
                    placeholder={t("manager.attendance.trialContact")}
                  />
                </label>
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full rounded-full"
                  disabled={
                    !canEditAttendance ||
                    !trialName.trim() ||
                    mutationState.addingTrial
                  }
                >
                  {mutationState.addingTrial ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <UserCheck className="size-4" aria-hidden="true" />
                  )}
                  {t("manager.attendance.addTrial")}
                </Button>
              </form>
            </div>
          )}

          {isInProgress && (
            <Button
              type="button"
              className="mt-4 rounded-full"
              disabled={!canEditAttendance || mutationState.completing}
              onClick={completeAttendance}
            >
              {mutationState.completing ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="size-4" aria-hidden="true" />
              )}
              {t("manager.attendance.complete")}
            </Button>
          )}
        </>
      )}
    </section>
  );
}

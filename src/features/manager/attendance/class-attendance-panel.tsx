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

type LoadStatus = "idle" | "loading" | "loaded" | "error";
type MutationStatus =
  | "idle"
  | "starting"
  | "updating"
  | "addingWalkIn"
  | "addingTrial"
  | "completing";

type ClassAttendancePanelProps = {
  client: ClassKitClient | null;
  managedClass: ManagedClass;
  canManageAttendance: boolean;
  canManageRegistrations: boolean;
  onClassChanged: () => void | Promise<void>;
};

function getUserLabel(user?: ProductUserListItem | null) {
  return user?.display_name ?? user?.email ?? user?.user_id ?? "";
}

function getRegistrationLabel(registration?: ManagementRegistrationSummary) {
  return (
    registration?.user.displayName ??
    registration?.user.email ??
    registration?.user.id ??
    ""
  );
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
  onUpdate,
}: {
  participant: ClassParticipant;
  label: string;
  disabled: boolean;
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
          <CheckCircle2 className="size-4" aria-hidden="true" />
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
          <XCircle className="size-4" aria-hidden="true" />
          {t("manager.attendance.markAbsent")}
        </Button>
      </div>
    </div>
  );
}

export function ClassAttendancePanel({
  client,
  managedClass,
  canManageAttendance,
  canManageRegistrations,
  onClassChanged,
}: ClassAttendancePanelProps) {
  const { t } = useTranslation();
  const [participants, setParticipants] = useState<ClassParticipant[]>([]);
  const [registered, setRegistered] = useState<ManagementRegistrationSummary[]>([]);
  const [users, setUsers] = useState<ProductUserListItem[]>([]);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mutationStatus, setMutationStatus] = useState<MutationStatus>("idle");
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
  const isCompleted = managedClass.lifecycle_status === "completed";
  const isCancelled = managedClass.lifecycle_status === "cancelled";
  const isInProgress = managedClass.lifecycle_status === "in_progress";
  const isEnded =
    managedClass.temporal_status === "ended" ||
    managedClass.read_only_reason === "ended";
  const canStartAttendance =
    canManageAttendance &&
    mutationStatus === "idle" &&
    managedClass.lifecycle_status === "created" &&
    !isEnded &&
    !isCancelled;
  const canEditAttendance =
    canManageAttendance &&
    mutationStatus === "idle" &&
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

  const loadAttendance = useCallback(async () => {
    if (!client || !canManageAttendance) {
      setParticipants([]);
      setRegistered([]);
      setUsers([]);
      setLoadStatus("idle");
      setErrorMessage(null);
      return;
    }

    setLoadStatus("loading");
    setErrorMessage(null);

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

  async function runMutation(
    status: MutationStatus,
    command: () => Promise<unknown>,
    options: { refreshClass?: boolean } = {},
  ) {
    if (!client || !canManageAttendance || mutationStatus !== "idle") return;

    setMutationStatus(status);
    setErrorMessage(null);

    try {
      await command();
      await loadAttendance();
      if (options.refreshClass) await onClassChanged();
      return true;
    } catch (error) {
      setErrorMessage(
        getAttendanceErrorMessage(error, t, "manager.attendance.actionFailed"),
      );
      return false;
    } finally {
      setMutationStatus("idle");
    }
  }

  function startAttendance() {
    if (!canStartAttendance) return;

    void runMutation(
      "starting",
      () =>
        client!.management.attendance.start(managedClass.id, {
          defaultAttendanceStatus: "absent",
        }),
      { refreshClass: true },
    );
  }

  function updateParticipant(participantId: string, attendanceStatus: AttendanceStatus) {
    void runMutation("updating", () =>
      client!.management.attendance.updateParticipant(participantId, {
        participantId,
        attendanceStatus,
      }),
    );
  }

  function addWalkIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!walkInUserId) return;

    void runMutation(
      "addingWalkIn",
      () =>
        client!.management.attendance.addWalkIn(managedClass.id, {
          userId: walkInUserId,
          attendanceStatus: "present",
        }),
    ).then((ok) => {
      if (ok) setWalkInUserId("");
    });
  }

  function addTrial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = trialName.trim();
    if (!name) return;

    void runMutation(
      "addingTrial",
      () =>
        client!.management.attendance.addTrial(managedClass.id, {
          name,
          contact: trialContact.trim() || null,
        }),
    ).then((ok) => {
      if (!ok) return;
      setTrialName("");
      setTrialContact("");
    });
  }

  function completeAttendance() {
    void runMutation(
      "completing",
      () => client!.management.attendance.complete(managedClass.id),
      { refreshClass: true },
    );
  }

  if (!canManageAttendance) return null;

  return (
    <section className="mt-5 rounded-[1.2rem] border border-blush/24 bg-card/50 p-3">
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
          onClick={startAttendance}
        >
          <Play className="size-4" aria-hidden="true" />
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
                        disabled={!canEditAttendance}
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
                <select
                  className="min-h-11 min-w-0 rounded-xl border border-blush/24 bg-background/70 px-3 text-foreground outline-none focus:border-blush-strong"
                  value={walkInUserId}
                  onChange={(event) => setWalkInUserId(event.target.value)}
                >
                  <option value="">{t("manager.attendance.chooseWalkIn")}</option>
                  {users.map((user) => (
                    <option key={user.user_id} value={user.user_id}>
                      {getUserLabel(user)}
                    </option>
                  ))}
                </select>
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full rounded-full"
                  disabled={!canEditAttendance || !walkInUserId}
                >
                  <Plus className="size-4" aria-hidden="true" />
                  {t("manager.attendance.addWalkIn")}
                </Button>
              </form>

              <form className="grid gap-2" onSubmit={addTrial}>
                <input
                  className="min-h-11 min-w-0 rounded-xl border border-blush/24 bg-background/70 px-3 text-foreground outline-none focus:border-blush-strong"
                  value={trialName}
                  onChange={(event) => setTrialName(event.target.value)}
                  placeholder={t("manager.attendance.trialName")}
                />
                <input
                  className="min-h-11 min-w-0 rounded-xl border border-blush/24 bg-background/70 px-3 text-foreground outline-none focus:border-blush-strong"
                  value={trialContact}
                  onChange={(event) => setTrialContact(event.target.value)}
                  placeholder={t("manager.attendance.trialContact")}
                />
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full rounded-full"
                  disabled={!canEditAttendance || !trialName.trim()}
                >
                  <UserCheck className="size-4" aria-hidden="true" />
                  {t("manager.attendance.addTrial")}
                </Button>
              </form>
            </div>
          )}

          {isInProgress && (
            <Button
              type="button"
              className="mt-4 rounded-full"
              disabled={mutationStatus !== "idle"}
              onClick={completeAttendance}
            >
              <CheckCircle2 className="size-4" aria-hidden="true" />
              {t("manager.attendance.complete")}
            </Button>
          )}
        </>
      )}
    </section>
  );
}

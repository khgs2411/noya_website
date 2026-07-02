import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  ClassKitClient,
  CreateScheduleInput,
  Schedule,
  ScheduleGenerationResult,
  SchedulePreviewOccurrence,
  UpdateScheduleInput,
} from "@class-kit/react";
import { useTranslation } from "react-i18next";

import { sortSchedules } from "@/features/manager/schedules/schedule-utils";

type LoadStatus = "idle" | "loading" | "loaded" | "error";
type MutationStatus =
  | "idle"
  | "creating"
  | "updating"
  | "previewing"
  | "generating"
  | "pausing"
  | "archiving"
  | "skipping"
  | "unskipping";

type PreviewState = {
  scheduleId: string;
  from: string;
  through: string;
  occurrences: SchedulePreviewOccurrence[];
} | null;

type UseManagedSchedulesInput = {
  client: ClassKitClient | null;
  canManageSchedules: boolean;
};

export function useManagedSchedules({
  client,
  canManageSchedules,
}: UseManagedSchedulesInput) {
  const { t } = useTranslation();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [mutationStatus, setMutationStatus] = useState<MutationStatus>("idle");
  const [preview, setPreview] = useState<PreviewState>(null);
  const [generationResult, setGenerationResult] =
    useState<ScheduleGenerationResult | null>(null);

  const sortedSchedules = useMemo(
    () => sortSchedules(schedules),
    [schedules],
  );
  const selectedSchedule = useMemo(
    () =>
      schedules.find((schedule) => schedule.id === selectedScheduleId) ?? null,
    [schedules, selectedScheduleId],
  );

  const mergeSchedule = useCallback((schedule: Schedule) => {
    setSchedules((current) => {
      const existingIndex = current.findIndex((item) => item.id === schedule.id);
      if (existingIndex === -1) return [...current, schedule];

      return current.map((item) => (item.id === schedule.id ? schedule : item));
    });
  }, []);

  const refreshSchedules = useCallback(async () => {
    if (!client || !canManageSchedules) {
      setSchedules([]);
      setLoadStatus("idle");
      setErrorMessage(null);
      return;
    }

    setLoadStatus("loading");
    setErrorMessage(null);

    try {
      const result = await client.management.schedules.list();
      setSchedules(result.schedules);
      setLoadStatus("loaded");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t("manager.schedules.errorBody"),
      );
      setLoadStatus("error");
    }
  }, [canManageSchedules, client, t]);

  const refreshPreview = useCallback(async () => {
    if (!client || !preview) return;

    const result = await client.management.schedules.preview({
      scheduleId: preview.scheduleId,
      from: preview.from,
      through: preview.through,
    });
    setPreview({ ...preview, occurrences: result.occurrences });
  }, [client, preview]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshSchedules();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [refreshSchedules]);

  const performMutation = useCallback(
    async <T,>(
      status: MutationStatus,
      command: () => Promise<T>,
      options: { refresh?: boolean } = {},
    ) => {
      if (mutationStatus !== "idle") return { ok: false as const };

      setOperationError(null);
      setGenerationResult(null);

      if (!client || !canManageSchedules) {
        setOperationError(t("manager.scheduleActions.notAvailable"));
        return { ok: false as const };
      }

      setMutationStatus(status);

      try {
        const result = await command();
        if (options.refresh) await refreshSchedules();
        return { ok: true as const, result };
      } catch (error) {
        setOperationError(
          error instanceof Error
            ? error.message
            : t("manager.scheduleActions.actionFailed"),
        );
        return { ok: false as const };
      } finally {
        setMutationStatus("idle");
      }
    },
    [canManageSchedules, client, mutationStatus, refreshSchedules, t],
  );

  const createSchedule = useCallback(
    async (input: CreateScheduleInput) => {
      const result = await performMutation(
        "creating",
        () => client!.management.schedules.create(input),
        { refresh: true },
      );

      if (result.ok && result.result.generation) {
        setGenerationResult(result.result.generation);
      }

      return result;
    },
    [client, performMutation],
  );

  const updateSchedule = useCallback(
    async (input: UpdateScheduleInput) => {
      const result = await performMutation(
        "updating",
        () => client!.management.schedules.update(input),
        { refresh: true },
      );

      if (result.ok && result.result.generation) {
        setGenerationResult(result.result.generation);
      }

      return result;
    },
    [client, performMutation],
  );

  const previewSchedule = useCallback(
    async (scheduleId: string, from: string, through: string) => {
      const result = await performMutation("previewing", () =>
        client
          ? client.management.schedules.preview({ scheduleId, from, through })
          : Promise.resolve({ occurrences: [] }),
      );

      if (result.ok) {
        setPreview({ scheduleId, from, through, occurrences: result.result.occurrences });
      }

      return result;
    },
    [client, performMutation],
  );

  const generateSchedule = useCallback(
    async (scheduleId: string, generationCount: number) => {
      const result = await performMutation(
        "generating",
        () =>
          client
            ? client.management.schedules.generate({ scheduleId, generationCount })
            : Promise.resolve({
                created_count: 0,
                existing_count: 0,
                skipped_count: 0,
              }),
        { refresh: true },
      );

      if (result.ok) setGenerationResult(result.result);

      return result;
    },
    [client, performMutation],
  );

  const pauseSchedule = useCallback(
    async (scheduleId: string) => {
      const result = await performMutation(
        "pausing",
        () => client!.management.schedules.pause(scheduleId),
        { refresh: true },
      );

      if (result.ok) mergeSchedule(result.result.schedule);

      return result;
    },
    [client, mergeSchedule, performMutation],
  );

  const archiveSchedule = useCallback(
    async (scheduleId: string) => {
      const result = await performMutation(
        "archiving",
        () => client!.management.schedules.archive(scheduleId),
        { refresh: true },
      );

      if (result.ok) {
        mergeSchedule(result.result.schedule);
        setPreview(null);
      }

      return result;
    },
    [client, mergeSchedule, performMutation],
  );

  const skipScheduleDate = useCallback(
    async (scheduleId: string, date: string, reason?: string | null) => {
      const result = await performMutation("skipping", () =>
        client!.management.schedules.skipDate({ scheduleId, date, reason }),
      );

      if (result.ok) await refreshPreview();

      return result;
    },
    [client, performMutation, refreshPreview],
  );

  const unskipScheduleDate = useCallback(
    async (scheduleId: string, date: string) => {
      const result = await performMutation("unskipping", () =>
        client!.management.schedules.unskipDate({ scheduleId, date }),
      );

      if (result.ok) await refreshPreview();

      return result;
    },
    [client, performMutation, refreshPreview],
  );

  const selectSchedule = useCallback(
    (scheduleId: string) => {
      setSelectedScheduleId(scheduleId);

      if (!client || !canManageSchedules) return;

      void client.management.schedules
        .get(scheduleId)
        .then((result) => mergeSchedule(result.schedule))
        .catch((error) => {
          setOperationError(
            error instanceof Error
              ? error.message
              : t("manager.scheduleActions.actionFailed"),
          );
        });
    },
    [canManageSchedules, client, mergeSchedule, t],
  );

  return {
    state: {
      schedules,
      sortedSchedules,
      selectedSchedule,
      selectedScheduleId,
      loadStatus,
      errorMessage,
      operationError,
      mutationStatus,
      preview,
      generationResult,
      canManageSchedules,
    },
    actions: {
      refreshSchedules,
      selectSchedule,
      clearSelection: () => setSelectedScheduleId(null),
      clearPreview: () => setPreview(null),
      clearGenerationResult: () => setGenerationResult(null),
      createSchedule,
      updateSchedule,
      previewSchedule,
      generateSchedule,
      pauseSchedule,
      archiveSchedule,
      skipScheduleDate,
      unskipScheduleDate,
    },
  };
}

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  CancelManagedClassInput,
  ClassKitClient,
  CreateManagedClassInput,
  ManagedClass,
  UpdateManagedClassInput,
} from "@class-kit/react";
import { useTranslation } from "react-i18next";

import {
  type CustomRangeValue,
  type RangeScope,
  type ViewMode,
  getLocalRange,
  getVisibleRangeLabel,
  shiftRange,
  toDateInput,
  toVisibleRange,
} from "@/features/classes/class-range";

type LoadStatus = "idle" | "loading" | "loaded" | "error";
type MutationStatus =
  | "idle"
  | "creating"
  | "updating"
  | "publishing"
  | "drafting"
  | "cancelling";

type ReconciliationNotice =
  | { type: "moved-out-of-range"; classId: string }
  | { type: "stale-after-mutation" }
  | null;

type RefreshVisibleRangeOptions = {
  preserveExistingOnFailure?: boolean;
  silent?: boolean;
};

type UseManagedClassesInput = {
  client: ClassKitClient | null;
  canManageClasses: boolean;
};

type ClassDateGroup = {
  dateKey: string;
  label: string;
  classes: ManagedClass[];
};

function getClassDateKey(managedClass: ManagedClass) {
  return managedClass.starts_at.slice(0, 10);
}

function getManagedClassFromResult(result: unknown) {
  return result &&
    typeof result === "object" &&
    "class" in result &&
    result.class &&
    typeof result.class === "object"
    ? result.class as ManagedClass
    : null;
}

function groupClassesByDate(
  classes: ManagedClass[],
  locale: string,
): ClassDateGroup[] {
  const formatter = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  const groups = new Map<string, ManagedClass[]>();

  for (const managedClass of [...classes].sort((a, b) =>
    a.starts_at.localeCompare(b.starts_at),
  )) {
    const key = getClassDateKey(managedClass);
    groups.set(key, [...(groups.get(key) ?? []), managedClass]);
  }

  return [...groups.entries()].map(([dateKey, groupedClasses]) => ({
    dateKey,
    label: formatter.format(new Date(groupedClasses[0].starts_at)),
    classes: groupedClasses,
  }));
}

export function useManagedClasses({
  client,
  canManageClasses,
}: UseManagedClassesInput) {
  const { t, i18n } = useTranslation();
  const [rangeScope, setRangeScope] = useState<RangeScope>("week");
  const [rangeAnchorDate, setRangeAnchorDate] = useState(() => new Date());
  const [customRange, setCustomRangeState] =
    useState<CustomRangeValue | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [classes, setClasses] = useState<ManagedClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("idle");
  const loadStatusRef = useRef<LoadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [mutationStatus, setMutationStatus] =
    useState<MutationStatus>("idle");
  const [reconciliationNotice, setReconciliationNotice] =
    useState<ReconciliationNotice>(null);
  const requestIdRef = useRef(0);

  const localRange = useMemo(
    () => getLocalRange(rangeScope, rangeAnchorDate, customRange),
    [customRange, rangeAnchorDate, rangeScope],
  );
  const visibleRange = useMemo(() => toVisibleRange(localRange), [localRange]);
  const visibleRangeLabel = useMemo(
    () => getVisibleRangeLabel(localRange),
    [localRange],
  );
  const selectedClass = useMemo(
    () => classes.find((managedClass) => managedClass.id === selectedClassId) ?? null,
    [classes, selectedClassId],
  );
  const classesGroupedByDate = useMemo(
    () => groupClassesByDate(classes, i18n.language),
    [classes, i18n.language],
  );

  const setTrackedLoadStatus = useCallback((status: LoadStatus) => {
    loadStatusRef.current = status;
    setLoadStatus(status);
  }, []);

  const classIsInVisibleRange = useCallback(
    (managedClass: ManagedClass) => {
      const startsAt = new Date(managedClass.starts_at).getTime();
      return (
        startsAt >= new Date(visibleRange.start).getTime() &&
        startsAt <= new Date(visibleRange.end).getTime()
      );
    },
    [visibleRange],
  );

  const applyClassMutationResult = useCallback(
    (managedClass: ManagedClass) => {
      if (!classIsInVisibleRange(managedClass)) {
        setClasses((current) =>
          current.filter((item) => item.id !== managedClass.id),
        );
        setReconciliationNotice({
          type: "moved-out-of-range",
          classId: managedClass.id,
        });
        setSelectedClassId((current) =>
          current === managedClass.id ? null : current,
        );
        return;
      }

      setClasses((current) => {
        const existing = current.some((item) => item.id === managedClass.id);
        if (!existing) return [...current, managedClass];

        return current.map((item) =>
          item.id === managedClass.id ? managedClass : item,
        );
      });
    },
    [classIsInVisibleRange],
  );

  const reconcileSelectedClass = useCallback(
    (refreshedClasses: ManagedClass[], mutatedClassId?: string) => {
      setSelectedClassId((currentSelectedClassId) => {
        const idToKeep = mutatedClassId ?? currentSelectedClassId;
        if (!idToKeep) return currentSelectedClassId;

        const existsInRange = refreshedClasses.some(
          (managedClass) => managedClass.id === idToKeep,
        );

        if (existsInRange) {
          setReconciliationNotice(null);
          return idToKeep;
        }

        setReconciliationNotice({
          type: "moved-out-of-range",
          classId: idToKeep,
        });
        return null;
      });
    },
    [],
  );

  const refreshVisibleRange = useCallback(async (
    options: RefreshVisibleRangeOptions = {},
  ) => {
    if (!client || !canManageClasses) {
      requestIdRef.current += 1;
      setClasses([]);
      setTrackedLoadStatus("idle");
      setErrorMessage(null);
      return { ok: false as const, classes: [] as ManagedClass[] };
    }

    const preservedLoadStatus =
      loadStatusRef.current === "loading" ? "idle" : loadStatusRef.current;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    if (!options.silent) {
      setTrackedLoadStatus("loading");
      setErrorMessage(null);
    }

    try {
      const result = await client.management.classes.list({
        range: visibleRange,
        fields: ["registeredUsersCount", "pendingRegistrationCount"],
      });

      if (requestIdRef.current !== requestId) {
        if (options.preserveExistingOnFailure || options.silent) {
          setTrackedLoadStatus(preservedLoadStatus);
        }
        return { ok: false as const, classes: [] as ManagedClass[] };
      }

      setClasses(result.classes);
      setTrackedLoadStatus("loaded");
      setErrorMessage(null);
      setReconciliationNotice(null);
      return { ok: true as const, classes: result.classes };
    } catch (error) {
      if (requestIdRef.current !== requestId) {
        if (options.preserveExistingOnFailure || options.silent) {
          setTrackedLoadStatus(preservedLoadStatus);
        }
        return { ok: false as const, classes: [] as ManagedClass[] };
      }

      if (!options.silent) {
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to load classes.",
        );
      }
      if (!options.preserveExistingOnFailure && !options.silent) {
        setTrackedLoadStatus("error");
      } else {
        setTrackedLoadStatus(preservedLoadStatus);
      }
      return { ok: false as const, classes: [] as ManagedClass[] };
    }
  }, [canManageClasses, client, setTrackedLoadStatus, visibleRange]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshVisibleRange();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [refreshVisibleRange]);

  const setScope = useCallback((scope: RangeScope) => {
    setRangeScope(scope);
    setReconciliationNotice(null);
    if (scope === "custom") {
      setViewMode("list");
      const today = new Date();
      const inputDate = toDateInput(today);
      setCustomRangeState((current) => current ?? {
        startDate: inputDate,
        endDate: inputDate,
      });
    }
  }, []);

  const setCustomRange = useCallback((startDate: string, endDate: string) => {
    setRangeScope("custom");
    setViewMode("list");
    setCustomRangeState({ startDate, endDate });
    setReconciliationNotice(null);
  }, []);

  const goToPreviousRange = useCallback(() => {
    const next = shiftRange(rangeScope, rangeAnchorDate, customRange, -1);
    setRangeAnchorDate(next.anchorDate);
    setCustomRangeState(next.customRange);
    setReconciliationNotice(null);
  }, [customRange, rangeAnchorDate, rangeScope]);

  const goToNextRange = useCallback(() => {
    const next = shiftRange(rangeScope, rangeAnchorDate, customRange, 1);
    setRangeAnchorDate(next.anchorDate);
    setCustomRangeState(next.customRange);
    setReconciliationNotice(null);
  }, [customRange, rangeAnchorDate, rangeScope]);

  const goToToday = useCallback(() => {
    const today = new Date();
    setRangeAnchorDate(today);
    setReconciliationNotice(null);

    if (rangeScope === "custom") {
      const inputDate = toDateInput(today);
      setCustomRangeState({ startDate: inputDate, endDate: inputDate });
    }
  }, [rangeScope]);

  const runLifecycleMutation = useCallback(
    async (
      nextStatus: MutationStatus,
      command: () => Promise<unknown>,
      mutatedClassId: string,
    ) => {
      if (mutationStatus !== "idle") return;

      setOperationError(null);
      setReconciliationNotice(null);

      if (!client || !canManageClasses) {
        setOperationError(t("manager.classActions.notAvailable"));
        return;
      }

      setMutationStatus(nextStatus);

      try {
        const result = await command();
        const managedClass = getManagedClassFromResult(result);
        if (managedClass) applyClassMutationResult(managedClass);

        void refreshVisibleRange({
          preserveExistingOnFailure: true,
          silent: true,
        }).then((refreshResult) => {
          if (refreshResult.ok) {
            reconcileSelectedClass(refreshResult.classes, mutatedClassId);
          } else {
            setReconciliationNotice({ type: "stale-after-mutation" });
          }
        });
      } catch (error) {
        setOperationError(
          error instanceof Error
            ? error.message
            : t("manager.classActions.actionFailed"),
        );
      } finally {
        setMutationStatus("idle");
      }
    },
    [
      canManageClasses,
      client,
      applyClassMutationResult,
      mutationStatus,
      reconcileSelectedClass,
      refreshVisibleRange,
      t,
    ],
  );

  const publishClass = useCallback(
    (classId: string) =>
      runLifecycleMutation(
        "publishing",
        () =>
          client ? client.management.classes.publish(classId) : Promise.resolve(),
        classId,
      ),
    [client, runLifecycleMutation],
  );

  const draftClass = useCallback(
    (classId: string) =>
      runLifecycleMutation(
        "drafting",
        () =>
          client ? client.management.classes.draft(classId) : Promise.resolve(),
        classId,
      ),
    [client, runLifecycleMutation],
  );

  const performMutation = useCallback(
    async <T,>(
      status: MutationStatus,
      command: () => Promise<T>,
      mutatedClassId?: string,
      getMutatedClassId?: (result: T) => string | undefined,
    ) => {
      if (mutationStatus !== "idle") return { ok: false as const };

      setOperationError(null);
      setReconciliationNotice(null);

      if (!client || !canManageClasses) {
        setOperationError(t("manager.classActions.notAvailable"));
        return { ok: false as const };
      }

      setMutationStatus(status);

      try {
        const result = await command();
        const reconciledClassId = getMutatedClassId?.(result) ?? mutatedClassId;
        const managedClass = getManagedClassFromResult(result);
        if (managedClass) applyClassMutationResult(managedClass);

        void refreshVisibleRange({
          preserveExistingOnFailure: true,
          silent: true,
        }).then((refreshResult) => {
          if (refreshResult.ok) {
            reconcileSelectedClass(refreshResult.classes, reconciledClassId);
          } else {
            setReconciliationNotice({ type: "stale-after-mutation" });
          }
        });
        return { ok: true as const, result };
      } catch (error) {
        setOperationError(
          error instanceof Error
            ? error.message
            : t("manager.classActions.actionFailed"),
        );
        return { ok: false as const };
      } finally {
        setMutationStatus("idle");
      }
    },
    [
      canManageClasses,
      client,
      applyClassMutationResult,
      mutationStatus,
      reconcileSelectedClass,
      refreshVisibleRange,
      t,
    ],
  );

  const createClass = useCallback(
    async (input: CreateManagedClassInput) => {
      const result = await performMutation(
        "creating",
        () =>
          client ? client.management.classes.create(input) : Promise.resolve(null),
        undefined,
        (mutationResult) =>
          mutationResult && "class" in mutationResult
            ? mutationResult.class.id
            : undefined,
      );

      return result;
    },
    [client, performMutation],
  );

  const updateClass = useCallback(
    async (classId: string, input: Omit<UpdateManagedClassInput, "classId">) => {
      const result = await performMutation("updating", () =>
        client
          ? client.management.classes.update({ ...input, classId })
          : Promise.resolve(null),
        classId,
      );

      return result;
    },
    [client, performMutation],
  );

  const cancelClass = useCallback(
    async (classId: string, input: CancelManagedClassInput) => {
      const result = await performMutation("cancelling", () =>
        client
          ? client.management.classes.cancel(classId, input)
          : Promise.resolve(null),
        classId,
      );

      return result;
    },
    [client, performMutation],
  );

  return {
    state: {
      rangeScope,
      rangeAnchorDate,
      customRange,
      localRange,
      visibleRange,
      visibleRangeLabel,
      viewMode,
      classes,
      classesGroupedByDate,
      selectedClass,
      selectedClassId,
      loadStatus,
      errorMessage,
      operationError,
      mutationStatus,
      reconciliationNotice,
      canManageClasses,
    },
    actions: {
      setRangeScope: setScope,
      setCustomRange,
      goToPreviousRange,
      goToNextRange,
      goToToday,
      setViewMode,
      selectClass: setSelectedClassId,
      clearSelection: () => setSelectedClassId(null),
      refreshVisibleRange,
      setOperationError,
      setMutationStatus,
      publishClass,
      draftClass,
      createClass,
      updateClass,
      cancelClass,
    },
  };
}

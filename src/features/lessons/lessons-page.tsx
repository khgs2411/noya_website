import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type ClassKitClient,
  useProductContext,
  type ClassInformation,
  type ClassSummary,
} from "@class-kit/react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  LogIn,
  RefreshCw,
  X,
  XCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { ToastStack, type ToastItem } from "@/components/ui/toast";
import {
  authPath,
  healthDeclarationPath,
  termsPath,
} from "@/content/site-content";
import { ClassCalendarView } from "@/features/classes/class-calendar-view";
import { ClassListView } from "@/features/classes/class-list-view";
import {
  type CustomRangeValue,
  getLocalDateKey,
  type RangeScope,
  type ViewMode,
  getLocalRange,
  getVisibleRangeLabel,
  parseDateInput,
  shiftRange,
  toDateInput,
  toVisibleRange,
} from "@/features/classes/class-range";
import { ClassRangeToolbar } from "@/features/classes/class-range-toolbar";
import {
  getSignupSlugFromSearch,
  resolveSignupFilters,
} from "@/features/classes/signup-links";
import type {
  ClassViewDateGroup,
  ClassViewItem,
} from "@/features/classes/class-types";
import { captureActiveElement, restoreFocus } from "@/lib/focus";
import { cn } from "@/lib/utils";
import { DocumentAgreement } from "@/features/documents/document-agreement";
import { acceptProductDocument } from "@/features/documents/product-document-acceptance";
import {
  hasAcceptedHealthDeclaration,
  healthDeclarationAcceptanceVersionKey,
} from "@/features/documents/health-declaration-acceptance";
import {
  productDocumentFallbackLocale,
  productDocumentTypes,
} from "@/features/documents/product-document-types";

type LoadStatus = "idle" | "loading" | "loaded" | "error";
type RegistrationMutation =
  | { type: "register"; classId: string }
  | { type: "cancel"; classId: string }
  | null;

type DetailStatus = "idle" | "loading" | "loaded" | "error";
type SignupLinkStatus = "idle" | "resolving" | "resolved" | "error";
type HealthDeclarationStatus = "idle" | "loading" | "ready" | "unavailable" | "error";
type TermsStatus = "idle" | "loading" | "ready" | "unavailable" | "error";
type ClassToast = ToastItem;
type ProductProfile = NonNullable<
  Awaited<ReturnType<ClassKitClient["profile"]["get"]>>["data"]
>;
const CANCELLATION_CLOSED_MESSAGE = "Cancellation is closed for this class.";
const dateInputPattern = /^\d{4}-\d{2}-\d{2}$/;

function getInitialClassFocus(search: string) {
  const params = new URLSearchParams(search);
  const date = params.get("date");
  const classId = params.get("classId");

  if (!date || !dateInputPattern.test(date)) {
    return { date: null, classId };
  }

  return { date, classId };
}

function getCustomerStatusLabel(
  classSummary: ClassSummary,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  const temporalStatus = classSummary.temporalStatus;
  const classDateKey = getLocalDateKey(new Date(classSummary.startsAt));
  const todayKey = getLocalDateKey(new Date());

  if (temporalStatus === "upcoming" && classDateKey !== todayKey) {
    return undefined;
  }

  return t(`classes.temporalStatus.${temporalStatus}`);
}

function toClassViewItem(
  classSummary: ClassSummary,
  t: (key: string, options?: Record<string, unknown>) => string,
): ClassViewItem {
  return {
    id: classSummary.id,
    name: classSummary.name,
    description: classSummary.description,
    category: classSummary.category,
    startsAt: classSummary.startsAt,
    endsAt: classSummary.endsAt,
    location: classSummary.location,
    capacity: classSummary.capacity,
    registeredUsersCount: classSummary.registeredUsersCount,
    membershipRequirement: classSummary.membershipRequirement,
    cancellationCutoffHours: classSummary.cancellationCutoffHours,
    registrationPolicy: classSummary.registrationPolicy,
    registrationOpen: classSummary.registrationOpen,
    canRegister: classSummary.canRegister,
    canCancelRegistration: classSummary.canCancelRegistration,
    userRegistrationState: classSummary.userRegistrationState,
    temporalStatus: classSummary.temporalStatus,
    statusLabel: getCustomerStatusLabel(classSummary, t),
    capacityLabel:
      classSummary.registeredUsersCount === undefined
        ? t("classes.capacity", { count: classSummary.capacity })
        : t("classes.capacityWithRegistered", {
            count: classSummary.capacity,
            registered: classSummary.registeredUsersCount,
          }),
  };
}

function groupClassesByDate(
  items: ClassViewItem[],
  locale: string,
): ClassViewDateGroup[] {
  const formatter = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  const groups = new Map<string, ClassViewItem[]>();

  for (const item of [...items].sort((a, b) => a.startsAt.localeCompare(b.startsAt))) {
    const key = getLocalDateKey(new Date(item.startsAt));
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  return [...groups.entries()].map(([dateKey, groupedItems]) => ({
    dateKey,
    label: formatter.format(new Date(groupedItems[0].startsAt)),
    items: groupedItems,
  }));
}

export function LessonsPage({
  search,
  onNavigate,
}: {
  search: string;
  onNavigate: (path: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const { client, session } = useProductContext();
  const [initialClassFocus] = useState(() => getInitialClassFocus(search));
  const [rangeScope, setRangeScope] = useState<RangeScope>(() =>
    initialClassFocus.date ? "custom" : "week",
  );
  const [rangeAnchorDate, setRangeAnchorDate] = useState(() =>
    initialClassFocus.date ? parseDateInput(initialClassFocus.date) : new Date(),
  );
  const [customRange, setCustomRangeState] =
    useState<CustomRangeValue | null>(() =>
      initialClassFocus.date
        ? {
            startDate: initialClassFocus.date,
            endDate: initialClassFocus.date,
          }
        : null,
    );
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(
    initialClassFocus.classId,
  );
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ClassToast[]>([]);
  const [registrationMutation, setRegistrationMutation] =
    useState<RegistrationMutation>(null);
  const [selectedClassDetail, setSelectedClassDetail] =
    useState<ClassInformation | null>(null);
  const [detailStatus, setDetailStatus] = useState<DetailStatus>("idle");
  const [detailError, setDetailError] = useState<string | null>(null);
  const [signupLinkStatus, setSignupLinkStatus] =
    useState<SignupLinkStatus>("idle");
  const [signupLinkError, setSignupLinkError] = useState<string | null>(null);
  const [healthDeclarationStatus, setHealthDeclarationStatus] =
    useState<HealthDeclarationStatus>("idle");
  const [healthDeclarationAccepted, setHealthDeclarationAccepted] =
    useState(false);
  const [healthDeclarationChecked, setHealthDeclarationChecked] =
    useState(false);
  const [healthDeclarationError, setHealthDeclarationError] =
    useState<string | null>(null);
  const [termsStatus, setTermsStatus] = useState<TermsStatus>("idle");
  const [termsChecked, setTermsChecked] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [agreementLoadAttempt, setAgreementLoadAttempt] = useState(0);
  const requestIdRef = useRef(0);
  const detailRequestIdRef = useRef(0);
  const resolvedSignupSlugRef = useRef<string | null>(null);
  const classDetailFocusReturnRef = useRef<HTMLElement | null>(null);
  const toastTimeoutsRef = useRef<number[]>([]);

  const localRange = useMemo(
    () => getLocalRange(rangeScope, rangeAnchorDate, customRange),
    [customRange, rangeAnchorDate, rangeScope],
  );
  const visibleRangeLabel = useMemo(
    () => getVisibleRangeLabel(localRange, i18n.language),
    [i18n.language, localRange],
  );
  const visibleRange = useMemo(() => toVisibleRange(localRange), [localRange]);
  const classViewItems = useMemo(
    () => classes.map((classSummary) => toClassViewItem(classSummary, t)),
    [classes, t],
  );
  const classViewGroups = useMemo(
    () => groupClassesByDate(classViewItems, i18n.language),
    [classViewItems, i18n.language],
  );
  const selectedClass = useMemo(
    () =>
      selectedClassId && selectedClassDetail
        ? toClassViewItem(selectedClassDetail, t)
        : selectedClassId
          ? classViewItems.find((item) => item.id === selectedClassId) ?? null
          : null,
    [classViewItems, selectedClassDetail, selectedClassId, t],
  );
  const loadingClassId =
    registrationMutation?.classId ??
    (detailStatus === "loading" ? selectedClassId : null);

  const updateClassLocally = useCallback((
    classId: string,
    updater: (classSummary: ClassSummary) => ClassSummary,
  ) => {
    setClasses((currentClasses) =>
      currentClasses.map((classSummary) =>
        classSummary.id === classId ? updater(classSummary) : classSummary,
      ),
    );
    setSelectedClassDetail((currentDetail) =>
      currentDetail?.id === classId ? updater(currentDetail) as ClassInformation : currentDetail,
    );
  }, []);

  const refreshClasses = useCallback(async (options?: { silent?: boolean }) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    if (!options?.silent) {
      setLoadStatus("loading");
      setErrorMessage(null);
    }

    if (!client) {
      if (options?.silent) return;
      setClasses([]);
      setLoadStatus("error");
      setErrorMessage(t("classes.unavailable"));
      return;
    }

    const result = await client.classes.list({
      range: visibleRange,
      fields: ["registeredUsersCount"],
    });

    if (requestIdRef.current !== requestId) return;

    if (result.error) {
      if (options?.silent) return;
      setClasses([]);
      setLoadStatus("error");
      setErrorMessage(result.error.message);
      return;
    }

    setClasses(result.data.classes);
    setLoadStatus("loaded");
    setErrorMessage(null);
    setOperationError(null);
  }, [client, t, visibleRange]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshClasses();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [refreshClasses]);

  useEffect(
    () => () => {
      toastTimeoutsRef.current.forEach((timeoutId) =>
        window.clearTimeout(timeoutId),
      );
    },
    [],
  );

  function dismissToast(toastId: string) {
    setToasts((current) => current.filter((toast) => toast.id !== toastId));
  }

  function showToast(toast: Omit<ClassToast, "id">) {
    const toastId = crypto.randomUUID();
    setToasts((current) => [...current.slice(-2), { ...toast, id: toastId }]);

    const timeoutId = window.setTimeout(() => {
      dismissToast(toastId);
    }, 4200);
    toastTimeoutsRef.current.push(timeoutId);
  }

  function showOperationError(message: string) {
    const mappedMessage =
      message === CANCELLATION_CLOSED_MESSAGE
        ? t("classes.toast.cancellationClosed")
        : message;

    setOperationError(mappedMessage);
    showToast({
      title: mappedMessage,
      variant: "error",
    });
  }

  function setScope(scope: RangeScope) {
    setRangeScope(scope);
    closeClassDetails({ restore: false });
    if (scope === "custom") {
      setViewMode("list");
      const today = new Date();
      const inputDate = toDateInput(today);
      setCustomRangeState((current) => current ?? {
        startDate: inputDate,
        endDate: inputDate,
      });
    }
  }

  function setCustomRange(startDate: string, endDate: string) {
    setRangeScope("custom");
    setViewMode("list");
    setCustomRangeState({ startDate, endDate });
    closeClassDetails({ restore: false });
  }

  function goToPreviousRange() {
    const next = shiftRange(rangeScope, rangeAnchorDate, customRange, -1);
    setRangeAnchorDate(next.anchorDate);
    setCustomRangeState(next.customRange);
    closeClassDetails({ restore: false });
  }

  function goToNextRange() {
    const next = shiftRange(rangeScope, rangeAnchorDate, customRange, 1);
    setRangeAnchorDate(next.anchorDate);
    setCustomRangeState(next.customRange);
    closeClassDetails({ restore: false });
  }

  function goToToday() {
    const today = new Date();
    setRangeAnchorDate(today);
    closeClassDetails({ restore: false });

    if (rangeScope === "custom") {
      const inputDate = toDateInput(today);
      setCustomRangeState({ startDate: inputDate, endDate: inputDate });
    }
  }

  function showMoreLessons() {
    setRangeScope("week");
    setRangeAnchorDate(new Date());
    setCustomRangeState(null);
    closeClassDetails({ restore: false });
  }

  function closeClassDetails(options: { restore?: boolean } = {}) {
    setSelectedClassId(null);
    setSelectedClassDetail(null);
    setDetailStatus("idle");
    setDetailError(null);
    if (options.restore !== false) {
      restoreFocus(classDetailFocusReturnRef.current);
    }
  }

  const loadClassDetail = useCallback(
    async (classId: string, options?: { silent?: boolean }) => {
      const requestId = detailRequestIdRef.current + 1;
      detailRequestIdRef.current = requestId;
      if (!options?.silent) {
        setDetailStatus("loading");
        setDetailError(null);
      }

      if (!client) {
        if (options?.silent) return null;
        setDetailStatus("error");
        setDetailError(t("classes.unavailable"));
        return null;
      }

      const result = await client.classes.get(classId, {
        fields: ["membershipRequirement", "registeredUsersCount"],
      });

      if (detailRequestIdRef.current !== requestId) return null;

      if (result.error) {
        if (options?.silent) return null;
        setDetailStatus("error");
        setDetailError(result.error.message);
        return null;
      }

      setSelectedClassDetail(result.data.class);
      setClasses((currentClasses) =>
        currentClasses.map((classSummary) =>
          classSummary.id === result.data.class.id ? result.data.class : classSummary,
        ),
      );
      setDetailStatus("loaded");
      return result.data.class;
    },
    [client, t],
  );

  useEffect(() => {
    const slug = getSignupSlugFromSearch(search);
    if (!slug || resolvedSignupSlugRef.current === slug) return;

    if (!client) {
      return;
    }

    const activeClient = client;
    const activeSlug = slug;

    let cancelled = false;

    async function resolveSignupLink() {
      resolvedSignupSlugRef.current = activeSlug;
      setSignupLinkStatus("resolving");
      setSignupLinkError(null);

      const result = await activeClient.signupLinks.resolve(activeSlug);

      if (cancelled) return;

      if (result.error) {
        setSignupLinkStatus("error");
        setSignupLinkError(result.error.message);
        return;
      }

      const { link } = result.data;

      if (link.target_type === "class" && link.class_id) {
        setDetailStatus("loading");
        setDetailError(null);
        const classResult = await activeClient.classes.get(link.class_id, {
          fields: ["membershipRequirement", "registeredUsersCount"],
        });

        if (cancelled) return;

        if (classResult.error) {
          setDetailStatus("error");
          setSignupLinkStatus("error");
          setSignupLinkError(classResult.error.message);
          return;
        }

        const linkedClass = classResult.data.class;
        const linkedClassDate = toDateInput(new Date(linkedClass.startsAt));
        setRangeScope("custom");
        setRangeAnchorDate(parseDateInput(linkedClassDate));
        setCustomRangeState({
          startDate: linkedClassDate,
          endDate: linkedClassDate,
        });
        setViewMode("list");
        setSelectedClassId(linkedClass.id);
        setSelectedClassDetail(linkedClass);
        setClasses((currentClasses) => {
          const existing = currentClasses.some(
            (classSummary) => classSummary.id === linkedClass.id,
          );

          if (!existing) return [...currentClasses, linkedClass];

          return currentClasses.map((classSummary) =>
            classSummary.id === linkedClass.id ? linkedClass : classSummary,
          );
        });
        setOperationError(null);
        setDetailStatus("loaded");
        setSignupLinkStatus("resolved");
        return;
      }

      if (link.target_type === "filter") {
        const resolvedFilters = resolveSignupFilters(link.filters);

        if (resolvedFilters.type === "range") {
          setRangeScope("custom");
          setRangeAnchorDate(parseDateInput(
            toDateInput(new Date(resolvedFilters.range.start)),
          ));
          setCustomRangeState({
            startDate: toDateInput(new Date(resolvedFilters.range.start)),
            endDate: toDateInput(new Date(resolvedFilters.range.end)),
          });
          setSelectedClassId(null);
          setSelectedClassDetail(null);
          setViewMode("list");
          setSignupLinkStatus("resolved");
          return;
        }
      }

      setSignupLinkStatus("error");
      setSignupLinkError(t("classes.signupLink.unsupportedFilter"));
    }

    const timeoutId = window.setTimeout(() => {
      void resolveSignupLink();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      if (resolvedSignupSlugRef.current === activeSlug) {
        resolvedSignupSlugRef.current = null;
      }
    };
  }, [client, search, t]);

  function reconcileClassAfterMutation(classId: string) {
    if (selectedClassId === classId) {
      void loadClassDetail(classId, { silent: true });
    }

    void refreshClasses({ silent: true });
  }

  useEffect(() => {
    if (
      !client ||
      !selectedClassId ||
      detailStatus !== "idle" ||
      selectedClassDetail?.id === selectedClassId
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadClassDetail(selectedClassId);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [client, detailStatus, loadClassDetail, selectedClassDetail?.id, selectedClassId]);

  useEffect(() => {
    if (!client || !session || !selectedClassId) {
      const timeoutId = window.setTimeout(() => {
        setHealthDeclarationStatus("idle");
        setHealthDeclarationAccepted(false);
        setHealthDeclarationChecked(false);
        setHealthDeclarationError(null);
        setTermsStatus("idle");
        setTermsChecked(false);
        setTermsError(null);
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }

    const activeClient = client;
    let cancelled = false;

    async function loadRegistrationAgreements() {
      try {
        const [termsResult, healthDeclarationResult, profileResult] = await Promise.all([
          activeClient.productDocuments.get(productDocumentTypes.terms, {
            locale: i18n.language,
            fallbackLocale: productDocumentFallbackLocale,
          }),
          activeClient.productDocuments.get(productDocumentTypes.healthDeclaration, {
            locale: i18n.language,
            fallbackLocale: productDocumentFallbackLocale,
          }),
          activeClient.profile.get(),
        ]);

        if (cancelled) return;

        if (termsResult.error?.code === "not_found") {
          setTermsStatus("unavailable");
        } else if (termsResult.error) {
          setTermsStatus("error");
          setTermsError(t("classes.terms.loadError"));
        } else {
          setTermsStatus("ready");
        }

        if (healthDeclarationResult.error?.code === "not_found") {
          setHealthDeclarationStatus("unavailable");
          return;
        }

        if (healthDeclarationResult.error || profileResult.error) {
          setHealthDeclarationStatus("error");
          setHealthDeclarationError(
            healthDeclarationResult.error?.message ?? profileResult.error?.message ?? t("classes.healthDeclaration.loadError"),
          );
          return;
        }

        const profile = profileResult.data as ProductProfile;
        setHealthDeclarationAccepted(
          hasAcceptedHealthDeclaration(
            profile.user.metadata,
            healthDeclarationResult.data.document.version,
          ),
        );
        setHealthDeclarationStatus("ready");
      } catch (error) {
        if (cancelled) return;
        setHealthDeclarationStatus("error");
        setHealthDeclarationError(
          error instanceof Error ? error.message : t("classes.healthDeclaration.loadError"),
        );
        setTermsStatus("error");
        setTermsError(t("classes.terms.loadError"));
      }
    }

    const timeoutId = window.setTimeout(() => {
      setHealthDeclarationStatus("loading");
      setHealthDeclarationAccepted(false);
      setHealthDeclarationChecked(false);
      setHealthDeclarationError(null);
      setTermsStatus("loading");
      setTermsChecked(false);
      setTermsError(null);
      void loadRegistrationAgreements();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [
    agreementLoadAttempt,
    client,
    i18n.language,
    selectedClassId,
    session,
    t,
  ]);

  function openClassDetails(classId: string) {
    classDetailFocusReturnRef.current = captureActiveElement();
    setSelectedClassId(classId);
    setSelectedClassDetail(null);
    setOperationError(null);
    void loadClassDetail(classId);
  }

  async function registerForClass(
    item: ClassViewItem,
    options?: { requiresHealthDeclaration?: boolean; requiresTerms?: boolean },
  ) {
    setOperationError(null);

    if (!session) {
      onNavigate(authPath);
      return;
    }

    if (!client) {
      setOperationError(t("classes.unavailable"));
      return;
    }

    if (!item.canRegister) {
      setOperationError(t("classes.registrationUnavailable"));
      return;
    }

    if (options?.requiresTerms) {
      if (termsStatus === "unavailable") {
        setOperationError(t("classes.terms.unavailable"));
        return;
      }

      if (termsStatus !== "ready") {
        setOperationError(termsError ?? t("classes.terms.loadError"));
        return;
      }

      if (!termsChecked) {
        setTermsError(t("classes.terms.required"));
        return;
      }
    }

    if (options?.requiresHealthDeclaration) {
      if (healthDeclarationStatus === "unavailable") {
        setOperationError(t("classes.healthDeclaration.unavailable"));
        return;
      }

      if (healthDeclarationStatus !== "ready") {
        setOperationError(
          healthDeclarationError ?? t("classes.healthDeclaration.loadError"),
        );
        return;
      }

      if (!healthDeclarationAccepted && !healthDeclarationChecked) {
        setHealthDeclarationError(t("classes.healthDeclaration.required"));
        return;
      }
    }

    setRegistrationMutation({ type: "register", classId: item.id });

    try {
      if (options?.requiresTerms) {
        const acceptanceResult = await acceptProductDocument(
          client,
          productDocumentTypes.terms,
          i18n.language,
          "registration",
        );

        if (acceptanceResult.error) {
          setTermsError(t("classes.terms.acceptanceError"));
          return;
        }

        setTermsError(null);
      }

      if (options?.requiresHealthDeclaration && !healthDeclarationAccepted) {
        const acceptanceResult = await acceptProductDocument(
          client,
          productDocumentTypes.healthDeclaration,
          i18n.language,
          "registration_health_declaration",
        );

        if (acceptanceResult.error) {
          showOperationError(acceptanceResult.error.message);
          return;
        }

        const profileResult = await client.profile.update({
          metadata: {
            [healthDeclarationAcceptanceVersionKey]:
              acceptanceResult.data.acceptance.document_version,
          },
        });

        if (profileResult.error) {
          showOperationError(profileResult.error.message);
          return;
        }

        setHealthDeclarationAccepted(true);
        setHealthDeclarationChecked(false);
        setHealthDeclarationError(null);
      }

      const result = await client.classes.register(item.id);

      if (result.error) {
        showOperationError(
          result.error.code === "membership_required"
            ? t("classes.registrationErrors.membershipRequired")
            : result.error.code === "membership_not_eligible"
              ? t("classes.registrationErrors.membershipNotEligible")
              : result.error.message,
        );
        return;
      }

      showToast({
        title: t(`classes.toast.${result.data.status}`),
        description:
          result.data.status === "pending"
            ? t("classes.pendingRegistrationHint")
            : undefined,
        variant: result.data.status === "pending" ? "info" : "success",
      });
      updateClassLocally(item.id, (classSummary) => ({
        ...classSummary,
        canRegister: false,
        canCancelRegistration: true,
        userRegistrationState: {
          id: result.data.registration_id,
          status: result.data.status,
        },
        registeredUsersCount:
          result.data.status === "approved" &&
          classSummary.registeredUsersCount !== undefined
            ? classSummary.registeredUsersCount + 1
            : classSummary.registeredUsersCount,
      }));
      reconcileClassAfterMutation(item.id);
    } finally {
      setRegistrationMutation(null);
    }
  }

  async function cancelRegistration(item: ClassViewItem) {
    setOperationError(null);

    if (!client || !item.userRegistrationState?.id) {
      setOperationError(t("classes.unavailable"));
      return;
    }

    setRegistrationMutation({ type: "cancel", classId: item.id });

    try {
      const result = await client.classes.cancelRegistration(
        item.userRegistrationState.id,
      );

      if (result.error) {
        showOperationError(result.error.message);
        return;
      }

      showToast({
        title: t("classes.toast.cancelled"),
        variant: "success",
      });
      updateClassLocally(item.id, (classSummary) => ({
        ...classSummary,
        canRegister: classSummary.registrationOpen,
        canCancelRegistration: false,
        userRegistrationState: null,
        registeredUsersCount:
          item.userRegistrationState?.status === "approved" &&
          classSummary.registeredUsersCount !== undefined
            ? Math.max(0, classSummary.registeredUsersCount - 1)
            : classSummary.registeredUsersCount,
      }));
      reconcileClassAfterMutation(item.id);
    } finally {
      setRegistrationMutation(null);
    }
  }

  function renderClassMeta(item: ClassViewItem) {
    const description = item.description?.trim();

    if (!item.category && !description) return null;

    return (
      <div className="mt-3 grid gap-2 text-sm text-foreground/68">
        {item.category && (
          <p className="font-semibold text-foreground/72">{item.category}</p>
        )}
        {description && <p className="leading-6">{description}</p>}
      </div>
    );
  }

  function renderClassActions(
    item: ClassViewItem,
    options?: { prominence?: "compact" | "primary" },
  ) {
    const mutationActive = registrationMutation?.classId === item.id;
    const actionBusy = mutationActive || loadingClassId === item.id;
    const registrationState = item.userRegistrationState?.status;
    const primary = options?.prominence === "primary";
    const primaryButtonClass = cn(
      "rounded-full",
      primary && "min-h-12 w-full px-5 text-base font-semibold sm:w-auto",
    );
    const statusClass = cn(
      "inline-flex w-fit items-center gap-2 rounded-full border border-blush/24 px-3 py-2 text-sm font-semibold text-foreground/68",
      primary && "min-h-12 px-4 text-base",
    );
    const fallbackClass = cn(
      "rounded-full border border-blush/24 px-3 py-2 text-sm font-semibold text-foreground/58",
      primary && "inline-flex min-h-12 items-center px-4 text-base",
    );

    if (registrationState === "approved" || registrationState === "pending") {
      const pending = registrationState === "pending";

      return (
        <>
          <div className="grid gap-1">
            <span className={statusClass}>
              {pending ? (
                <Clock className="size-4 text-blush-strong" aria-hidden="true" />
              ) : (
                <CheckCircle2
                  className="size-4 text-blush-strong"
                  aria-hidden="true"
                />
              )}
              {t(`classes.registrationStatus.${registrationState}`)}
            </span>
            {pending && (
              <span className="max-w-64 text-xs leading-5 text-foreground/58">
                {t("classes.pendingRegistrationHint")}
              </span>
            )}
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className={primaryButtonClass}
            disabled={actionBusy}
            onClick={() => void cancelRegistration(item)}
          >
            {actionBusy && registrationMutation?.type !== "register" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <XCircle className="size-4" aria-hidden="true" />
            )}
            {pending
              ? t("classes.cancelRegistrationRequest")
              : t("classes.cancelRegistration")}
          </Button>
        </>
      );
    }

    if (!session && item.registrationOpen) {
      return (
        <Button
          type="button"
          size="sm"
          className={primaryButtonClass}
          onClick={() => void registerForClass(item)}
        >
          <LogIn className="size-4" aria-hidden="true" />
          {t("classes.signInToRegister")}
        </Button>
      );
    }

    if (session && item.canRegister) {
      if (options?.prominence === "primary") return null;

      return (
        <Button
          type="button"
          size="sm"
          className={primaryButtonClass}
          disabled={actionBusy}
          onClick={() => openClassDetails(item.id)}
        >
          {actionBusy ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="size-4" aria-hidden="true" />
          )}
          {t("classes.register")}
        </Button>
      );
    }

    return (
      <span className={fallbackClass}>
        {session
          ? t("classes.registrationUnavailable")
          : t("classes.registrationClosed")}
      </span>
    );
  }

  function renderClassFacts(item: ClassViewItem) {
    const description = item.description?.trim();
    const facts = [
      {
        label: t("classes.detail.time"),
        value: new Intl.DateTimeFormat(i18n.language, {
          dateStyle: "medium",
          timeStyle: "short",
        }).formatRange(new Date(item.startsAt), new Date(item.endsAt)),
      },
      {
        label: t("classes.detail.location"),
        value: item.location ?? t("classes.detail.noLocation"),
      },
      {
        label: t("classes.detail.capacity"),
        value: item.capacityLabel ?? t("classes.capacity", { count: item.capacity }),
      },
      item.membershipRequirement
        ? {
            label: t("classes.detail.membership"),
            value: t(`classes.membershipRequirement.${item.membershipRequirement}`),
          }
        : null,
      item.registrationPolicy
        ? {
            label: t("classes.detail.registrationPolicy"),
            value: t(`classes.registrationPolicy.${item.registrationPolicy}`),
          }
        : null,
      item.cancellationCutoffHours !== undefined
        ? {
            label: t("classes.detail.cancellationCutoff"),
            value: t("classes.cancellationCutoff", {
              count: item.cancellationCutoffHours,
            }),
          }
        : null,
      description
        ? {
            label: t("classes.detail.description"),
            value: description,
          }
        : null,
    ].filter((fact): fact is { label: string; value: string } => Boolean(fact));

    return (
      <dl className="mt-4 grid gap-2 text-sm">
        {facts.map((fact) => (
          <div
            key={fact.label}
            className="grid gap-1 rounded-xl border border-blush/18 bg-background/34 px-3 py-2.5 sm:grid-cols-[8rem_1fr]"
          >
            <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-foreground/46">
              {fact.label}
            </dt>
            <dd className="break-words leading-5 text-foreground/70">
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <main className="min-h-screen bg-background px-5 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6 text-foreground sm:px-8 md:pb-10">
      <div className="mx-auto w-full max-w-6xl xl:max-w-[95vw]">
        <button
          type="button"
          className="inline-flex text-sm font-semibold text-blush-strong underline-offset-4 hover:underline"
          onClick={() => onNavigate("./")}
        >
          {t("actions.back")}
        </button>

        <section className="mt-6 rounded-[1.4rem] border border-blush/24 bg-card/78 p-4 shadow-soft sm:p-5">
          <div className="max-w-3xl">
            <p className="font-serif text-[0.68rem] uppercase tracking-[0.25em] text-foreground/48">
              {t("classes.pageEyebrow")}
            </p>
            <h1 className="mt-2 font-serif text-4xl text-foreground sm:text-5xl">
              {t("classes.pageTitle")}
            </h1>
            <p className="mt-3 text-sm leading-6 text-foreground/68">
              {t("classes.pageBody")}
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-4">
            <ClassRangeToolbar
              rangeScope={rangeScope}
              customRange={customRange}
              visibleRangeLabel={visibleRangeLabel}
              viewMode={viewMode}
              isRefreshing={loadStatus === "loading"}
              labelPrefix="classes"
              onScopeChange={setScope}
              onCustomRangeChange={setCustomRange}
              onPrevious={goToPreviousRange}
              onNext={goToNextRange}
              onToday={goToToday}
              onRefresh={() => void refreshClasses()}
              onViewModeChange={setViewMode}
            />

            {loadStatus === "loading" && (
              <div className="rounded-xl border border-blush/24 bg-background/46 p-5">
                <div className="flex items-center gap-3 text-sm text-foreground/68">
                  <Loader2
                    className="size-4 shrink-0 animate-spin text-blush-strong"
                    aria-hidden="true"
                  />
                  {t("classes.loading")}
                </div>
              </div>
            )}

            {loadStatus === "error" && (
              <div className="rounded-xl border border-blush/24 bg-background/46 p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle
                    className="mt-0.5 size-5 shrink-0 text-blush-strong"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="font-serif text-xl text-foreground">
                      {t("classes.errorTitle")}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-foreground/68">
                      {errorMessage ?? t("classes.errorBody")}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4 rounded-full"
                      onClick={() => void refreshClasses()}
                    >
                      <RefreshCw className="size-4" aria-hidden="true" />
                      {t("classes.retry")}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {operationError && (
              <p className="rounded-xl border border-blush/24 bg-background/46 p-3 text-sm leading-6 text-blush-strong">
                {operationError}
              </p>
            )}

            {signupLinkStatus === "resolving" && (
              <div className="rounded-xl border border-blush/24 bg-background/46 p-4">
                <div className="flex items-center gap-3 text-sm text-foreground/68">
                  <Loader2
                    className="size-4 shrink-0 animate-spin text-blush-strong"
                    aria-hidden="true"
                  />
                  {t("classes.signupLink.resolving")}
                </div>
              </div>
            )}

            {signupLinkStatus === "error" && (
              <p className="rounded-xl border border-blush/24 bg-background/46 p-3 text-sm leading-6 text-blush-strong">
                {signupLinkError ?? t("classes.signupLink.error")}
              </p>
            )}

            {viewMode === "calendar" ? (
              <ClassCalendarView
                rangeScope={rangeScope}
                localRange={localRange}
                items={classViewItems}
                selectedClassId={selectedClassId}
                loadingClassId={loadingClassId}
                labelPrefix="classes"
                selectLabel={t("classes.select")}
                onSelectClass={openClassDetails}
              />
            ) : (
              <ClassListView
                groups={classViewGroups}
                selectedClassId={selectedClassId}
                loadingClassId={loadingClassId}
                selectLabel={t("classes.select")}
                onSelectClass={openClassDetails}
                renderCardMeta={renderClassMeta}
                renderCardActions={renderClassActions}
              />
            )}

            {loadStatus === "loaded" && classViewItems.length === 0 && (
              <div className="rounded-xl border border-blush/24 bg-background/46 p-5">
                <p className="font-serif text-xl text-foreground">
                  {t("classes.emptyTitle")}
                </p>
                <p className="mt-2 text-sm leading-6 text-foreground/68">
                  {t("classes.emptyBody")}
                </p>
              </div>
            )}

            {viewMode === "calendar" && loadStatus === "loaded" && classViewItems.length > 0 && (
              <div className="md:hidden">
                <ClassListView
                  groups={classViewGroups}
                  selectedClassId={selectedClassId}
                  loadingClassId={loadingClassId}
                  selectLabel={t("classes.select")}
                  onSelectClass={openClassDetails}
                  renderCardMeta={renderClassMeta}
                  renderCardActions={renderClassActions}
                />
              </div>
            )}

            {selectedClass && (
              <div
                className="fixed inset-0 z-50 grid place-items-end bg-black/50 p-0 md:place-items-center md:p-6"
                onClick={() => closeClassDetails()}
              >
                <aside
                  role="dialog"
                  aria-modal="true"
                  aria-label={`${t("classes.detail.eyebrow")}: ${selectedClass.name}`}
                  className="max-h-[92vh] w-full overflow-y-auto rounded-t-[1.4rem] border border-blush/24 bg-background p-5 text-foreground shadow-soft md:max-w-xl md:rounded-[1.4rem] md:bg-card/95"
                  onClick={(event) => event.stopPropagation()}
                >
                  <header className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                        <div className="min-w-0">
                          <p className="font-serif text-xs uppercase tracking-[0.25em] text-foreground/48">
                            {t("classes.detail.eyebrow")}
                          </p>
                          <h2 className="mt-2 break-words font-serif text-3xl text-foreground">
                            {selectedClass.name}
                          </h2>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                          {renderClassActions(selectedClass, {
                            prominence: "primary",
                          })}
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => closeClassDetails()}
                      aria-label={t("actions.close")}
                    >
                      <X className="size-5" aria-hidden="true" />
                    </Button>
                  </header>

                  {detailStatus === "loading" && (
                    <div className="mt-5 flex items-center gap-3 rounded-xl border border-blush/24 bg-background/46 p-4 text-sm text-foreground/68">
                      <Loader2
                        className="size-4 shrink-0 animate-spin text-blush-strong"
                        aria-hidden="true"
                      />
                      {t("classes.detail.loading")}
                    </div>
                  )}

                  {detailStatus === "error" && (
                    <p className="mt-5 rounded-xl border border-blush/24 bg-background/46 p-4 text-sm leading-6 text-blush-strong">
                      {detailError ?? t("classes.detail.error")}
                    </p>
                  )}

                  {selectedClass.category && (
                    <p className="mt-3 inline-flex rounded-full border border-blush/24 px-3 py-1 text-xs font-semibold text-foreground/60">
                      {selectedClass.category}
                    </p>
                  )}

                  {renderClassFacts(selectedClass)}

                  {session &&
                    selectedClass.canRegister &&
                    !selectedClass.userRegistrationState && (
                      <section className="mt-5 grid gap-3 rounded-xl border border-blush/24 bg-background/46 p-4">
                        <div className="grid gap-1">
                          <p className="font-serif text-xl text-foreground">
                            {t("classes.terms.title")}
                          </p>
                          <p className="text-sm leading-6 text-foreground/68">
                            {t("classes.terms.body")}
                          </p>
                        </div>

                        {termsStatus === "loading" && (
                          <div className="flex items-center gap-2 text-sm text-foreground/64">
                            <Loader2 className="size-4 animate-spin text-blush-strong" aria-hidden="true" />
                            {t("classes.terms.loading")}
                          </div>
                        )}

                        {termsStatus === "unavailable" && (
                          <p className="text-sm leading-6 text-blush-strong">
                            {t("classes.terms.unavailable")}
                          </p>
                        )}

                        {termsStatus === "error" && (
                          <div className="grid justify-items-start gap-2">
                            <p className="text-sm leading-6 text-blush-strong">
                              {termsError ?? t("classes.terms.loadError")}
                            </p>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setAgreementLoadAttempt((attempt) => attempt + 1)
                              }
                            >
                              <RefreshCw className="size-4" aria-hidden="true" />
                              {t("classes.retry")}
                            </Button>
                          </div>
                        )}

                        {termsStatus === "ready" && (
                          <DocumentAgreement
                            checked={termsChecked}
                            labelKey="classes.terms.agreement"
                            linkLabelKey="documents.terms.label"
                            documentPath={termsPath}
                            disabled={registrationMutation?.classId === selectedClass.id}
                            error={termsError}
                            onCheckedChange={(checked) => {
                              setTermsChecked(checked);
                              setTermsError(null);
                            }}
                          />
                        )}

                        <div className="border-t border-blush/18 pt-3" />

                        <div className="grid gap-1">
                          <p className="font-serif text-xl text-foreground">
                            {t("classes.healthDeclaration.title")}
                          </p>
                          <p className="text-sm leading-6 text-foreground/68">
                            {healthDeclarationAccepted
                              ? t("classes.healthDeclaration.alreadyAccepted")
                              : t("classes.healthDeclaration.body")}
                          </p>
                        </div>

                        {healthDeclarationStatus === "loading" && (
                          <div className="flex items-center gap-2 text-sm text-foreground/64">
                            <Loader2 className="size-4 animate-spin text-blush-strong" aria-hidden="true" />
                            {t("classes.healthDeclaration.loading")}
                          </div>
                        )}

                        {healthDeclarationStatus === "unavailable" && (
                          <p className="text-sm leading-6 text-blush-strong">
                            {t("classes.healthDeclaration.unavailable")}
                          </p>
                        )}

                        {healthDeclarationStatus === "error" && (
                          <p className="text-sm leading-6 text-blush-strong">
                            {healthDeclarationError ?? t("classes.healthDeclaration.loadError")}
                          </p>
                        )}

                        {healthDeclarationStatus === "ready" && !healthDeclarationAccepted && (
                          <DocumentAgreement
                            checked={healthDeclarationChecked}
                            labelKey="classes.healthDeclaration.agreement"
                            linkLabelKey="documents.healthDeclaration.label"
                            documentPath={healthDeclarationPath}
                            disabled={registrationMutation?.classId === selectedClass.id}
                            error={healthDeclarationError}
                            onCheckedChange={(checked) => {
                              setHealthDeclarationChecked(checked);
                              setHealthDeclarationError(null);
                            }}
                          />
                        )}

                        <Button
                          type="button"
                          className="min-h-12 w-full rounded-full px-5 text-base font-semibold sm:w-auto"
                          disabled={
                            registrationMutation?.classId === selectedClass.id ||
                            termsStatus !== "ready" ||
                            !termsChecked ||
                            healthDeclarationStatus !== "ready" ||
                            (!healthDeclarationAccepted && !healthDeclarationChecked)
                          }
                          onClick={() =>
                            void registerForClass(selectedClass, {
                              requiresTerms: true,
                              requiresHealthDeclaration: true,
                            })
                          }
                        >
                          {registrationMutation?.classId === selectedClass.id ? (
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                          ) : (
                            <CheckCircle2 className="size-4" aria-hidden="true" />
                          )}
                          {t("classes.register")}
                        </Button>
                      </section>
                    )}

                  <div className="mt-5 border-t border-blush/18 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full rounded-full sm:w-auto"
                      onClick={showMoreLessons}
                    >
                      <CalendarDays className="size-4" aria-hidden="true" />
                      {t("classes.moreLessons")}
                    </Button>
                  </div>
                </aside>
              </div>
            )}

            {loadStatus === "idle" && (
              <div className="rounded-xl border border-blush/24 bg-background/46 p-5">
              <p className="font-serif text-xl text-foreground">
                {t("classes.emptyTitle")}
              </p>
              <p className="mt-2 text-sm leading-6 text-foreground/68">
                {t("classes.emptyBody")}
              </p>
              </div>
            )}
          </div>
        </section>
      </div>
      <ToastStack
        toasts={toasts}
        dir={i18n.dir()}
        onDismiss={dismissToast}
      />
    </main>
  );
}

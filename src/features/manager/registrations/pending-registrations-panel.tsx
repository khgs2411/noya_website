import type {
  ClassKitClient,
  ManagementRegistrationSummary,
} from "@class-kit/react";
import { AlertCircle, Check, Clock3, Loader2, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

type LoadStatus = "idle" | "loading" | "loaded" | "error";
type MutationStatus = { registrationId: string; action: "approve" | "reject" } | null;

type PendingRegistrationsPanelProps = {
  client: ClassKitClient | null;
  canManageRegistrations: boolean;
  classId?: string;
  compact?: boolean;
  onChanged?: () => void | Promise<void>;
};

function getRegistrationUserLabel(registration: ManagementRegistrationSummary) {
  return (
    registration.user.displayName ??
    registration.user.email ??
    registration.user.id
  );
}

export function PendingRegistrationsPanel({
  client,
  canManageRegistrations,
  classId,
  compact = false,
  onChanged,
}: PendingRegistrationsPanelProps) {
  const { t, i18n } = useTranslation();
  const [registrations, setRegistrations] = useState<ManagementRegistrationSummary[]>([]);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [mutationStatus, setMutationStatus] = useState<MutationStatus>(null);
  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [i18n.language],
  );

  const loadPending = useCallback(async () => {
    if (!client || !canManageRegistrations) {
      setRegistrations([]);
      setLoadStatus("idle");
      setErrorMessage(null);
      return;
    }

    setLoadStatus("loading");
    setErrorMessage(null);

    try {
      const result = await client.management.registrations.listPending(
        classId ? { classId } : undefined,
      );
      setRegistrations(result.registrations);
      setLoadStatus("loaded");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : t("manager.pending.errorBody"),
      );
      setLoadStatus("error");
    }
  }, [canManageRegistrations, classId, client, t]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadPending();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadPending]);

  const runAction = useCallback(
    async (registrationId: string, action: "approve" | "reject") => {
      if (!client || !canManageRegistrations || mutationStatus) return;

      setOperationError(null);
      setMutationStatus({ registrationId, action });

      try {
        if (action === "approve") {
          await client.management.registrations.approve(registrationId);
        } else {
          await client.management.registrations.reject(registrationId);
        }

        await loadPending();
        await onChanged?.();
      } catch (error) {
        setOperationError(
          error instanceof Error
            ? error.message
            : t("manager.pending.actionFailed"),
        );
      } finally {
        setMutationStatus(null);
      }
    },
    [
      canManageRegistrations,
      client,
      loadPending,
      mutationStatus,
      onChanged,
      t,
    ],
  );

  if (!canManageRegistrations) {
    return (
      <div className="rounded-xl border border-blush/24 bg-background/46 p-4">
        <p className="font-serif text-xl text-foreground">
          {t("manager.pending.noAccessTitle")}
        </p>
        <p className="mt-2 text-sm leading-6 text-foreground/68">
          {t("manager.pending.noAccessBody")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {!compact && (
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blush-strong text-background">
            <Clock3 className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-serif text-xs uppercase tracking-[0.25em] text-foreground/48">
              {t("manager.pending.eyebrow")}
            </p>
            <h2 className="mt-1 font-serif text-3xl text-foreground">
              {t("manager.pending.title")}
            </h2>
            <p className="mt-2 max-w-prose text-sm leading-6 text-foreground/68">
              {t("manager.pending.body")}
            </p>
          </div>
        </div>
      )}

      {loadStatus === "loading" && (
        <div className="rounded-xl border border-blush/24 bg-background/46 p-4 text-sm text-foreground/68">
          <Loader2
            className="me-2 inline size-4 animate-spin text-blush-strong"
            aria-hidden="true"
          />
          {t("manager.pending.loading")}
        </div>
      )}

      {loadStatus === "error" && (
        <div className="rounded-xl border border-blush/24 bg-background/46 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle
              className="mt-0.5 size-5 shrink-0 text-blush-strong"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="font-serif text-xl text-foreground">
                {t("manager.pending.errorTitle")}
              </p>
              <p className="mt-2 text-sm leading-6 text-foreground/68">
                {errorMessage ?? t("manager.pending.errorBody")}
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-4 rounded-full"
                onClick={() => void loadPending()}
              >
                <RefreshCw className="size-4" aria-hidden="true" />
                {t("manager.pending.retry")}
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

      {loadStatus === "loaded" && registrations.length === 0 && (
        <div className="rounded-xl border border-blush/24 bg-background/46 p-4">
          <p className="font-serif text-xl text-foreground">
            {t("manager.pending.emptyTitle")}
          </p>
          <p className="mt-2 text-sm leading-6 text-foreground/68">
            {t("manager.pending.emptyBody")}
          </p>
        </div>
      )}

      {loadStatus === "loaded" && registrations.length > 0 && (
        <div className="grid gap-3">
          {registrations.map((registration) => {
            const approving =
              mutationStatus?.registrationId === registration.id &&
              mutationStatus.action === "approve";
            const rejecting =
              mutationStatus?.registrationId === registration.id &&
              mutationStatus.action === "reject";

            return (
              <article
                key={registration.id}
                className="rounded-[1.3rem] border border-blush/24 bg-background/46 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-serif text-xl text-foreground">
                      {getRegistrationUserLabel(registration)}
                    </p>
                    {registration.user.email && (
                      <p className="mt-1 break-words text-sm text-foreground/60">
                        {registration.user.email}
                      </p>
                    )}
                    {registration.class && !classId && (
                      <p className="mt-2 text-sm leading-6 text-foreground/68">
                        {registration.class.name}
                      </p>
                    )}
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
                      {formatter.format(new Date(registration.createdAt))}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-full"
                      disabled={Boolean(mutationStatus)}
                      onClick={() => void runAction(registration.id, "approve")}
                    >
                      {approving ? (
                        <Loader2
                          className="size-4 animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        <Check className="size-4" aria-hidden="true" />
                      )}
                      {t("manager.pending.approve")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      disabled={Boolean(mutationStatus)}
                      onClick={() => void runAction(registration.id, "reject")}
                    >
                      {rejecting ? (
                        <Loader2
                          className="size-4 animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        <X className="size-4" aria-hidden="true" />
                      )}
                      {t("manager.pending.reject")}
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

import {
  ClassKitManagerApiError,
  useProductContext,
} from "@class-kit/react";
import { AlertCircle, Check, Loader2, RefreshCw, Save } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

type LoadStatus = "idle" | "loading" | "loaded" | "error";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function CancellationPolicyManagementTab({
  canReadCancellationPolicy,
  canUpdateCancellationPolicy,
}: {
  canReadCancellationPolicy: boolean;
  canUpdateCancellationPolicy: boolean;
}) {
  const { t } = useTranslation();
  const { client } = useProductContext();
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("idle");
  const [cutoffHours, setCutoffHours] = useState<number | null>(null);
  const [draftHours, setDraftHours] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const formatCutoff = useCallback(
    (hours: number) =>
      hours === 0
        ? t("manager.cancellationPolicy.atClassStart")
        : t("manager.cancellationPolicy.hoursBeforeClass", { count: hours }),
    [t],
  );

  const loadPolicy = useCallback(async () => {
    if (!canReadCancellationPolicy) return;

    if (!client) {
      setLoadStatus("error");
      setLoadError(t("manager.cancellationPolicy.unavailable"));
      return;
    }

    setLoadStatus("loading");
    setLoadError(null);
    setNotice(null);

    try {
      const policy = await client.management.product.getCancellationPolicy();
      setCutoffHours(policy.registration_cancellation_cutoff_hours);
      setDraftHours(String(policy.registration_cancellation_cutoff_hours));
      setLoadStatus("loaded");
    } catch (error) {
      setLoadStatus("error");
      setLoadError(
        error instanceof ClassKitManagerApiError && error.code === "forbidden"
          ? t("manager.cancellationPolicy.readDenied")
          : getErrorMessage(error, t("manager.cancellationPolicy.loadErrorBody")),
      );
    }
  }, [canReadCancellationPolicy, client, t]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadPolicy();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadPolicy]);

  async function savePolicy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canUpdateCancellationPolicy) return;
    if (!client) {
      setMutationError(t("manager.cancellationPolicy.unavailable"));
      return;
    }

    setSaving(true);
    setMutationError(null);
    setNotice(null);

    try {
      const result = await client.management.product.updateCancellationPolicy({
        registrationCancellationCutoffHours: Number(draftHours),
      });
      setCutoffHours(result.registration_cancellation_cutoff_hours);
      setDraftHours(String(result.registration_cancellation_cutoff_hours));
      setNotice(
        result.changed
          ? t("manager.cancellationPolicy.updated", {
              cutoff: formatCutoff(
                result.registration_cancellation_cutoff_hours,
              ),
            })
          : t("manager.cancellationPolicy.unchanged"),
      );
    } catch (error) {
      setMutationError(
        error instanceof ClassKitManagerApiError && error.code === "forbidden"
          ? t("manager.cancellationPolicy.updateDenied")
          : error instanceof ClassKitManagerApiError && error.code === "bad_request"
            ? t("manager.cancellationPolicy.invalidValue")
            : getErrorMessage(error, t("manager.cancellationPolicy.saveError")),
      );
    } finally {
      setSaving(false);
    }
  }

  const isLoading = canReadCancellationPolicy && loadStatus === "loading";
  const cannotRead = !canReadCancellationPolicy;

  return (
    <section className="rounded-[1.4rem] border border-blush/24 bg-card/78 p-4 shadow-soft sm:p-5">
      <header className="max-w-2xl">
        <p className="font-serif text-xs uppercase tracking-[0.25em] text-foreground/48">
          {t("manager.cancellationPolicy.eyebrow")}
        </p>
        <h2 className="mt-2 font-serif text-3xl">
          {t("manager.cancellationPolicy.title")}
        </h2>
        <p className="mt-2 text-sm leading-6 text-foreground/68">
          {t("manager.cancellationPolicy.body")}
        </p>
      </header>

      {isLoading && (
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-blush/18 bg-background/34 p-4 text-sm text-foreground/68">
          <Loader2 className="size-4 animate-spin text-blush-strong" aria-hidden="true" />
          {t("manager.cancellationPolicy.loading")}
        </div>
      )}

      {loadStatus === "error" && (
        <div className="mt-5 rounded-xl border border-blush-strong/35 bg-background/46 p-4">
          <AlertCircle className="size-5 text-blush-strong" aria-hidden="true" />
          <h3 className="mt-3 font-serif text-xl">
            {t("manager.cancellationPolicy.loadErrorTitle")}
          </h3>
          <p className="mt-1 text-sm leading-6 text-foreground/68">{loadError}</p>
          <Button
            type="button"
            variant="outline"
            className="mt-4 rounded-full"
            onClick={() => void loadPolicy()}
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            {t("actions.retry")}
          </Button>
        </div>
      )}

      {cannotRead && (
        <p className="mt-5 rounded-xl border border-blush/24 bg-background/34 p-4 text-sm leading-6 text-foreground/68">
          {t("manager.cancellationPolicy.currentValueUnavailable")}
        </p>
      )}

      {cutoffHours !== null && (
        <div className="mt-5 rounded-xl border border-blush/24 bg-background/34 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
            {t("manager.cancellationPolicy.currentCutoff")}
          </p>
          <p className="mt-2 font-serif text-2xl">{formatCutoff(cutoffHours)}</p>
        </div>
      )}

      {!isLoading && (loadStatus !== "error" || canUpdateCancellationPolicy) && (
        <div className="mt-5 rounded-xl border border-blush/18 bg-background/34 p-4">
          <p className="text-sm leading-6 text-foreground/68">
            {t("manager.cancellationPolicy.effect")}
          </p>
        </div>
      )}

      {canUpdateCancellationPolicy && !isLoading && (
        <form className="mt-5 grid gap-4 sm:max-w-md" onSubmit={savePolicy}>
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
              {t("manager.cancellationPolicy.inputLabel")}
            </span>
            <input
              type="number"
              inputMode="numeric"
              step="any"
              required
              className="h-11 rounded-xl border border-blush/24 bg-background/70 px-3 text-sm text-foreground outline-none focus:border-blush-strong"
              value={draftHours}
              disabled={saving}
              onChange={(event) => {
                setDraftHours(event.target.value);
                setMutationError(null);
                setNotice(null);
              }}
            />
          </label>
          {mutationError && (
            <p className="rounded-xl border border-blush-strong/35 bg-background/46 p-3 text-sm leading-6 text-blush-strong" role="alert">
              {mutationError}
            </p>
          )}
          {notice && (
            <p className="flex items-start gap-2 rounded-xl border border-blush/24 bg-background/46 p-3 text-sm leading-6 text-foreground/72" role="status">
              <Check className="mt-0.5 size-4 shrink-0 text-blush-strong" aria-hidden="true" />
              {notice}
            </p>
          )}
          <Button type="submit" className="w-full rounded-full sm:w-fit" disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
            {saving ? t("manager.cancellationPolicy.saving") : t("actions.save")}
          </Button>
        </form>
      )}

      {!canUpdateCancellationPolicy && !isLoading && loadStatus !== "error" && (
        <p className="mt-5 text-sm leading-6 text-foreground/58">
          {t("manager.cancellationPolicy.updateNotAllowed")}
        </p>
      )}
    </section>
  );
}

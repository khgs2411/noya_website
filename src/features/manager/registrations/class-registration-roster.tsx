import {
  ClassKitManagerApiError,
  type ClassKitClient,
  type ManagementRegistrationSummary,
} from "@class-kit/react";
import {
  AlertCircle,
  Check,
  Loader2,
  RefreshCw,
  UserMinus,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  getCustomerContact,
  getCustomerLabel,
} from "@/features/customers/customer-labels";
import { CustomerPicker } from "@/features/manager/customers/customer-picker";
import { useCustomerDirectory } from "@/features/manager/customers/use-customer-directory";

type LoadStatus = "idle" | "loading" | "loaded" | "error";
type Mutation = "register" | "deregister" | null;

type ClassRegistrationRosterProps = {
  client: ClassKitClient | null;
  classId: string;
  canManageRegistrations: boolean;
  canReadCustomers: boolean;
  refreshKey?: number;
  onChanged?: () => void | Promise<void>;
};

function getRegistrationLabel(
  registration: ManagementRegistrationSummary,
  unnamedLabel: string,
) {
  if (registration.customer) {
    return getCustomerLabel(registration.customer, unnamedLabel);
  }

  return (
    registration.user?.displayName?.trim() ??
    registration.user?.email?.trim() ??
    unnamedLabel
  );
}

function getRegistrationContact(registration: ManagementRegistrationSummary) {
  return registration.customer
    ? getCustomerContact(registration.customer)
    : registration.user?.email?.trim() || null;
}

function getMutationErrorMessage(
  error: unknown,
  t: (key: string) => string,
) {
  const code = error instanceof ClassKitManagerApiError ? error.code : null;
  const message = error instanceof Error ? error.message : "";

  if (code === "customer_inactive" || message.includes("customer_inactive")) {
    return t("manager.registrations.errors.customerInactive");
  }

  if (message.includes("membership_required")) {
    return t("manager.registrations.errors.membershipRequired");
  }

  if (message.includes("membership_not_eligible")) {
    return t("manager.registrations.errors.membershipNotEligible");
  }

  if (message.includes("membership_stock_depleted")) {
    return t("manager.registrations.errors.membershipStockDepleted");
  }

  if (message.includes("class_capacity_full")) {
    return t("manager.registrations.errors.classFull");
  }

  if (
    message.includes("class_not_registerable") ||
    message === "This class is no longer open for registration changes."
  ) {
    return t("manager.registrations.errors.classNotRegisterable");
  }

  if (message.includes("registration_not_cancellable")) {
    return t("manager.registrations.errors.deregistrationUnavailable");
  }

  if (
    message.includes("registration_exists") ||
    message.includes("live_registration_exists") ||
    message.includes("registration_not_found") ||
    code === "conflict" ||
    code === "not_found"
  ) {
    return t("manager.registrations.errors.stale");
  }

  if (code === "forbidden") {
    return t("manager.registrations.errors.forbidden");
  }

  return t("manager.registrations.errors.actionFailed");
}

export function ClassRegistrationRoster({
  client,
  classId,
  canManageRegistrations,
  canReadCustomers,
  refreshKey = 0,
  onChanged,
}: ClassRegistrationRosterProps) {
  const { t } = useTranslation();
  const [registrations, setRegistrations] = useState<ManagementRegistrationSummary[]>([]);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [mutation, setMutation] = useState<Mutation>(null);
  const [confirmingCustomerId, setConfirmingCustomerId] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const clearSelection = useCallback(() => setSelectedCustomerId(""), []);
  const directory = useCustomerDirectory({
    client,
    canReadCustomers,
    onForbidden: clearSelection,
    initialFilter: "active",
  });
  const selectedCustomer = useMemo(
    () => directory.records.find(
      (customer) => customer.customerId === selectedCustomerId,
    ) ?? null,
    [directory.records, selectedCustomerId],
  );
  const selectedCustomerRegistered = Boolean(
    selectedCustomer && registrations.some(
      (registration) => registration.customerId === selectedCustomer.customerId,
    ),
  );

  const loadRegistered = useCallback(async (options?: { silent?: boolean }) => {
    if (!client || !canManageRegistrations) {
      requestIdRef.current += 1;
      setRegistrations([]);
      setLoadStatus("idle");
      setErrorMessage(null);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    if (!options?.silent) {
      setLoadStatus("loading");
      setErrorMessage(null);
    }

    try {
      const result = await client.management.registrations.listRegistered({ classId });
      if (requestId !== requestIdRef.current) return;

      setRegistrations(result.registrations);
      setLoadStatus("loaded");
      setErrorMessage(null);
    } catch (error) {
      if (requestId !== requestIdRef.current || options?.silent) return;

      setErrorMessage(
        error instanceof Error ? error.message : t("manager.registrations.errorBody"),
      );
      setLoadStatus("error");
    }
  }, [canManageRegistrations, classId, client, t]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadRegistered({ silent: refreshKey > 0 });
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      requestIdRef.current += 1;
    };
  }, [loadRegistered, refreshKey]);

  const notifyChanged = useCallback(() => {
    void Promise.resolve(onChanged?.()).catch(() => {
      // The registration mutation already succeeded; linked surfaces can retry their refresh.
    });
  }, [onChanged]);

  async function registerCustomer() {
    if (
      !client ||
      !canManageRegistrations ||
      !canReadCustomers ||
      directory.accessChanged ||
      !selectedCustomer ||
      selectedCustomerRegistered ||
      mutation
    ) {
      return;
    }

    setMutation("register");
    setOperationError(null);

    try {
      const result = await client.management.registrations.registerCustomer({
        customerId: selectedCustomer.customerId,
        classId,
      });
      setRegistrations((current) => [
        ...current.filter((registration) => registration.id !== result.registration.id),
        result.registration,
      ]);
      clearSelection();
      void loadRegistered({ silent: true });
      notifyChanged();
    } catch (error) {
      setOperationError(getMutationErrorMessage(error, t));
    } finally {
      setMutation(null);
    }
  }

  async function deregisterCustomer(registration: ManagementRegistrationSummary) {
    if (!client || !canManageRegistrations || mutation) return;

    setMutation("deregister");
    setOperationError(null);

    try {
      await client.management.registrations.deregisterCustomer({
        customerId: registration.customerId,
        classId,
      });
      setRegistrations((current) => current.filter((item) => item.id !== registration.id));
      setConfirmingCustomerId(null);
      void loadRegistered({ silent: true });
      notifyChanged();
    } catch (error) {
      setOperationError(getMutationErrorMessage(error, t));
    } finally {
      setMutation(null);
    }
  }

  if (!canManageRegistrations) return null;

  return (
    <section className="mt-5 rounded-[1.2rem] border border-blush/24 bg-card/50 p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blush-strong/18 text-blush-strong">
            <UsersRound className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-serif text-xs uppercase tracking-[0.25em] text-foreground/48">
              {t("manager.registrations.eyebrow")}
            </p>
            <h3 className="mt-1 font-serif text-2xl text-foreground">
              {t("manager.registrations.title")}
            </h3>
            <p className="mt-1 text-sm leading-6 text-foreground/68">
              {t("manager.registrations.body")}
            </p>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="ms-auto shrink-0 rounded-full"
          disabled={loadStatus === "loading"}
          onClick={() => void loadRegistered()}
        >
          <RefreshCw
            className={`size-4 ${loadStatus === "loading" ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          {t("manager.registrations.refresh")}
        </Button>
      </div>

      {operationError && (
        <div className="mt-4 rounded-xl border border-blush/24 bg-background/46 p-3 text-sm leading-6 text-blush-strong">
          <p>{operationError}</p>
          <p className="mt-1 text-foreground/68">{t("manager.registrations.retryHint")}</p>
        </div>
      )}

      {canReadCustomers ? (
        <div className="mt-4 rounded-xl border border-blush/24 bg-background/30 p-3">
          <div className="mb-3">
            <h4 className="font-serif text-xl text-foreground">
              {t("manager.registrations.addTitle")}
            </h4>
            <p className="mt-1 text-sm leading-6 text-foreground/68">
              {t("manager.registrations.addBody")}
            </p>
          </div>
          <CustomerPicker
            directory={directory}
            selectedCustomerId={selectedCustomerId}
            onSelectCustomer={setSelectedCustomerId}
            onClearSelection={clearSelection}
            filterOptions={["active"]}
            variant="compact"
          />
          {selectedCustomerRegistered && (
            <p className="mt-3 rounded-xl border border-blush/24 bg-card/40 p-3 text-sm leading-6 text-foreground/68">
              {t("manager.registrations.alreadyRegistered")}
            </p>
          )}
          <Button
            type="button"
            className="mt-3 w-full rounded-full sm:w-auto"
            disabled={
              !selectedCustomer ||
              selectedCustomerRegistered ||
              Boolean(mutation) ||
              directory.accessChanged
            }
            onClick={() => void registerCustomer()}
          >
            {mutation === "register" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <UserPlus className="size-4" aria-hidden="true" />
            )}
            {t("manager.registrations.add")}
          </Button>
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-blush/24 bg-background/46 p-3 text-sm leading-6 text-foreground/68">
          {t("manager.registrations.customerDirectoryUnavailable")}
        </p>
      )}

      {loadStatus === "loading" && (
        <p className="mt-4 rounded-xl border border-blush/24 bg-background/46 p-4 text-sm text-foreground/68">
          <Loader2 className="me-2 inline size-4 animate-spin text-blush-strong" aria-hidden="true" />
          {t("manager.registrations.loading")}
        </p>
      )}

      {loadStatus === "error" && (
        <div className="mt-4 rounded-xl border border-blush/24 bg-background/46 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-blush-strong" aria-hidden="true" />
            <div className="min-w-0">
              <p className="font-serif text-xl text-foreground">{t("manager.registrations.errorTitle")}</p>
              <p className="mt-2 text-sm leading-6 text-foreground/68">
                {errorMessage ?? t("manager.registrations.errorBody")}
              </p>
              <Button type="button" variant="outline" className="mt-4 rounded-full" onClick={() => void loadRegistered()}>
                <RefreshCw className="size-4" aria-hidden="true" />
                {t("manager.registrations.retry")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {loadStatus === "loaded" && registrations.length === 0 && (
        <p className="mt-4 rounded-xl border border-blush/24 bg-background/46 p-4 text-sm leading-6 text-foreground/68">
          {t("manager.registrations.empty")}
        </p>
      )}

      {loadStatus === "loaded" && registrations.length > 0 && (
        <div className="mt-4 grid gap-3">
          {registrations.map((registration) => {
            const confirming = confirmingCustomerId === registration.customerId;
            const contact = getRegistrationContact(registration);
            const deregistering = mutation === "deregister" && confirming;

            return (
              <article key={registration.id} className="rounded-xl border border-blush/24 bg-background/46 p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="break-words font-serif text-xl text-foreground [overflow-wrap:anywhere]">
                      {getRegistrationLabel(registration, t("manager.customers.unnamed"))}
                    </p>
                    {contact && (
                      <p className="mt-1 break-words text-sm text-foreground/60 [overflow-wrap:anywhere]">{contact}</p>
                    )}
                  </div>
                  {!confirming ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="w-full rounded-full sm:w-auto"
                      disabled={Boolean(mutation)}
                      onClick={() => setConfirmingCustomerId(registration.customerId)}
                    >
                      <UserMinus className="size-4" aria-hidden="true" />
                      {t("manager.registrations.deregister")}
                    </Button>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        disabled={Boolean(mutation)}
                        onClick={() => setConfirmingCustomerId(null)}
                      >
                        <X className="size-4" aria-hidden="true" />
                        {t("actions.cancel")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-full"
                        disabled={Boolean(mutation)}
                        onClick={() => void deregisterCustomer(registration)}
                      >
                        {deregistering ? (
                          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <Check className="size-4" aria-hidden="true" />
                        )}
                        {t("manager.registrations.confirmDeregister")}
                      </Button>
                    </div>
                  )}
                </div>
                {confirming && (
                  <p className="mt-3 text-sm leading-6 text-foreground/68">
                    {t("manager.registrations.confirmDeregisterBody")}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

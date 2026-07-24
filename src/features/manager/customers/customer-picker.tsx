import { Loader2, RefreshCw, UsersRound } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  getCustomerContact,
  getCustomerInitials,
  getCustomerLabel,
} from "@/features/customers/customer-labels";
import type {
  CustomerDirectoryFilter,
  CustomerDirectoryState,
} from "@/features/manager/customers/use-customer-directory";

type CustomerPickerProps = {
  directory: CustomerDirectoryState;
  selectedCustomerId: string;
  onSelectCustomer: (customerId: string) => void;
  onClearSelection: () => void;
  variant?: "full" | "compact";
};

const filters: CustomerDirectoryFilter[] = ["all", "active", "inactive"];

export function CustomerPicker({
  directory,
  selectedCustomerId,
  onSelectCustomer,
  onClearSelection,
  variant = "full",
}: CustomerPickerProps) {
  const { t } = useTranslation();
  const compact = variant === "compact";

  useEffect(() => {
    if (
      directory.accessChanged ||
      (selectedCustomerId && !directory.records.some(
        (customer) => customer.customerId === selectedCustomerId,
      ))
    ) {
      onClearSelection();
    }
  }, [directory.accessChanged, directory.records, onClearSelection, selectedCustomerId]);

  const resetThen = (action: () => void) => {
    onClearSelection();
    action();
  };

  if (directory.accessChanged) {
    return (
      <div className="rounded-xl border border-blush/24 bg-card/40 p-3 text-sm leading-6 text-foreground/68">
        <p>{t("manager.customers.accessChanged")}</p>
        <Button type="button" size="sm" variant="outline" className="mt-3 rounded-full" onClick={directory.retry}>
          {t("manager.customers.retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className={compact ? "grid gap-3" : "rounded-[1.2rem] border border-blush/22 bg-background/30 p-3 sm:p-4"}>
      {!compact && (
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-blush-strong/18 text-blush-strong">
            <UsersRound className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-serif text-2xl text-foreground">{t("manager.customers.title")}</h3>
            <p className="text-sm text-foreground/58">{t("manager.customers.body")}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {filters.map((filter) => (
          <Button
            key={filter}
            type="button"
            size="sm"
            variant={directory.filter === filter ? "default" : "outline"}
            className="rounded-full"
            disabled={directory.loadStatus === "loading"}
            onClick={() => resetThen(() => directory.setFilter(filter))}
          >
            {t(`manager.customers.filters.${filter}`)}
          </Button>
        ))}
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="ms-auto size-9 rounded-full"
          disabled={directory.loadStatus === "loading"}
          onClick={() => directory.refresh()}
          aria-label={t("manager.customers.refresh")}
        >
          {directory.loadStatus === "loading" ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
        </Button>
      </div>

      {directory.error && (
        <div className="rounded-xl border border-blush/24 bg-card/40 p-3 text-sm leading-6 text-blush-strong">
          <p>{t("manager.customers.errorBody")}</p>
          <Button type="button" size="sm" variant="outline" className="mt-3 rounded-full" onClick={directory.retry}>
            {t("manager.customers.retry")}
          </Button>
        </div>
      )}

      {directory.loadStatus === "loading" && directory.records.length === 0 ? (
        <p className="rounded-xl border border-blush/24 bg-card/40 p-3 text-sm text-foreground/68">
          <Loader2 className="me-2 inline size-4 animate-spin" />
          {t("manager.customers.loading")}
        </p>
      ) : directory.records.length === 0 ? (
        <p className="rounded-xl border border-blush/24 bg-card/40 p-3 text-sm leading-6 text-foreground/60">
          {t("manager.customers.empty")}
        </p>
      ) : (
        <div className={compact ? "grid gap-2" : "grid max-h-[38rem] gap-2 overflow-y-auto pe-1"}>
          {directory.records.map((customer) => {
            const selected = customer.customerId === selectedCustomerId;
            const label = getCustomerLabel(customer, t("manager.customers.unnamed"));
            const contact = getCustomerContact(customer);
            return (
              <button
                key={customer.customerId}
                type="button"
                className={[
                  "grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl border p-3 text-start transition-colors",
                  selected ? "border-blush-strong bg-blush-strong/14" : "border-blush/20 bg-card/42 hover:border-blush-strong/55",
                ].join(" ")}
                aria-pressed={selected}
                onClick={() => onSelectCustomer(customer.customerId)}
              >
                <span className="min-w-0">
                  <span className="block break-words font-serif text-lg leading-5 text-foreground [overflow-wrap:anywhere]">{label}</span>
                  {contact && <span className="mt-1 block break-words text-sm text-foreground/60 [overflow-wrap:anywhere]">{contact}</span>}
                  <span className="mt-2 inline-flex rounded-full border border-blush/18 px-2 py-0.5 text-xs font-semibold text-foreground/50">
                    {t(`manager.customers.lifecycle.${customer.status}`)} · {customer.userId ? t("manager.customers.linked") : t("manager.customers.unlinked")}
                  </span>
                </span>
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blush-strong/24 font-serif text-sm text-foreground">
                  {getCustomerInitials(customer, t("manager.customers.unnamed"))}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex justify-between gap-2">
        <Button type="button" size="sm" variant="outline" className="rounded-full" disabled={!directory.canGoPrevious || directory.loadStatus === "loading"} onClick={() => resetThen(directory.previous)}>{t("manager.customers.previous")}</Button>
        <Button type="button" size="sm" variant="outline" className="rounded-full" disabled={!directory.canGoNext || directory.loadStatus === "loading"} onClick={() => resetThen(directory.next)}>{t("manager.customers.next")}</Button>
      </div>
    </div>
  );
}

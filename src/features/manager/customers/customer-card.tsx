import type { Customer } from "@class-kit/react";
import { ChevronLeft, Link2, Unlink } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  getCustomerContact,
  getCustomerInitials,
  getCustomerLabel,
  getCustomerOriginKey,
} from "@/features/customers/customer-labels";

export function CustomerCard({
  customer,
  onSelect,
}: {
  customer: Customer;
  onSelect: (customerId: string) => void;
}) {
  const { t } = useTranslation();
  const label = getCustomerLabel(customer, t("manager.customers.unnamed"));
  const contact = getCustomerContact(customer);
  const linked = customer.userId !== null;

  return (
    <button
      type="button"
      className="flex min-w-0 items-center gap-3 rounded-xl border border-blush/18 bg-background/32 p-3 text-start transition hover:border-blush-strong/45 hover:bg-blush/10"
      onClick={() => onSelect(customer.customerId)}
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-blush/28 font-serif text-foreground">
        {getCustomerInitials(customer, t("manager.customers.unnamed"))}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block break-words font-semibold text-foreground">
          {label}
        </span>
        {contact && (
          <span className="mt-0.5 block text-sm text-foreground/62 [overflow-wrap:anywhere]">
            {contact}
          </span>
        )}
        <span className="mt-2 flex flex-wrap gap-1.5 text-xs text-foreground/58">
          <span className="rounded-full bg-background/64 px-2 py-1">
            {t(`manager.customers.lifecycle.${customer.status}`)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-background/64 px-2 py-1">
            {linked ? <Link2 className="size-3" /> : <Unlink className="size-3" />}
            {t(linked ? "manager.customers.linked" : "manager.customers.unlinked")}
          </span>
          <span className="rounded-full bg-background/64 px-2 py-1">
            {t(`manager.customers.origin.${getCustomerOriginKey(customer.customerOrigin)}`)}
          </span>
        </span>
      </span>
      <ChevronLeft className="size-4 shrink-0 text-foreground/48 rtl:rotate-180" aria-hidden="true" />
    </button>
  );
}

import {
  CalendarDays,
  Clock3,
  FileText,
  MessageSquareText,
  Layers3,
  Menu,
  Repeat,
  Settings2,
  UsersRound,
  WalletCards,
  ShieldCheck,
} from "lucide-react";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ManagerTab =
  | "classes"
  | "pending"
  | "templates"
  | "schedules"
  | "documents"
  | "memberships"
  | "customers"
  | "permissions"
  | "change-requests"
  | "settings";

const primaryTabs: Array<{
  id: ManagerTab;
  icon: typeof CalendarDays;
  labelKey: string;
}> = [
  { id: "classes", icon: CalendarDays, labelKey: "manager.tabs.classes" },
  { id: "pending", icon: Clock3, labelKey: "manager.tabs.pending" },
  { id: "customers", icon: UsersRound, labelKey: "manager.tabs.customers" },
];

const moreTabs: Array<{
  id: ManagerTab;
  icon: typeof CalendarDays;
  labelKey: string;
}> = [
  { id: "templates", icon: Layers3, labelKey: "manager.tabs.templates" },
  { id: "schedules", icon: Repeat, labelKey: "manager.tabs.schedules" },
  { id: "documents", icon: FileText, labelKey: "manager.tabs.documents" },
  {
    id: "memberships",
    icon: WalletCards,
    labelKey: "manager.tabs.memberships",
  },
];

type ManagerTabsProps = {
  activeTab: ManagerTab;
  onChange: (tab: ManagerTab) => void;
  canAccessCustomers: boolean;
  canManageRoles: boolean;
  canManageChangeRequests: boolean;
  canAccessCancellationPolicy: boolean;
};

export function ManagerTabs({
  activeTab,
  onChange,
  canAccessCustomers,
  canManageRoles,
  canManageChangeRequests,
  canAccessCancellationPolicy,
}: ManagerTabsProps) {
  const { t } = useTranslation();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreMenuId = useId();
  const visiblePrimaryTabs = primaryTabs.filter(
    (tab) => tab.id !== "customers" || canAccessCustomers,
  );
  const visibleMoreTabs = [
    ...moreTabs,
    ...(canManageRoles
      ? [
          {
            id: "permissions" as const,
            icon: ShieldCheck,
            labelKey: "manager.tabs.permissions",
          },
        ]
      : []),
    ...(canAccessCancellationPolicy
      ? [
          {
            id: "settings" as const,
            icon: Settings2,
            labelKey: "manager.tabs.settings",
          },
        ]
      : []),
    ...(canManageChangeRequests
      ? [
        {
          id: "change-requests" as const,
          icon: MessageSquareText,
          labelKey: "manager.tabs.changeRequests",
        },
      ]
      : []),
  ];
  const moreIsActive = visibleMoreTabs.some((tab) => tab.id === activeTab);

  function selectTab(tab: ManagerTab) {
    onChange(tab);
    setMoreOpen(false);
  }

  return (
    <div className="relative rounded-[1.2rem] border border-blush/24 bg-card/78 p-1">
      <div className="grid grid-cols-2 gap-1 sm:grid-cols-4 sm:gap-2">
        {visiblePrimaryTabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.id === activeTab;

          return (
            <Button
              key={tab.id}
              type="button"
              variant="ghost"
              className={cn(
                "h-10 min-w-12 shrink-0 gap-2 rounded-xl px-3 font-serif text-sm lg:min-w-0",
                "w-full",
                active &&
                  "bg-blush-strong text-background hover:bg-blush-strong/90 hover:text-background",
              )}
              aria-pressed={active}
              onClick={() => selectTab(tab.id)}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{t(tab.labelKey)}</span>
            </Button>
          );
        })}
        <Button
          type="button"
          variant="ghost"
          className={cn(
            "h-10 w-full gap-2 rounded-xl px-3 font-serif text-sm",
            (moreOpen || moreIsActive) &&
              "bg-blush-strong text-background hover:bg-blush-strong/90 hover:text-background",
          )}
          aria-expanded={moreOpen}
          aria-controls={moreMenuId}
          onClick={() => setMoreOpen((open) => !open)}
        >
          <Menu className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{t("manager.tabs.more")}</span>
        </Button>
      </div>

      {moreOpen && (
        <div
          id={moreMenuId}
          className="mt-2 grid gap-2 rounded-xl border border-blush/20 bg-background/42 p-2 sm:grid-cols-2"
          aria-label={t("manager.tabs.moreMenuLabel")}
        >
          {visibleMoreTabs.map((tab) => {
            const Icon = tab.icon;
            const active = tab.id === activeTab;

            return (
              <Button
                key={tab.id}
                type="button"
                variant="ghost"
                className={cn(
                  "h-12 justify-start gap-3 rounded-xl px-4 font-serif text-sm",
                  active &&
                    "bg-blush-strong text-background hover:bg-blush-strong/90 hover:text-background",
                )}
                aria-pressed={active}
                onClick={() => selectTab(tab.id)}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{t(tab.labelKey)}</span>
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}

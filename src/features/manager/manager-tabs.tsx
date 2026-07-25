import {
  CalendarDays,
  Clock3,
  FileText,
  MessageSquareText,
  Layers3,
  Repeat,
  Settings2,
  UsersRound,
  WalletCards,
  ShieldCheck,
} from "lucide-react";
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
  const visiblePrimaryTabs = primaryTabs.filter(
    (tab) => tab.id !== "customers" || canAccessCustomers,
  );
  const visibleTabs = [
    ...visiblePrimaryTabs,
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

  function selectTab(tab: ManagerTab) {
    onChange(tab);
  }

  return (
    <nav
      className="w-full min-w-0 max-w-full overflow-hidden rounded-[1.2rem] border border-blush/24 bg-card/78 p-1 lg:h-fit lg:w-48 lg:shrink-0 lg:p-2"
      aria-label={t("manager.menu")}
    >
      <div className="flex w-full min-w-0 max-w-full gap-1 overflow-x-auto overscroll-x-contain lg:flex-col lg:overflow-visible">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.id === activeTab;

          return (
            <Button
              key={tab.id}
              type="button"
              variant="ghost"
              className={cn(
                "h-9 min-w-max shrink-0 justify-start gap-2 rounded-lg px-3 font-serif text-sm whitespace-nowrap lg:w-full lg:min-w-0 lg:whitespace-normal",
                active &&
                  "bg-blush-strong text-background hover:bg-blush-strong/90 hover:text-background",
              )}
              aria-pressed={active}
              onClick={() => selectTab(tab.id)}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span className="lg:text-start">{t(tab.labelKey)}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}

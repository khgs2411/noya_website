import { CalendarDays, Clock3, FileText, Layers3, Repeat, UserCog, WalletCards } from "lucide-react";
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
  | "users";

const tabs: Array<{
  id: ManagerTab;
  icon: typeof CalendarDays;
  labelKey: string;
}> = [
  { id: "classes", icon: CalendarDays, labelKey: "manager.tabs.classes" },
  { id: "pending", icon: Clock3, labelKey: "manager.tabs.pending" },
  { id: "templates", icon: Layers3, labelKey: "manager.tabs.templates" },
  { id: "schedules", icon: Repeat, labelKey: "manager.tabs.schedules" },
  { id: "documents", icon: FileText, labelKey: "manager.tabs.documents" },
  { id: "memberships", icon: WalletCards, labelKey: "manager.tabs.memberships" },
  { id: "users", icon: UserCog, labelKey: "manager.tabs.users" },
];

type ManagerTabsProps = {
  activeTab: ManagerTab;
  onChange: (tab: ManagerTab) => void;
};

export function ManagerTabs({ activeTab, onChange }: ManagerTabsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex max-w-full gap-1 overflow-x-auto rounded-[1.2rem] border border-blush/24 bg-card/78 p-1 lg:grid lg:grid-cols-7 lg:gap-2 lg:overflow-visible">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = tab.id === activeTab;

        return (
          <Button
            key={tab.id}
            type="button"
            variant="ghost"
            className={cn(
              "h-10 min-w-12 shrink-0 gap-2 rounded-xl px-3 font-serif text-sm lg:min-w-0",
              active ? "min-w-28" : "w-12 px-0 lg:w-auto lg:px-3",
              active && "bg-blush-strong text-background hover:bg-blush-strong/90 hover:text-background",
            )}
            aria-pressed={active}
            onClick={() => onChange(tab.id)}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span className={cn("truncate", !active && "sr-only lg:not-sr-only")}>
              {t(tab.labelKey)}
            </span>
          </Button>
        );
      })}
    </div>
  );
}

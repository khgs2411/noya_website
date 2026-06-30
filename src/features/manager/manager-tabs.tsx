import { CalendarDays, Layers3, Repeat } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ManagerTab = "classes" | "templates" | "schedules";

const tabs: Array<{
  id: ManagerTab;
  icon: typeof CalendarDays;
  labelKey: string;
}> = [
  { id: "classes", icon: CalendarDays, labelKey: "manager.tabs.classes" },
  { id: "templates", icon: Layers3, labelKey: "manager.tabs.templates" },
  { id: "schedules", icon: Repeat, labelKey: "manager.tabs.schedules" },
];

type ManagerTabsProps = {
  activeTab: ManagerTab;
  onChange: (tab: ManagerTab) => void;
};

export function ManagerTabs({ activeTab, onChange }: ManagerTabsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-3 gap-2 rounded-[1.4rem] border border-blush/24 bg-card/78 p-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = tab.id === activeTab;

        return (
          <Button
            key={tab.id}
            type="button"
            variant="ghost"
            className={cn(
              "h-11 min-w-0 gap-2 rounded-xl px-2 font-serif text-sm",
              active && "bg-blush-strong text-background hover:bg-blush-strong/90 hover:text-background",
            )}
            aria-pressed={active}
            onClick={() => onChange(tab.id)}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{t(tab.labelKey)}</span>
          </Button>
        );
      })}
    </div>
  );
}

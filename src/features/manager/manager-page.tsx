import { useProductContext } from "@class-kit/react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ClassManagementTab } from "@/features/manager/classes/class-management-tab";
import { ManagerTabs, type ManagerTab } from "@/features/manager/manager-tabs";

function ComingNextPanel({ kind }: { kind: "templates" | "schedules" }) {
  const { t } = useTranslation();

  return (
    <section className="rounded-[1.4rem] border border-blush/24 bg-card/78 p-5 shadow-soft sm:p-6">
      <p className="font-serif text-xs uppercase tracking-[0.25em] text-foreground/48">
        {t(`manager.tabs.${kind}`)}
      </p>
      <h2 className="mt-2 font-serif text-3xl text-foreground">
        {t(`manager.${kind}.title`)}
      </h2>
      <p className="mt-3 max-w-prose text-sm leading-6 text-foreground/68">
        {t(`manager.${kind}.body`)}
      </p>
    </section>
  );
}

export function ManagerPage({ loading = false }: { loading?: boolean }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ManagerTab>("classes");
  const { capabilities } = useProductContext();
  const canManageClasses = Boolean(
    capabilities.dashboard.can_manage_classes,
  );

  return (
    <main className="min-h-screen bg-background px-5 pb-12 pt-6 text-foreground sm:px-8">
      <div className="mx-auto max-w-5xl">
        <a
          href="./"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blush-strong underline-offset-4 hover:underline"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" />
          {t("actions.back")}
        </a>

        {loading ? (
          <section className="mt-7 rounded-[1.4rem] border border-blush/24 bg-card/78 p-5 shadow-soft">
            <div className="flex items-center gap-3 text-sm text-foreground/68">
              <Loader2
                className="size-4 shrink-0 animate-spin text-blush-strong"
                aria-hidden="true"
              />
              {t("manager.loadingBody")}
            </div>
          </section>
        ) : (
          <section className="mt-7 flex flex-col gap-4">
            <ManagerTabs activeTab={activeTab} onChange={setActiveTab} />
            {activeTab === "classes" && (
              <ClassManagementTab canManageClasses={canManageClasses} />
            )}
            {activeTab === "templates" && <ComingNextPanel kind="templates" />}
            {activeTab === "schedules" && <ComingNextPanel kind="schedules" />}
          </section>
        )}
      </div>
    </main>
  );
}

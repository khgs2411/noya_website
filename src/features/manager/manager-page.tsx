import { useProductContext } from "@class-kit/react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ClassManagementTab } from "@/features/manager/classes/class-management-tab";
import { ManagerTabs, type ManagerTab } from "@/features/manager/manager-tabs";
import { PendingRegistrationManagementTab } from "@/features/manager/registrations/pending-registration-management-tab";
import { ScheduleManagementTab } from "@/features/manager/schedules/schedule-management-tab";
import { TemplateManagementTab } from "@/features/manager/templates/template-management-tab";
import { UserRoleManagementTab } from "@/features/manager/users/user-role-management-tab";

export type ManagerAccessSnapshot = {
  dashboard: {
    can_manage_classes: boolean;
    can_manage_roles: boolean;
    can_manage_users: boolean;
  };
  permissions: string[];
};

export function ManagerPage({
  loading = false,
  accessSnapshot = null,
}: {
  loading?: boolean;
  accessSnapshot?: ManagerAccessSnapshot | null;
}) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ManagerTab>("classes");
  const { capabilities } = useProductContext();
  const managerAccess = accessSnapshot ?? capabilities;
  const canManageClasses = Boolean(
    managerAccess.dashboard.can_manage_classes,
  );
  const canManageRegistrations =
    managerAccess.permissions.includes("registrations.manage");
  const canManageAttendance =
    managerAccess.permissions.includes("attendance.manage");
  const canManageRoles = Boolean(managerAccess.dashboard.can_manage_roles);
  const canManageUsers = Boolean(managerAccess.dashboard.can_manage_users);

  return (
    <main className="min-h-screen bg-background px-4 pb-12 pt-5 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[95vw]">
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
              <ClassManagementTab
                canManageClasses={canManageClasses}
                canManageRegistrations={canManageRegistrations}
                canManageAttendance={canManageAttendance}
              />
            )}
            {activeTab === "pending" && (
              <PendingRegistrationManagementTab
                canManageRegistrations={canManageRegistrations}
              />
            )}
            {activeTab === "templates" && (
              <TemplateManagementTab canManageTemplates={canManageClasses} />
            )}
            {activeTab === "schedules" && (
              <ScheduleManagementTab canManageSchedules={canManageClasses} />
            )}
            {activeTab === "users" && (
              <UserRoleManagementTab
                canManageRoles={canManageRoles}
                canManageUsers={canManageUsers}
              />
            )}
          </section>
        )}
      </div>
    </main>
  );
}

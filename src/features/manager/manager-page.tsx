import { useProductContext } from "@class-kit/react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { useTranslation } from "react-i18next";

import { ManagerTabs, type ManagerTab } from "@/features/manager/manager-tabs";

const ClassManagementTab = lazy(() =>
  import("@/features/manager/classes/class-management-tab").then((module) => ({
    default: module.ClassManagementTab,
  })),
);
const MembershipManagementTab = lazy(() =>
  import("@/features/manager/memberships/membership-management-tab").then(
    (module) => ({
      default: module.MembershipManagementTab,
    }),
  ),
);
const PendingRegistrationManagementTab = lazy(() =>
  import(
    "@/features/manager/registrations/pending-registration-management-tab"
  ).then((module) => ({
    default: module.PendingRegistrationManagementTab,
  })),
);
const ScheduleManagementTab = lazy(() =>
  import("@/features/manager/schedules/schedule-management-tab").then(
    (module) => ({
      default: module.ScheduleManagementTab,
    }),
  ),
);
const TemplateManagementTab = lazy(() =>
  import("@/features/manager/templates/template-management-tab").then(
    (module) => ({
      default: module.TemplateManagementTab,
    }),
  ),
);
const UserRoleManagementTab = lazy(() =>
  import("@/features/manager/users/user-role-management-tab").then((module) => ({
    default: module.UserRoleManagementTab,
  })),
);

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
  onNavigate,
}: {
  loading?: boolean;
  accessSnapshot?: ManagerAccessSnapshot | null;
  onNavigate: (path: string) => void;
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
  const canManageMemberships =
    managerAccess.permissions.includes("memberships.manage");
  const canManageRoles = Boolean(managerAccess.dashboard.can_manage_roles);
  const canManageUsers = Boolean(managerAccess.dashboard.can_manage_users);
  const tabFallback = (
    <section className="rounded-[1.4rem] border border-blush/24 bg-card/78 p-5 shadow-soft">
      <div className="flex items-center gap-3 text-sm text-foreground/68">
        <Loader2
          className="size-4 shrink-0 animate-spin text-blush-strong"
          aria-hidden="true"
        />
        {t("manager.loadingBody")}
      </div>
    </section>
  );

  return (
    <main className="min-h-screen bg-background px-4 pb-12 pt-5 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-full lg:max-w-[95vw]">
        <button
          type="button"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blush-strong underline-offset-4 hover:underline"
          onClick={() => onNavigate("./")}
        >
          <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
          {t("actions.back")}
        </button>

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
            <Suspense fallback={tabFallback}>
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
              {activeTab === "memberships" && (
                <MembershipManagementTab
                  canManageMemberships={canManageMemberships}
                />
              )}
              {activeTab === "users" && (
                <UserRoleManagementTab
                  canManageRoles={canManageRoles}
                  canManageUsers={canManageUsers}
                />
              )}
            </Suspense>
          </section>
        )}
      </div>
    </main>
  );
}

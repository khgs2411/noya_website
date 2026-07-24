import { useProductContext } from "@class-kit/react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
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
const DocumentManagementTab = lazy(() =>
  import("@/features/manager/documents/document-management-tab").then(
    (module) => ({
      default: module.DocumentManagementTab,
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
  import("@/features/manager/users/user-role-management-tab").then(
    (module) => ({
      default: module.UserRoleManagementTab,
    }),
  ),
);
const PermissionManagementTab = lazy(() =>
  import("@/features/manager/permissions/permission-management-tab").then(
    (module) => ({
      default: module.PermissionManagementTab,
    }),
  ),
);
const ChangeRequestManagementTab = lazy(() =>
  import(
    "@/features/manager/change-requests/change-request-management-tab"
  ).then((module) => ({
    default: module.ChangeRequestManagementTab,
  })),
);
const CancellationPolicyManagementTab = lazy(() =>
  import(
    "@/features/manager/settings/cancellation-policy-management-tab"
  ).then((module) => ({
    default: module.CancellationPolicyManagementTab,
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
  const canManageClasses = Boolean(managerAccess.dashboard.can_manage_classes);
  const canManageRegistrations = managerAccess.permissions.includes(
    "registrations.manage",
  );
  const canManageAttendance =
    managerAccess.permissions.includes("attendance.manage");
  const canManageMemberships =
    managerAccess.permissions.includes("memberships.manage");
  const canManageDocuments = managerAccess.permissions.includes(
    "product_documents.manage",
  );
  const canManageRoles = Boolean(capabilities.dashboard.can_manage_roles);
  const canManageUsers = Boolean(capabilities.dashboard.can_manage_users);
  const canReadUsers = capabilities.permissions.includes("users.read");
  const canAccessUsers = canManageUsers && canReadUsers;
  const canManageChangeRequests =
    accessSnapshot === null &&
    capabilities.permissions.includes("product_change_requests.manage");
  const canAutocompleteLocations =
    accessSnapshot === null &&
    capabilities.permissions.includes("locations.autocomplete");
  const canReadCancellationPolicy = managerAccess.permissions.includes(
    "product.cancellation_policy.read",
  );
  const canUpdateCancellationPolicy = managerAccess.permissions.includes(
    "product.cancellation_policy.update",
  );
  const canAccessCancellationPolicy =
    canReadCancellationPolicy || canUpdateCancellationPolicy;
  const effectiveActiveTab =
    (activeTab === "users" && !canAccessUsers) ||
    (activeTab === "permissions" && !canManageRoles) ||
    (activeTab === "change-requests" && !canManageChangeRequests) ||
    (activeTab === "settings" && !canAccessCancellationPolicy)
      ? "classes"
      : activeTab;

  useEffect(() => {
    if (activeTab === effectiveActiveTab) return;

    const repairId = window.setTimeout(
      () => setActiveTab(effectiveActiveTab),
      0,
    );
    return () => window.clearTimeout(repairId);
  }, [activeTab, effectiveActiveTab]);
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
            <ManagerTabs
              activeTab={effectiveActiveTab}
              onChange={setActiveTab}
              canAccessUsers={canAccessUsers}
              canManageRoles={canManageRoles}
              canManageChangeRequests={canManageChangeRequests}
              canAccessCancellationPolicy={canAccessCancellationPolicy}
            />
            <Suspense fallback={tabFallback}>
              {effectiveActiveTab === "classes" && (
                <ClassManagementTab
                  canManageClasses={canManageClasses}
                  canManageRegistrations={canManageRegistrations}
                  canManageAttendance={canManageAttendance}
                  canAutocompleteLocations={canAutocompleteLocations}
                />
              )}
              {effectiveActiveTab === "pending" && (
                <PendingRegistrationManagementTab
                  canManageRegistrations={canManageRegistrations}
                />
              )}
              {effectiveActiveTab === "templates" && (
                <TemplateManagementTab
                  canManageTemplates={canManageClasses}
                  canAutocompleteLocations={canAutocompleteLocations}
                />
              )}
              {effectiveActiveTab === "schedules" && (
                <ScheduleManagementTab canManageSchedules={canManageClasses} />
              )}
              {effectiveActiveTab === "documents" && (
                <DocumentManagementTab
                  canManageDocuments={canManageDocuments}
                />
              )}
              {effectiveActiveTab === "memberships" && (
                <MembershipManagementTab
                  canManageMemberships={canManageMemberships}
                />
              )}
              {effectiveActiveTab === "users" && canAccessUsers && (
                <UserRoleManagementTab
                  canManageUsers={canManageUsers}
                  canReadUsers={canReadUsers}
                />
              )}
              {effectiveActiveTab === "permissions" && canManageRoles && (
                <PermissionManagementTab canManageRoles={canManageRoles} />
              )}
              {effectiveActiveTab === "change-requests" &&
                canManageChangeRequests && (
                  <ChangeRequestManagementTab
                    canManageChangeRequests={canManageChangeRequests}
                  />
                )}
              {effectiveActiveTab === "settings" &&
                canAccessCancellationPolicy && (
                  <CancellationPolicyManagementTab
                    canReadCancellationPolicy={canReadCancellationPolicy}
                    canUpdateCancellationPolicy={canUpdateCancellationPolicy}
                  />
                )}
            </Suspense>
          </section>
        )}
      </div>
    </main>
  );
}

import { useProductContext } from "@class-kit/react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { ManagerTabs, type ManagerTab } from "@/features/manager/manager-tabs";
import { cn } from "@/lib/utils";

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
const CustomerManagementTab = lazy(() =>
  import("@/features/manager/customers/customer-management-tab").then(
    (module) => ({
      default: module.CustomerManagementTab,
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
  const hasLiveCapabilities = accessSnapshot === null;
  const canReadCustomers =
    hasLiveCapabilities && capabilities.dashboard.can_read_customers;
  const canReadMemberships =
    hasLiveCapabilities && capabilities.dashboard.can_read_memberships;
  const canReadUsers =
    hasLiveCapabilities && capabilities.permissions.includes("users.read");
  const canManageUsers =
    hasLiveCapabilities &&
    capabilities.dashboard.can_manage_users &&
    capabilities.permissions.includes("product_user_roles.manage");
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
    (activeTab === "customers" && !canReadCustomers) ||
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
    <main className="min-h-screen overflow-x-clip bg-background px-4 pb-12 pt-5 text-foreground sm:px-6 lg:h-[calc(100dvh-3.5rem)] lg:min-h-0 lg:overflow-hidden lg:px-6 lg:pb-5 lg:pt-1">
      <div className="mx-auto w-full max-w-full lg:flex lg:h-full lg:max-w-[95vw] lg:min-w-0 lg:flex-col">
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
          <section className="mt-7 flex min-w-0 flex-col gap-4 lg:mt-3 lg:grid lg:min-h-0 lg:flex-1 lg:grid-cols-[12rem_minmax(0,1fr)] lg:items-stretch lg:gap-4">
            <ManagerTabs
              activeTab={effectiveActiveTab}
              onChange={setActiveTab}
              canAccessCustomers={canReadCustomers}
              canManageRoles={canManageRoles}
              canManageChangeRequests={canManageChangeRequests}
              canAccessCancellationPolicy={canAccessCancellationPolicy}
            />
            <div
              className={cn(
                "min-w-0",
                effectiveActiveTab === "change-requests"
                  ? "lg:h-full lg:min-h-0 lg:overflow-hidden"
                  : "lg:h-full lg:min-h-0 lg:overflow-y-auto lg:pe-2",
              )}
            >
              <Suspense fallback={tabFallback}>
                {effectiveActiveTab === "classes" && (
                  <ClassManagementTab
                    canManageClasses={canManageClasses}
                    canManageRegistrations={canManageRegistrations}
                    canManageAttendance={canManageAttendance}
                    canReadCustomers={canReadCustomers}
                    canReadUsers={canReadUsers}
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
                    canReadCustomers={canReadCustomers}
                    canReadMemberships={canReadMemberships}
                  />
                )}
                {effectiveActiveTab === "customers" && canReadCustomers && (
                  <CustomerManagementTab
                    canReadCustomers={canReadCustomers}
                    canReadMemberships={canReadMemberships}
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
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

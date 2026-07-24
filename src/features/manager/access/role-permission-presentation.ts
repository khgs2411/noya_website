import {
  BarChart3,
  CalendarDays,
  Gauge,
  Layers,
  type LucideIcon,
  UsersRound,
} from "lucide-react";

export type PermissionGroup = {
  id: string;
  labelKey: string;
  descriptionKey: string;
  permissionKeys: string[];
  icon: LucideIcon;
};

export const permissionGroups: PermissionGroup[] = [
  {
    id: "classManagement",
    labelKey: "manager.permissions.permissionGroups.classManagement",
    descriptionKey: "manager.permissions.permissionGroupDescriptions.classManagement",
    permissionKeys: [
      "classes.create",
      "classes.update",
      "classes.publish",
      "classes.draft",
      "classes.cancel",
      "classes.drafts.read",
      "classes.extra_fields.read",
    ],
    icon: CalendarDays,
  },
  {
    id: "scheduleManagement",
    labelKey: "manager.permissions.permissionGroups.scheduleManagement",
    descriptionKey: "manager.permissions.permissionGroupDescriptions.scheduleManagement",
    permissionKeys: [
      "schedules.manage",
      "templates.manage",
    ],
    icon: Layers,
  },
  {
    id: "registrationManagement",
    labelKey: "manager.permissions.permissionGroups.registrationManagement",
    descriptionKey: "manager.permissions.permissionGroupDescriptions.registrationManagement",
    permissionKeys: [
      "registrations.manage",
      "attendance.manage",
      "memberships.manage",
    ],
    icon: UsersRound,
  },
  {
    id: "staffManagement",
    labelKey: "manager.permissions.permissionGroups.staffManagement",
    descriptionKey: "manager.permissions.permissionGroupDescriptions.staffManagement",
    permissionKeys: [
      "users.read",
      "users.manage",
      "product_user_roles.manage",
      "product_roles.manage",
      "product_role_permissions.manage",
      "product_managers.manage",
    ],
    icon: BarChart3,
  },
  {
    id: "studioSettings",
    labelKey: "manager.permissions.permissionGroups.studioSettings",
    descriptionKey: "manager.permissions.permissionGroupDescriptions.studioSettings",
    permissionKeys: ["product.auth_mode.update"],
    icon: Gauge,
  },
];

export function filterAvailablePermissionGroups(availableKeys: Iterable<string>) {
  const keys = new Set(availableKeys);

  return permissionGroups
    .map((group) => ({
      ...group,
      permissionKeys: group.permissionKeys.filter((key) => keys.has(key)),
    }))
    .filter((group) => group.permissionKeys.length > 0);
}

export function summarizePermissionGroups(permissionKeys: Iterable<string>) {
  const keys = new Set(permissionKeys);

  return permissionGroups
    .map((group) => ({
      ...group,
      grantedCount: group.permissionKeys.filter((key) => keys.has(key)).length,
    }))
    .filter((group) => group.grantedCount > 0);
}

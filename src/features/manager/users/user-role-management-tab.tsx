import type {
  ProductManagedPermission,
  ProductManagedRole,
  ProductUserListItem,
} from "@class-kit/react";
import { useProductContext } from "@class-kit/react";
import {
  AlertCircle,
  BarChart3,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  Gauge,
  Layers,
  Loader2,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserCog,
  UsersRound,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  getUserDisplayName,
  getUserPhoneNumber,
  getUserSupportingEmail,
} from "@/features/users/user-labels";

type LoadStatus = "idle" | "loading" | "loaded" | "error";
type MutationStatus =
  | "idle"
  | "creatingRole"
  | "updatingRole"
  | "grantingPermission"
  | "revokingPermission"
  | "assigningRole"
  | "revokingRole";

type UserRoleManagementTabProps = {
  canManageRoles: boolean;
  canManageUsers: boolean;
};

type RoleForm = {
  name: string;
  levelPreset: RoleLevelPreset;
  customLevel: string;
  permissionGroups: string[];
};

type EditingRoleForm = {
  roleId: string;
  name: string;
  levelPreset: RoleLevelPreset;
  customLevel: string;
} | null;

type RoleLevelPreset = "coach" | "supervisor" | "manager" | "custom";

const rolesPanelStorageKey = "noya.manager.users.rolesPanelExpanded";

const roleLevelPresets: Array<{
  id: RoleLevelPreset;
  level: number | null;
  labelKey: string;
}> = [
  { id: "coach", level: 20, labelKey: "manager.users.rolePresets.coach" },
  {
    id: "supervisor",
    level: 40,
    labelKey: "manager.users.rolePresets.supervisor",
  },
  { id: "manager", level: 75, labelKey: "manager.users.rolePresets.manager" },
  { id: "custom", level: null, labelKey: "manager.users.rolePresets.custom" },
];

const permissionGroups: Array<{
  id: string;
  labelKey: string;
  descriptionKey: string;
  permissionKeys: string[];
}> = [
  {
    id: "classManagement",
    labelKey: "manager.users.permissionGroups.classManagement",
    descriptionKey: "manager.users.permissionGroupDescriptions.classManagement",
    permissionKeys: [
      "classes.create",
      "classes.update",
      "classes.publish",
      "classes.draft",
      "classes.cancel",
      "classes.drafts.read",
      "classes.extra_fields.read",
    ],
  },
  {
    id: "scheduleManagement",
    labelKey: "manager.users.permissionGroups.scheduleManagement",
    descriptionKey: "manager.users.permissionGroupDescriptions.scheduleManagement",
    permissionKeys: ["schedules.manage", "templates.manage"],
  },
  {
    id: "registrationManagement",
    labelKey: "manager.users.permissionGroups.registrationManagement",
    descriptionKey: "manager.users.permissionGroupDescriptions.registrationManagement",
    permissionKeys: [
      "registrations.manage",
      "attendance.manage",
      "memberships.manage",
    ],
  },
  {
    id: "staffManagement",
    labelKey: "manager.users.permissionGroups.staffManagement",
    descriptionKey: "manager.users.permissionGroupDescriptions.staffManagement",
    permissionKeys: [
      "product_users.read",
      "product_users.manage",
      "product_user_roles.manage",
      "product_roles.manage",
      "product_role_permissions.manage",
      "product_users.promote_manager",
    ],
  },
  {
    id: "studioSettings",
    labelKey: "manager.users.permissionGroups.studioSettings",
    descriptionKey: "manager.users.permissionGroupDescriptions.studioSettings",
    permissionKeys: ["product.auth_mode.update"],
  },
];

function getUserLabel(user: ProductUserListItem) {
  return getUserDisplayName(user);
}

function getUserInitials(user: ProductUserListItem) {
  const label = getUserLabel(user).trim();
  if (!label) return "?";

  const parts = label.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getRoleLabel(role: ProductManagedRole | undefined, roleId: string) {
  return role ? `${role.name} (${role.key})` : roleId;
}

function getUserRoleIds(user: ProductUserListItem) {
  return new Set(user.roles?.map((role) => role.role_id) ?? []);
}

function getUserPermissionKeys(
  user: ProductUserListItem,
  rolesById: Map<string, ProductManagedRole>,
) {
  const permissions = new Set<string>();

  for (const assignment of user.roles ?? []) {
    const role = rolesById.get(assignment.role_id);
    role?.permissions.forEach((permission) => permissions.add(permission));
  }

  return [...permissions].sort();
}

function getRoleKeyFromName(name: string) {
  const key = name
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return key || `role_${Date.now().toString(36)}`;
}

function getPresetFromLevel(level: number): RoleLevelPreset {
  const preset = roleLevelPresets.find((option) => option.level === level);
  return preset?.id ?? "custom";
}

function getLevelFromPreset(preset: RoleLevelPreset, customLevel: string) {
  const presetLevel = roleLevelPresets.find((option) => option.id === preset)?.level;
  return presetLevel ?? Number(customLevel);
}

function isValidLevel(level: number) {
  return Number.isInteger(level) && level >= 0 && level <= 100;
}

function getAvailablePermissionGroups(permissions: ProductManagedPermission[]) {
  const availableKeys = new Set(permissions.map((permission) => permission.key));

  return permissionGroups
    .map((group) => ({
      ...group,
      permissionKeys: group.permissionKeys.filter((key) => availableKeys.has(key)),
    }))
    .filter((group) => group.permissionKeys.length > 0);
}

function getPermissionGroupIcon(groupId: string): LucideIcon {
  if (groupId === "classManagement") return CalendarDays;
  if (groupId === "scheduleManagement") return Layers;
  if (groupId === "registrationManagement") return UsersRound;
  if (groupId === "studioSettings") return Gauge;
  return BarChart3;
}

function getRoleGroupState(
  role: ProductManagedRole,
  group: { permissionKeys: string[] },
) {
  const granted = group.permissionKeys.filter((key) =>
    role.permissions.includes(key),
  );

  if (granted.length === 0) return "none";
  if (granted.length === group.permissionKeys.length) return "all";
  return "partial";
}

function readStoredExpandedState(key: string, defaultValue: boolean) {
  if (typeof window === "undefined") return defaultValue;

  const storedValue = window.localStorage.getItem(key);
  if (storedValue === "true") return true;
  if (storedValue === "false") return false;
  return defaultValue;
}

function usePersistentExpandedState(key: string, defaultValue = true) {
  const [expanded, setExpanded] = useState(() =>
    readStoredExpandedState(key, defaultValue),
  );

  useEffect(() => {
    window.localStorage.setItem(key, String(expanded));
  }, [expanded, key]);

  return [expanded, setExpanded] as const;
}

export function UserRoleManagementTab({
  canManageRoles,
  canManageUsers,
}: UserRoleManagementTabProps) {
  const { t } = useTranslation();
  const { client } = useProductContext();
  const [users, setUsers] = useState<ProductUserListItem[]>([]);
  const [roles, setRoles] = useState<ProductManagedRole[]>([]);
  const [permissions, setPermissions] = useState<ProductManagedPermission[]>([]);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [mutationStatus, setMutationStatus] =
    useState<MutationStatus>("idle");
  const [roleForm, setRoleForm] = useState<RoleForm>({
    name: "",
    levelPreset: "coach",
    customLevel: "75",
    permissionGroups: [],
  });
  const [rolesExpanded, setRolesExpanded] = usePersistentExpandedState(
    rolesPanelStorageKey,
    false,
  );
  const [editingRole, setEditingRole] = useState<EditingRoleForm>(null);
  const [assignRoleByUserId, setAssignRoleByUserId] = useState<Record<string, string>>({});
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const rolesById = useMemo(
    () => new Map(roles.map((role) => [role.id, role])),
    [roles],
  );
  const availablePermissionGroups = useMemo(
    () => getAvailablePermissionGroups(permissions),
    [permissions],
  );
  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    if (!query) return users;

    return users.filter((user) =>
      [
        user.display_name,
        user.email,
        user.phone_number,
        user.user_id,
        user.status,
        user.scope,
        ...(user.roles?.map((role) => role.role_name ?? role.role_key ?? "") ??
          []),
      ]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(query)),
      );
  }, [userSearch, users]);
  const selectedUser = useMemo(
    () =>
      filteredUsers.find((user) => user.user_id === selectedUserId) ??
      filteredUsers[0] ??
      null,
    [filteredUsers, selectedUserId],
  );
  const hasAccess = canManageRoles || canManageUsers;

  const loadAdministration = useCallback(async (options?: { silent?: boolean }) => {
    if (!client || !hasAccess) {
      setUsers([]);
      setRoles([]);
      setPermissions([]);
      setLoadStatus("idle");
      return;
    }

    if (!options?.silent) {
      setLoadStatus("loading");
      setErrorMessage(null);
    }

    try {
      const [roleResult, permissionResult, userResult] = await Promise.all([
        canManageRoles || canManageUsers
          ? client.management.roles.list()
          : Promise.resolve({ roles: [] }),
        canManageRoles
          ? client.management.roles.listPermissions()
          : Promise.resolve({ permissions: [] }),
        canManageUsers
          ? client.management.users.list()
          : Promise.resolve({ users: [] }),
      ]);

      setRoles(roleResult.roles);
      setPermissions(permissionResult.permissions);
      setUsers(userResult.users);
      setLoadStatus("loaded");
    } catch (error) {
      if (options?.silent) return;

      setErrorMessage(
        error instanceof Error ? error.message : t("manager.users.errorBody"),
      );
      setLoadStatus("error");
    }
  }, [
    canManageRoles,
    canManageUsers,
    client,
    hasAccess,
    t,
  ]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadAdministration();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadAdministration]);

  const mergeRole = useCallback((role: ProductManagedRole) => {
    setRoles((current) => {
      const exists = current.some((item) => item.id === role.id);
      if (!exists) return [...current, role];

      return current.map((item) => (item.id === role.id ? role : item));
    });
  }, []);

  const mergeUserRoleAssignment = useCallback(
    (userId: string, assignment: NonNullable<ProductUserListItem["roles"]>[number]) => {
      setUsers((current) =>
        current.map((user) => {
          if (user.user_id !== userId) return user;

          const roles = user.roles ?? [];
          const exists = roles.some((role) => role.role_id === assignment.role_id);

          return {
            ...user,
            roles: exists
              ? roles.map((role) =>
                  role.role_id === assignment.role_id ? assignment : role,
                )
              : [...roles, assignment],
          };
        }),
      );
    },
    [],
  );

  const removeUserRoleAssignment = useCallback(
    (userId: string, roleId: string) => {
      setUsers((current) =>
        current.map((user) =>
          user.user_id === userId
            ? {
                ...user,
                roles: (user.roles ?? []).filter((role) => role.role_id !== roleId),
              }
            : user,
        ),
      );
    },
    [],
  );

  const runMutation = useCallback(
    async <T,>(status: MutationStatus, command: () => Promise<T>) => {
      if (!client || mutationStatus !== "idle") return { ok: false as const };

      setOperationError(null);
      setMutationStatus(status);

      try {
        const result = await command();
        void loadAdministration({ silent: true });
        return { ok: true as const, result };
      } catch (error) {
        setOperationError(
          error instanceof Error
            ? error.message
            : t("manager.users.actionFailed"),
        );
        return { ok: false as const };
      } finally {
        setMutationStatus("idle");
      }
    },
    [client, loadAdministration, mutationStatus, t],
  );

  const createRole = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!client || !canManageRoles) return;

      const level = getLevelFromPreset(roleForm.levelPreset, roleForm.customLevel);
      if (!isValidLevel(level)) {
        setOperationError(t("manager.users.invalidRoleLevel"));
        return;
      }

      const selectedGroups = availablePermissionGroups.filter((group) =>
        roleForm.permissionGroups.includes(group.id),
      );
      const selectedPermissionKeys = selectedGroups.flatMap(
        (group) => group.permissionKeys,
      );
      const created = await runMutation("creatingRole", async () => {
        const result = await client.management.roles.create({
          key: getRoleKeyFromName(roleForm.name),
          name: roleForm.name.trim(),
          level,
        });

        for (const group of selectedGroups) {
          for (const permissionKey of group.permissionKeys) {
            await client.management.roles.grantPermission({
              roleId: result.role.id,
              permissionKey,
            });
          }
        }

        return {
          ...result.role,
          permissions: selectedPermissionKeys,
        } satisfies ProductManagedRole;
      });

      if (created.ok) {
        mergeRole(created.result);
        setRoleForm({
          name: "",
          levelPreset: "coach",
          customLevel: "75",
          permissionGroups: [],
        });
      }
    },
    [
      availablePermissionGroups,
      canManageRoles,
      client,
      mergeRole,
      roleForm,
      runMutation,
      t,
    ],
  );

  const updateRole = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!client || !canManageRoles || !editingRole) return;

      const level = getLevelFromPreset(
        editingRole.levelPreset,
        editingRole.customLevel,
      );
      if (!isValidLevel(level)) {
        setOperationError(t("manager.users.invalidRoleLevel"));
        return;
      }

      const currentRole = rolesById.get(editingRole.roleId);
      const updated = await runMutation("updatingRole", async () => {
        const result = await client.management.roles.update({
          roleId: editingRole.roleId,
          name: editingRole.name.trim(),
          level,
        });

        return {
          ...result.role,
          permissions: currentRole?.permissions ?? [],
        } satisfies ProductManagedRole;
      });

      if (updated.ok) {
        mergeRole(updated.result);
        setEditingRole(null);
      }
    },
    [canManageRoles, client, editingRole, mergeRole, rolesById, runMutation, t],
  );

  const togglePermissionGroup = useCallback(
    async (role: ProductManagedRole, group: { permissionKeys: string[] }) => {
      if (!client || !canManageRoles) return;
      const groupState = getRoleGroupState(role, group);

      if (groupState === "all") {
        const revoked = await runMutation("revokingPermission", async () => {
          for (const permissionKey of group.permissionKeys) {
            await client.management.roles.revokePermission({
              roleId: role.id,
              permissionKey,
            });
          }

          return {
            ...role,
            permissions: role.permissions.filter(
              (permissionKey) => !group.permissionKeys.includes(permissionKey),
            ),
          };
        });
        if (revoked.ok) mergeRole(revoked.result);
        return;
      }

      const granted = await runMutation("grantingPermission", async () => {
        for (const permissionKey of group.permissionKeys) {
          if (!role.permissions.includes(permissionKey)) {
            await client.management.roles.grantPermission({
              roleId: role.id,
              permissionKey,
            });
          }
        }

        return {
          ...role,
          permissions: [...new Set([...role.permissions, ...group.permissionKeys])],
        };
      });
      if (granted.ok) mergeRole(granted.result);
    },
    [canManageRoles, client, mergeRole, runMutation],
  );

  const assignRole = useCallback(
    async (userId: string) => {
      if (!client || !canManageUsers) return;
      const roleId = assignRoleByUserId[userId];
      if (!roleId) return;

      const assigned = await runMutation("assigningRole", () =>
        client.management.users.roles.assign({ userId, roleId }),
      );

      if (assigned.ok) {
        mergeUserRoleAssignment(userId, assigned.result.assignment);
        setAssignRoleByUserId((current) => ({ ...current, [userId]: "" }));
      }
    },
    [
      assignRoleByUserId,
      canManageUsers,
      client,
      mergeUserRoleAssignment,
      runMutation,
    ],
  );

  const revokeRole = useCallback(
    (userId: string, roleId: string) => {
      if (!client || !canManageUsers) return;
      void runMutation("revokingRole", () =>
        client.management.users.roles.revoke({ userId, roleId }),
      ).then((result) => {
        if (result.ok) removeUserRoleAssignment(userId, roleId);
      });
    },
    [canManageUsers, client, removeUserRoleAssignment, runMutation],
  );

  if (!hasAccess) {
    return (
      <section className="rounded-[1.4rem] border border-blush/24 bg-card/78 p-5 shadow-soft">
        <p className="font-serif text-xl text-foreground">
          {t("manager.users.noAccessTitle")}
        </p>
        <p className="mt-2 text-sm leading-6 text-foreground/68">
          {t("manager.users.noAccessBody")}
        </p>
      </section>
    );
  }

  return (
    <section className="grid gap-4">
      <div className="flex items-start justify-between gap-3 lg:flex-row-reverse lg:justify-between">
        <div className="flex items-start gap-3 text-end">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blush-strong text-background sm:size-12">
            <UserCog className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-foreground/48 sm:text-xs">
              {t("manager.users.eyebrow")}
            </p>
            <h2 className="mt-1 whitespace-nowrap font-serif text-[1.65rem] leading-none text-foreground min-[390px]:text-[1.85rem] sm:text-5xl">
              {t("manager.users.title")}
            </h2>
            <p className="mt-3 hidden max-w-prose text-sm leading-6 text-foreground/68 sm:block">
              {t("manager.users.body")}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10 rounded-full border-blush/30 bg-background/30 text-foreground/72 hover:bg-blush/10 sm:h-12 sm:w-auto sm:px-5"
            disabled={loadStatus === "loading"}
            onClick={() => void loadAdministration()}
            aria-label={t("manager.users.refresh")}
          >
            <RefreshCw
              className={[
                "size-4",
                loadStatus === "loading" ? "animate-spin" : "",
              ].join(" ")}
              aria-hidden="true"
            />
            <span className="hidden sm:inline">{t("manager.users.refresh")}</span>
          </Button>
          {canManageRoles && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-10 rounded-full border-blush/30 bg-background/30 text-foreground/72 hover:bg-blush/10 sm:h-12 sm:w-auto sm:px-5"
              onClick={() => setRolesExpanded((expanded) => !expanded)}
              aria-label={t("manager.users.rolesTitle")}
            >
              <ShieldCheck className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">{t("manager.users.rolesTitle")}</span>
              <ChevronDown
                className={[
                  "hidden size-4 transition-transform sm:block",
                  rolesExpanded ? "rotate-180" : "",
                ].join(" ")}
                aria-hidden="true"
              />
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {loadStatus === "loading" && (
          <div className="rounded-xl border border-blush/24 bg-background/46 p-4 text-sm text-foreground/68">
            <Loader2
              className="me-2 inline size-4 animate-spin text-blush-strong"
              aria-hidden="true"
            />
            {t("manager.users.loading")}
          </div>
        )}

        {loadStatus === "error" && (
          <div className="rounded-xl border border-blush/24 bg-background/46 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle
                className="mt-0.5 size-5 shrink-0 text-blush-strong"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="font-serif text-xl text-foreground">
                  {t("manager.users.errorTitle")}
                </p>
                <p className="mt-2 text-sm leading-6 text-foreground/68">
                  {errorMessage ?? t("manager.users.errorBody")}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 rounded-full"
                  onClick={() => void loadAdministration()}
                >
                  <RefreshCw className="size-4" aria-hidden="true" />
                  {t("manager.users.retry")}
                </Button>
              </div>
            </div>
          </div>
        )}

        {operationError && (
          <p className="rounded-xl border border-blush/24 bg-background/46 p-3 text-sm leading-6 text-blush-strong">
            {operationError}
          </p>
        )}

        {loadStatus === "loaded" && (
          <>
            {canManageUsers && (
              <section
                className="grid gap-4 xl:grid-cols-[minmax(28rem,1.35fr)_minmax(22rem,0.9fr)]"
                dir="ltr"
              >
                <div
                  className="rounded-[1.2rem] border border-blush/22 bg-card/56 p-3 sm:rounded-[1.3rem] sm:border-blush/24 sm:p-4 xl:col-start-2"
                  dir="rtl"
                >
                  <div className="flex gap-3">
                    <label className="relative min-w-0 flex-1">
                      <Search
                        className="pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-foreground/48 ltr:left-3 rtl:right-3"
                        aria-hidden="true"
                      />
                      <input
                        className="h-12 w-full rounded-xl border border-blush/24 bg-background/54 px-10 text-sm text-foreground outline-none focus:border-blush-strong"
                        value={userSearch}
                        placeholder={t("manager.users.searchDetailed")}
                        onChange={(event) => setUserSearch(event.target.value)}
                      />
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-11 rounded-xl border-blush/30 bg-background/30 text-foreground/72 hover:bg-blush/10 sm:size-12"
                      aria-label={t("manager.users.filter")}
                    >
                      <SlidersHorizontal className="size-4" aria-hidden="true" />
                    </Button>
                  </div>

                  {filteredUsers.length === 0 ? (
                    <p className="mt-3 rounded-xl border border-blush/24 bg-card/40 p-4 text-sm leading-6 text-foreground/60">
                      {t("manager.users.noSearchResults")}
                    </p>
                  ) : (
                    <div className="mt-4 max-h-none overflow-visible rounded-[1.2rem] border border-blush/18 bg-background/26 p-2 sm:max-h-[34rem] sm:overflow-auto">
                      <div className="grid gap-2">
                        {filteredUsers.map((user) => {
                          const selected = selectedUserId === user.user_id;
                          const supportingEmail = getUserSupportingEmail(user);
                          const phoneNumber = getUserPhoneNumber(user);
                          const roleNames = (user.roles ?? [])
                            .map((assignment) => assignment.role_name)
                            .filter((value): value is string => Boolean(value));

                          return (
                            <button
                              key={user.user_id}
                              type="button"
                              className={[
                                "grid grid-cols-[auto_1fr] items-center gap-3 rounded-xl border p-3 text-start transition-colors sm:grid-cols-[auto_1fr_auto]",
                                selected
                                  ? "border-blush-strong/65 bg-blush-strong/12 shadow-soft"
                                  : "border-blush/16 bg-background/34 hover:border-blush-strong/45",
                              ].join(" ")}
                              aria-pressed={selected}
                              onClick={() => setSelectedUserId(user.user_id)}
                            >
                              <span className="grid size-12 place-items-center rounded-full bg-blush/28 font-serif text-lg text-foreground sm:order-3">
                                {getUserInitials(user)}
                              </span>
                              <span className="min-w-0 sm:order-2">
                                <span className="block break-words font-serif text-xl leading-6 text-foreground [overflow-wrap:anywhere]">
                                  {getUserLabel(user)}
                                </span>
                                {supportingEmail && (
                                  <span className="mt-1 block break-words text-sm text-foreground/60 [overflow-wrap:anywhere]">
                                    {supportingEmail}
                                  </span>
                                )}
                              </span>
                              <span className="col-span-2 flex flex-wrap items-center gap-2 text-xs sm:order-1 sm:col-span-1 sm:justify-end">
                                <span className="font-semibold uppercase tracking-[0.14em] text-green-300/80">
                                  {user.status}
                                </span>
                                {roleNames.slice(0, 1).map((roleName) => (
                                  <span
                                    key={`${user.user_id}-${roleName}`}
                                    className="rounded-full border border-blush/24 bg-background/38 px-2.5 py-1 text-foreground/62"
                                  >
                                    {roleName}
                                  </span>
                                ))}
                                {phoneNumber && (
                                  <span className="text-foreground/56">{phoneNumber}</span>
                                )}
                                {roleNames.length === 0 ? (
                                  <span className="text-foreground/48">
                                    {t("manager.users.noRoles")}
                                  </span>
                                ) : null}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div
                  className={[
                    selectedUserId
                      ? "fixed inset-0 z-50 grid place-items-end bg-black/50 p-0 xl:static xl:block xl:bg-transparent"
                      : "hidden xl:col-start-1 xl:row-start-1 xl:block",
                  ].join(" ")}
                  dir="rtl"
                  onClick={() => {
                    if (selectedUserId) setSelectedUserId(null);
                  }}
                >
                <article
                  className="max-h-[92vh] w-full overflow-y-auto rounded-t-[1.4rem] border border-blush/24 bg-background p-5 text-foreground shadow-soft xl:max-h-none xl:rounded-[1.3rem] xl:bg-card/56"
                  dir="rtl"
                  onClick={(event) => event.stopPropagation()}
                >
                  <span className="mx-auto mb-3 block h-1 w-12 rounded-full bg-blush/28 xl:hidden" />
                  {selectedUser ? (
                    (() => {
                      const assignedRoleIds = getUserRoleIds(selectedUser);
                      const assignableRoles = roles.filter(
                        (role) => !assignedRoleIds.has(role.id),
                      );
                      const userPermissions = getUserPermissionKeys(
                        selectedUser,
                        rolesById,
                      );
                      const userPermissionSet = new Set(userPermissions);
                      const userPermissionGroups = availablePermissionGroups
                        .map((group) => {
                          const grantedCount = group.permissionKeys.filter((key) =>
                            userPermissionSet.has(key),
                          ).length;

                          return { ...group, grantedCount };
                        })
                        .filter((group) => group.grantedCount > 0);

                      return (
                        <>
                          <div className="flex items-start gap-3">
                            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-blush/28 font-serif text-xl text-foreground sm:size-16 sm:text-3xl">
                              {getUserInitials(selectedUser)}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-3">
                                <h4 className="break-words font-serif text-2xl leading-none text-foreground [overflow-wrap:anywhere] sm:text-3xl">
                                  {getUserLabel(selectedUser)}
                                </h4>
                                <span className="rounded-full border border-green-300/20 bg-green-300/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-green-300/80">
                                  {selectedUser.status}
                                </span>
                              </div>
                              <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-foreground/60">
                                {getUserSupportingEmail(selectedUser) && (
                                  <span className="break-words [overflow-wrap:anywhere]">
                                    {getUserSupportingEmail(selectedUser)}
                                  </span>
                                )}
                                {getUserPhoneNumber(selectedUser) && (
                                  <span>{getUserPhoneNumber(selectedUser)}</span>
                                )}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-9 shrink-0 rounded-full text-foreground/54 hover:bg-blush/10"
                              aria-label={t("manager.users.userActions")}
                            >
                              <MoreVertical className="size-4" aria-hidden="true" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-9 shrink-0 rounded-full text-foreground/54 hover:bg-blush/10 xl:hidden"
                              onClick={() => setSelectedUserId(null)}
                              aria-label={t("actions.close")}
                            >
                              <X className="size-5" aria-hidden="true" />
                            </Button>
                          </div>

                          <div className="mt-5 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border border-blush/18 bg-background/32 p-4">
                              <div className="flex items-center gap-3">
                                <span className="grid size-9 place-items-center rounded-full bg-blush/18 text-blush-strong">
                                  <Building2 className="size-4" aria-hidden="true" />
                                </span>
                                <div>
                                  <p className="text-xs text-foreground/50">
                                    {t("manager.users.scope")}
                                  </p>
                                  <p className="font-semibold text-foreground">
                                    {selectedUser.scope}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="rounded-xl border border-blush/18 bg-background/32 p-4">
                              <div className="flex items-center gap-3">
                                <span className="grid size-9 place-items-center rounded-full bg-blush/18 text-blush-strong">
                                  <CalendarDays className="size-4" aria-hidden="true" />
                                </span>
                                <div>
                                  <p className="text-xs text-foreground/50">
                                    {t("manager.users.status")}
                                  </p>
                                  <p className="font-semibold text-foreground">
                                    {selectedUser.status}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-6">
                            <p className="font-serif text-2xl text-foreground">
                              {t("manager.users.assignedRoles")}
                            </p>
                            <div className="mt-3 rounded-xl border border-blush/18 bg-background/32 p-3">
                              <div className="flex flex-wrap gap-2">
                              {(selectedUser.roles ?? []).length === 0 ? (
                                <span className="text-sm text-foreground/56">
                                  {t("manager.users.noRoles")}
                                </span>
                              ) : (
                                selectedUser.roles?.map((assignment) => (
                                  <span
                                    key={`${selectedUser.user_id}-${assignment.role_id}`}
                                    className="inline-flex items-center gap-2 rounded-full border border-blush/24 bg-card/44 px-3 py-2 text-sm text-foreground/76"
                                  >
                                    <UsersRound className="size-4 text-blush-strong" aria-hidden="true" />
                                    {assignment.role_name ??
                                      getRoleLabel(
                                        rolesById.get(assignment.role_id),
                                        assignment.role_id,
                                      )}
                                    <button
                                      type="button"
                                      className="rounded-full text-foreground/48 hover:text-blush-strong"
                                      disabled={mutationStatus !== "idle"}
                                      onClick={() =>
                                        revokeRole(
                                          selectedUser.user_id,
                                          assignment.role_id,
                                        )
                                      }
                                      aria-label={t("manager.users.revokeRole")}
                                    >
                                      <X className="size-3" aria-hidden="true" />
                                    </button>
                                  </span>
                                ))
                              )}
                              </div>

                            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
                              <label className="grid min-w-0 flex-1 gap-1.5">
                                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
                                  {t("manager.users.chooseRole")}
                                </span>
                                <select
                                  className="h-10 min-w-0 rounded-xl border border-blush/24 bg-background/70 px-3 text-sm text-foreground outline-none focus:border-blush-strong"
                                  value={assignRoleByUserId[selectedUser.user_id] ?? ""}
                                  onChange={(event) =>
                                    setAssignRoleByUserId((current) => ({
                                      ...current,
                                      [selectedUser.user_id]: event.target.value,
                                    }))
                                  }
                                >
                                  <option value="">
                                    {t("manager.users.chooseRole")}
                                  </option>
                                  {assignableRoles.map((role) => (
                                    <option key={role.id} value={role.id}>
                                      {role.name}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <Button
                                type="button"
                                size="sm"
                                className="rounded-full bg-blush px-5 text-primary-foreground hover:bg-blush-strong"
                                disabled={
                                  mutationStatus !== "idle" ||
                                  !assignRoleByUserId[selectedUser.user_id]
                                }
                                onClick={() => void assignRole(selectedUser.user_id)}
                              >
                                <Plus className="size-4" aria-hidden="true" />
                                {t("manager.users.assignRole")}
                              </Button>
                            </div>
                          </div>
                          </div>

                          <div className="mt-6">
                            <p className="font-serif text-2xl text-foreground">
                              {t("manager.users.effectivePermissions")}
                            </p>
                            <p className="mt-1 text-sm text-foreground/58">
                              {t("manager.users.effectivePermissionsBody")}
                            </p>
                            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                              {userPermissionGroups.length === 0 ? (
                                <span className="text-sm text-foreground/56">
                                  {t("manager.users.noPermissions")}
                                </span>
                              ) : (
                                userPermissionGroups.map((group) => {
                                  const Icon = getPermissionGroupIcon(group.id);

                                  return (
                                    <div
                                      key={group.id}
                                      className="rounded-xl border border-blush/18 bg-background/32 p-3"
                                    >
                                      <div className="flex items-center gap-3">
                                        <Icon
                                          className="size-5 text-blush-strong"
                                          aria-hidden="true"
                                        />
                                        <div>
                                          <p className="font-semibold text-foreground">
                                            {t(group.labelKey)}
                                          </p>
                                          <p className="text-xs text-foreground/54">
                                            {group.grantedCount}{" "}
                                            {t("manager.users.permissionsCount")}
                                            {group.grantedCount <
                                            group.permissionKeys.length
                                              ? ` · ${t("manager.users.partial")}`
                                              : ""}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </>
                      );
                    })()
                  ) : (
                    <p className="text-sm leading-6 text-foreground/60">
                      {t("manager.users.noSearchResults")}
                    </p>
                  )}
                </article>
                </div>
              </section>
            )}

            {canManageRoles && (
              <section className="rounded-[1.3rem] border border-blush/24 bg-background/34 p-4">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 text-start"
                  aria-expanded={rolesExpanded}
                  onClick={() => setRolesExpanded((expanded) => !expanded)}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <ShieldCheck
                      className="size-5 shrink-0 text-blush-strong"
                      aria-hidden="true"
                    />
                    <span className="font-serif text-2xl text-foreground">
                      {t("manager.users.rolesTitle")}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
                    {rolesExpanded
                      ? t("manager.users.collapse")
                      : t("manager.users.expand")}
                    <ChevronDown
                      className={[
                        "size-4 transition-transform",
                        rolesExpanded ? "rotate-180" : "",
                      ].join(" ")}
                      aria-hidden="true"
                    />
                  </span>
                </button>

                {rolesExpanded && (
                  <>
                    <form
                      className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_1fr_auto]"
                      onSubmit={(event) => void createRole(event)}
                    >
                      <label className="grid gap-1.5">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
                          {t("manager.users.roleName")}
                        </span>
                        <input
                          className="h-11 rounded-xl border border-blush/24 bg-background/70 px-3 text-sm text-foreground outline-none focus:border-blush-strong"
                          value={roleForm.name}
                          placeholder={t("manager.users.roleName")}
                          onChange={(event) =>
                            setRoleForm((current) => ({
                              ...current,
                              name: event.target.value,
                            }))
                          }
                          required
                        />
                      </label>
                      <div className="grid gap-2 sm:grid-cols-[1fr_7rem]">
                        <label className="grid gap-1.5">
                          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
                            {t("manager.users.roleLevel")}
                          </span>
                          <select
                            className="h-11 rounded-xl border border-blush/24 bg-background/70 px-3 text-sm text-foreground outline-none focus:border-blush-strong"
                            value={roleForm.levelPreset}
                            onChange={(event) =>
                              setRoleForm((current) => ({
                                ...current,
                                levelPreset: event.target.value as RoleLevelPreset,
                              }))
                            }
                          >
                            {roleLevelPresets.map((preset) => (
                              <option key={preset.id} value={preset.id}>
                                {t(preset.labelKey)}
                              </option>
                            ))}
                          </select>
                        </label>
                        {roleForm.levelPreset === "custom" && (
                          <label className="grid gap-1.5">
                            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
                              {t("manager.users.roleLevel")}
                            </span>
                            <input
                              className="h-11 rounded-xl border border-blush/24 bg-background/70 px-3 text-sm text-foreground outline-none focus:border-blush-strong"
                              type="number"
                              min="0"
                              max="100"
                              value={roleForm.customLevel}
                              placeholder={t("manager.users.roleLevel")}
                              onChange={(event) =>
                                setRoleForm((current) => ({
                                  ...current,
                                  customLevel: event.target.value,
                                }))
                              }
                              required
                            />
                          </label>
                        )}
                      </div>
                      <Button
                        type="submit"
                        className="rounded-full"
                        disabled={mutationStatus !== "idle"}
                      >
                        <Plus className="size-4" aria-hidden="true" />
                        {t("manager.users.createRole")}
                      </Button>
                    </form>

                    <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                      {availablePermissionGroups.map((group) => {
                        const selected = roleForm.permissionGroups.includes(group.id);

                        return (
                          <button
                            key={group.id}
                            type="button"
                            className={[
                              "rounded-xl border p-3 text-start transition-colors",
                              selected
                                ? "border-blush-strong bg-blush-strong/12 text-foreground"
                                : "border-blush/24 bg-card/50 text-foreground/72 hover:border-blush-strong/55",
                            ].join(" ")}
                            aria-pressed={selected}
                            onClick={() =>
                              setRoleForm((current) => ({
                                ...current,
                                permissionGroups: selected
                                  ? current.permissionGroups.filter(
                                      (groupId) => groupId !== group.id,
                                    )
                                  : [...current.permissionGroups, group.id],
                              }))
                            }
                          >
                            <span className="flex items-center gap-2 text-sm font-semibold">
                              {selected && (
                                <Check
                                  className="size-4 text-blush-strong"
                                  aria-hidden="true"
                                />
                              )}
                              {t(group.labelKey)}
                            </span>
                            <span className="mt-1 block text-xs leading-5 text-foreground/56">
                              {t(group.descriptionKey)}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      {roles.map((role) => {
                        const isEditing = editingRole?.roleId === role.id;

                        return (
                          <article
                            key={role.id}
                            className="rounded-[1.2rem] border border-blush/24 bg-card/60 p-4"
                          >
                            {isEditing ? (
                              <form
                                className="grid gap-2 sm:grid-cols-[1fr_12rem_auto_auto]"
                                onSubmit={(event) => void updateRole(event)}
                              >
                                <input
                                  className="h-10 rounded-xl border border-blush/24 bg-background/70 px-3 text-sm text-foreground outline-none focus:border-blush-strong"
                                  value={editingRole.name}
                                  onChange={(event) =>
                                    setEditingRole((current) =>
                                      current
                                        ? { ...current, name: event.target.value }
                                        : current,
                                    )
                                  }
                                  required
                                />
                                <div className="grid gap-2">
                                  <select
                                    className="h-10 rounded-xl border border-blush/24 bg-background/70 px-3 text-sm text-foreground outline-none focus:border-blush-strong"
                                    value={editingRole.levelPreset}
                                    onChange={(event) =>
                                      setEditingRole((current) =>
                                        current
                                          ? {
                                              ...current,
                                              levelPreset: event.target
                                                .value as RoleLevelPreset,
                                            }
                                          : current,
                                      )
                                    }
                                  >
                                    {roleLevelPresets.map((preset) => (
                                      <option key={preset.id} value={preset.id}>
                                        {t(preset.labelKey)}
                                      </option>
                                    ))}
                                  </select>
                                  {editingRole.levelPreset === "custom" && (
                                    <input
                                      className="h-10 rounded-xl border border-blush/24 bg-background/70 px-3 text-sm text-foreground outline-none focus:border-blush-strong"
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={editingRole.customLevel}
                                      onChange={(event) =>
                                        setEditingRole((current) =>
                                          current
                                            ? {
                                                ...current,
                                                customLevel: event.target.value,
                                              }
                                            : current,
                                        )
                                      }
                                      required
                                    />
                                  )}
                                </div>
                                <Button
                                  type="submit"
                                  size="sm"
                                  className="rounded-full"
                                  disabled={mutationStatus !== "idle"}
                                >
                                  <Check className="size-4" aria-hidden="true" />
                                  {t("actions.save")}
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="rounded-full"
                                  onClick={() => setEditingRole(null)}
                                >
                                  {t("actions.cancel")}
                                </Button>
                              </form>
                            ) : (
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <h4 className="break-words font-serif text-xl text-foreground [overflow-wrap:anywhere]">
                                    {role.name}
                                  </h4>
                                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
                                    {t(
                                      roleLevelPresets.find(
                                        (preset) => preset.level === role.level,
                                      )?.labelKey ??
                                        "manager.users.rolePresets.custom",
                                    )}
                                  </p>
                                </div>
                                {!role.is_protected && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="rounded-full"
                                    onClick={() =>
                                      setEditingRole({
                                        roleId: role.id,
                                        name: role.name,
                                        levelPreset: getPresetFromLevel(role.level),
                                        customLevel: String(role.level),
                                      })
                                    }
                                  >
                                    {t("manager.users.editRole")}
                                  </Button>
                                )}
                              </div>
                            )}

                            <div className="mt-3 flex flex-wrap gap-2">
                              {availablePermissionGroups.map((group) => {
                                const groupState = getRoleGroupState(role, group);
                                const selected = groupState === "all";
                                const partial = groupState === "partial";

                                return (
                                  <button
                                    key={group.id}
                                    type="button"
                                    className={[
                                      "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                                      selected || partial
                                        ? "border-blush-strong/45 bg-blush-strong/10 text-blush-strong"
                                        : "border-blush/24 text-foreground/56 hover:border-blush-strong/45",
                                    ].join(" ")}
                                    disabled={
                                      role.is_protected || mutationStatus !== "idle"
                                    }
                                    onClick={() =>
                                      void togglePermissionGroup(role, group)
                                    }
                                  >
                                    {t(group.labelKey)}
                                    {partial
                                      ? ` · ${t("manager.users.partial")}`
                                      : ""}
                                  </button>
                                );
                              })}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </section>
  );
}

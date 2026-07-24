import type {
  AssignableProductRole,
  ProductUserListItem,
} from "@class-kit/react";
import { useProductContext } from "@class-kit/react";
import {
  AlertCircle,
  Building2,
  CalendarDays,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  UserCog,
  UsersRound,
  X,
} from "lucide-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { summarizePermissionGroups } from "@/features/manager/access/role-permission-presentation";
import {
  getUserDisplayName,
  getUserPhoneNumber,
  getUserSupportingEmail,
} from "@/features/users/user-labels";

type LoadStatus = "idle" | "loading" | "loaded" | "error";
type MutationStatus = "idle" | "assigning" | "revoking";

type UserRoleManagementTabProps = {
  canManageUsers: boolean;
  canReadUsers: boolean;
};

function getUserInitials(user: ProductUserListItem) {
  const parts = getUserDisplayName(user).trim().split(/\s+/).filter(Boolean);

  if (parts.length > 1) {
    return `${parts[0][0]}${parts.at(-1)![0]}`.toUpperCase();
  }

  return parts[0]?.slice(0, 2).toUpperCase() || "?";
}

function getRoleName(role: AssignableProductRole | undefined, roleId: string) {
  return role ? `${role.name} (${role.key})` : roleId;
}

function getActiveRoleAssignments(user: ProductUserListItem) {
  return (user.roles ?? []).filter((assignment) => assignment.status === "active");
}

export function UserRoleManagementTab({
  canManageUsers,
  canReadUsers,
}: UserRoleManagementTabProps) {
  const { t } = useTranslation();
  const { client } = useProductContext();
  const [users, setUsers] = useState<ProductUserListItem[]>([]);
  const [roles, setRoles] = useState<AssignableProductRole[]>([]);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [mutationStatus, setMutationStatus] =
    useState<MutationStatus>("idle");
  const [query, setQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [pendingRoleByUser, setPendingRoleByUser] = useState<
    Record<string, string>
  >({});
  const hasAccess = canManageUsers && canReadUsers;

  const rolesById = useMemo(
    () => new Map(roles.map((role) => [role.id, role])),
    [roles],
  );

  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return users;

    return users.filter((user) =>
      [
        user.display_name,
        user.email,
        user.phone_number,
        user.user_id,
        user.status,
        user.scope,
        ...getActiveRoleAssignments(user).flatMap((role) => [
          role.role_name,
          role.role_key,
        ]),
      ]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(term)),
    );
  }, [query, users]);

  const selectedUser = useMemo(
    () =>
      filteredUsers.find((user) => user.user_id === selectedUserId) ??
      filteredUsers[0] ??
      null,
    [filteredUsers, selectedUserId],
  );

  const load = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!client || !hasAccess) {
        setUsers([]);
        setRoles([]);
        setLoadStatus("idle");
        return;
      }

      if (!options?.silent) {
        setLoadStatus("loading");
        setErrorMessage(null);
      }

      try {
        const [userResult, roleResult] = await Promise.all([
          client.management.users.list(),
          client.management.users.roles.listAssignable(),
        ]);

        setUsers(userResult.users);
        setRoles(roleResult.roles);
        setLoadStatus("loaded");
      } catch (error) {
        if (!options?.silent) {
          setErrorMessage(
            error instanceof Error ? error.message : t("manager.users.errorBody"),
          );
          setLoadStatus("error");
        }
      }
    },
    [client, hasAccess, t],
  );

  useEffect(() => {
    const id = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const runMutation = useCallback(
    async <T,>(
      status: Exclude<MutationStatus, "idle">,
      command: () => Promise<T>,
    ) => {
      if (!client || !hasAccess || mutationStatus !== "idle") {
        return { ok: false as const };
      }

      setOperationError(null);
      setMutationStatus(status);

      try {
        const result = await command();
        void load({ silent: true });
        return { ok: true as const, result };
      } catch (error) {
        setOperationError(
          error instanceof Error ? error.message : t("manager.users.actionFailed"),
        );
        return { ok: false as const };
      } finally {
        setMutationStatus("idle");
      }
    },
    [client, hasAccess, load, mutationStatus, t],
  );

  const assignRole = useCallback(
    async (userId: string) => {
      const roleId = pendingRoleByUser[userId];
      if (!roleId) return;

      const result = await runMutation("assigning", () =>
        client!.management.users.roles.assign({ userId, roleId }),
      );

      if (result.ok) {
        setUsers((current) =>
          current.map((user) =>
            user.user_id === userId
              ? {
                  ...user,
                  roles: [
                    ...(user.roles ?? []).filter(
                      (role) => role.role_id !== roleId,
                    ),
                    result.result.assignment,
                  ],
                }
              : user,
          ),
        );
        setPendingRoleByUser((current) => ({ ...current, [userId]: "" }));
      }
    },
    [client, pendingRoleByUser, runMutation],
  );

  const revokeRole = useCallback(
    async (userId: string, roleId: string) => {
      const result = await runMutation("revoking", () =>
        client!.management.users.roles.revoke({ userId, roleId }),
      );

      if (result.ok) {
        setUsers((current) =>
          current.map((user) =>
            user.user_id === userId
              ? {
                  ...user,
                  roles: (user.roles ?? []).filter(
                    (role) => role.role_id !== roleId,
                  ),
                }
              : user,
          ),
        );
      }
    },
    [client, runMutation],
  );

  if (!hasAccess) return <Denied />;

  return (
    <section className="grid gap-4">
      <header className="flex items-start justify-between gap-4 rounded-[1.4rem] border border-blush/24 bg-card/78 p-5 shadow-soft">
        <div className="flex gap-3">
          <span className="grid size-11 place-items-center rounded-full bg-blush-strong text-background">
            <UserCog className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/48">
              {t("manager.users.eyebrow")}
            </p>
            <h2 className="mt-1 font-serif text-3xl text-foreground sm:text-4xl">
              {t("manager.users.title")}
            </h2>
            <p className="mt-2 max-w-prose text-sm leading-6 text-foreground/68">
              {t("manager.users.body")}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10 shrink-0 rounded-full"
          disabled={loadStatus === "loading"}
          onClick={() => void load()}
          aria-label={t("manager.users.refresh")}
        >
          <RefreshCw
            className={loadStatus === "loading" ? "size-4 animate-spin" : "size-4"}
            aria-hidden="true"
          />
        </Button>
      </header>

      {loadStatus === "loading" && (
        <Notice
          icon={<Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          text={t("manager.users.loading")}
        />
      )}
      {!client && <Notice text={t("manager.users.unavailable")} />}
      {loadStatus === "error" && (
        <Notice
          icon={<AlertCircle className="size-4" aria-hidden="true" />}
          text={errorMessage ?? t("manager.users.errorBody")}
          action={
            <Button variant="outline" onClick={() => void load()}>
              {t("manager.users.retry")}
            </Button>
          }
        />
      )}
      {operationError && (
        <p className="rounded-xl border border-blush/24 bg-background/46 p-3 text-sm text-blush-strong">
          {operationError}
        </p>
      )}

      {loadStatus === "loaded" && client && (
        <div className="grid gap-4 xl:grid-cols-[minmax(19rem,0.8fr)_minmax(28rem,1.2fr)]">
          <section className="rounded-[1.3rem] border border-blush/24 bg-card/60 p-3">
            <label className="relative block">
              <Search
                className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-foreground/48"
                aria-hidden="true"
              />
              <input
                className="h-11 w-full rounded-xl border border-blush/24 bg-background/54 ps-10 pe-3 text-sm"
                value={query}
                placeholder={t("manager.users.searchDetailed")}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <div className="mt-3 grid gap-2">
              {filteredUsers.length ? (
                filteredUsers.map((user) => {
                  const selected = selectedUser?.user_id === user.user_id;

                  return (
                    <button
                      key={user.user_id}
                      type="button"
                      className={
                        selected
                          ? "flex items-center gap-3 rounded-xl border border-blush-strong bg-blush-strong/12 p-3 text-start"
                          : "flex items-center gap-3 rounded-xl border border-blush/18 bg-background/32 p-3 text-start hover:border-blush-strong/45"
                      }
                      aria-pressed={selected}
                      onClick={() => setSelectedUserId(user.user_id)}
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blush/28 font-serif text-foreground">
                        {getUserInitials(user)}
                      </span>
                      <span className="min-w-0">
                        <span className="block break-words font-semibold text-foreground">
                          {getUserDisplayName(user)}
                        </span>
                        <span className="block break-words text-xs text-foreground/56">
                          {getUserSupportingEmail(user)}
                        </span>
                      </span>
                    </button>
                  );
                })
              ) : (
                <p className="p-3 text-sm text-foreground/60">
                  {t("manager.users.noSearchResults")}
                </p>
              )}
            </div>
          </section>

          <div
            className={[
              selectedUserId
                ? "fixed inset-0 z-50 grid place-items-end bg-black/50 p-0 xl:static xl:block xl:bg-transparent"
                : "hidden xl:col-start-2 xl:row-start-1 xl:block",
            ].join(" ")}
            onClick={() => {
              if (selectedUserId) setSelectedUserId(null);
            }}
          >
            <article
              className="max-h-[92vh] w-full overflow-y-auto rounded-t-[1.4rem] border border-blush/24 bg-background p-5 text-foreground shadow-soft xl:max-h-none xl:rounded-[1.3rem] xl:bg-card/60"
              onClick={(event) => event.stopPropagation()}
            >
              <span className="mx-auto mb-3 block h-1 w-12 rounded-full bg-blush/28 xl:hidden" />
              {selectedUser ? (
                <UserDetail
                  user={selectedUser}
                  rolesById={rolesById}
                  pendingRole={pendingRoleByUser[selectedUser.user_id] ?? ""}
                  mutationStatus={mutationStatus}
                  onClose={() => setSelectedUserId(null)}
                  onPendingRole={(roleId) =>
                    setPendingRoleByUser((current) => ({
                      ...current,
                      [selectedUser.user_id]: roleId,
                    }))
                  }
                  onAssign={() => void assignRole(selectedUser.user_id)}
                  onRevoke={(roleId) =>
                    void revokeRole(selectedUser.user_id, roleId)
                  }
                  t={t}
                />
              ) : (
                <p className="text-sm text-foreground/60">
                  {t("manager.users.noSearchResults")}
                </p>
              )}
            </article>
          </div>
        </div>
      )}
    </section>
  );
}

function UserDetail({
  user,
  rolesById,
  pendingRole,
  mutationStatus,
  onClose,
  onPendingRole,
  onAssign,
  onRevoke,
  t,
}: {
  user: ProductUserListItem;
  rolesById: Map<string, AssignableProductRole>;
  pendingRole: string;
  mutationStatus: MutationStatus;
  onClose: () => void;
  onPendingRole: (roleId: string) => void;
  onAssign: () => void;
  onRevoke: (roleId: string) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  const activeAssignments = getActiveRoleAssignments(user);
  const assignedRoleIds = new Set(activeAssignments.map((role) => role.role_id));
  const effectivePermissionKeys = new Set(
    activeAssignments.flatMap(
      (assignment) => rolesById.get(assignment.role_id)?.permissions ?? [],
    ),
  );
  const groups = summarizePermissionGroups(effectivePermissionKeys);
  const assignableRoles = [...rolesById.values()].filter(
    (role) => !assignedRoleIds.has(role.id),
  );

  return (
    <>
      <div className="flex items-start gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-blush/28 font-serif text-xl text-foreground">
          {getUserInitials(user)}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="break-words font-serif text-3xl text-foreground">
            {getUserDisplayName(user)}
          </h3>
          <p className="mt-1 break-words text-sm text-foreground/60">
            {getUserSupportingEmail(user)}
            {getUserPhoneNumber(user) && ` · ${getUserPhoneNumber(user)}`}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 shrink-0 rounded-full text-foreground/54 hover:bg-blush/10 xl:hidden"
          onClick={onClose}
          aria-label={t("actions.close")}
        >
          <X className="size-5" aria-hidden="true" />
        </Button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Info
          icon={<Building2 className="size-4" aria-hidden="true" />}
          label={t("manager.users.scope")}
          value={user.scope}
        />
        <Info
          icon={<CalendarDays className="size-4" aria-hidden="true" />}
          label={t("manager.users.status")}
          value={user.status}
        />
      </div>

      <div className="mt-6">
        <h4 className="font-serif text-2xl text-foreground">
          {t("manager.users.assignedRoles")}
        </h4>
        <div className="mt-3 flex flex-wrap gap-2">
          {activeAssignments.length ? (
            activeAssignments.map((assignment) => (
              <span
                key={assignment.role_id}
                className="inline-flex items-center gap-2 rounded-full border border-blush/24 bg-background/32 px-3 py-2 text-sm text-foreground"
              >
                <UsersRound className="size-4 text-blush-strong" aria-hidden="true" />
                {assignment.role_name ??
                  getRoleName(rolesById.get(assignment.role_id), assignment.role_id)}
                {rolesById.has(assignment.role_id) && (
                  <span className="text-xs text-foreground/52">
                    {t("manager.users.roleLevel", {
                      level: rolesById.get(assignment.role_id)!.level,
                    })}
                  </span>
                )}
                <button
                  type="button"
                  className="rounded-full text-foreground/48 hover:text-blush-strong disabled:opacity-45"
                  disabled={mutationStatus !== "idle"}
                  onClick={() => onRevoke(assignment.role_id)}
                  aria-label={t("manager.users.revokeRole")}
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              </span>
            ))
          ) : (
            <span className="text-sm text-foreground/56">
              {t("manager.users.noRoles")}
            </span>
          )}
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <select
            className="h-10 min-w-0 flex-1 rounded-xl border border-blush/24 bg-background/70 px-3 text-sm"
            value={pendingRole}
            onChange={(event) => onPendingRole(event.target.value)}
          >
            <option value="">{t("manager.users.chooseRole")}</option>
            {assignableRoles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          <Button
            type="button"
            size="sm"
            className="rounded-full"
            disabled={mutationStatus !== "idle" || !pendingRole}
            onClick={onAssign}
          >
            <Plus className="size-4" aria-hidden="true" />
            {t("manager.users.assignRole")}
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="font-serif text-2xl text-foreground">
          {t("manager.users.effectivePermissions")}
        </h4>
        <p className="mt-1 text-sm text-foreground/58">
          {t("manager.users.effectivePermissionsBody")}
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {groups.length ? (
            groups.map((group) => {
              const Icon = group.icon;

              return (
                <div
                  key={group.id}
                  className="rounded-xl border border-blush/18 bg-background/32 p-3"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="size-4 text-blush-strong" aria-hidden="true" />
                    <div>
                      <p className="font-semibold text-foreground">
                        {t(group.labelKey)}
                      </p>
                      <p className="text-xs text-foreground/56">
                        {group.grantedCount} {t("manager.users.permissionsCount")}
                        {group.grantedCount < group.permissionKeys.length
                          ? ` · ${t("manager.users.partial")}`
                          : ""}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <span className="text-sm text-foreground/56">
              {t("manager.users.noPermissions")}
            </span>
          )}
        </div>
      </div>
    </>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-blush/18 bg-background/32 p-3">
      <div className="flex items-center gap-3">
        <span className="text-blush-strong">{icon}</span>
        <div>
          <p className="text-xs text-foreground/50">{label}</p>
          <p className="font-semibold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}

function Notice({
  icon,
  text,
  action,
}: {
  icon?: ReactNode;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-blush/24 bg-background/46 p-4 text-sm text-foreground/68">
      {icon}
      {text}
      {action && <span className="ms-auto">{action}</span>}
    </div>
  );
}

function Denied() {
  const { t } = useTranslation();

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

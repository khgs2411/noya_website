import type {
  ProductManagedPermission,
  ProductManagedRole,
} from "@class-kit/react";
import { useProductContext } from "@class-kit/react";
import {
  AlertCircle,
  Check,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  filterAvailablePermissionGroups,
  type PermissionGroup,
} from "@/features/manager/access/role-permission-presentation";

type LoadStatus = "idle" | "loading" | "loaded" | "error";
type MutationStatus = "idle" | "creating" | "updating" | "granting" | "revoking";
type RoleLevelPreset = "coach" | "supervisor" | "manager" | "custom";

type RoleForm = {
  name: string;
  levelPreset: RoleLevelPreset;
  customLevel: string;
  groupIds: string[];
};

type EditingRole = {
  roleId: string;
  name: string;
  levelPreset: RoleLevelPreset;
  customLevel: string;
} | null;

const roleLevelPresets: Array<{
  id: RoleLevelPreset;
  level: number | null;
}> = [
  { id: "coach", level: 20 },
  { id: "supervisor", level: 40 },
  { id: "manager", level: 75 },
  { id: "custom", level: null },
];

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

function getPresetForLevel(level: number): RoleLevelPreset {
  return (
    roleLevelPresets.find((preset) => preset.level === level)?.id ?? "custom"
  );
}

function getLevelForPreset(preset: RoleLevelPreset, customLevel: string) {
  return (
    roleLevelPresets.find((option) => option.id === preset)?.level ??
    Number(customLevel)
  );
}

function isValidLevel(level: number) {
  return Number.isInteger(level) && level >= 0 && level <= 100;
}

function getGroupState(
  role: ProductManagedRole,
  group: Pick<PermissionGroup, "permissionKeys">,
) {
  const granted = group.permissionKeys.filter((key) =>
    role.permissions.includes(key),
  ).length;

  if (granted === 0) return "none";
  if (granted === group.permissionKeys.length) return "all";
  return "partial";
}

export function PermissionManagementTab({
  canManageRoles,
}: {
  canManageRoles: boolean;
}) {
  const { t } = useTranslation();
  const { client } = useProductContext();
  const [roles, setRoles] = useState<ProductManagedRole[]>([]);
  const [permissions, setPermissions] = useState<ProductManagedPermission[]>([]);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [mutationStatus, setMutationStatus] =
    useState<MutationStatus>("idle");
  const [form, setForm] = useState<RoleForm>({
    name: "",
    levelPreset: "coach",
    customLevel: "75",
    groupIds: [],
  });
  const [editing, setEditing] = useState<EditingRole>(null);
  const availableGroups = useMemo(
    () => filterAvailablePermissionGroups(permissions.map((permission) => permission.key)),
    [permissions],
  );

  const load = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!client || !canManageRoles) {
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
        const [roleResult, permissionResult] = await Promise.all([
          client.management.roles.list(),
          client.management.roles.listPermissions(),
        ]);

        setRoles(roleResult.roles);
        setPermissions(permissionResult.permissions);
        setLoadStatus("loaded");
      } catch (error) {
        if (!options?.silent) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : t("manager.permissions.errorBody"),
          );
          setLoadStatus("error");
        }
      }
    },
    [canManageRoles, client, t],
  );

  useEffect(() => {
    const id = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const mergeRole = useCallback((role: ProductManagedRole) => {
    setRoles((current) => {
      const exists = current.some((item) => item.id === role.id);

      return exists
        ? current.map((item) => (item.id === role.id ? role : item))
        : [...current, role];
    });
  }, []);

  const runMutation = useCallback(
    async <T,>(
      status: Exclude<MutationStatus, "idle">,
      command: () => Promise<T>,
    ) => {
      if (!client || !canManageRoles || mutationStatus !== "idle") {
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
          error instanceof Error
            ? error.message
            : t("manager.permissions.actionFailed"),
        );
        return { ok: false as const };
      } finally {
        setMutationStatus("idle");
      }
    },
    [canManageRoles, client, load, mutationStatus, t],
  );

  const createRole = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const level = getLevelForPreset(form.levelPreset, form.customLevel);
      if (!isValidLevel(level) || !form.name.trim()) {
        setOperationError(t("manager.permissions.invalidRoleLevel"));
        return;
      }

      const selectedGroups = availableGroups.filter((group) =>
        form.groupIds.includes(group.id),
      );
      const created = await runMutation("creating", async () => {
        const { role } = await client!.management.roles.create({
          key: getRoleKeyFromName(form.name),
          name: form.name.trim(),
          level,
        });

        for (const group of selectedGroups) {
          for (const permissionKey of group.permissionKeys) {
            await client!.management.roles.grantPermission({
              roleId: role.id,
              permissionKey,
            });
          }
        }

        return {
          ...role,
          permissions: selectedGroups.flatMap((group) => group.permissionKeys),
        };
      });

      if (created.ok) {
        mergeRole(created.result);
        setForm({
          name: "",
          levelPreset: "coach",
          customLevel: "75",
          groupIds: [],
        });
      }
    },
    [availableGroups, client, form, mergeRole, runMutation, t],
  );

  const updateRole = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!editing) return;

      const level = getLevelForPreset(
        editing.levelPreset,
        editing.customLevel,
      );
      if (!isValidLevel(level) || !editing.name.trim()) {
        setOperationError(t("manager.permissions.invalidRoleLevel"));
        return;
      }

      const currentRole = roles.find((role) => role.id === editing.roleId);
      if (currentRole?.is_protected) return;

      const updated = await runMutation("updating", async () => {
        const { role } = await client!.management.roles.update({
          roleId: editing.roleId,
          name: editing.name.trim(),
          level,
        });

        return { ...role, permissions: currentRole?.permissions ?? [] };
      });

      if (updated.ok) {
        mergeRole(updated.result);
        setEditing(null);
      }
    },
    [client, editing, mergeRole, roles, runMutation, t],
  );

  const toggleGroup = useCallback(
    async (role: ProductManagedRole, group: PermissionGroup) => {
      const state = getGroupState(role, group);
      const changed = await runMutation(
        state === "all" ? "revoking" : "granting",
        async () => {
          if (state === "all") {
            for (const permissionKey of group.permissionKeys) {
              await client!.management.roles.revokePermission({
                roleId: role.id,
                permissionKey,
              });
            }

            return {
              ...role,
              permissions: role.permissions.filter(
                (key) => !group.permissionKeys.includes(key),
              ),
            };
          }

          for (const permissionKey of group.permissionKeys) {
            if (!role.permissions.includes(permissionKey)) {
              await client!.management.roles.grantPermission({
                roleId: role.id,
                permissionKey,
              });
            }
          }

          return {
            ...role,
            permissions: [
              ...new Set([...role.permissions, ...group.permissionKeys]),
            ],
          };
        },
      );

      if (changed.ok) mergeRole(changed.result);
    },
    [client, mergeRole, runMutation],
  );

  if (!canManageRoles) return <Denied />;

  return (
    <section className="grid gap-4">
      <header className="flex items-start justify-between gap-4 rounded-[1.4rem] border border-blush/24 bg-card/78 p-5 shadow-soft">
        <div className="flex gap-3">
          <span className="grid size-11 place-items-center rounded-full bg-blush-strong text-background">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/48">
              {t("manager.permissions.eyebrow")}
            </p>
            <h2 className="mt-1 font-serif text-3xl text-foreground sm:text-4xl">
              {t("manager.permissions.title")}
            </h2>
            <p className="mt-2 max-w-prose text-sm leading-6 text-foreground/68">
              {t("manager.permissions.body")}
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
          aria-label={t("manager.permissions.refresh")}
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
          text={t("manager.permissions.loading")}
        />
      )}
      {!client && <Notice text={t("manager.permissions.unavailable")} />}
      {loadStatus === "error" && (
        <Notice
          icon={<AlertCircle className="size-4" aria-hidden="true" />}
          text={errorMessage ?? t("manager.permissions.errorBody")}
          action={
            <Button variant="outline" onClick={() => void load()}>
              {t("manager.permissions.retry")}
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
        <>
          <form
            className="rounded-[1.3rem] border border-blush/24 bg-card/60 p-4"
            onSubmit={(event) => void createRole(event)}
          >
            <h3 className="font-serif text-2xl text-foreground">
              {t("manager.permissions.createTitle")}
            </h3>
            <div className="mt-3 grid gap-3 lg:grid-cols-[1.2fr_1fr_auto]">
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
                  {t("manager.permissions.roleName")}
                </span>
                <input
                  required
                  className="h-11 rounded-xl border border-blush/24 bg-background/70 px-3"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </label>
              <LevelFields
                preset={form.levelPreset}
                customLevel={form.customLevel}
                onChange={(patch) =>
                  setForm((current) => ({ ...current, ...patch }))
                }
                t={t}
              />
              <Button
                type="submit"
                className="self-end rounded-full"
                disabled={mutationStatus !== "idle"}
              >
                <Plus className="size-4" aria-hidden="true" />
                {t("manager.permissions.createRole")}
              </Button>
            </div>
            <GroupChoices
              groups={availableGroups}
              selectedIds={form.groupIds}
              disabled={mutationStatus !== "idle"}
              onToggle={(id) =>
                setForm((current) => ({
                  ...current,
                  groupIds: current.groupIds.includes(id)
                    ? current.groupIds.filter((groupId) => groupId !== id)
                    : [...current.groupIds, id],
                }))
              }
              t={t}
            />
          </form>

          {roles.length === 0 ? (
            <Notice text={t("manager.permissions.empty")} />
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {roles.map((role) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  editing={editing}
                  groups={availableGroups}
                  mutationStatus={mutationStatus}
                  onEditingChange={setEditing}
                  onSubmit={updateRole}
                  onToggleGroup={toggleGroup}
                  t={t}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function RoleCard({
  role,
  editing,
  groups,
  mutationStatus,
  onEditingChange,
  onSubmit,
  onToggleGroup,
  t,
}: {
  role: ProductManagedRole;
  editing: EditingRole;
  groups: PermissionGroup[];
  mutationStatus: MutationStatus;
  onEditingChange: (value: EditingRole) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onToggleGroup: (role: ProductManagedRole, group: PermissionGroup) => Promise<void>;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  const isEditing = editing?.roleId === role.id;

  return (
    <article className="rounded-[1.3rem] border border-blush/24 bg-card/60 p-4">
      {isEditing && editing ? (
        <form className="grid gap-3" onSubmit={(event) => void onSubmit(event)}>
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
              {t("manager.permissions.roleName")}
            </span>
            <input
              required
              className="h-10 rounded-xl border border-blush/24 bg-background/70 px-3"
              value={editing.name}
              onChange={(event) =>
                onEditingChange({ ...editing, name: event.target.value })
              }
            />
          </label>
          <LevelFields
            preset={editing.levelPreset}
            customLevel={editing.customLevel}
            onChange={(patch) => onEditingChange({ ...editing, ...patch })}
            t={t}
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={mutationStatus !== "idle"}>
              {t("actions.save")}
            </Button>
            <Button type="button" variant="outline" onClick={() => onEditingChange(null)}>
              {t("actions.cancel")}
            </Button>
          </div>
        </form>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-serif text-2xl text-foreground">{role.name}</h3>
              <p className="mt-1 text-sm text-foreground/56">
                {role.key} · {t("manager.permissions.level", { level: role.level })}
              </p>
            </div>
            {role.is_protected ? (
              <span className="rounded-full border border-blush/24 px-3 py-1 text-xs text-foreground/60">
                {t("manager.permissions.protected")}
              </span>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={mutationStatus !== "idle"}
                onClick={() =>
                  onEditingChange({
                    roleId: role.id,
                    name: role.name,
                    levelPreset: getPresetForLevel(role.level),
                    customLevel: String(role.level),
                  })
                }
              >
                <Pencil className="size-3" aria-hidden="true" />
                {t("manager.permissions.editRole")}
              </Button>
            )}
          </div>
          <div className="mt-4 grid gap-2">
            {groups.map((group) => {
              const Icon = group.icon;
              const state = getGroupState(role, group);

              return (
                <button
                  key={group.id}
                  type="button"
                  disabled={role.is_protected || mutationStatus !== "idle"}
                  className="flex items-center justify-between gap-3 rounded-xl border border-blush/18 bg-background/32 p-3 text-start disabled:cursor-not-allowed disabled:opacity-55"
                  aria-pressed={state === "all"}
                  onClick={() => void onToggleGroup(role, group)}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="size-4 text-blush-strong" aria-hidden="true" />
                    <span>
                      <span className="block text-sm font-semibold text-foreground">
                        {t(group.labelKey)}
                      </span>
                      <span className="block text-xs text-foreground/56">
                        {t(group.descriptionKey)}
                      </span>
                    </span>
                  </span>
                  <span className="text-xs font-semibold text-foreground/56">
                    {state === "all" ? (
                      <Check className="size-4 text-blush-strong" aria-hidden="true" />
                    ) : state === "partial" ? (
                      t("manager.permissions.partial")
                    ) : (
                      <X className="size-4" aria-hidden="true" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </article>
  );
}

function LevelFields({
  preset,
  customLevel,
  onChange,
  t,
}: {
  preset: RoleLevelPreset;
  customLevel: string;
  onChange: (patch: Partial<Pick<RoleForm, "levelPreset" | "customLevel">>) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_7rem]">
      <label className="grid gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
          {t("manager.permissions.roleLevel")}
        </span>
        <select
          className="h-11 rounded-xl border border-blush/24 bg-background/70 px-3"
          value={preset}
          onChange={(event) =>
            onChange({ levelPreset: event.target.value as RoleLevelPreset })
          }
        >
          {roleLevelPresets.map((option) => (
            <option key={option.id} value={option.id}>
              {t(`manager.permissions.rolePresets.${option.id}`)}
            </option>
          ))}
        </select>
      </label>
      {preset === "custom" && (
        <label className="grid gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
            {t("manager.permissions.roleLevel")}
          </span>
          <input
            required
            type="number"
            min="0"
            max="100"
            className="h-11 rounded-xl border border-blush/24 bg-background/70 px-3"
            value={customLevel}
            onChange={(event) => onChange({ customLevel: event.target.value })}
          />
        </label>
      )}
    </div>
  );
}

function GroupChoices({
  groups,
  selectedIds,
  disabled,
  onToggle,
  t,
}: {
  groups: PermissionGroup[];
  selectedIds: string[];
  disabled: boolean;
  onToggle: (id: string) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
      {groups.map((group) => {
        const selected = selectedIds.includes(group.id);
        const Icon = group.icon;

        return (
          <button
            key={group.id}
            type="button"
            disabled={disabled}
            className={
              selected
                ? "rounded-xl border border-blush-strong bg-blush-strong/12 p-3 text-start"
                : "rounded-xl border border-blush/24 bg-background/32 p-3 text-start"
            }
            aria-pressed={selected}
            onClick={() => onToggle(group.id)}
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Icon className="size-4 text-blush-strong" aria-hidden="true" />
              {t(group.labelKey)}
            </span>
            <span className="mt-1 block text-xs leading-5 text-foreground/56">
              {t(group.descriptionKey)}
            </span>
          </button>
        );
      })}
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
        {t("manager.permissions.noAccessTitle")}
      </p>
      <p className="mt-2 text-sm leading-6 text-foreground/68">
        {t("manager.permissions.noAccessBody")}
      </p>
    </section>
  );
}

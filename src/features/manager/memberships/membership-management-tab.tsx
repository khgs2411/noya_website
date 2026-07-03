import type {
  MembershipGrant,
  MembershipLedgerEntry,
  MembershipMode,
  MembershipType,
  ProductUserListItem,
} from "@class-kit/react";
import { useProductContext } from "@class-kit/react";
import {
  AlertCircle,
  Check,
  Loader2,
  Plus,
  RefreshCw,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

type LoadStatus = "idle" | "loading" | "loaded" | "error";

type MembershipForm = {
  name: string;
  mode: MembershipMode;
  defaultStock: string;
  defaultDurationDays: string;
};

type UserMembershipState = {
  loadStatus: LoadStatus;
  grants: MembershipGrant[];
  ledger: MembershipLedgerEntry[];
  errorMessage: string | null;
};

type GrantForm = {
  membershipTypeId: string;
  totalStock: string;
  validFrom: string;
  validUntil: string;
  mode: "grant" | "upgrade";
};

type EditingMembershipForm = MembershipForm & {
  membershipTypeId: string;
};

type MembershipManagementTabProps = {
  canManageMemberships: boolean;
};

const modeOptions: MembershipMode[] = [
  "stock",
  "limited_stock",
  "limited",
  "infinite",
];

const initialForm: MembershipForm = {
  name: "",
  mode: "limited_stock",
  defaultStock: "10",
  defaultDurationDays: "30",
};

const initialGrantForm: GrantForm = {
  membershipTypeId: "",
  totalStock: "",
  validFrom: "",
  validUntil: "",
  mode: "grant",
};

const membershipLedgerLimit = 8;

function supportsStock(mode: MembershipMode) {
  return mode === "stock" || mode === "limited_stock";
}

function supportsDuration(mode: MembershipMode) {
  return mode === "limited" || mode === "limited_stock";
}

function parseOptionalPositiveInteger(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return Number.NaN;
  return parsed;
}

function buildTypeInput(
  form: MembershipForm,
  t: (key: string) => string,
) {
  const defaultStock = supportsStock(form.mode)
    ? parseOptionalPositiveInteger(form.defaultStock)
    : null;
  const defaultDurationDays = supportsDuration(form.mode)
    ? parseOptionalPositiveInteger(form.defaultDurationDays)
    : null;

  if (Number.isNaN(defaultStock) || Number.isNaN(defaultDurationDays)) {
    throw new Error(t("manager.memberships.invalidNumbers"));
  }

  return {
    name: form.name.trim(),
    mode: form.mode,
    defaultStock,
    defaultDurationDays,
  };
}

function mergeMembershipType(
  membershipTypes: MembershipType[],
  membershipType: MembershipType,
) {
  if (!membershipTypes.some((item) => item.id === membershipType.id)) {
    return [...membershipTypes, membershipType];
  }

  return membershipTypes.map((item) =>
    item.id === membershipType.id ? membershipType : item,
  );
}

function mergeMembershipGrant(
  grants: MembershipGrant[],
  grant: MembershipGrant,
) {
  if (!grants.some((item) => item.id === grant.id)) return [...grants, grant];

  return grants.map((item) => (item.id === grant.id ? grant : item));
}

function formatNullableNumber(value: number | null) {
  return value === null ? "" : String(value);
}

function getUserLabel(user: ProductUserListItem) {
  return user.display_name ?? user.email ?? user.user_id;
}

function getGrantStockLabel(
  grant: MembershipGrant,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  if (grant.total_stock === null) return t("manager.memberships.notLimited");

  return t("manager.memberships.remainingStock", {
    remaining: grant.remaining_stock ?? 0,
    total: grant.total_stock,
  });
}

function getDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseOptionalDate(value: string) {
  if (!value) return null;
  return new Date(`${value}T00:00:00`).toISOString();
}

export function MembershipManagementTab({
  canManageMemberships,
}: MembershipManagementTabProps) {
  const { t, i18n } = useTranslation();
  const { client } = useProductContext();
  const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);
  const [users, setUsers] = useState<ProductUserListItem[]>([]);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [mutatingKey, setMutatingKey] = useState<string | null>(null);
  const [form, setForm] = useState<MembershipForm>(initialForm);
  const [grantForm, setGrantForm] = useState<GrantForm>(initialGrantForm);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUserMembership, setSelectedUserMembership] =
    useState<UserMembershipState>({
      loadStatus: "idle",
      grants: [],
      ledger: [],
      errorMessage: null,
    });
  const [editingForm, setEditingForm] = useState<EditingMembershipForm | null>(
    null,
  );
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        dateStyle: "medium",
      }),
    [i18n.language],
  );
  const dateTimeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [i18n.language],
  );
  const activeMembershipTypes = useMemo(
    () =>
      membershipTypes.filter(
        (membershipType) => membershipType.status === "active",
      ),
    [membershipTypes],
  );
  const membershipTypesById = useMemo(
    () =>
      new Map(
        membershipTypes.map((membershipType) => [
          membershipType.id,
          membershipType,
        ]),
      ),
    [membershipTypes],
  );
  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    if (!query) return users.slice(0, 8);

    return users
      .filter((user) =>
        [user.display_name, user.email, user.user_id, user.status, user.scope]
          .filter((value): value is string => Boolean(value))
          .some((value) => value.toLowerCase().includes(query)),
      )
      .slice(0, 12);
  }, [userSearch, users]);
  const selectedUser = useMemo(
    () => users.find((user) => user.user_id === selectedUserId) ?? null,
    [selectedUserId, users],
  );

  const loadMembershipTypes = useCallback(async (options?: { silent?: boolean }) => {
    if (!client || !canManageMemberships) {
      setMembershipTypes([]);
      setUsers([]);
      setLoadStatus("idle");
      return;
    }

    if (!options?.silent) {
      setLoadStatus("loading");
      setErrorMessage(null);
    }

    try {
      const [membershipTypeResult, userResult] = await Promise.all([
        client.management.memberships.listTypes(),
        client.management.users.list(),
      ]);
      setMembershipTypes(membershipTypeResult.membership_types);
      setUsers(userResult.users);
      setLoadStatus("loaded");
    } catch (error) {
      if (options?.silent) return;

      setErrorMessage(
        error instanceof Error
          ? error.message
          : t("manager.memberships.errorBody"),
      );
      setLoadStatus("error");
    }
  }, [canManageMemberships, client, t]);

  const loadUserMemberships = useCallback(
    async (userId: string, options?: { silent?: boolean }) => {
      if (!client || !canManageMemberships || !userId) return;

      if (!options?.silent) {
        setSelectedUserMembership((current) => ({
          loadStatus: "loading",
          grants: current.grants,
          ledger: current.ledger,
          errorMessage: null,
        }));
      }

      try {
        const [grantResult, ledgerResult] = await Promise.all([
          client.management.memberships.listUserGrants(userId),
          client.management.memberships.listLedger({
            userId,
            limit: membershipLedgerLimit,
          }),
        ]);

        setSelectedUserMembership({
          loadStatus: "loaded",
          grants: grantResult.membership_grants,
          ledger: ledgerResult.membership_ledger,
          errorMessage: null,
        });
      } catch (error) {
        if (options?.silent) return;

        setSelectedUserMembership((current) => ({
          loadStatus: "error",
          grants: current.grants,
          ledger: current.ledger,
          errorMessage:
            error instanceof Error
              ? error.message
              : t("manager.memberships.userErrorBody"),
        }));
      }
    },
    [canManageMemberships, client, t],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadMembershipTypes();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadMembershipTypes]);

  useEffect(() => {
    if (!selectedUserId) {
      setSelectedUserMembership({
        loadStatus: "idle",
        grants: [],
        ledger: [],
        errorMessage: null,
      });
      setGrantForm(initialGrantForm);
      return;
    }

    const defaultMembershipType = activeMembershipTypes[0];
    setGrantForm({
      ...initialGrantForm,
      membershipTypeId: defaultMembershipType?.id ?? "",
      validFrom: getDateInputValue(new Date()),
    });
    void loadUserMemberships(selectedUserId);
  }, [activeMembershipTypes, loadUserMemberships, selectedUserId]);

  const runMembershipMutation = useCallback(
    async <T,>(key: string, command: () => Promise<T>) => {
      if (!client || mutatingKey) return { ok: false as const };

      setOperationError(null);
      setMutatingKey(key);

      try {
        const result = await command();
        void loadMembershipTypes({ silent: true });
        return { ok: true as const, result };
      } catch (error) {
        setOperationError(
          error instanceof Error
            ? error.message
            : t("manager.memberships.actionFailed"),
        );
        return { ok: false as const };
      } finally {
        setMutatingKey(null);
      }
    },
    [client, loadMembershipTypes, mutatingKey, t],
  );

  const createMembershipType = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!client || !canManageMemberships) return;

      let input: ReturnType<typeof buildTypeInput>;
      try {
        input = buildTypeInput(form, t);
      } catch (error) {
        setOperationError(
          error instanceof Error
            ? error.message
            : t("manager.memberships.invalidNumbers"),
        );
        return;
      }

      const created = await runMembershipMutation("create", () =>
        client.management.memberships.createType(input),
      );

      if (created.ok) {
        setMembershipTypes((current) =>
          mergeMembershipType(current, created.result.membership_type),
        );
        setForm(initialForm);
      }
    },
    [canManageMemberships, client, form, runMembershipMutation, t],
  );

  const updateMembershipType = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!client || !canManageMemberships || !editingForm) return;

      let input: ReturnType<typeof buildTypeInput>;
      try {
        input = buildTypeInput(editingForm, t);
      } catch (error) {
        setOperationError(
          error instanceof Error
            ? error.message
            : t("manager.memberships.invalidNumbers"),
        );
        return;
      }

      const updated = await runMembershipMutation(editingForm.membershipTypeId, () =>
        client.management.memberships.updateType({
          membershipTypeId: editingForm.membershipTypeId,
          name: input.name,
          defaultStock: input.defaultStock,
          defaultDurationDays: input.defaultDurationDays,
        }),
      );

      if (updated.ok) {
        setMembershipTypes((current) =>
          mergeMembershipType(current, updated.result.membership_type),
        );
        setEditingForm(null);
      }
    },
    [canManageMemberships, client, editingForm, runMembershipMutation, t],
  );

  const deactivateMembershipType = useCallback(
    (membershipTypeId: string) => {
      if (!client || !canManageMemberships) return;

      void runMembershipMutation(membershipTypeId, () =>
        client.management.memberships.deactivateType(membershipTypeId),
      ).then((result) => {
        if (result.ok) {
          setMembershipTypes((current) =>
            mergeMembershipType(current, result.result.membership_type),
          );
        }
      });
    },
    [canManageMemberships, client, runMembershipMutation],
  );

  const grantMembership = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!client || !canManageMemberships || !selectedUserId) return;

      const selectedMembershipType = membershipTypesById.get(
        grantForm.membershipTypeId,
      );
      if (!selectedMembershipType) {
        setOperationError(t("manager.memberships.chooseMembershipType"));
        return;
      }

      const totalStock = supportsStock(selectedMembershipType.mode)
        ? parseOptionalPositiveInteger(grantForm.totalStock)
        : null;
      if (Number.isNaN(totalStock)) {
        setOperationError(t("manager.memberships.invalidNumbers"));
        return;
      }

      const input = {
        userId: selectedUserId,
        membershipTypeId: selectedMembershipType.id,
        validFrom: parseOptionalDate(grantForm.validFrom),
        validUntil: parseOptionalDate(grantForm.validUntil),
        totalStock,
      };

      const granted = await runMembershipMutation(
        `grant-${selectedUserId}`,
        () =>
          grantForm.mode === "upgrade"
            ? client.management.memberships.upgrade(input)
            : client.management.memberships.grant(input),
      );

      if (granted.ok) {
        setSelectedUserMembership((current) => ({
          ...current,
          loadStatus: "loaded",
          grants: mergeMembershipGrant(
            current.grants,
            granted.result.membership_grant,
          ),
        }));
        void loadUserMemberships(selectedUserId, { silent: true });
      }
    },
    [
      canManageMemberships,
      client,
      grantForm,
      loadUserMemberships,
      membershipTypesById,
      runMembershipMutation,
      selectedUserId,
      t,
    ],
  );

  const revokeMembership = useCallback(
    (membershipGrantId: string) => {
      if (!client || !canManageMemberships || !selectedUserId) return;

      void runMembershipMutation(membershipGrantId, () =>
        client.management.memberships.revoke(membershipGrantId),
      ).then((result) => {
        if (result.ok) {
          setSelectedUserMembership((current) => ({
            ...current,
            loadStatus: "loaded",
            grants: mergeMembershipGrant(
              current.grants,
              result.result.membership_grant,
            ),
          }));
          void loadUserMemberships(selectedUserId, { silent: true });
        }
      });
    },
    [
      canManageMemberships,
      client,
      loadUserMemberships,
      runMembershipMutation,
      selectedUserId,
    ],
  );

  if (!canManageMemberships) {
    return (
      <section className="rounded-[1.4rem] border border-blush/24 bg-card/78 p-5 shadow-soft">
        <p className="font-serif text-xl text-foreground">
          {t("manager.memberships.noAccessTitle")}
        </p>
        <p className="mt-2 text-sm leading-6 text-foreground/68">
          {t("manager.memberships.noAccessBody")}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[1.4rem] border border-blush/24 bg-card/78 p-4 shadow-soft sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blush-strong text-background">
            <WalletCards className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-serif text-xs uppercase tracking-[0.25em] text-foreground/48">
              {t("manager.memberships.eyebrow")}
            </p>
            <h2 className="mt-1 font-serif text-3xl text-foreground">
              {t("manager.memberships.title")}
            </h2>
            <p className="mt-2 max-w-prose text-sm leading-6 text-foreground/68">
              {t("manager.memberships.body")}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="shrink-0 rounded-full"
          disabled={loadStatus === "loading"}
          onClick={() => void loadMembershipTypes()}
        >
          <RefreshCw
            className={[
              "size-4",
              loadStatus === "loading" ? "animate-spin" : "",
            ].join(" ")}
            aria-hidden="true"
          />
          {t("manager.memberships.refresh")}
        </Button>
      </div>

      <section className="mt-5 rounded-[1.3rem] border border-blush/24 bg-background/34 p-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blush-strong/16 text-blush-strong">
            <UserRound className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="font-serif text-2xl text-foreground">
              {t("manager.memberships.assignTitle")}
            </h3>
            <p className="mt-1 text-sm leading-6 text-foreground/60">
              {t("manager.memberships.assignBody")}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(18rem,26rem)_1fr]">
          <div className="grid gap-3">
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
                {t("manager.memberships.userSearch")}
              </span>
              <input
                className="h-11 rounded-xl border border-blush/24 bg-background/70 px-3 text-sm text-foreground outline-none focus:border-blush-strong"
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
              />
            </label>
            <div className="grid max-h-80 gap-2 overflow-y-auto pe-1">
              {filteredUsers.length === 0 ? (
                <p className="rounded-xl border border-blush/24 bg-card/40 p-3 text-sm leading-6 text-foreground/60">
                  {t("manager.memberships.noUsers")}
                </p>
              ) : (
                filteredUsers.map((user) => {
                  const selected = user.user_id === selectedUserId;

                  return (
                    <button
                      key={user.user_id}
                      type="button"
                      className={[
                        "rounded-xl border p-3 text-start transition-colors",
                        selected
                          ? "border-blush-strong bg-blush-strong/12"
                          : "border-blush/24 bg-card/45 hover:border-blush-strong/55",
                      ].join(" ")}
                      aria-pressed={selected}
                      onClick={() => setSelectedUserId(user.user_id)}
                    >
                      <span className="block break-words font-serif text-lg text-foreground [overflow-wrap:anywhere]">
                        {getUserLabel(user)}
                      </span>
                      {user.email && (
                        <span className="mt-1 block break-words text-sm text-foreground/60 [overflow-wrap:anywhere]">
                          {user.email}
                        </span>
                      )}
                      <span className="mt-2 block text-xs font-semibold uppercase tracking-[0.16em] text-foreground/44">
                        {user.status} · {user.scope}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-[1.1rem] border border-blush/24 bg-card/50 p-4">
            {!selectedUser ? (
              <p className="text-sm leading-6 text-foreground/60">
                {t("manager.memberships.selectUser")}
              </p>
            ) : (
              <div className="grid gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-serif text-xl text-foreground">
                      {getUserLabel(selectedUser)}
                    </p>
                    {selectedUser.email && (
                      <p className="mt-1 break-words text-sm text-foreground/60 [overflow-wrap:anywhere]">
                        {selectedUser.email}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 rounded-full"
                    disabled={selectedUserMembership.loadStatus === "loading"}
                    onClick={() => void loadUserMemberships(selectedUser.user_id)}
                  >
                    <RefreshCw
                      className={[
                        "size-4",
                        selectedUserMembership.loadStatus === "loading"
                          ? "animate-spin"
                          : "",
                      ].join(" ")}
                      aria-hidden="true"
                    />
                    {t("manager.memberships.refreshUser")}
                  </Button>
                </div>

                <form
                  className="grid gap-3 rounded-xl border border-blush/24 bg-background/36 p-3 lg:grid-cols-2"
                  onSubmit={(event) => void grantMembership(event)}
                >
                  <label className="grid gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
                      {t("manager.memberships.membershipType")}
                    </span>
                    <select
                      className="h-10 rounded-xl border border-blush/24 bg-background/70 px-3 text-sm text-foreground outline-none focus:border-blush-strong"
                      value={grantForm.membershipTypeId}
                      onChange={(event) => {
                        const membershipType = membershipTypesById.get(
                          event.target.value,
                        );
                        setGrantForm((current) => ({
                          ...current,
                          membershipTypeId: event.target.value,
                          totalStock:
                            membershipType?.default_stock === null ||
                            membershipType?.default_stock === undefined
                              ? ""
                              : String(membershipType.default_stock),
                        }));
                      }}
                      required
                    >
                      <option value="">
                        {t("manager.memberships.chooseMembershipType")}
                      </option>
                      {activeMembershipTypes.map((membershipType) => (
                        <option key={membershipType.id} value={membershipType.id}>
                          {membershipType.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
                      {t("manager.memberships.assignmentMode")}
                    </span>
                    <select
                      className="h-10 rounded-xl border border-blush/24 bg-background/70 px-3 text-sm text-foreground outline-none focus:border-blush-strong"
                      value={grantForm.mode}
                      onChange={(event) =>
                        setGrantForm((current) => ({
                          ...current,
                          mode: event.target.value as GrantForm["mode"],
                        }))
                      }
                    >
                      <option value="grant">
                        {t("manager.memberships.grantMode.grant")}
                      </option>
                      <option value="upgrade">
                        {t("manager.memberships.grantMode.upgrade")}
                      </option>
                    </select>
                  </label>
                  {supportsStock(
                    membershipTypesById.get(grantForm.membershipTypeId)?.mode ??
                      "stock",
                  ) && (
                    <label className="grid gap-1.5">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
                        {t("manager.memberships.totalStock")}
                      </span>
                      <input
                        className="h-10 rounded-xl border border-blush/24 bg-background/70 px-3 text-sm text-foreground outline-none focus:border-blush-strong"
                        type="number"
                        min="1"
                        value={grantForm.totalStock}
                        placeholder={t("manager.memberships.totalStockOverride")}
                        onChange={(event) =>
                          setGrantForm((current) => ({
                            ...current,
                            totalStock: event.target.value,
                          }))
                        }
                      />
                    </label>
                  )}
                  <label className="grid gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
                      {t("manager.memberships.validFrom")}
                    </span>
                    <input
                      className="h-10 rounded-xl border border-blush/24 bg-background/70 px-3 text-sm text-foreground outline-none focus:border-blush-strong"
                      type="date"
                      value={grantForm.validFrom}
                      onChange={(event) =>
                        setGrantForm((current) => ({
                          ...current,
                          validFrom: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
                      {t("manager.memberships.validUntil")}
                    </span>
                    <input
                      className="h-10 rounded-xl border border-blush/24 bg-background/70 px-3 text-sm text-foreground outline-none focus:border-blush-strong"
                      type="date"
                      value={grantForm.validUntil}
                      onChange={(event) =>
                        setGrantForm((current) => ({
                          ...current,
                          validUntil: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <Button
                    type="submit"
                    className="rounded-full lg:self-end"
                    disabled={Boolean(mutatingKey) || !grantForm.membershipTypeId}
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    {t(`manager.memberships.grantAction.${grantForm.mode}`)}
                  </Button>
                </form>

                {selectedUserMembership.loadStatus === "loading" && (
                  <p className="rounded-xl border border-blush/24 bg-background/36 p-3 text-sm text-foreground/68">
                    <Loader2
                      className="me-2 inline size-4 animate-spin text-blush-strong"
                      aria-hidden="true"
                    />
                    {t("manager.memberships.loadingUser")}
                  </p>
                )}

                {selectedUserMembership.loadStatus === "error" && (
                  <p className="rounded-xl border border-blush/24 bg-background/36 p-3 text-sm leading-6 text-blush-strong">
                    {selectedUserMembership.errorMessage ??
                      t("manager.memberships.userErrorBody")}
                  </p>
                )}

                {selectedUserMembership.loadStatus === "loaded" && (
                  <div className="grid gap-3">
                    <div className="grid gap-2 md:grid-cols-2">
                      {selectedUserMembership.grants.length === 0 ? (
                        <p className="rounded-xl border border-blush/24 bg-background/36 p-3 text-sm leading-6 text-foreground/60 md:col-span-2">
                          {t("manager.memberships.noGrants")}
                        </p>
                      ) : (
                        selectedUserMembership.grants.map((grant) => {
                          const membershipType = membershipTypesById.get(
                            grant.membership_type_id,
                          );
                          const isMutating = mutatingKey === grant.id;

                          return (
                            <article
                              key={grant.id}
                              className="rounded-xl border border-blush/24 bg-background/36 p-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="break-words font-serif text-lg text-foreground [overflow-wrap:anywhere]">
                                    {membershipType?.name ??
                                      grant.membership_type_id}
                                  </p>
                                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
                                    {t(
                                      `manager.memberships.status.${grant.status}`,
                                    )}
                                  </p>
                                </div>
                                {grant.status === "active" && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="shrink-0 rounded-full"
                                    disabled={Boolean(mutatingKey)}
                                    onClick={() => revokeMembership(grant.id)}
                                  >
                                    {isMutating ? (
                                      <Loader2
                                        className="size-4 animate-spin"
                                        aria-hidden="true"
                                      />
                                    ) : (
                                      <X className="size-4" aria-hidden="true" />
                                    )}
                                    {t("manager.memberships.revoke")}
                                  </Button>
                                )}
                              </div>
                              <dl className="mt-3 grid gap-2 text-sm text-foreground/68">
                                <div className="flex justify-between gap-3">
                                  <dt>{t("manager.memberships.stock")}</dt>
                                  <dd className="text-foreground">
                                    {getGrantStockLabel(grant, t)}
                                  </dd>
                                </div>
                                <div className="flex justify-between gap-3">
                                  <dt>{t("manager.memberships.validFrom")}</dt>
                                  <dd className="text-foreground">
                                    {dateFormatter.format(
                                      new Date(grant.valid_from),
                                    )}
                                  </dd>
                                </div>
                                <div className="flex justify-between gap-3">
                                  <dt>{t("manager.memberships.validUntil")}</dt>
                                  <dd className="text-foreground">
                                    {grant.valid_until
                                      ? dateFormatter.format(
                                          new Date(grant.valid_until),
                                        )
                                      : t("manager.memberships.notLimited")}
                                  </dd>
                                </div>
                              </dl>
                            </article>
                          );
                        })
                      )}
                    </div>

                    <div className="rounded-xl border border-blush/24 bg-background/36 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
                        {t("manager.memberships.ledgerTitle")}
                      </p>
                      {selectedUserMembership.ledger.length === 0 ? (
                        <p className="mt-2 text-sm leading-6 text-foreground/60">
                          {t("manager.memberships.noLedger")}
                        </p>
                      ) : (
                        <div className="mt-2 grid gap-2">
                          {selectedUserMembership.ledger.map((entry) => (
                            <div
                              key={entry.id}
                              className="flex flex-col gap-1 rounded-lg border border-blush/18 bg-card/38 p-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                            >
                              <span className="font-semibold text-foreground">
                                {t(
                                  `manager.memberships.event.${entry.event_type}`,
                                )}
                              </span>
                              <span className="text-foreground/60">
                                {dateTimeFormatter.format(
                                  new Date(entry.created_at),
                                )}
                                {entry.stock_delta !== 0
                                  ? ` · ${t("manager.memberships.stockDelta", {
                                      count: entry.stock_delta,
                                    })}`
                                  : ""}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(18rem,24rem)_1fr]">
        <form
          className="rounded-[1.3rem] border border-blush/24 bg-background/34 p-4"
          onSubmit={(event) => void createMembershipType(event)}
        >
          <h3 className="font-serif text-2xl text-foreground">
            {t("manager.memberships.createTitle")}
          </h3>
          <div className="mt-4 grid gap-3">
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
                {t("manager.memberships.name")}
              </span>
              <input
                className="h-11 rounded-xl border border-blush/24 bg-background/70 px-3 text-sm text-foreground outline-none focus:border-blush-strong"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                required
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
                {t("manager.memberships.type")}
              </span>
              <select
                className="h-11 rounded-xl border border-blush/24 bg-background/70 px-3 text-sm text-foreground outline-none focus:border-blush-strong"
                value={form.mode}
                onChange={(event) => {
                  const mode = event.target.value as MembershipMode;
                  setForm((current) => ({ ...current, mode }));
                }}
              >
                {modeOptions.map((mode) => (
                  <option key={mode} value={mode}>
                    {t(`manager.memberships.mode.${mode}`)}
                  </option>
                ))}
              </select>
            </label>
            {supportsStock(form.mode) && (
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
                  {t("manager.memberships.defaultStock")}
                </span>
                <input
                  className="h-11 rounded-xl border border-blush/24 bg-background/70 px-3 text-sm text-foreground outline-none focus:border-blush-strong"
                  type="number"
                  min="1"
                  value={form.defaultStock}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      defaultStock: event.target.value,
                    }))
                  }
                />
              </label>
            )}
            {supportsDuration(form.mode) && (
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
                  {t("manager.memberships.defaultDurationDays")}
                </span>
                <input
                  className="h-11 rounded-xl border border-blush/24 bg-background/70 px-3 text-sm text-foreground outline-none focus:border-blush-strong"
                  type="number"
                  min="1"
                  value={form.defaultDurationDays}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      defaultDurationDays: event.target.value,
                    }))
                  }
                />
              </label>
            )}
            <Button
              type="submit"
              className="rounded-full"
              disabled={Boolean(mutatingKey)}
            >
              <Plus className="size-4" aria-hidden="true" />
              {t("manager.memberships.create")}
            </Button>
          </div>
        </form>

        <div className="rounded-[1.3rem] border border-blush/24 bg-background/34 p-4">
          <h3 className="font-serif text-2xl text-foreground">
            {t("manager.memberships.typesTitle")}
          </h3>

          {operationError && (
            <p className="mt-3 rounded-xl border border-blush/24 bg-card/40 p-3 text-sm leading-6 text-blush-strong">
              {operationError}
            </p>
          )}

          {loadStatus === "loading" && (
            <p className="mt-4 rounded-xl border border-blush/24 bg-card/40 p-4 text-sm text-foreground/68">
              <Loader2
                className="me-2 inline size-4 animate-spin text-blush-strong"
                aria-hidden="true"
              />
              {t("manager.memberships.loading")}
            </p>
          )}

          {loadStatus === "error" && (
            <div className="mt-4 rounded-xl border border-blush/24 bg-card/40 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle
                  className="mt-0.5 size-5 shrink-0 text-blush-strong"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="font-serif text-xl text-foreground">
                    {t("manager.memberships.errorTitle")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-foreground/68">
                    {errorMessage ?? t("manager.memberships.errorBody")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {loadStatus === "loaded" && membershipTypes.length === 0 && (
            <p className="mt-4 rounded-xl border border-blush/24 bg-card/40 p-4 text-sm leading-6 text-foreground/60">
              {t("manager.memberships.empty")}
            </p>
          )}

          {loadStatus === "loaded" && membershipTypes.length > 0 && (
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {membershipTypes.map((membershipType) => {
                const isEditing =
                  editingForm?.membershipTypeId === membershipType.id;
                const isMutating = mutatingKey === membershipType.id;

                return (
                  <article
                    key={membershipType.id}
                    className="rounded-[1.2rem] border border-blush/24 bg-card/60 p-4"
                  >
                    {isEditing ? (
                      <form
                        className="grid gap-3"
                        onSubmit={(event) => void updateMembershipType(event)}
                      >
                        <label className="grid gap-1.5">
                          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
                            {t("manager.memberships.name")}
                          </span>
                          <input
                            className="h-10 rounded-xl border border-blush/24 bg-background/70 px-3 text-sm text-foreground outline-none focus:border-blush-strong"
                            value={editingForm.name}
                            onChange={(event) =>
                              setEditingForm((current) =>
                                current
                                  ? { ...current, name: event.target.value }
                                  : current,
                              )
                            }
                            required
                          />
                        </label>
                        {supportsStock(editingForm.mode) && (
                          <label className="grid gap-1.5">
                            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
                              {t("manager.memberships.defaultStock")}
                            </span>
                            <input
                              className="h-10 rounded-xl border border-blush/24 bg-background/70 px-3 text-sm text-foreground outline-none focus:border-blush-strong"
                              type="number"
                              min="1"
                              value={editingForm.defaultStock}
                              onChange={(event) =>
                                setEditingForm((current) =>
                                  current
                                    ? {
                                        ...current,
                                        defaultStock: event.target.value,
                                      }
                                    : current,
                                )
                              }
                            />
                          </label>
                        )}
                        {supportsDuration(editingForm.mode) && (
                          <label className="grid gap-1.5">
                            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
                              {t("manager.memberships.defaultDurationDays")}
                            </span>
                            <input
                              className="h-10 rounded-xl border border-blush/24 bg-background/70 px-3 text-sm text-foreground outline-none focus:border-blush-strong"
                              type="number"
                              min="1"
                              value={editingForm.defaultDurationDays}
                              onChange={(event) =>
                                setEditingForm((current) =>
                                  current
                                    ? {
                                        ...current,
                                        defaultDurationDays: event.target.value,
                                      }
                                    : current,
                                )
                              }
                            />
                          </label>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="submit"
                            size="sm"
                            className="rounded-full"
                            disabled={Boolean(mutatingKey)}
                          >
                            <Check className="size-4" aria-hidden="true" />
                            {t("actions.save")}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="rounded-full"
                            onClick={() => setEditingForm(null)}
                          >
                            {t("actions.cancel")}
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="break-words font-serif text-xl text-foreground [overflow-wrap:anywhere]">
                              {membershipType.name}
                            </h4>
                            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
                              {t(`manager.memberships.mode.${membershipType.mode}`)}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full border border-blush/24 px-2.5 py-1 text-xs font-semibold text-foreground/62">
                            {t(
                              `manager.memberships.status.${membershipType.status}`,
                            )}
                          </span>
                        </div>

                        <dl className="mt-4 grid gap-2 text-sm text-foreground/68">
                          <div className="flex justify-between gap-3">
                            <dt>{t("manager.memberships.defaultStock")}</dt>
                            <dd className="text-foreground">
                              {membershipType.default_stock ??
                                t("manager.memberships.notLimited")}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt>{t("manager.memberships.defaultDurationDays")}</dt>
                            <dd className="text-foreground">
                              {membershipType.default_duration_days
                                ? t("manager.memberships.days", {
                                    count:
                                      membershipType.default_duration_days,
                                  })
                                : t("manager.memberships.notLimited")}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt>{t("manager.memberships.updatedAt")}</dt>
                            <dd className="text-foreground">
                              {dateFormatter.format(
                                new Date(membershipType.updated_at),
                              )}
                            </dd>
                          </div>
                        </dl>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="rounded-full"
                            disabled={Boolean(mutatingKey)}
                            onClick={() =>
                              setEditingForm({
                                membershipTypeId: membershipType.id,
                                name: membershipType.name,
                                mode: membershipType.mode,
                                defaultStock: formatNullableNumber(
                                  membershipType.default_stock,
                                ),
                                defaultDurationDays: formatNullableNumber(
                                  membershipType.default_duration_days,
                                ),
                              })
                            }
                          >
                            {t("manager.memberships.edit")}
                          </Button>
                          {membershipType.status === "active" && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="rounded-full"
                              disabled={Boolean(mutatingKey)}
                              onClick={() =>
                                deactivateMembershipType(membershipType.id)
                              }
                            >
                              {isMutating && (
                                <Loader2
                                  className="size-4 animate-spin"
                                  aria-hidden="true"
                                />
                              )}
                              {t("manager.memberships.deactivate")}
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

import type {
  MembershipGrant,
  MembershipLedgerEntry,
  MembershipMode,
  MembershipType,
  ProductUserListItem,
  ClassTemplate,
} from "@class-kit/react";
import { useProductContext } from "@class-kit/react";
import {
  AlertCircle,
  Check,
  ChevronDown,
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
import {
  getUserDisplayName,
  getUserSupportingEmail,
} from "@/features/users/user-labels";

type LoadStatus = "idle" | "loading" | "loaded" | "error";

type MembershipForm = {
  name: string;
  mode: MembershipMode;
  templateId: string;
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
};

type StockAdjustmentForm = {
  stockDelta: string;
};

type EditingMembershipForm = MembershipForm & {
  membershipTypeId: string;
  initialTemplateId: string | null;
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
  templateId: "",
  defaultStock: "10",
  defaultDurationDays: "30",
};

const initialGrantForm: GrantForm = {
  membershipTypeId: "",
  totalStock: "",
  validFrom: "",
  validUntil: "",
};

const membershipLedgerLimit = 8;
const ltrIsolate = "\u2066";
const popDirectionalIsolate = "\u2069";

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

function parseRequiredNonZeroInteger(value: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed === 0) return Number.NaN;
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
    templateId: form.templateId || null,
    defaultStock,
    defaultDurationDays,
  };
}

function getTemplateBindingLabel(
  templateId: string | null,
  templatesById: Map<string, ClassTemplate>,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  if (!templateId) return t("manager.memberships.allClasses");

  const template = templatesById.get(templateId);
  if (!template) {
    return t("manager.memberships.missingTemplate", { templateId });
  }

  return template.status === "active"
    ? template.name
    : t("manager.memberships.inactiveTemplate", {
        templateName: template.name,
      });
}

type TemplateEligibilityFieldProps = {
  value: string;
  onChange: (templateId: string) => void;
  activeTemplates: ClassTemplate[];
  currentTemplateId?: string | null;
  templatesById: Map<string, ClassTemplate>;
  templateLoadStatus: LoadStatus;
  templateErrorMessage: string | null;
  t: (key: string, options?: Record<string, unknown>) => string;
};

function TemplateEligibilityField({
  value,
  onChange,
  activeTemplates,
  currentTemplateId,
  templatesById,
  templateLoadStatus,
  templateErrorMessage,
  t,
}: TemplateEligibilityFieldProps) {
  const currentTemplateIsUnavailable =
    Boolean(currentTemplateId) &&
    !activeTemplates.some((template) => template.id === currentTemplateId);

  return (
    <div className="rounded-xl border border-blush/18 bg-background/34 p-3">
      <label className="grid gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
          {t("manager.memberships.eligibility")}
        </span>
        <select
          className="h-11 rounded-xl border border-blush/24 bg-background/70 px-3 text-sm text-foreground outline-none focus:border-blush-strong"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">{t("manager.memberships.allClasses")}</option>
          {currentTemplateIsUnavailable && currentTemplateId && (
            <option value={currentTemplateId} disabled>
              {getTemplateBindingLabel(currentTemplateId, templatesById, t)}
            </option>
          )}
          {activeTemplates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
      </label>
      <p className="mt-2 text-xs leading-5 text-foreground/58">
        {t("manager.memberships.eligibilityHint")}
      </p>
      {templateLoadStatus === "loading" && (
        <p className="mt-2 text-xs text-foreground/58">
          {t("manager.memberships.templatesLoading")}
        </p>
      )}
      {templateLoadStatus === "error" && (
        <p className="mt-2 text-xs leading-5 text-blush-strong">
          {templateErrorMessage ?? t("manager.memberships.templatesErrorBody")}
        </p>
      )}
      {templateLoadStatus === "loaded" && activeTemplates.length === 0 && (
        <p className="mt-2 text-xs leading-5 text-foreground/58">
          {t("manager.memberships.noActiveTemplates")}
        </p>
      )}
    </div>
  );
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

function formatStockRatio(remaining: number, total: number) {
  return `${ltrIsolate}${remaining} / ${total}${popDirectionalIsolate}`;
}

function getUserLabel(user: ProductUserListItem) {
  return getUserDisplayName(user);
}

function getUserInitials(user: ProductUserListItem) {
  const label = getUserLabel(user).trim();
  const parts = label.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return label.slice(0, 2).toUpperCase();
}

function getGrantStockLabel(
  grant: MembershipGrant,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  if (grant.total_stock === null) return t("manager.memberships.notLimited");

  return t("manager.memberships.remainingStock", {
    stockRatio: formatStockRatio(grant.remaining_stock ?? 0, grant.total_stock),
  });
}

function getDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getGrantDateInputValue(value: string | null) {
  if (!value) return "";
  return getDateInputValue(new Date(value));
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
  const [templates, setTemplates] = useState<ClassTemplate[]>([]);
  const [users, setUsers] = useState<ProductUserListItem[]>([]);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("idle");
  const [templateLoadStatus, setTemplateLoadStatus] =
    useState<LoadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [templateErrorMessage, setTemplateErrorMessage] = useState<string | null>(
    null,
  );
  const [operationError, setOperationError] = useState<string | null>(null);
  const [mutatingKey, setMutatingKey] = useState<string | null>(null);
  const [form, setForm] = useState<MembershipForm>(initialForm);
  const [grantForm, setGrantForm] = useState<GrantForm>(initialGrantForm);
  const [stockAdjustmentForms, setStockAdjustmentForms] = useState<
    Record<string, StockAdjustmentForm>
  >({});
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
  const templatesById = useMemo(
    () => new Map(templates.map((template) => [template.id, template])),
    [templates],
  );
  const activeTemplates = useMemo(
    () =>
      templates
        .filter((template) => template.status === "active")
        .sort((a, b) => a.name.localeCompare(b.name)),
    [templates],
  );
  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    if (!query) return users.slice(0, 8);

    return users
      .filter((user) =>
        [
          user.display_name,
          user.email,
          user.phone_number,
          user.user_id,
          user.status,
          user.scope,
        ]
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
      setTemplates([]);
      setUsers([]);
      setLoadStatus("idle");
      setTemplateLoadStatus("idle");
      setTemplateErrorMessage(null);
      return;
    }

    if (!options?.silent) {
      setLoadStatus("loading");
      setErrorMessage(null);
      setTemplateLoadStatus("loading");
      setTemplateErrorMessage(null);
    }

    const [membershipTypeResult, userResult, templateResult] =
      await Promise.allSettled([
        client.management.memberships.listTypes(),
        client.management.users.list(),
        client.management.templates.list(),
      ]);

    if (templateResult.status === "fulfilled") {
      setTemplates(templateResult.value.templates);
      setTemplateLoadStatus("loaded");
      setTemplateErrorMessage(null);
    } else if (!options?.silent) {
      setTemplates([]);
      setTemplateLoadStatus("error");
      setTemplateErrorMessage(
        templateResult.reason instanceof Error
          ? templateResult.reason.message
          : t("manager.memberships.templatesErrorBody"),
      );
    }

    if (
      membershipTypeResult.status === "fulfilled" &&
      userResult.status === "fulfilled"
    ) {
      setMembershipTypes(membershipTypeResult.value.membership_types);
      setUsers(userResult.value.users);
      setLoadStatus("loaded");
      return;
    }

    if (options?.silent) return;

    const error =
      membershipTypeResult.status === "rejected"
        ? membershipTypeResult.reason
        : userResult.status === "rejected"
          ? userResult.reason
          : null;
    setErrorMessage(
      error instanceof Error ? error.message : t("manager.memberships.errorBody"),
    );
    setLoadStatus("error");
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
      setStockAdjustmentForms({});
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
          ...(input.templateId === editingForm.initialTemplateId
            ? {}
            : { templateId: input.templateId }),
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
        `set-${selectedUserId}`,
        () => client.management.memberships.setForUser(input),
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

  const editGrantDetails = useCallback((grant: MembershipGrant) => {
    setGrantForm({
      membershipTypeId: grant.membership_type_id,
      totalStock: formatNullableNumber(grant.total_stock),
      validFrom: getGrantDateInputValue(grant.valid_from),
      validUntil: getGrantDateInputValue(grant.valid_until),
    });
  }, []);

  const adjustMembershipStock = useCallback(
    async (event: FormEvent<HTMLFormElement>, grant: MembershipGrant) => {
      event.preventDefault();
      if (!client || !canManageMemberships || !selectedUserId) return;

      const stockDelta = parseRequiredNonZeroInteger(
        stockAdjustmentForms[grant.id]?.stockDelta ?? "",
      );
      if (Number.isNaN(stockDelta)) {
        setOperationError(t("manager.memberships.invalidStockDelta"));
        return;
      }

      const adjusted = await runMembershipMutation(`stock-${grant.id}`, () =>
        client.management.memberships.adjustStock({
          membershipGrantId: grant.id,
          stockDelta,
        }),
      );

      if (adjusted.ok) {
        setSelectedUserMembership((current) => ({
          ...current,
          loadStatus: "loaded",
          grants: mergeMembershipGrant(
            current.grants,
            adjusted.result.membership_grant,
          ),
        }));
        setStockAdjustmentForms((current) => ({
          ...current,
          [grant.id]: { stockDelta: "" },
        }));
        void loadUserMemberships(selectedUserId, { silent: true });
      }
    },
    [
      canManageMemberships,
      client,
      loadUserMemberships,
      runMembershipMutation,
      selectedUserId,
      stockAdjustmentForms,
      t,
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
    <section className="grid gap-4 rounded-[1.2rem] border border-blush/20 bg-card/58 p-3 shadow-soft sm:rounded-[1.4rem] sm:border-blush/24 sm:bg-card/78 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blush-strong text-background sm:size-11">
            <WalletCards className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-serif text-[0.65rem] uppercase tracking-[0.22em] text-foreground/48 sm:text-xs">
              {t("manager.memberships.eyebrow")}
            </p>
            <h2 className="mt-1 font-serif text-3xl leading-none text-foreground sm:text-4xl">
              {t("manager.memberships.title")}
            </h2>
            <p className="mt-2 hidden max-w-prose text-sm leading-6 text-foreground/68 sm:block">
              {t("manager.memberships.body")}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10 shrink-0 rounded-full sm:h-11 sm:w-auto sm:px-4"
          disabled={loadStatus === "loading"}
          onClick={() => void loadMembershipTypes()}
          aria-label={t("manager.memberships.refresh")}
        >
          <RefreshCw
            className={[
              "size-4",
              loadStatus === "loading" ? "animate-spin" : "",
            ].join(" ")}
            aria-hidden="true"
          />
          <span className="hidden sm:inline">{t("manager.memberships.refresh")}</span>
        </Button>
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(18rem,25rem)_minmax(0,1fr)]">
        <aside className="rounded-[1.2rem] border border-blush/22 bg-background/30 p-3 sm:rounded-[1.3rem] sm:border-blush/24 sm:bg-background/34 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-serif text-3xl leading-none text-foreground sm:text-2xl">
                {t("manager.memberships.usersTitle")}
              </h3>
              <p className="mt-1 text-sm text-foreground/58">
                {t("manager.memberships.userSearch")}
              </p>
            </div>
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blush-strong/18 text-blush-strong">
              <UserRound className="size-5" aria-hidden="true" />
            </span>
          </div>

          <label className="mt-4 block">
            <span className="sr-only">{t("manager.memberships.userSearch")}</span>
            <input
              className="h-11 w-full rounded-xl border border-blush/24 bg-background/70 px-3 text-sm text-foreground outline-none focus:border-blush-strong"
              value={userSearch}
              placeholder={t("manager.memberships.userSearchPlaceholder")}
              onChange={(event) => setUserSearch(event.target.value)}
            />
          </label>

          <div className="mt-3 grid max-h-none gap-2 overflow-y-visible pe-0 sm:max-h-[38rem] sm:overflow-y-auto sm:pe-1">
            {filteredUsers.length === 0 ? (
              <p className="rounded-xl border border-blush/24 bg-card/40 p-3 text-sm leading-6 text-foreground/60">
                {t("manager.memberships.noUsers")}
              </p>
            ) : (
              filteredUsers.map((user) => {
                const selected = user.user_id === selectedUserId;
                const supportingEmail = getUserSupportingEmail(user);

                return (
                  <button
                    key={user.user_id}
                    type="button"
                    className={[
                      "grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl border p-3 text-start transition-colors",
                      selected
                        ? "border-blush-strong bg-blush-strong/14"
                        : "border-blush/20 bg-card/42 hover:border-blush-strong/55",
                    ].join(" ")}
                    aria-pressed={selected}
                    onClick={() => setSelectedUserId(user.user_id)}
                  >
                    <span className="min-w-0">
                      <span className="block break-words font-serif text-lg leading-5 text-foreground [overflow-wrap:anywhere] sm:text-lg">
                        {getUserLabel(user)}
                      </span>
                      {supportingEmail && (
                        <span className="mt-1 block break-words text-sm text-foreground/60 [overflow-wrap:anywhere]">
                          {supportingEmail}
                        </span>
                      )}
                      {user.phone_number && (
                        <span className="mt-1 block text-sm text-foreground/50">
                          {user.phone_number}
                        </span>
                      )}
                      <span className="mt-2 inline-flex rounded-full border border-blush/18 px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.14em] text-foreground/50">
                        {user.status} · {user.scope}
                      </span>
                    </span>
                    <span className="grid size-12 shrink-0 place-items-center rounded-full bg-blush-strong/24 font-serif text-lg text-foreground">
                      {getUserInitials(user)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <div
          className={[
            selectedUser
              ? "fixed inset-0 z-50 grid place-items-end bg-black/50 p-0 xl:static xl:block xl:bg-transparent"
              : "hidden xl:block",
          ].join(" ")}
          onClick={() => {
            if (selectedUser) setSelectedUserId("");
          }}
        >
          <div
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-[1.4rem] border border-blush/24 bg-background p-4 text-foreground shadow-soft xl:max-h-none xl:rounded-[1.3rem] xl:bg-background/34"
            onClick={(event) => event.stopPropagation()}
          >
          <span className="mx-auto mb-3 block h-1 w-12 rounded-full bg-blush/28 xl:hidden" />
          {!selectedUser ? (
            <div className="grid min-h-72 place-items-center rounded-[1.1rem] border border-blush/18 bg-card/38 p-6 text-center">
              <div className="max-w-sm">
                <span className="mx-auto grid size-12 place-items-center rounded-full bg-blush-strong/18 text-blush-strong">
                  <WalletCards className="size-6" aria-hidden="true" />
                </span>
                <p className="mt-4 font-serif text-2xl text-foreground">
                  {t("manager.memberships.selectUser")}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="relative flex flex-col gap-3 rounded-[1.1rem] border border-blush/18 bg-card/45 p-4 pe-12 lg:flex-row lg:items-center lg:justify-between xl:pe-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-14 shrink-0 place-items-center rounded-full bg-blush-strong/24 font-serif text-xl text-foreground">
                    {getUserInitials(selectedUser)}
                  </span>
                  <div className="min-w-0">
                    <p className="break-words font-serif text-2xl text-foreground [overflow-wrap:anywhere]">
                      {getUserLabel(selectedUser)}
                    </p>
                    <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-foreground/60">
                      {getUserSupportingEmail(selectedUser) && (
                        <span className="break-words [overflow-wrap:anywhere]">
                          {getUserSupportingEmail(selectedUser)}
                        </span>
                      )}
                      {selectedUser.phone_number && (
                        <span>{selectedUser.phone_number}</span>
                      )}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit shrink-0 rounded-full"
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
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute end-4 top-4 size-9 rounded-full xl:hidden"
                  onClick={() => setSelectedUserId("")}
                  aria-label={t("actions.close")}
                >
                  <X className="size-5" aria-hidden="true" />
                </Button>
              </div>

              <details className="rounded-[1.1rem] border border-blush/20 bg-card/36 p-3" open>
                <summary className="cursor-pointer list-none font-serif text-xl text-foreground">
                  {t("manager.memberships.setMembership")}
                </summary>
              <form
                className="mt-3 grid gap-3 lg:grid-cols-2 2xl:grid-cols-[1.1fr_0.8fr_0.8fr_0.8fr_auto]"
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
                      placeholder={t("manager.memberships.totalStockShort")}
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
                  className="rounded-full 2xl:self-end"
                  disabled={Boolean(mutatingKey) || !grantForm.membershipTypeId}
                >
                  <Plus className="size-4" aria-hidden="true" />
                  {t("manager.memberships.setMembership")}
                </Button>
              </form>
              </details>

              {selectedUserMembership.loadStatus === "loading" && (
                <p className="rounded-xl border border-blush/24 bg-card/36 p-3 text-sm text-foreground/68">
                  <Loader2
                    className="me-2 inline size-4 animate-spin text-blush-strong"
                    aria-hidden="true"
                  />
                  {t("manager.memberships.loadingUser")}
                </p>
              )}

              {selectedUserMembership.loadStatus === "error" && (
                <p className="rounded-xl border border-blush/24 bg-card/36 p-3 text-sm leading-6 text-blush-strong">
                  {selectedUserMembership.errorMessage ??
                    t("manager.memberships.userErrorBody")}
                </p>
              )}

              {selectedUserMembership.loadStatus === "loaded" && (
                <div className="grid gap-4">
                  <div className="grid gap-3 2xl:grid-cols-2">
                    {selectedUserMembership.grants.length === 0 ? (
                      <p className="rounded-xl border border-blush/24 bg-card/36 p-4 text-sm leading-6 text-foreground/60 2xl:col-span-2">
                        {t("manager.memberships.noGrants")}
                      </p>
                    ) : (
                      selectedUserMembership.grants.map((grant) => {
                        const membershipType = membershipTypesById.get(
                          grant.membership_type_id,
                        );
                        const isMutating = mutatingKey === grant.id;
                        const isAdjusting = mutatingKey === `stock-${grant.id}`;
                        const canAdjustStock =
                          grant.status === "active" &&
                          supportsStock(grant.mode) &&
                          grant.total_stock !== null;
                        const stockAdjustmentForm =
                          stockAdjustmentForms[grant.id] ?? {
                            stockDelta: "",
                          };

                        return (
                          <article
                            key={grant.id}
                            className="rounded-[1.1rem] border border-blush/22 bg-card/45 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="break-words font-serif text-xl text-foreground [overflow-wrap:anywhere]">
                                  {membershipType?.name ??
                                    grant.membership_type_id}
                                </p>
                                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
                                  {t(
                                    `manager.memberships.status.${grant.status}`,
                                  )}
                                </p>
                              </div>
                              <span className="rounded-full border border-blush/20 px-2.5 py-1 text-xs font-semibold text-foreground/62">
                                {t(`manager.memberships.mode.${grant.mode}`)}
                              </span>
                            </div>

                            <dl className="mt-4 grid gap-2 sm:grid-cols-3">
                              <div className="rounded-xl border border-blush/18 bg-background/42 p-3">
                                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/42">
                                  {t("manager.memberships.stock")}
                                </dt>
                                <dd className="mt-1 font-serif text-xl text-foreground">
                                  {getGrantStockLabel(grant, t)}
                                </dd>
                              </div>
                              <div className="rounded-xl border border-blush/18 bg-background/42 p-3">
                                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/42">
                                  {t("manager.memberships.validFrom")}
                                </dt>
                                <dd className="mt-1 text-sm text-foreground">
                                  {dateFormatter.format(new Date(grant.valid_from))}
                                </dd>
                              </div>
                              <div className="rounded-xl border border-blush/18 bg-background/42 p-3">
                                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/42">
                                  {t("manager.memberships.validUntil")}
                                </dt>
                                <dd className="mt-1 text-sm text-foreground">
                                  {grant.valid_until
                                    ? dateFormatter.format(
                                        new Date(grant.valid_until),
                                      )
                                    : t("manager.memberships.notLimited")}
                                </dd>
                              </div>
                            </dl>

                            {canAdjustStock && (
                              <form
                                className="mt-4 grid gap-2 rounded-xl border border-blush/18 bg-background/34 p-2 sm:grid-cols-[1fr_auto]"
                                onSubmit={(event) =>
                                  void adjustMembershipStock(event, grant)
                                }
                              >
                                <label className="grid gap-1.5">
                                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
                                    {t("manager.memberships.stockAdjustment")}
                                  </span>
                                  <input
                                    className="h-10 rounded-xl border border-blush/24 bg-background/70 px-3 text-sm text-foreground outline-none focus:border-blush-strong"
                                    type="number"
                                    step="1"
                                    value={stockAdjustmentForm.stockDelta}
                                    placeholder={t(
                                      "manager.memberships.stockAdjustmentPlaceholder",
                                    )}
                                    onChange={(event) =>
                                      setStockAdjustmentForms((current) => ({
                                        ...current,
                                        [grant.id]: {
                                          stockDelta: event.target.value,
                                        },
                                      }))
                                    }
                                  />
                                </label>
                                <Button
                                  type="submit"
                                  size="sm"
                                  variant="outline"
                                  className="rounded-full sm:self-end"
                                  disabled={Boolean(mutatingKey)}
                                >
                                  {isAdjusting ? (
                                    <Loader2
                                      className="size-4 animate-spin"
                                      aria-hidden="true"
                                    />
                                  ) : (
                                    <Check className="size-4" aria-hidden="true" />
                                  )}
                                  {t("manager.memberships.applyStockAdjustment")}
                                </Button>
                              </form>
                            )}

                            {grant.status === "active" && (
                              <div className="mt-4 flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="rounded-full"
                                  disabled={Boolean(mutatingKey)}
                                  onClick={() => editGrantDetails(grant)}
                                >
                                  {t("manager.memberships.editGrantDetails")}
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="rounded-full"
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
                              </div>
                            )}
                          </article>
                        );
                      })
                    )}
                  </div>

                  <div className="rounded-[1.1rem] border border-blush/22 bg-card/38 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
                      {t("manager.memberships.ledgerTitle")}
                    </p>
                    {selectedUserMembership.ledger.length === 0 ? (
                      <p className="mt-2 text-sm leading-6 text-foreground/60">
                        {t("manager.memberships.noLedger")}
                      </p>
                    ) : (
                      <div className="mt-3 grid gap-2">
                        {selectedUserMembership.ledger.map((entry) => (
                          <div
                            key={entry.id}
                            className="flex flex-col gap-1 rounded-lg border border-blush/16 bg-background/36 p-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                          >
                            <span className="font-semibold text-foreground">
                              {t(`manager.memberships.event.${entry.event_type}`)}
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

      <details className="group mt-5 rounded-[1.3rem] border border-blush/20 bg-background/28 p-4">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-serif text-2xl text-foreground marker:hidden [&::-webkit-details-marker]:hidden">
          <span>{t("manager.memberships.typesTitle")}</span>
          <span className="grid size-9 shrink-0 place-items-center rounded-full border border-blush/24 bg-background/36 text-foreground/68 transition-colors group-open:text-blush-strong">
            <ChevronDown
              className="size-4 transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </span>
        </summary>
        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(18rem,24rem)_1fr]">
        <form
          className="rounded-[1.1rem] border border-blush/20 bg-card/36 p-4"
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
            <TemplateEligibilityField
              value={form.templateId}
              onChange={(templateId) =>
                setForm((current) => ({ ...current, templateId }))
              }
              activeTemplates={activeTemplates}
              templatesById={templatesById}
              templateLoadStatus={templateLoadStatus}
              templateErrorMessage={templateErrorMessage}
              t={t}
            />
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

        <div className="rounded-[1.1rem] border border-blush/20 bg-card/36 p-4">
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
                        <TemplateEligibilityField
                          value={editingForm.templateId}
                          onChange={(templateId) =>
                            setEditingForm((current) =>
                              current ? { ...current, templateId } : current,
                            )
                          }
                          activeTemplates={activeTemplates}
                          currentTemplateId={editingForm.initialTemplateId}
                          templatesById={templatesById}
                          templateLoadStatus={templateLoadStatus}
                          templateErrorMessage={templateErrorMessage}
                          t={t}
                        />
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
                          <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-3">
                            <dt>{t("manager.memberships.eligibility")}</dt>
                            <dd className="break-words text-foreground [overflow-wrap:anywhere] sm:text-end">
                              {getTemplateBindingLabel(
                                membershipType.template_id,
                                templatesById,
                                t,
                              )}
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
                                templateId: membershipType.template_id ?? "",
                                initialTemplateId: membershipType.template_id,
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
      </details>
    </section>
  );
}

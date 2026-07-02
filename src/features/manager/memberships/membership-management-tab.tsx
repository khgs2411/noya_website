import type { MembershipMode, MembershipType } from "@class-kit/react";
import { useProductContext } from "@class-kit/react";
import {
  AlertCircle,
  Check,
  Loader2,
  Plus,
  RefreshCw,
  WalletCards,
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

function formatNullableNumber(value: number | null) {
  return value === null ? "" : String(value);
}

export function MembershipManagementTab({
  canManageMemberships,
}: MembershipManagementTabProps) {
  const { t, i18n } = useTranslation();
  const { client } = useProductContext();
  const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [mutatingKey, setMutatingKey] = useState<string | null>(null);
  const [form, setForm] = useState<MembershipForm>(initialForm);
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

  const loadMembershipTypes = useCallback(async (options?: { silent?: boolean }) => {
    if (!client || !canManageMemberships) {
      setMembershipTypes([]);
      setLoadStatus("idle");
      return;
    }

    if (!options?.silent) {
      setLoadStatus("loading");
      setErrorMessage(null);
    }

    try {
      const result = await client.management.memberships.listTypes();
      setMembershipTypes(result.membership_types);
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

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadMembershipTypes();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadMembershipTypes]);

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
                            <h4 className="break-words font-serif text-xl text-foreground">
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

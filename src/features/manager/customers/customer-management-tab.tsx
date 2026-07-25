import {
  ClassKitManagerApiError,
  type AssignableProductRole,
  type CreateCustomerInput,
  type Customer,
  type MembershipGrant,
  type MembershipLedgerEntry,
  type MembershipType,
  type ProductUserListItem,
  type UpdateCustomerInput,
  useProductContext,
} from "@class-kit/react";
import { AlertCircle, Loader2, Plus, RefreshCw, UsersRound } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { CustomerCard } from "@/features/manager/customers/customer-card";
import { CustomerFormDialog } from "@/features/manager/customers/customer-form-dialog";
import { CustomerLifecycleDialog } from "@/features/manager/customers/customer-lifecycle-dialog";
import {
  CustomerDetailPanel,
  type ContextState,
} from "@/features/manager/customers/customer-detail-panel";
import {
  type CustomerDirectoryFilter,
  useCustomerDirectory,
} from "@/features/manager/customers/use-customer-directory";

type CustomerManagementTabProps = {
  canReadCustomers: boolean;
  canReadMemberships: boolean;
  canReadUsers: boolean;
  canManageUsers: boolean;
};

type MembershipContext = {
  grants: MembershipGrant[];
  ledger: MembershipLedgerEntry[];
  types: MembershipType[];
};

type CustomerMutationState =
  | "idle"
  | "assigning"
  | "revoking"
  | "creating"
  | "updating"
  | "deactivating"
  | "reactivating";

type CustomerFormSurface = "create" | "edit" | null;
type CustomerLifecycleSurface = "deactivate" | "reactivate" | null;

export function CustomerManagementTab({
  canReadCustomers,
  canReadMemberships,
  canReadUsers,
  canManageUsers,
}: CustomerManagementTabProps) {
  const { client } = useProductContext();
  const { t } = useTranslation();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [detailState, setDetailState] = useState<ContextState>("idle");
  const [membership, setMembership] = useState<MembershipContext | null>(null);
  const [membershipState, setMembershipState] = useState<ContextState>("idle");
  const [linkedUser, setLinkedUser] = useState<ProductUserListItem | null>(null);
  const [linkedState, setLinkedState] = useState<ContextState>("idle");
  const [roles, setRoles] = useState<AssignableProductRole[]>([]);
  const [roleState, setRoleState] = useState<ContextState>("idle");
  const [mutationState, setMutationState] = useState<CustomerMutationState>("idle");
  const [notice, setNotice] = useState<string | null>(null);
  const [formSurface, setFormSurface] = useState<CustomerFormSurface>(null);
  const [lifecycleSurface, setLifecycleSurface] = useState<CustomerLifecycleSurface>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [mutationAccessDenied, setMutationAccessDenied] = useState(false);
  const selectionTokenRef = useRef(0);
  const membershipRequestRef = useRef(0);
  const linkedRequestRef = useRef(0);
  const customerMutationRequestRef = useRef(false);
  const clientRef = useRef(client);
  const canReadMembershipsRef = useRef(canReadMemberships);
  const canReadUsersRef = useRef(canReadUsers);
  const canManageUsersRef = useRef(canManageUsers);
  useLayoutEffect(() => {
    clientRef.current = client;
    canReadMembershipsRef.current = canReadMemberships;
    canReadUsersRef.current = canReadUsers;
    canManageUsersRef.current = canManageUsers;
  }, [canManageUsers, canReadMemberships, canReadUsers, client]);

  const closeDetail = useCallback(() => {
    selectionTokenRef.current += 1;
    membershipRequestRef.current += 1;
    linkedRequestRef.current += 1;
    setSelectedCustomerId(null);
    setSelectedCustomer(null);
    setDetailState("idle");
    setMembership(null);
    setMembershipState("idle");
    setLinkedUser(null);
    setLinkedState("idle");
    setRoles([]);
    setRoleState("idle");
  }, []);

  const directory = useCustomerDirectory({
    client,
    canReadCustomers,
    onForbidden: closeDetail,
  });

  const classifySectionFailure = useCallback((
    error: unknown,
    clear: () => void,
    state: (state: ContextState) => void,
  ) => {
    if (error instanceof ClassKitManagerApiError && error.code === "forbidden") {
      clear();
      state("forbidden");
      return;
    }
    state("error");
  }, []);

  const loadMembership = useCallback(async (customerId: string, token: number) => {
    const requestId = ++membershipRequestRef.current;
    if (!client || !canReadMemberships) {
      setMembership(null);
      setMembershipState("unavailable");
      return;
    }
    setMembershipState("loading");
    try {
      const [typesResult, grantsResult, ledgerResult] = await Promise.all([
        client.management.memberships.listTypes(),
        client.management.memberships.listCustomerGrants(customerId),
        client.management.memberships.listLedger({ customerId, limit: 8 }),
      ]);
      if (
        token !== selectionTokenRef.current ||
        requestId !== membershipRequestRef.current ||
        !canReadMembershipsRef.current ||
        client !== clientRef.current
      ) return;
      setMembership({
        types: typesResult.membership_types,
        grants: grantsResult.membership_grants,
        ledger: ledgerResult.membership_ledger,
      });
      setMembershipState("ready");
    } catch (error) {
      if (
        token !== selectionTokenRef.current ||
        requestId !== membershipRequestRef.current ||
        !canReadMembershipsRef.current ||
        client !== clientRef.current
      ) return;
      classifySectionFailure(error, () => setMembership(null), setMembershipState);
    }
  }, [canReadMemberships, classifySectionFailure, client]);

  const loadLinkedAccess = useCallback(async (
    customer: Customer,
    token: number,
    silent = false,
  ) => {
    const requestId = ++linkedRequestRef.current;
    const userId = customer.userId;
    const linked = customer.userId !== null && customer.identityStatus === "linked";
    const inconsistent =
      (customer.userId === null && customer.identityStatus === "linked") ||
      (customer.userId !== null && customer.identityStatus === "unlinked");
    if (!linked || inconsistent || !userId) {
      setLinkedUser(null);
      setRoles([]);
      setLinkedState(inconsistent ? "error" : "unavailable");
      setRoleState("unavailable");
      return;
    }
    if (!client || !canReadUsers) {
      setLinkedUser(null);
      setRoles([]);
      setLinkedState("unavailable");
      setRoleState("unavailable");
      return;
    }
    if (!silent) {
      setLinkedState("loading");
      setRoleState(canManageUsers ? "loading" : "unavailable");
    }
    try {
      const userResult = await client.management.users.get(userId);
      if (
        token !== selectionTokenRef.current ||
        requestId !== linkedRequestRef.current ||
        !canReadUsersRef.current ||
        client !== clientRef.current
      ) return;
      setLinkedUser(userResult.user);
      setLinkedState("ready");
      if (!canManageUsersRef.current) {
        setRoles([]);
        setRoleState("unavailable");
        return;
      }
      try {
        const roleResult = await client.management.users.roles.listAssignable();
        if (
          token !== selectionTokenRef.current ||
          requestId !== linkedRequestRef.current ||
          !canReadUsersRef.current ||
          !canManageUsersRef.current ||
          client !== clientRef.current
        ) return;
        setRoles(roleResult.roles);
        setRoleState("ready");
      } catch (error) {
        if (token !== selectionTokenRef.current) return;
        if (
          silent &&
          !(error instanceof ClassKitManagerApiError && error.code === "forbidden")
        ) return;
        classifySectionFailure(error, () => setRoles([]), setRoleState);
      }
    } catch (error) {
      if (
        token !== selectionTokenRef.current ||
        requestId !== linkedRequestRef.current ||
        !canReadUsersRef.current ||
        client !== clientRef.current
      ) return;
      if (
        silent &&
        !(error instanceof ClassKitManagerApiError && error.code === "forbidden")
      ) return;
      setRoles([]);
      setRoleState("unavailable");
      classifySectionFailure(error, () => setLinkedUser(null), setLinkedState);
    }
  }, [canManageUsers, canReadUsers, classifySectionFailure, client]);

  const loadCustomer = useCallback(async (customerId: string) => {
    if (!client || !canReadCustomers) return;
    const token = ++selectionTokenRef.current;
    setSelectedCustomerId(customerId);
    setNotice(null);
    setSelectedCustomer(null);
    setDetailState("loading");
    setMembership(null);
    setMembershipState("idle");
    setLinkedUser(null);
    setLinkedState("idle");
    setRoles([]);
    setRoleState("idle");
    try {
      const result = await client.management.customers.get(customerId);
      if (token !== selectionTokenRef.current) return;
      setSelectedCustomer(result.customer);
      setDetailState("ready");
    } catch (error) {
      if (token !== selectionTokenRef.current) return;
      if (error instanceof ClassKitManagerApiError && error.code === "forbidden") {
        directory.clearForForbidden();
        closeDetail();
        return;
      }
      if (error instanceof ClassKitManagerApiError && error.code === "not_found") {
        closeDetail();
        setNotice(t("manager.customers.selectedMissing"));
        return;
      }
      setDetailState("error");
    }
  }, [canReadCustomers, client, closeDetail, directory, t]);

  useEffect(() => {
    membershipRequestRef.current += 1;
    if (!selectedCustomer) return;
    const token = selectionTokenRef.current;
    void loadMembership(selectedCustomer.customerId, token);
    return () => {
      membershipRequestRef.current += 1;
    };
  }, [canReadMemberships, loadMembership, selectedCustomer]);

  useEffect(() => {
    linkedRequestRef.current += 1;
    if (!selectedCustomer) return;
    const token = selectionTokenRef.current;
    void loadLinkedAccess(selectedCustomer, token);
    return () => {
      linkedRequestRef.current += 1;
    };
  }, [canManageUsers, canReadUsers, loadLinkedAccess, selectedCustomer]);

  const changeFilter = useCallback((filter: CustomerDirectoryFilter) => {
    closeDetail();
    directory.setFilter(filter);
  }, [closeDetail, directory]);

  const changePage = useCallback((direction: "next" | "previous") => {
    closeDetail();
    if (direction === "next") directory.next();
    else directory.previous();
  }, [closeDetail, directory]);

  const refresh = useCallback(() => {
    directory.refresh();
    if (selectedCustomerId) void loadCustomer(selectedCustomerId);
  }, [directory, loadCustomer, selectedCustomerId]);

  const mutateRole = useCallback(async (roleId: string, action: "assign" | "revoke") => {
    if (
      !client ||
      !selectedCustomer?.userId ||
      selectedCustomer.identityStatus !== "linked" ||
      !canReadUsers ||
      !canManageUsers ||
      mutationState !== "idle"
    ) return;
    const token = selectionTokenRef.current;
    setMutationState(action === "assign" ? "assigning" : "revoking");
    try {
      const result = action === "assign"
        ? await client.management.users.roles.assign({ userId: selectedCustomer.userId, roleId })
        : await client.management.users.roles.revoke({ userId: selectedCustomer.userId, roleId });
      if (token !== selectionTokenRef.current) return;
      setLinkedUser((current) => current?.user_id === selectedCustomer.userId
        ? {
            ...current,
            roles: action === "assign"
              ? [
                  ...(current.roles ?? []).filter((role) => role.role_id !== roleId),
                  result.assignment,
                ]
              : (current.roles ?? []).filter((role) => role.role_id !== roleId),
          }
        : current);
      void loadLinkedAccess(selectedCustomer, token, true);
    } catch (error) {
      if (token !== selectionTokenRef.current) return;
      classifySectionFailure(error, () => setRoles([]), setRoleState);
    } finally {
      if (token === selectionTokenRef.current) setMutationState("idle");
    }
  }, [canManageUsers, canReadUsers, classifySectionFailure, client, loadLinkedAccess, mutationState, selectedCustomer]);

  const mutationFailureMessage = useCallback((error: unknown) => {
    if (!(error instanceof ClassKitManagerApiError)) {
      return t("manager.customerActions.mutation.failed");
    }
    if (error.code === "forbidden") return t("manager.customerActions.mutation.forbidden");
    if (error.code === "conflict") return t("manager.customerActions.mutation.conflict");
    if (error.code === "bad_request") return t("manager.customerActions.mutation.validation");
    if (error.code === "not_found") return t("manager.customers.selectedMissing");
    if (error.code === "customer_inactive") return t("manager.customerActions.mutation.inactive");
    return t("manager.customerActions.mutation.failed");
  }, [t]);

  const runCustomerMutation = useCallback(async (
    state: Extract<CustomerMutationState, "creating" | "updating" | "deactivating" | "reactivating">,
    mutation: () => Promise<{ customer: Customer }>,
  ) => {
    if (
      !client ||
      mutationState !== "idle" ||
      mutationAccessDenied ||
      customerMutationRequestRef.current
    ) return null;

    customerMutationRequestRef.current = true;
    setMutationState(state);
    setMutationError(null);
    try {
      return await mutation();
    } catch (error) {
      if (error instanceof ClassKitManagerApiError && error.code === "forbidden") {
        setMutationAccessDenied(true);
      }
      setMutationError(mutationFailureMessage(error));
      return null;
    } finally {
      customerMutationRequestRef.current = false;
      setMutationState("idle");
    }
  }, [client, mutationAccessDenied, mutationFailureMessage, mutationState]);

  const reconcileCustomer = useCallback((customer: Customer) => {
    directory.reconcile(customer);
    setSelectedCustomer((current) =>
      current?.customerId === customer.customerId ? customer : current,
    );
  }, [directory]);

  const createCustomer = useCallback(async (input: CreateCustomerInput) => {
    const result = await runCustomerMutation(
      "creating",
      () => client!.management.customers.create(input),
    );
    if (!result) return { ok: false };

    selectionTokenRef.current += 1;
    setSelectedCustomerId(result.customer.customerId);
    setSelectedCustomer(result.customer);
    setDetailState("ready");
    setMembership(null);
    setMembershipState("idle");
    setLinkedUser(null);
    setLinkedState("idle");
    setRoles([]);
    setRoleState("idle");
    setNotice(t("manager.customerActions.mutation.created"));
    directory.refresh();
    return { ok: true };
  }, [client, directory, runCustomerMutation, t]);

  const updateCustomer = useCallback(async (input: UpdateCustomerInput) => {
    const result = await runCustomerMutation(
      "updating",
      () => client!.management.customers.update(input),
    );
    if (!result) return { ok: false };

    reconcileCustomer(result.customer);
    setNotice(t("manager.customerActions.mutation.updated"));
    return { ok: true };
  }, [client, reconcileCustomer, runCustomerMutation, t]);

  const changeLifecycle = useCallback(async (action: "deactivate" | "reactivate") => {
    if (!selectedCustomer) return { ok: false };

    const customerId = selectedCustomer.customerId;
    const result = await runCustomerMutation(
      action === "deactivate" ? "deactivating" : "reactivating",
      () => action === "deactivate"
        ? client!.management.customers.deactivate(customerId)
        : client!.management.customers.reactivate(customerId),
    );
    if (!result) return { ok: false };

    reconcileCustomer(result.customer);
    setNotice(t(`manager.customerActions.mutation.${action}d`));
    return { ok: true };
  }, [client, reconcileCustomer, runCustomerMutation, selectedCustomer, t]);

  const openForm = useCallback((surface: Exclude<CustomerFormSurface, null>) => {
    setMutationError(null);
    setFormSurface(surface);
  }, []);

  const openLifecycle = useCallback((surface: CustomerLifecycleSurface) => {
    setMutationError(null);
    setLifecycleSurface(surface);
  }, []);

  if (!canReadCustomers) return <Denied />;

  return (
    <section className="grid gap-4">
      <header className="flex items-start justify-between gap-4 rounded-[1.4rem] border border-blush/24 bg-card/78 p-5 shadow-soft">
        <div className="flex gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-blush-strong text-background">
            <UsersRound className="size-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/48">
              {t("manager.customers.eyebrow")}
            </p>
            <h2 className="mt-1 font-serif text-3xl text-foreground sm:text-4xl">
              {t("manager.customers.title")}
            </h2>
            <p className="mt-2 max-w-prose text-sm leading-6 text-foreground/68">
              {t("manager.customers.body")}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button type="button" className="rounded-full" disabled={directory.loadStatus === "loading" || mutationState !== "idle" || mutationAccessDenied} onClick={() => openForm("create")}>
            <Plus className="size-4" aria-hidden="true" />
            {t("manager.customerActions.add")}
          </Button>
          <Button type="button" variant="outline" size="icon" className="size-10 rounded-full" disabled={directory.loadStatus === "loading"} onClick={refresh} aria-label={t("manager.customers.refresh")}>
            <RefreshCw className={directory.loadStatus === "loading" ? "size-4 animate-spin" : "size-4"} />
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {(["all", "active", "inactive"] as CustomerDirectoryFilter[]).map((filter) => (
          <Button key={filter} variant={directory.filter === filter ? "default" : "outline"} size="sm" className="rounded-full" aria-pressed={directory.filter === filter} onClick={() => changeFilter(filter)}>
            {t(`manager.customers.filters.${filter}`)}
          </Button>
        ))}
      </div>

      {directory.accessChanged && <Notice text={t("manager.customers.accessChanged")} icon={<AlertCircle className="size-4" />} />}
      {notice && <Notice text={notice} icon={<AlertCircle className="size-4" />} />}
      {directory.loadStatus === "loading" && directory.records.length === 0 && <Notice text={t("manager.customers.loading")} icon={<Loader2 className="size-4 animate-spin" />} />}
      {directory.loadStatus === "error" && !directory.accessChanged && (
        <Notice text={t("manager.customers.errorBody")} icon={<AlertCircle className="size-4" />} action={<Button size="sm" variant="outline" onClick={directory.retry}>{t("manager.customers.retry")}</Button>} />
      )}
      {directory.loadStatus === "loaded" && directory.records.length === 0 && <Notice text={t("manager.customers.empty")} />}
      {directory.records.length > 0 && (
        <div className="grid gap-2">
          {directory.records.map((customer) => (
            <CustomerCard key={customer.customerId} customer={customer} onSelect={(customerId) => void loadCustomer(customerId)} />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" onClick={() => changePage("previous")} disabled={!directory.canGoPrevious || directory.loadStatus === "loading"}>
          {t("manager.customers.previous")}
        </Button>
        <Button variant="outline" onClick={() => changePage("next")} disabled={!directory.canGoNext || directory.loadStatus === "loading"}>
          {t("manager.customers.next")}
        </Button>
      </div>

      {selectedCustomer && detailState === "ready" && formSurface === null && lifecycleSurface === null && (
        <CustomerDetailPanel
          customer={selectedCustomer}
          membership={membership}
          membershipState={membershipState}
          linkedUser={linkedUser}
          linkedState={linkedState}
          roles={roles}
          roleState={roleState}
          mutationState={mutationState}
          canMutateCustomers={!mutationAccessDenied}
          onAssign={(roleId) => void mutateRole(roleId, "assign")}
          onClose={closeDetail}
          onEdit={() => openForm("edit")}
          onLifecycle={openLifecycle}
          onRevoke={(roleId) => void mutateRole(roleId, "revoke")}
          onRetryMembership={() => {
            if (selectedCustomer) void loadMembership(selectedCustomer.customerId, selectionTokenRef.current);
          }}
          onRetryLinked={() => {
            if (selectedCustomer) void loadLinkedAccess(selectedCustomer, selectionTokenRef.current);
          }}
        />
      )}
      {selectedCustomerId && detailState === "loading" && <Notice text={t("manager.customers.loadingDetail")} icon={<Loader2 className="size-4 animate-spin" />} />}
      {selectedCustomerId && detailState === "error" && (
        <Notice text={t("manager.customers.detailError")} icon={<AlertCircle className="size-4" />} action={<Button size="sm" variant="outline" onClick={() => void loadCustomer(selectedCustomerId)}>{t("manager.customers.retry")}</Button>} />
      )}
      <CustomerFormDialog
        open={formSurface !== null}
        mode={formSurface ?? "create"}
        customer={formSurface === "edit" ? selectedCustomer : null}
        submitting={mutationState === "creating" || mutationState === "updating"}
        canSubmit={!mutationAccessDenied}
        errorMessage={mutationError}
        onClose={() => setFormSurface(null)}
        onCreate={createCustomer}
        onUpdate={updateCustomer}
      />
      <CustomerLifecycleDialog
        open={lifecycleSurface !== null}
        action={lifecycleSurface ?? "deactivate"}
        customer={selectedCustomer}
        submitting={mutationState === "deactivating" || mutationState === "reactivating"}
        canSubmit={!mutationAccessDenied}
        errorMessage={mutationError}
        onClose={() => setLifecycleSurface(null)}
        onConfirm={() => changeLifecycle(lifecycleSurface ?? "deactivate")}
      />
    </section>
  );
}

function Notice({ text, icon, action }: { text: string; icon?: ReactNode; action?: ReactNode }) {
  return <div role="status" aria-live="polite" className="flex items-center justify-between gap-3 rounded-xl border border-blush/24 bg-background/46 p-3 text-sm text-foreground/68"><span className="flex items-center gap-2">{icon}{text}</span>{action}</div>;
}

function Denied() {
  const { t } = useTranslation();
  return <Notice text={t("manager.customers.denied")} />;
}

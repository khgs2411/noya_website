import {
  ClassKitManagerApiError,
  type AssignableProductRole,
  type Customer,
  type MembershipGrant,
  type MembershipLedgerEntry,
  type MembershipType,
  type ProductUserListItem,
  useProductContext,
} from "@class-kit/react";
import { AlertCircle, Loader2, RefreshCw, UsersRound } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { CustomerCard } from "@/features/manager/customers/customer-card";
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
  const [mutationState, setMutationState] = useState<"idle" | "assigning" | "revoking">("idle");
  const [notice, setNotice] = useState<string | null>(null);
  const selectionTokenRef = useRef(0);
  const membershipRequestRef = useRef(0);
  const linkedRequestRef = useRef(0);
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

  const loadLinkedAccess = useCallback(async (customer: Customer, token: number) => {
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
    setLinkedState("loading");
    setRoleState(canManageUsers ? "loading" : "unavailable");
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
        classifySectionFailure(error, () => setRoles([]), setRoleState);
      }
    } catch (error) {
      if (
        token !== selectionTokenRef.current ||
        requestId !== linkedRequestRef.current ||
        !canReadUsersRef.current ||
        client !== clientRef.current
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
      if (action === "assign") await client.management.users.roles.assign({ userId: selectedCustomer.userId, roleId });
      else await client.management.users.roles.revoke({ userId: selectedCustomer.userId, roleId });
      if (token !== selectionTokenRef.current) return;
      void loadLinkedAccess(selectedCustomer, token);
    } catch (error) {
      if (token !== selectionTokenRef.current) return;
      classifySectionFailure(error, () => setRoles([]), setRoleState);
    } finally {
      if (token === selectionTokenRef.current) setMutationState("idle");
    }
  }, [canManageUsers, canReadUsers, classifySectionFailure, client, loadLinkedAccess, mutationState, selectedCustomer]);

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
        <Button type="button" variant="outline" size="icon" className="size-10 shrink-0 rounded-full" disabled={directory.loadStatus === "loading"} onClick={refresh} aria-label={t("manager.customers.refresh")}>
          <RefreshCw className={directory.loadStatus === "loading" ? "size-4 animate-spin" : "size-4"} />
        </Button>
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

      {selectedCustomer && detailState === "ready" && (
        <CustomerDetailPanel
          customer={selectedCustomer}
          membership={membership}
          membershipState={membershipState}
          linkedUser={linkedUser}
          linkedState={linkedState}
          roles={roles}
          roleState={roleState}
          mutationState={mutationState}
          onAssign={(roleId) => void mutateRole(roleId, "assign")}
          onClose={closeDetail}
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

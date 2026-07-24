import type {
  AssignableProductRole,
  Customer,
  MembershipGrant,
  MembershipLedgerEntry,
  MembershipType,
  ProductUserListItem,
} from "@class-kit/react";
import { AlertCircle, Loader2, Pencil, X } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { getCustomerContact, getCustomerLabel } from "@/features/customers/customer-labels";
import { summarizePermissionGroups } from "@/features/manager/access/role-permission-presentation";

export type ContextState = "idle" | "loading" | "ready" | "error" | "forbidden" | "unavailable";

type MembershipContext = {
  grants: MembershipGrant[];
  ledger: MembershipLedgerEntry[];
  types: MembershipType[];
};

export function CustomerDetailPanel({
  customer,
  membership,
  membershipState,
  linkedUser,
  linkedState,
  roles,
  roleState,
  mutationState,
  canMutateCustomers,
  onAssign,
  onClose,
  onEdit,
  onLifecycle,
  onRevoke,
  onRetryMembership,
  onRetryLinked,
}: {
  customer: Customer;
  membership: MembershipContext | null;
  membershipState: ContextState;
  linkedUser: ProductUserListItem | null;
  linkedState: ContextState;
  roles: AssignableProductRole[];
  roleState: ContextState;
  mutationState: "idle" | "assigning" | "revoking" | "creating" | "updating" | "deactivating" | "reactivating";
  canMutateCustomers: boolean;
  onAssign: (roleId: string) => void;
  onClose: () => void;
  onEdit: () => void;
  onLifecycle: (action: "deactivate" | "reactivate") => void;
  onRevoke: (roleId: string) => void;
  onRetryMembership: () => void;
  onRetryLinked: () => void;
}) {
  const { t } = useTranslation();
  const isLinked = customer.userId !== null && customer.identityStatus === "linked";
  const isInconsistent =
    (customer.userId === null && customer.identityStatus === "linked") ||
    (customer.userId !== null && customer.identityStatus === "unlinked");
  const dialogRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusId = window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    return () => {
      window.clearTimeout(focusId);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        "button:not([disabled]), select:not([disabled]), [href], input:not([disabled])",
      );
      if (!focusable?.length) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-foreground/30 p-0 sm:items-center sm:justify-center sm:p-6"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("manager.customers.detailTitle")}
        className="max-h-[90dvh] w-full overflow-y-auto rounded-t-[1.7rem] border border-blush/24 bg-card p-5 shadow-soft sm:max-w-2xl sm:rounded-[1.7rem]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/48">
              {t("manager.customers.detailEyebrow")}
            </p>
            <h2 className="mt-1 break-words font-serif text-3xl text-foreground">
              {getCustomerLabel(customer, t("manager.customers.unnamed"))}
            </h2>
            {getCustomerContact(customer) && (
              <p className="mt-1 text-sm text-foreground/62 [overflow-wrap:anywhere]">
                {getCustomerContact(customer)}
              </p>
            )}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-blush/24 bg-background/54 hover:bg-blush/12"
            onClick={onClose}
            aria-label={t("manager.customers.close")}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </header>

        <div className="mt-5 grid gap-4">
          <section className="rounded-xl border border-blush/18 bg-background/38 p-4">
            <h3 className="font-serif text-xl">{t("manager.customers.identity")}</h3>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <DetailRow label={t("manager.customers.lifecycleLabel")} value={t(`manager.customers.lifecycle.${customer.status}`)} />
              <DetailRow label={t("manager.customers.originLabel")} value={t(`manager.customers.origin.${customer.customerOrigin === "manager_created" ? "managerCreated" : customer.customerOrigin === "signup" ? "signup" : "other"}`)} />
              <DetailRow label={t("manager.customers.linkageLabel")} value={t(isLinked ? "manager.customers.linked" : "manager.customers.unlinked")} />
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled={mutationState !== "idle" || !canMutateCustomers} onClick={onEdit}>
                <Pencil className="size-4" aria-hidden="true" />
                {t("manager.customerActions.edit")}
              </Button>
              <Button size="sm" variant="outline" disabled={mutationState !== "idle" || !canMutateCustomers} onClick={() => onLifecycle(customer.status === "active" ? "deactivate" : "reactivate")}>
                {t(customer.status === "active" ? "manager.customerActions.deactivate" : "manager.customerActions.reactivate")}
              </Button>
            </div>
          </section>

          <MembershipSection
            context={membership}
            state={membershipState}
            onRetry={onRetryMembership}
          />
          <LinkedAccessSection
            inconsistent={isInconsistent}
            isLinked={isLinked}
            linkedUser={linkedUser}
            linkedState={linkedState}
            mutationState={
              mutationState === "assigning" || mutationState === "revoking"
                ? mutationState
                : "idle"
            }
            roles={roles}
            roleState={roleState}
            onAssign={onAssign}
            onRetry={onRetryLinked}
            onRevoke={onRevoke}
          />
        </div>
      </section>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-foreground/52">{label}</dt><dd className="mt-0.5 break-words font-medium">{value}</dd></div>;
}

function SectionNotice({
  state,
  onRetry,
}: {
  state: ContextState;
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  if (state === "loading") return <p role="status" aria-live="polite" className="mt-3 flex items-center gap-2 text-sm text-foreground/62"><Loader2 className="size-4 animate-spin" />{t("manager.customers.loadingContext")}</p>;
  if (state === "unavailable") return <p role="status" aria-live="polite" className="mt-3 text-sm text-foreground/62">{t("manager.customers.contextUnavailable")}</p>;
  if (state === "forbidden") return <p role="status" aria-live="polite" className="mt-3 text-sm text-blush-strong">{t("manager.customers.accessChanged")}</p>;
  if (state === "error") return <div role="status" aria-live="polite" className="mt-3 flex items-center justify-between gap-3 text-sm text-blush-strong"><span className="flex items-center gap-2"><AlertCircle className="size-4" />{t("manager.customers.contextError")}</span><Button variant="outline" size="sm" onClick={onRetry}>{t("manager.customers.retry")}</Button></div>;
  return null;
}

function MembershipSection({
  context,
  state,
  onRetry,
}: {
  context: MembershipContext | null;
  state: ContextState;
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  const typeNames = useMemo(
    () => new Map(context?.types.map((type) => [type.id, type.name]) ?? []),
    [context?.types],
  );
  return <section className="rounded-xl border border-blush/18 bg-background/38 p-4"><h3 className="font-serif text-xl">{t("manager.customers.memberships")}</h3><SectionNotice state={state} onRetry={onRetry} />{state === "ready" && context && <><div className="mt-3 grid gap-2">{context.grants.length ? context.grants.map((grant) => <div key={grant.id} className="rounded-lg bg-background/58 p-3 text-sm"><p className="break-words font-medium">{typeNames.get(grant.membership_type_id) ?? t("manager.customers.membershipUnknown")}</p><p className="mt-1 text-foreground/62">{t(`manager.customers.membershipStatus.${grant.status}`)}{grant.remaining_stock !== null ? ` · ${t("manager.customers.remainingStock", { count: grant.remaining_stock })}` : ""}</p><p className="mt-1 text-foreground/62">{grant.valid_until ? t("manager.customers.validUntil", { date: new Date(grant.valid_until).toLocaleDateString() }) : t("manager.customers.noExpiry")}</p></div>) : <p className="mt-3 text-sm text-foreground/62">{t("manager.customers.noMemberships")}</p>}</div>{context.ledger.length > 0 && <div className="mt-4"><p className="text-sm font-semibold">{t("manager.customers.recentActivity")}</p><div className="mt-2 grid gap-1 text-sm text-foreground/62">{context.ledger.slice(0, 6).map((entry) => <p key={entry.id}>{t(`manager.customers.membershipEvent.${entry.event_type}`)}</p>)}</div></div>}</>}</section>;
}

function LinkedAccessSection({
  inconsistent,
  isLinked,
  linkedUser,
  linkedState,
  roles,
  roleState,
  mutationState,
  onAssign,
  onRetry,
  onRevoke,
}: {
  inconsistent: boolean;
  isLinked: boolean;
  linkedUser: ProductUserListItem | null;
  linkedState: ContextState;
  roles: AssignableProductRole[];
  roleState: ContextState;
  mutationState: "idle" | "assigning" | "revoking";
  onAssign: (roleId: string) => void;
  onRetry: () => void;
  onRevoke: (roleId: string) => void;
}) {
  const { t } = useTranslation();
  const assignments = linkedUser?.roles?.filter((role) => role.status === "active") ?? [];
  const rolesById = useMemo(() => new Map(roles.map((role) => [role.id, role])), [roles]);
  const availableRoles = roles.filter((role) => !assignments.some((assignment) => assignment.role_id === role.id));
  const permissions = new Set(assignments.flatMap((assignment) => rolesById.get(assignment.role_id)?.permissions ?? []));
  const groups = summarizePermissionGroups(permissions);

  return <section className="rounded-xl border border-blush/18 bg-background/38 p-4"><h3 className="font-serif text-xl">{t("manager.customers.linkedAccess")}</h3>{inconsistent ? <p className="mt-3 text-sm text-blush-strong">{t("manager.customers.linkageError")}</p> : !isLinked ? <p className="mt-3 text-sm text-foreground/62">{t("manager.customers.noLogin")}</p> : <><SectionNotice state={linkedState} onRetry={onRetry} />{linkedState === "ready" && linkedUser && <><dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2"><DetailRow label={t("manager.customers.accessStatus")} value={t(`manager.customers.userStatus.${linkedUser.status}`)} /><DetailRow label={t("manager.customers.accessScope")} value={t(`manager.customers.scope.${linkedUser.scope}`)} /></dl><div className="mt-4"><p className="text-sm font-semibold">{t("manager.customers.assignedRoles")}</p>{assignments.length ? <div className="mt-2 grid gap-2">{assignments.map((assignment) => <div key={assignment.role_id} className="flex items-center justify-between gap-3 rounded-lg bg-background/58 p-3 text-sm"><span className="min-w-0 break-words">{assignment.role_name ?? t("manager.customers.unknownRole")}</span>{roleState === "ready" && <Button size="sm" variant="outline" disabled={mutationState !== "idle"} onClick={() => onRevoke(assignment.role_id)}>{t("manager.customers.revokeRole")}</Button>}</div>)}</div> : <p className="mt-2 text-sm text-foreground/62">{t("manager.customers.noRoles")}</p>}</div>{groups.length > 0 && <div className="mt-4"><p className="text-sm font-semibold">{t("manager.customers.effectivePermissions")}</p><p className="mt-1 text-sm text-foreground/62">{groups.map((group) => t(group.labelKey)).join(", ")}</p></div>}{roleState !== "ready" && <SectionNotice state={roleState} onRetry={onRetry} />}{roleState === "ready" && availableRoles.length > 0 && <div className="mt-4"><label className="text-sm font-semibold" htmlFor="customer-role">{t("manager.customers.assignRole")}</label><select id="customer-role" className="mt-2 h-10 w-full rounded-lg border border-blush/24 bg-background px-3 text-sm" defaultValue="" disabled={mutationState !== "idle"} onChange={(event) => { if (event.target.value) { onAssign(event.target.value); event.currentTarget.value = ""; } }}><option value="">{t("manager.customers.chooseRole")}</option>{availableRoles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></div>}</>}</>}</section>;
}

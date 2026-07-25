import type { ClassKitClient, Customer } from "@class-kit/react";
import { AlertCircle, Loader2, X } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { getCustomerContact, getCustomerLabel, getCustomerOriginKey } from "@/features/customers/customer-labels";
import { CustomerPicker } from "@/features/manager/customers/customer-picker";
import { useCustomerDirectory } from "@/features/manager/customers/use-customer-directory";
import {
  buildMergeFieldResolutions,
  formatMergeJsonValue,
  getMergeSurvivorAvailability,
  knownMergeOutcomeKey,
  type MergeResolutionDraft,
  type MergeResolutionDrafts,
} from "@/features/manager/customers/merge/customer-merge-presentation";
import { useCustomerMerge } from "@/features/manager/customers/merge/use-customer-merge";

type CustomerMergeDialogProps = {
  open: boolean;
  source: Customer;
  client: ClassKitClient | null;
  canReadCustomers: boolean;
  mutationDenied: boolean;
  onClose: () => void;
  onCustomerReadForbidden: () => void;
  onMutationForbidden: () => void;
  onComplete: (survivor: Customer) => void;
  onAlreadyMerged: (survivorCustomerId: string) => void;
};

const emptyDrafts = (): MergeResolutionDrafts => ({ metadata: {} });

export function CustomerMergeDialog({
  open,
  source,
  client,
  canReadCustomers,
  mutationDenied,
  onClose,
  onCustomerReadForbidden,
  onMutationForbidden,
  onComplete,
  onAlreadyMerged,
}: CustomerMergeDialogProps) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const [drafts, setDrafts] = useState<MergeResolutionDrafts>(emptyDrafts);
  const [showValidation, setShowValidation] = useState(false);
  const directory = useCustomerDirectory({
    client,
    canReadCustomers,
    onForbidden: onCustomerReadForbidden,
  });
  const merge = useCustomerMerge({ client, source, onComplete, onAlreadyMerged, onMutationForbidden });

  useEffect(() => {
    if (!open || canReadCustomers) return;
    merge.forceClear();
    onCustomerReadForbidden();
  }, [canReadCustomers, merge, onCustomerReadForbidden, open]);

  const locked = merge.phase === "merging" || merge.phase === "completion_unknown";
  const dismiss = useCallback(() => {
    if (merge.close()) onClose();
  }, [merge, onClose]);

  const requestPreview = () => {
    setDrafts(emptyDrafts());
    setShowValidation(false);
    void merge.requestPreview();
  };

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusId = window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (!locked) dismiss();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), select:not([disabled]), textarea:not([disabled]), input:not([disabled]), [href]");
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusId);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [dismiss, locked, open]);

  const availability = (candidate: Customer) => {
    const result = getMergeSurvivorAvailability(source.customerId, candidate);
    if (result.selectable) return result;
    return { selectable: false, reason: t(`manager.customerMerge.unavailable${result.reason === "source" ? "Source" : "Unlinked"}`) };
  };

  const fieldResolutions = useMemo(
    () => merge.preview ? buildMergeFieldResolutions(merge.preview, drafts) : { invalidMetadataKeys: [] },
    [drafts, merge.preview],
  );

  const updateDraft = (key: "displayName" | "contactEmail" | "phoneNumber" | string, next: Partial<MergeResolutionDraft>, metadata = false) => {
    setDrafts((current) => metadata
      ? { ...current, metadata: { ...current.metadata, [key]: { ...current.metadata[key], ...next } } }
      : { ...current, [key]: { ...(current[key as keyof Omit<MergeResolutionDrafts, "metadata">] ?? {}), ...next } });
  };

  if (!open) return null;

  const selectedSurvivor = directory.records.find((customer) => customer.customerId === merge.survivorCustomerId)
    ?? merge.preview?.survivor
    ?? null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-foreground/40 sm:items-center sm:justify-center sm:p-6" role="presentation" onMouseDown={locked ? undefined : dismiss}>
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-label={t("manager.customerMerge.title")} className="flex max-h-[96dvh] w-full flex-col overflow-hidden rounded-t-[1.7rem] border border-blush/24 bg-card shadow-soft sm:max-h-[92vh] sm:max-w-3xl sm:rounded-[1.7rem]" onMouseDown={(event) => event.stopPropagation()}>
        <header className="flex items-start justify-between gap-4 border-b border-blush/20 p-5">
          <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/48">{t("manager.customerMerge.action")}</p><h2 className="mt-1 font-serif text-3xl text-foreground">{t("manager.customerMerge.title")}</h2></div>
          <button ref={closeButtonRef} type="button" disabled={locked} onClick={dismiss} className="grid size-10 shrink-0 place-items-center rounded-full border border-blush/24 hover:bg-blush/12 disabled:opacity-50" aria-label={t("manager.customerMerge.close")}><X className="size-4" /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <IdentitySummary label={t("manager.customerMerge.source")} customer={source} />
          {selectedSurvivor && <IdentitySummary label={t("manager.customerMerge.survivor")} customer={selectedSurvivor} />}
          {mutationDenied && <ErrorNotice text={t("manager.customerActions.mutation.forbidden")} />}
          {merge.error && <ErrorNotice text={t(`manager.customerMerge.${merge.error}`)} />}
          {merge.phase === "completion_unknown" ? <UnknownCompletion onRetry={merge.retrySameRequest} /> : <>
            {(merge.phase === "selecting" || merge.phase === "previewing" || merge.phase === "preview_error") && <section className="mt-5"><h3 className="font-serif text-2xl">{t("manager.customerMerge.chooseSurvivor")}</h3><p className="mt-2 text-sm leading-6 text-foreground/62">{t("manager.customerMerge.irreversible")}</p><div className="mt-4"><CustomerPicker directory={directory} selectedCustomerId={merge.survivorCustomerId} onSelectCustomer={merge.setSurvivorCustomerId} onClearSelection={() => merge.setSurvivorCustomerId("")} getRecordAvailability={availability} /></div><div className="mt-4 flex flex-wrap gap-2"><Button type="button" className="rounded-full" disabled={!merge.survivorCustomerId || merge.phase === "previewing" || mutationDenied} onClick={requestPreview}>{merge.phase === "previewing" ? <Loader2 className="size-4 animate-spin" /> : null}{merge.phase === "preview_error" ? t("manager.customerMerge.retryPreview") : t("manager.customerMerge.preview")}</Button><Button type="button" variant="outline" className="rounded-full" disabled={locked} onClick={dismiss}>{t("manager.customerMerge.cancel")}</Button></div></section>}
            {(merge.phase === "reviewing" || merge.phase === "confirming" || merge.phase === "merging") && merge.preview && <PreviewReview preview={merge.preview} drafts={drafts} onDraft={updateDraft} t={t} showValidation={showValidation} invalidMetadataKeys={fieldResolutions.invalidMetadataKeys} />}
            {merge.phase === "reviewing" && <div className="mt-6 flex flex-wrap gap-2"><Button type="button" variant="outline" className="rounded-full" onClick={() => merge.setSurvivorCustomerId("")}>{t("manager.customerMerge.back")}</Button><Button type="button" className="rounded-full" disabled={merge.expired || mutationDenied} onClick={() => { if (!fieldResolutions.value) { setShowValidation(true); return; } merge.confirm(); }}>{t("manager.customerMerge.confirm")}</Button></div>}
            {merge.phase === "confirming" && <section className="mt-6 rounded-xl border border-blush-strong/35 bg-blush/10 p-4"><h3 className="font-serif text-2xl">{t("manager.customerMerge.confirmation")}</h3><p className="mt-2 text-sm leading-6 text-foreground/68">{t("manager.customerMerge.confirmationBody")}</p><div className="mt-4 flex flex-wrap gap-2"><Button type="button" variant="outline" className="rounded-full" onClick={() => merge.setSurvivorCustomerId(merge.survivorCustomerId)}>{t("manager.customerMerge.back")}</Button><Button type="button" className="rounded-full" disabled={!fieldResolutions.value || mutationDenied} onClick={() => fieldResolutions.value && void merge.submit(fieldResolutions.value)}>{t("manager.customerMerge.submit")}</Button></div></section>}
            {merge.phase === "merging" && <p role="status" aria-live="polite" className="mt-6 flex items-center gap-2 text-sm text-foreground/68"><Loader2 className="size-4 animate-spin" />{t("manager.customerMerge.merging")}</p>}
          </>}
          {merge.preview && <p role="status" aria-live="polite" className="mt-4 text-sm text-foreground/60">{t("manager.customerMerge.expiry", { date: new Date(merge.preview.expiresAt).toLocaleString() })} · {t("manager.customerMerge.remaining", { count: merge.remainingSeconds })}</p>}
          {merge.expired && <ErrorNotice text={t("manager.customerMerge.expired")} />}
        </div>
      </section>
    </div>
  );
}

function IdentitySummary({ label, customer }: { label: string; customer: Customer }) {
  const { t } = useTranslation();
  const contact = getCustomerContact(customer);
  return <section className="mt-3 rounded-xl border border-blush/20 bg-background/38 p-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">{label}</p><p className="mt-1 break-words font-serif text-2xl [overflow-wrap:anywhere]">{getCustomerLabel(customer, t("manager.customers.unnamed"))}</p>{contact && <p className="mt-1 break-words text-sm text-foreground/60 [overflow-wrap:anywhere]">{contact}</p>}<dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3"><SummaryRow label={t("manager.customerMerge.lifecycle")} value={t(`manager.customers.lifecycle.${customer.status}`)} /><SummaryRow label={t("manager.customerMerge.origin")} value={t(`manager.customers.origin.${getCustomerOriginKey(customer.customerOrigin)}`)} /><SummaryRow label={t("manager.customerMerge.linkage")} value={customer.userId ? t("manager.customerMerge.linked") : t("manager.customerMerge.unlinked")} /></dl></section>;
}

function SummaryRow({ label, value }: { label: string; value: string }) { return <div><dt className="text-foreground/52">{label}</dt><dd className="mt-0.5 break-words font-medium">{value}</dd></div>; }
function ErrorNotice({ text }: { text: string }) { return <p role="alert" className="mt-4 flex gap-2 rounded-xl border border-blush-strong/35 bg-blush/10 p-3 text-sm leading-6 text-foreground"><AlertCircle className="mt-0.5 size-4 shrink-0 text-blush-strong" />{text}</p>; }
function UnknownCompletion({ onRetry }: { onRetry: () => Promise<void> }) { const { t } = useTranslation(); return <section className="mt-5 rounded-xl border border-blush-strong/35 bg-blush/10 p-4"><h3 className="font-serif text-2xl">{t("manager.customerMerge.merging")}</h3><p className="mt-2 text-sm leading-6">{t("manager.customerMerge.unknown")}</p><Button type="button" className="mt-4 rounded-full" onClick={() => void onRetry()}>{t("manager.customerMerge.retrySame")}</Button></section>; }

function PreviewReview({ preview, drafts, onDraft, t, showValidation, invalidMetadataKeys }: { preview: NonNullable<ReturnType<typeof useCustomerMerge>["preview"]>; drafts: MergeResolutionDrafts; onDraft: (key: string, next: Partial<MergeResolutionDraft>, metadata?: boolean) => void; t: (key: string, options?: Record<string, unknown>) => string; showValidation: boolean; invalidMetadataKeys: string[] }) {
  const comparisonRows = [["displayName", preview.fieldComparisons.displayName], ["contactEmail", preview.fieldComparisons.contactEmail], ["phoneNumber", preview.fieldComparisons.phoneNumber]] as const;
  return <div className="mt-5 grid gap-4"><section className="rounded-xl border border-blush/20 bg-background/38 p-4"><h3 className="font-serif text-2xl">{t("manager.customerMerge.comparisons")}</h3>{comparisonRows.map(([key, comparison]) => <ResolutionControl key={key} label={key} source={comparison.sourceValue} survivor={comparison.survivorValue} allowed={comparison.allowedSelections} draft={drafts[key]} onChange={(next) => onDraft(key, next)} t={t} invalid={showValidation && !drafts[key]?.selection} />)}</section><section className="rounded-xl border border-blush/20 bg-background/38 p-4"><h3 className="font-serif text-2xl">{t("manager.customerMerge.metadata")}</h3><p className="mt-2 text-sm text-foreground/62">{t("manager.customerMerge.carriedMetadata", { count: Object.keys(preview.fieldComparisons.metadata.carriedResult).length })}</p>{preview.fieldComparisons.metadata.conflicts.length > 0 && <><h4 className="mt-4 font-medium">{t("manager.customerMerge.conflicts")}</h4>{preview.fieldComparisons.metadata.conflicts.map((conflict) => <ResolutionControl key={conflict.key} label={conflict.key} source={conflict.source.present ? formatMergeJsonValue(conflict.source.value) : t("manager.customerMerge.noValue")} survivor={conflict.survivor.present ? formatMergeJsonValue(conflict.survivor.value) : t("manager.customerMerge.noValue")} allowed={conflict.allowedSelections} draft={drafts.metadata[conflict.key]} onChange={(next) => onDraft(conflict.key, next, true)} t={t} invalid={showValidation && invalidMetadataKeys.includes(conflict.key)} metadata />)}</>}</section><Consequences preview={preview} t={t} />{showValidation && <ErrorNotice text={t("manager.customerMerge.missingSelection")} />}</div>;
}

function ResolutionControl({ label, source, survivor, allowed, draft, onChange, t, invalid, metadata = false }: { label: string; source: string | null; survivor: string | null; allowed: readonly string[]; draft?: MergeResolutionDraft; onChange: (next: Partial<MergeResolutionDraft>) => void; t: (key: string) => string; invalid: boolean; metadata?: boolean }) {
  return <fieldset className="mt-4 border-t border-blush/16 pt-4"><legend className="break-words font-medium [overflow-wrap:anywhere]">{label}</legend><div className="mt-2 grid gap-2 text-sm"><p><span className="text-foreground/52">{t("manager.customerMerge.sourceValue")}: </span><span className="break-words [overflow-wrap:anywhere]">{source ?? t("manager.customerMerge.noValue")}</span></p><p><span className="text-foreground/52">{t("manager.customerMerge.survivorValue")}: </span><span className="break-words [overflow-wrap:anywhere]">{survivor ?? t("manager.customerMerge.noValue")}</span></p><select aria-label={`${label} ${t("manager.customerMerge.selectChoice")}`} className="min-h-11 rounded-xl border border-blush/24 bg-background px-3" value={draft?.selection ?? ""} onChange={(event) => onChange({ selection: event.target.value as MergeResolutionDraft["selection"] })}><option value="">{t("manager.customerMerge.selectChoice")}</option>{allowed.includes("source") && <option value="source">{t("manager.customerMerge.useSource")}</option>}{allowed.includes("survivor") && <option value="survivor">{t("manager.customerMerge.useSurvivor")}</option>}{allowed.includes("replacement") && <option value="replacement">{t("manager.customerMerge.useReplacement")}</option>}</select>{draft?.selection === "replacement" && (metadata ? <textarea aria-label={t("manager.customerMerge.replacement")} className="min-h-24 rounded-xl border border-blush/24 bg-background p-3 font-mono text-xs" value={draft.replacement ?? ""} onChange={(event) => onChange({ replacement: event.target.value })} /> : <input aria-label={t("manager.customerMerge.replacement")} className="min-h-11 rounded-xl border border-blush/24 bg-background px-3" value={draft.replacement ?? ""} onChange={(event) => onChange({ replacement: event.target.value })} />)}{invalid && <p role="alert" className="text-sm text-blush-strong">{metadata && draft?.selection === "replacement" ? t("manager.customerMerge.invalidJson") : t("manager.customerMerge.missingSelection")}</p>}</div></fieldset>;
}

function Consequences({ preview, t }: { preview: NonNullable<ReturnType<typeof useCustomerMerge>["preview"]>; t: (key: string, options?: Record<string, unknown>) => string }) {
  const membershipKey = knownMergeOutcomeKey(preview.membershipResolution.resolution);
  const rows = Object.entries(preview.movementCounts);
  return <section className="grid gap-4 sm:grid-cols-2"><Summary title={t("manager.customerMerge.membership")}><p>{membershipKey ? t(`manager.customerMerge.${membershipKey}`) : t("manager.customerMerge.genericOutcome")}</p>{[preview.membershipResolution.sourceGrant, preview.membershipResolution.survivorGrant].filter(Boolean).map((grant) => <p key={grant!.membershipTypeId} className="mt-2 text-sm text-foreground/62">{grant!.membershipType.name}{grant!.remainingStock !== null ? ` · ${grant!.remainingStock}` : ""}</p>)}</Summary><Summary title={t("manager.customerMerge.registrations")}><p>{t("manager.customerMerge.moved", { count: preview.registrations.movedCount })} · {t("manager.customerMerge.collisions", { count: preview.registrations.collisionCount })}</p>{preview.registrations.samples.map((sample, index) => <p key={index} className="mt-2 text-sm text-foreground/62">{knownMergeOutcomeKey(sample.rule) ? t(`manager.customerMerge.${sample.rule}`) : t("manager.customerMerge.genericOutcome")}{sample.stockRestoration ? ` · ${t("manager.customerMerge.stockRestored", { count: sample.stockRestoration.stockRestored })}` : ""}</p>)}{preview.registrations.samplesTruncated && <p className="mt-2 text-sm text-foreground/62">{t("manager.customerMerge.samplesTruncated")}</p>}</Summary><Summary title={t("manager.customerMerge.participants")}><p>{t("manager.customerMerge.moved", { count: preview.participants.movedCount })} · {t("manager.customerMerge.collisions", { count: preview.participants.collisionCount })}</p>{preview.participants.samples.map((_, index) => <p key={index} className="mt-2 text-sm text-foreground/62">{t("manager.customerMerge.genericOutcome")}</p>)}{preview.participants.samplesTruncated && <p className="mt-2 text-sm text-foreground/62">{t("manager.customerMerge.samplesTruncated")}</p>}</Summary><Summary title={t("manager.customerMerge.movements")}><dl className="mt-2 grid grid-cols-2 gap-2 text-sm">{rows.map(([key, value]) => <div key={key}><dt className="break-words text-foreground/52">{key.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`)}</dt><dd className="font-medium">{value}</dd></div>)}</dl></Summary></section>;
}

function Summary({ title, children }: { title: string; children: ReactNode }) { return <section className="rounded-xl border border-blush/20 bg-background/38 p-4"><h3 className="font-serif text-2xl">{title}</h3><div className="mt-2 break-words leading-6 text-foreground/68 [overflow-wrap:anywhere]">{children}</div></section>; }

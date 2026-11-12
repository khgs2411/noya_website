import { useProductContext } from "@class-kit/react";
import { Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

type DeleteTarget = {
  kind: "classes" | "schedules" | "customers";
  id: string;
  name: string;
  occurrence?: { scheduleId: string; date: string };
};

export function ManagerDeleteAction({ target, disabled, onDeleted }: {
  target: DeleteTarget;
  disabled?: boolean;
  onDeleted: () => void;
}) {
  const { client, capabilities } = useProductContext();
  const { t, i18n } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const busyRef = useRef(false);
  const deletedRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [skip, setSkip] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const allowed = capabilities.permissions.includes(`${target.kind}.delete`);

  function close() {
    if (busyRef.current) return;
    dialogRef.current?.close();
    if (deletedRef.current) onDeleted();
  }

  async function confirm() {
    if (!client || !allowed || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      if (!deletedRef.current) {
        await client.management[target.kind].delete(target.id);
        deletedRef.current = true;
        setDeleted(true);
      }
      if (skip && target.occurrence) {
        await client.management.schedules.skipDate(target.occurrence);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("manager.delete.failed"));
      busyRef.current = false;
      setBusy(false);
      return;
    }
    busyRef.current = false;
    setBusy(false);
    close();
  }

  if (!allowed) return null;

  return <>
    <Button type="button" variant="outline" className="rounded-full border-status-closed/50 text-status-closed" disabled={disabled || !client} onClick={() => {
      setError(null);
      setSkip(false);
      dialogRef.current?.showModal();
    }}>
      <Trash2 className="size-4" aria-hidden="true" />
      {t(`manager.delete.${target.kind}.action`)}
    </Button>
    {createPortal(<dialog
      ref={dialogRef}
      dir={i18n.dir()}
      aria-label={t(`manager.delete.${target.kind}.action`)}
      className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[92vh] w-full max-w-none overflow-y-auto rounded-t-[1.4rem] border border-blush/24 bg-background p-5 text-foreground shadow-soft backdrop:bg-black/50 sm:inset-0 sm:m-auto sm:max-w-lg sm:rounded-[1.4rem]"
      onCancel={(event) => { event.preventDefault(); close(); }}
      onKeyDown={(event) => event.stopPropagation()}
      onClick={(event) => { event.stopPropagation(); if (event.target === event.currentTarget) close(); }}
    >
      <div>
        <h2 className="font-serif text-3xl">{t(`manager.delete.${target.kind}.action`)}</h2>
        <p className="mt-3 text-sm leading-6 text-foreground/68">{t(`manager.delete.${target.kind}.body`)}</p>
        <p className="mt-4 break-words font-serif text-xl">{target.name}</p>
        {target.occurrence && !deleted && <label className="mt-4 flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-1" checked={skip} disabled={busy} onChange={(event) => setSkip(event.target.checked)} />
          <span>{t("manager.delete.alsoSkip")}<span className="mt-1 block text-foreground/68">{t("manager.delete.regeneration")}</span></span>
        </label>}
        {deleted && error && <p role="status" className="mt-4 text-sm">{t("manager.delete.skipFailed")}</p>}
        {error && <p role="alert" className="mt-4 text-sm text-status-closed">{error}</p>}
        <div className="mt-6 flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="rounded-full" disabled={busy} onClick={close}>{t("actions.close")}</Button>
          <Button type="button" className="rounded-full bg-status-closed text-background hover:bg-status-closed/90" disabled={busy || !allowed} onClick={() => void confirm()}>
            {busy ? t("manager.delete.saving") : deleted ? t("manager.delete.retrySkip") : t(`manager.delete.${target.kind}.action`)}
          </Button>
        </div>
      </div>
    </dialog>, document.body)}
  </>;
}

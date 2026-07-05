import { Check } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  acceptStorageNotice,
  hasAcceptedStorageNotice,
} from "@/lib/browser-storage-notice";

export function BrowserStorageNotice() {
  const { t, i18n } = useTranslation();
  const [visible, setVisible] = useState(() => !hasAcceptedStorageNotice());

  function handleAccept() {
    acceptStorageNotice();
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <aside
      dir={i18n.dir()}
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-2xl rounded-[1.35rem] border border-blush/28 bg-card/95 p-4 text-card-foreground shadow-soft backdrop-blur"
      aria-label={t("storageNotice.label")}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="font-serif text-xl leading-6">
            {t("storageNotice.title")}
          </p>
          <p className="mt-1 text-sm leading-6 text-foreground/68">
            {t("storageNotice.body")}
          </p>
        </div>
        <Button
          type="button"
          className="h-11 shrink-0 rounded-full px-5"
          onClick={handleAccept}
        >
          <Check className="size-4" aria-hidden="true" />
          {t("storageNotice.accept")}
        </Button>
      </div>
    </aside>
  );
}

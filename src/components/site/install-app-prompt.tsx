import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  hasAcceptedStorageNotice,
  STORAGE_NOTICE_ACCEPTED_EVENT,
} from "@/lib/browser-storage-notice";

const INSTALL_PROMPT_STORAGE_KEY = "noya.pwa.installPromptDismissed";

type InstallChoice = {
  outcome: "accepted" | "dismissed";
  platform: string;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<InstallChoice>;
  userChoice: Promise<InstallChoice>;
};

function isMobileViewport() {
  return window.matchMedia("(max-width: 767px)").matches;
}

function isInstalledDisplayMode() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

function isPromptDismissed() {
  return window.localStorage.getItem(INSTALL_PROMPT_STORAGE_KEY) === "true";
}

function dismissFuturePrompts() {
  window.localStorage.setItem(INSTALL_PROMPT_STORAGE_KEY, "true");
}

export function InstallAppPrompt() {
  const { t, i18n } = useTranslation();
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [storageNoticeAccepted, setStorageNoticeAccepted] = useState(() =>
    hasAcceptedStorageNotice(),
  );

  useEffect(() => {
    function handleStorageNoticeAccepted() {
      setStorageNoticeAccepted(true);
    }

    window.addEventListener(
      STORAGE_NOTICE_ACCEPTED_EVENT,
      handleStorageNoticeAccepted,
    );

    return () =>
      window.removeEventListener(
        STORAGE_NOTICE_ACCEPTED_EVENT,
        handleStorageNoticeAccepted,
      );
  }, []);

  useEffect(() => {
    if (
      !storageNoticeAccepted ||
      isPromptDismissed() ||
      isInstalledDisplayMode()
    ) {
      return;
    }

    function syncMobileVisibility() {
      setVisible(Boolean(installPrompt) && isMobileViewport());
    }

    syncMobileVisibility();
    window.addEventListener("resize", syncMobileVisibility);
    return () => window.removeEventListener("resize", syncMobileVisibility);
  }, [installPrompt, storageNoticeAccepted]);

  useEffect(() => {
    if (isPromptDismissed() || isInstalledDisplayMode()) return;

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setVisible(storageNoticeAccepted && isMobileViewport());
    }

    function handleAppInstalled() {
      dismissFuturePrompts();
      setInstallPrompt(null);
      setVisible(false);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [storageNoticeAccepted]);

  function dismissPrompt() {
    dismissFuturePrompts();
    setInstallPrompt(null);
    setVisible(false);
  }

  async function installApp() {
    if (!installPrompt) return;

    const result = await installPrompt.prompt();
    setInstallPrompt(null);
    setVisible(false);

    if (result.outcome === "accepted" || result.outcome === "dismissed") {
      dismissFuturePrompts();
    }
  }

  if (!visible || !installPrompt) return null;

  return (
    <aside
      dir={i18n.dir()}
      className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-md rounded-[1.35rem] border border-blush/28 bg-card/95 p-4 text-card-foreground shadow-soft backdrop-blur"
      aria-label={t("installPrompt.label")}
    >
      <div className="flex items-start gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-full bg-blush/16 text-blush-strong">
          <Download className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-serif text-xl leading-6">{t("installPrompt.title")}</p>
          <p className="mt-1 text-sm leading-6 text-foreground/68">
            {t("installPrompt.body")}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" className="rounded-full" onClick={installApp}>
              {t("installPrompt.install")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-blush/32 bg-background/50"
              onClick={dismissPrompt}
            >
              {t("installPrompt.notNow")}
            </Button>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 shrink-0 rounded-full text-foreground/62 hover:bg-blush/10"
          aria-label={t("installPrompt.dismiss")}
          onClick={dismissPrompt}
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </aside>
  );
}

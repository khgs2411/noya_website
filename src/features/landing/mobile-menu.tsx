import { Mail, Moon, Settings, Sun, UserCircle, X } from "lucide-react";
import type { MouseEvent } from "react";
import { useTranslation } from "react-i18next";

import { LanguageMenu } from "@/components/layout/language-menu";
import { ContactLine, ContactLink } from "@/components/site/contact-line";
import { siteDesign } from "@/components/site/design-guide";
import { SidebarLink } from "@/components/site/sidebar-link";
import { InstagramIcon, TikTokIcon } from "@/components/site/social-icons";
import { Button } from "@/components/ui/button";
import { lessonsPath } from "@/content/site-content";

export function MobileMenu({
  theme,
  onToggleTheme,
  onOpenAccount,
  onOpenManager,
  canEnterManager,
  onClose,
  onNavigate,
}: {
  theme: string;
  onToggleTheme: () => void;
  onOpenAccount: () => void;
  onOpenManager: () => void;
  canEnterManager: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}) {
  const { t } = useTranslation();

  function handleHomeClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey
    ) {
      return;
    }

    event.preventDefault();
    onClose();
    onNavigate("./#top");
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/28 backdrop-blur-sm"
        aria-label={t("menu.close")}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t("menu.dialog")}
        className="absolute inset-y-0 end-0 flex w-[min(20.5rem,86vw)] flex-col overflow-y-auto bg-gradient-to-b from-card via-card to-muted/60 px-3.5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3.5 shadow-2xl"
      >
        <div className="relative overflow-hidden rounded-[1.2rem] border border-blush/35 bg-background/72 p-3.5 shadow-soft">
          <div className="floral-mark opacity-15" aria-hidden="true" />
          <a
            href="./#top"
            className="relative z-10 block leading-none"
            onClick={handleHomeClick}
          >
            <span className="font-display block text-4xl text-blush-strong">
              {t("brand.name")}
            </span>
            <span className="font-display mt-0.5 block text-lg leading-none text-foreground/58">
              {t("brand.subtitle")}
            </span>
          </a>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute end-2.5 top-2.5 z-20 size-8 rounded-full bg-blush/42 hover:bg-blush/70 [&_svg]:!size-4"
            aria-label={t("menu.close")}
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </Button>
        </div>

        <div className="mt-3.5 grid grid-cols-2 gap-2.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={`text-foreground [&_svg]:!size-4 ${siteDesign.sidebarControl}`}
            aria-label={t("theme.toggle")}
            onClick={onToggleTheme}
          >
            {theme === "dark" ? (
              <Moon aria-hidden="true" />
            ) : (
              <Sun aria-hidden="true" />
            )}
          </Button>
          <LanguageMenu
            buttonClassName={`${siteDesign.sidebarControl} [&_svg]:!size-4`}
            panelClassName="end-0 top-12"
          />
        </div>

        <nav className="mt-4 grid gap-2">
          <button
            type="button"
            className="group flex items-center justify-between rounded-[0.95rem] border border-blush/24 bg-background/52 px-3.5 py-2.5 text-lg font-serif text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-blush/45 hover:bg-background/78 hover:text-blush-strong hover:shadow-soft"
            onClick={onOpenAccount}
          >
            <span className="font-serif text-lg">{t("account.title")}</span>
            <UserCircle
              className="size-4 opacity-55 transition group-hover:opacity-90"
              aria-hidden="true"
            />
          </button>
          {canEnterManager && (
            <button
              type="button"
              className="group flex items-center justify-between rounded-[0.95rem] border border-blush/24 bg-background/52 px-3.5 py-2.5 text-lg font-serif text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-blush/45 hover:bg-background/78 hover:text-blush-strong hover:shadow-soft"
              onClick={onOpenManager}
            >
              <span className="font-serif text-lg">{t("manager.menu")}</span>
              <Settings
                className="size-4 opacity-55 transition group-hover:opacity-90"
                aria-hidden="true"
              />
            </button>
          )}
          <SidebarLink href="./#about" onClick={onClose} onNavigate={onNavigate}>
            {t("nav.about")}
          </SidebarLink>
          <SidebarLink href="./#work" onClick={onClose} onNavigate={onNavigate}>
            {t("nav.work")}
          </SidebarLink>
          <SidebarLink href={lessonsPath} onClick={onClose} onNavigate={onNavigate}>
            {t("nav.classes")}
          </SidebarLink>
          <SidebarLink href="./#contact" onClick={onClose} onNavigate={onNavigate}>
            {t("nav.contact")}
          </SidebarLink>
        </nav>

        <div className="mt-4 grid gap-2 rounded-[1rem] border border-blush/25 bg-background/52 p-3 text-xs text-foreground/70 shadow-sm">
          <ContactLine icon={<Mail />} text="noyas2703@gmail.com" />
          <ContactLink
            href="https://www.instagram.com/noyashlomo?utm_source=qr"
            icon={<InstagramIcon />}
            text="Instagram"
          />
          <ContactLink
            href="https://www.tiktok.com/@noyalachan?_r=1&_t=ZS-96pJauUzNoO"
            icon={<TikTokIcon />}
            text="TikTok"
          />
        </div>
      </aside>
    </div>
  );
}

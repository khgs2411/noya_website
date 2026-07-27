import { Menu, Moon, Sun, UserCircle } from "lucide-react";
import type { MouseEvent } from "react";
import { useTranslation } from "react-i18next";

import { LanguageMenu } from "@/components/layout/language-menu";
import { siteDesign } from "@/components/site/design-guide";
import { Button } from "@/components/ui/button";
import {
  getSitePath,
  lessonsPath,
  pricingPath,
} from "@/content/site-content";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  theme: string;
  menuOpen: boolean;
  compact?: boolean;
  onToggleTheme: () => void;
  onOpenAccount: () => void;
  onOpenMenu: () => void;
  onNavigate: (path: string) => void;
  className?: string;
};

const desktopNavigation = [
  { href: "./#about", labelKey: "nav.about" },
  { href: "./#work", labelKey: "nav.work" },
  { href: lessonsPath, labelKey: "nav.classes" },
  { href: pricingPath, labelKey: "nav.pricing" },
  { href: "./#contact", labelKey: "nav.contact" },
] as const;

export function SiteHeader({
  theme,
  menuOpen,
  compact = false,
  onToggleTheme,
  onOpenAccount,
  onOpenMenu,
  onNavigate,
  className,
}: SiteHeaderProps) {
  const { t } = useTranslation();

  function handleNavigation(
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
  ) {
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
    onNavigate(href);
  }

  return (
    <header
      className={cn(
        "relative z-40 mx-auto flex w-full max-w-6xl items-center px-5 py-3 sm:px-8 xl:my-3 xl:grid xl:max-w-[88rem] xl:grid-cols-[auto_minmax(0,1fr)_auto] xl:gap-5 xl:rounded-[1.35rem] xl:border xl:border-blush/24 xl:bg-background/82 xl:px-5 xl:py-2.5 xl:shadow-soft xl:backdrop-blur-md",
        compact && "lg:py-2 xl:my-1 xl:py-1.5",
        className,
      )}
    >
      <a
        href={getSitePath("./#top")}
        className="hidden min-w-0 leading-none xl:block"
        onClick={(event) => handleNavigation(event, getSitePath("./#top"))}
      >
        <span className="font-display block text-3xl text-blush-strong">
          {t("brand.name")}
        </span>
        <span className="mt-0.5 block text-[0.68rem] font-medium uppercase tracking-[0.16em] text-foreground/52">
          {t("brand.subtitle")}
        </span>
      </a>

      <nav
        className="hidden min-w-0 items-center justify-center gap-1 xl:flex"
        aria-label={t("menu.primary")}
      >
        {desktopNavigation.map((item) => {
          const href = getSitePath(item.href);

          return (
            <a
              key={item.labelKey}
              href={href}
              className="rounded-full px-3 py-2 font-serif text-lg text-foreground/76 transition-colors hover:bg-blush/14 hover:text-blush-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={(event) => handleNavigation(event, href)}
            >
              {t(item.labelKey)}
            </a>
          );
        })}
      </nav>

      <div className="ms-auto flex shrink-0 items-center gap-1.5 sm:gap-2 xl:ms-0">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "size-9 sm:size-10 [&_svg]:!size-4 sm:[&_svg]:!size-5",
            compact && "lg:size-9 lg:[&_svg]:!size-4",
            siteDesign.iconButton,
          )}
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
          buttonClassName={cn(
            "size-9 shadow-sm sm:size-10 [&_svg]:!size-4 sm:[&_svg]:!size-5",
            compact && "lg:size-9 lg:[&_svg]:!size-4",
          )}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "size-9 sm:size-10 [&_svg]:!size-4 sm:[&_svg]:!size-5",
            compact && "lg:size-9 lg:[&_svg]:!size-4",
            siteDesign.iconButton,
          )}
          aria-label={t("account.open")}
          onClick={onOpenAccount}
        >
          <UserCircle aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "size-11 gap-2 sm:size-12 [&_svg]:!size-5 sm:[&_svg]:!size-6 xl:h-10 xl:w-auto xl:px-3.5 xl:[&_svg]:!size-5",
            compact && "lg:size-10 lg:[&_svg]:!size-5 xl:w-auto",
            siteDesign.primaryMenuButton,
          )}
          aria-label={t("menu.toggle")}
          aria-expanded={menuOpen}
          onClick={onOpenMenu}
        >
          <Menu aria-hidden="true" />
          <span className="hidden font-serif text-base xl:inline">
            {t("menu.dialog")}
          </span>
        </Button>
      </div>
    </header>
  );
}

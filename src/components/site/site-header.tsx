import { Menu, Moon, Sun, UserCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { LanguageMenu } from "@/components/layout/language-menu";
import { siteDesign } from "@/components/site/design-guide";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  theme: string;
  menuOpen: boolean;
  compact?: boolean;
  onToggleTheme: () => void;
  onOpenAccount: () => void;
  onOpenMenu: () => void;
  className?: string;
};

export function SiteHeader({
  theme,
  menuOpen,
  compact = false,
  onToggleTheme,
  onOpenAccount,
  onOpenMenu,
  className,
}: SiteHeaderProps) {
  const { t } = useTranslation();

  return (
    <header
      className={cn(
        "relative z-40 mx-auto flex max-w-6xl items-start px-5 py-3 sm:px-8",
        compact && "lg:py-2",
        className,
      )}
    >
      <div className="ms-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
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
            "size-11 sm:size-12 [&_svg]:!size-5 sm:[&_svg]:!size-6",
            compact && "lg:size-10 lg:[&_svg]:!size-5",
            siteDesign.primaryMenuButton,
          )}
          aria-label={t("menu.toggle")}
          aria-expanded={menuOpen}
          onClick={onOpenMenu}
        >
          <Menu aria-hidden="true" />
        </Button>
      </div>
    </header>
  );
}

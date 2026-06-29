import { Menu, Moon, Sun, UserCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { LanguageMenu } from "@/components/layout/language-menu";
import { siteDesign } from "@/components/site/design-guide";
import { PillLink } from "@/components/site/pill-link";
import { Button } from "@/components/ui/button";
import { images, lessonsPath } from "@/content/site-content";

export function HeroSection({
  theme,
  menuOpen,
  onToggleTheme,
  onOpenAccount,
  onOpenMenu,
}: {
  theme: string;
  menuOpen: boolean;
  onToggleTheme: () => void;
  onOpenAccount: () => void;
  onOpenMenu: () => void;
}) {
  const { t } = useTranslation();

  return (
    <section id="top" className="hero-shell relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[48rem] w-full overflow-hidden opacity-24 md:inset-x-auto md:end-0 md:w-[52%] md:max-w-[46rem] md:opacity-100">
        <img
          src={images.hero}
          alt=""
          className="size-full object-cover object-[52%_18%] grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/18 to-transparent" />
        <div className="absolute inset-y-0 start-0 w-28 bg-gradient-to-r from-background to-transparent" />
      </div>

      <header className="relative z-40 mx-auto flex max-w-6xl items-start px-5 py-5 sm:px-8">
        <div className="ms-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={`size-12 sm:size-14 [&_svg]:!size-6 ${siteDesign.iconButton}`}
            aria-label={t("theme.toggle")}
            onClick={onToggleTheme}
          >
            {theme === "dark" ? <Moon /> : <Sun />}
          </Button>
          <LanguageMenu buttonClassName="size-12 shadow-sm sm:size-14 [&_svg]:!size-6" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={`size-12 sm:size-14 [&_svg]:!size-6 ${siteDesign.iconButton}`}
            aria-label={t("account.open")}
            onClick={onOpenAccount}
          >
            <UserCircle />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={`size-16 sm:size-20 [&_svg]:!size-8 ${siteDesign.primaryMenuButton}`}
            aria-label={t("menu.toggle")}
            aria-expanded={menuOpen}
            onClick={onOpenMenu}
          >
            <Menu />
          </Button>
        </div>
      </header>

      <div className="relative z-10 mx-auto grid max-w-6xl gap-8 px-5 pb-8 pt-8 sm:px-8 md:grid-cols-[0.9fr_1.1fr] md:pb-0 md:pt-8">
        <div className="max-w-xl">
          <p className="font-display mb-5 text-2xl leading-none text-foreground/70 sm:text-3xl">
            {t("hero.eyebrow")}
          </p>
          <h1 className="font-display text-[4.75rem] font-medium leading-[0.78] tracking-normal text-foreground sm:text-[7.45rem]">
            {t("hero.titleTop")}
            <br />
            {t("hero.titleBottom")}
          </h1>
          <div className="mt-5 h-1 w-48 rounded-full bg-blush" />
          <p className="mt-6 max-w-md text-lg leading-7 text-foreground/70">
            {t("hero.body")}
          </p>
          <div className="mt-8 flex max-w-sm flex-col gap-3">
            <PillLink href={lessonsPath}>{t("hero.classes")}</PillLink>
            <PillLink href={lessonsPath} variant="outline">
              {t("hero.private")}
            </PillLink>
          </div>
        </div>
      </div>
    </section>
  );
}

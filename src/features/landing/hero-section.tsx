import { useTranslation } from "react-i18next";

import { PillLink } from "@/components/site/pill-link";
import { SiteHeader } from "@/components/site/site-header";
import { images, lessonsPath } from "@/content/site-content";

export function HeroSection({
  theme,
  menuOpen,
  onToggleTheme,
  onOpenAccount,
  onOpenMenu,
  onNavigate,
}: {
  theme: string;
  menuOpen: boolean;
  onToggleTheme: () => void;
  onOpenAccount: () => void;
  onOpenMenu: () => void;
  onNavigate: (path: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <section id="top" className="hero-shell relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[48rem] w-full overflow-hidden opacity-24 md:inset-x-auto md:end-0 md:w-[52%] md:max-w-[46rem] md:opacity-100">
        <img
          src={images.hero}
          alt=""
          fetchPriority="high"
          loading="eager"
          decoding="async"
          className="size-full object-cover object-[52%_18%] grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/18 to-transparent" />
        <div className="absolute inset-y-0 start-0 w-28 bg-gradient-to-r from-background to-transparent" />
      </div>

      <SiteHeader
        theme={theme}
        menuOpen={menuOpen}
        onToggleTheme={onToggleTheme}
        onOpenAccount={onOpenAccount}
        onOpenMenu={onOpenMenu}
        onNavigate={onNavigate}
      />

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
            <PillLink href={lessonsPath} onNavigate={onNavigate}>
              {t("hero.classes")}
            </PillLink>
            <PillLink
              href={lessonsPath}
              variant="outline"
              onNavigate={onNavigate}
            >
              {t("hero.private")}
            </PillLink>
          </div>
        </div>
      </div>
    </section>
  );
}

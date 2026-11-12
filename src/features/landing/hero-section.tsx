import { useTranslation } from "react-i18next";

import { PillLink } from "@/components/site/pill-link";
import { WeeklyTimetable } from "./weekly-timetable";
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
    <section id="top" className="relative overflow-hidden">
      <SiteHeader
        theme={theme}
        menuOpen={menuOpen}
        onToggleTheme={onToggleTheme}
        onOpenAccount={onOpenAccount}
        onOpenMenu={onOpenMenu}
        onNavigate={onNavigate}
      />

      <div className="relative mx-auto grid max-w-[76rem] gap-12 px-5 pb-16 pt-4 sm:px-8 min-[900px]:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] min-[900px]:gap-16 min-[900px]:pb-24 min-[900px]:pt-10 min-[1100px]:grid-cols-[15rem_minmax(0,0.85fr)_minmax(0,1.25fr)] min-[1100px]:gap-14">
        <div aria-hidden="true" className="pointer-events-none absolute end-0 -top-20 h-[30rem] w-full overflow-hidden opacity-22 mask-[linear-gradient(to_bottom,black_40%,transparent)] min-[1100px]:relative min-[1100px]:top-0 min-[1100px]:-ms-8 min-[1100px]:h-[36rem] min-[1100px]:w-auto min-[1100px]:opacity-100 min-[1100px]:mask-[linear-gradient(to_bottom,black_65%,transparent)]">
          <img src={images.hero} alt="" fetchPriority="high" loading="eager" decoding="async" className="size-full object-cover object-[52%_18%] grayscale" />
        </div>
        <div className="relative z-10 min-w-0 min-[900px]:pt-8 min-[1100px]:pt-24">
          <p className="font-display mb-3 text-2xl leading-none text-foreground/70 min-[900px]:text-3xl">
            {t("hero.eyebrow")}
          </p>
          <h1 dir="ltr" className="font-display text-[5rem] font-normal leading-[0.8] tracking-normal text-foreground min-[900px]:text-[7.4rem] rtl:text-right">
            {t("hero.titleTop")}
            <br />
            {t("hero.titleBottom")}
          </h1>
          <div className="mt-6 h-1 w-36 rounded-full bg-blush" />
          <p className="mt-6 max-w-md text-lg leading-7 text-foreground/70">
            {t("hero.body")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <PillLink href={lessonsPath} onNavigate={onNavigate} className="h-auto min-h-12 gap-2 bg-blush-strong px-6 py-3 text-background! normal-case tracking-normal focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
              {t("timetable.register")}
            </PillLink>
            <PillLink
              href={lessonsPath}
              variant="outline"
              className="h-auto min-h-12 gap-2 px-6 py-3 normal-case tracking-normal focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              onNavigate={onNavigate}
            >
              {t("hero.private")}
            </PillLink>
          </div>
        </div>
        <WeeklyTimetable onNavigate={onNavigate} />
      </div>
    </section>
  );
}

import { useTranslation } from "react-i18next";

import { PillLink } from "@/components/site/pill-link";
import { Button } from "@/components/ui/button";
import { images } from "@/content/site-content";

export function AboutSection({
  expanded,
  onToggleExpanded,
}: {
  expanded: boolean;
  onToggleExpanded: () => void;
}) {
  const { t } = useTranslation();

  return (
    <section
      id="about"
      className="relative mx-auto grid max-w-6xl gap-8 px-5 py-8 sm:px-8 md:grid-cols-[0.8fr_1.2fr] md:items-start"
    >
      <img
        src={images.portrait}
        alt=""
        loading="lazy"
        decoding="async"
        className="h-80 w-full rounded-[1.65rem] object-cover object-top grayscale md:sticky md:top-8 md:h-[32rem]"
      />
      <div className="relative rounded-[1.8rem] bg-card/62 p-7 shadow-soft sm:p-8">
        <div className="floral-mark" aria-hidden="true" />
        <h2 className="font-serif text-5xl leading-none">
          {t("about.title")}{" "}
          <span className="font-display text-6xl font-normal text-blush-strong">
            {t("brand.first")}
          </span>
        </h2>
        <div className="mt-4 h-0.5 w-28 bg-blush" />
        <div className="relative">
          <p className="mt-6 max-w-2xl whitespace-pre-line text-base leading-7 text-foreground/72">
            <span className="md:hidden">
              {expanded ? t("about.body") : t("about.mobilePreview")}
            </span>
            <span className="hidden md:inline">{t("about.body")}</span>
          </p>
        </div>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="h-12 rounded-full border-blush px-8 text-sm font-semibold uppercase tracking-[0.18em] text-blush-strong md:hidden"
            onClick={onToggleExpanded}
          >
            {expanded ? t("actions.readLess") : t("actions.readMore")}
          </Button>
          <PillLink href="#work" className="max-w-56">
            {t("about.cta")}
          </PillLink>
        </div>
      </div>
    </section>
  );
}

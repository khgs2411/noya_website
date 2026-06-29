import { useTranslation } from "react-i18next";

import { PillLink } from "@/components/site/pill-link";
import { featuredClasses, lessonsPath } from "@/content/site-content";

export function FeaturedClassesSection() {
  const { t } = useTranslation();

  return (
    <section id="classes" className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 className="font-serif text-4xl sm:text-5xl">
          {t("classes.title")}
        </h2>
        <PillLink
          href={lessonsPath}
          variant="outline"
          className="hidden min-w-48 sm:flex"
        >
          {t("classes.viewAll")}
        </PillLink>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {featuredClasses.map((item) => (
          <a
            key={item.date}
            href={lessonsPath}
            className="overflow-hidden rounded-[1.1rem] bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="relative h-36">
              <img src={item.image} alt="" className="size-full object-cover" />
              <div className="absolute start-4 top-4 rounded-sm bg-blush px-5 py-2 text-center text-primary-foreground">
                <p className="text-xs font-semibold uppercase tracking-[0.12em]">
                  {t("classes.month")}
                </p>
                <p className="text-4xl leading-none">{item.date}</p>
              </div>
            </div>
            <div className="px-5 py-4 text-center">
              <h3 className="text-lg font-medium">{t(item.title)}</h3>
              <p className="mt-1 text-sm text-foreground/62">
                {t(item.time)}
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

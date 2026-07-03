import { useEffect, useMemo, useState } from "react";
import type { MouseEvent } from "react";
import { useProductContext, type ClassSummary } from "@class-kit/react";
import { useTranslation } from "react-i18next";

import { PillLink } from "@/components/site/pill-link";
import { featuredClasses, lessonsPath } from "@/content/site-content";
import {
  addDays,
  endOfLocalDay,
  getLocalDateKey,
  startOfLocalDay,
} from "@/features/classes/class-range";

type FeaturedClassCard = {
  id: string;
  name: string;
  startsAt: string;
  image: string;
};

function toClassHref(item: FeaturedClassCard) {
  const date = getLocalDateKey(new Date(item.startsAt));
  return `${lessonsPath}?date=${date}&classId=${encodeURIComponent(item.id)}`;
}

export function FeaturedClassesSection({
  onNavigate,
}: {
  onNavigate: (path: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const { client } = useProductContext();
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    [i18n.language],
  );
  const weekdayFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        weekday: "short",
      }),
    [i18n.language],
  );
  const dayFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        day: "numeric",
      }),
    [i18n.language],
  );
  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [i18n.language],
  );
  const featuredClassCards = useMemo<FeaturedClassCard[]>(
    () =>
      classes.slice(0, 3).map((classSummary, index) => ({
        id: classSummary.id,
        name: classSummary.name,
        startsAt: classSummary.startsAt,
        image: featuredClasses[index % featuredClasses.length].image,
      })),
    [classes],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadFeaturedClasses() {
      if (!client) return;

      const today = startOfLocalDay(new Date());
      const result = await client.classes.list({
        range: {
          start: today.toISOString(),
          end: endOfLocalDay(addDays(today, 90)).toISOString(),
        },
      });

      if (cancelled) return;

      if (result.error) {
        setLoadFailed(true);
        return;
      }

      const now = Date.now();
      setClasses(
        [...result.data.classes]
          .filter(
            (classSummary) =>
              classSummary.temporalStatus === "upcoming" &&
              new Date(classSummary.startsAt).getTime() >= now,
          )
          .sort((first, second) => first.startsAt.localeCompare(second.startsAt))
          .slice(0, 3),
      );
      setLoadFailed(false);
    }

    void loadFeaturedClasses();

    return () => {
      cancelled = true;
    };
  }, [client]);

  function handleClassLinkClick(
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
    <section id="classes" className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 className="font-serif text-4xl sm:text-5xl">
          {t("classes.title")}
        </h2>
        <PillLink
          href={lessonsPath}
          variant="outline"
          className="hidden min-w-48 sm:flex"
          onNavigate={onNavigate}
        >
          {t("classes.viewAll")}
        </PillLink>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {(featuredClassCards.length > 0 && !loadFailed
          ? featuredClassCards
          : featuredClasses
        ).map((item) => (
          <a
            key={"id" in item ? item.id : item.date}
            href={"id" in item ? toClassHref(item) : lessonsPath}
            onClick={(event) =>
              handleClassLinkClick(
                event,
                "id" in item ? toClassHref(item) : lessonsPath,
              )
            }
            className="overflow-hidden rounded-[1.1rem] bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="relative h-36">
              <img
                src={item.image}
                alt=""
                loading="lazy"
                decoding="async"
                className="size-full object-cover"
              />
              <div className="absolute start-4 top-4 rounded-sm bg-blush px-5 py-2 text-center text-primary-foreground">
                <p className="text-xs font-semibold uppercase tracking-[0.12em]">
                  {"id" in item
                    ? weekdayFormatter.format(new Date(item.startsAt))
                    : t("classes.month")}
                </p>
                <p className="text-4xl leading-none">
                  {"id" in item
                    ? dayFormatter.format(new Date(item.startsAt))
                    : item.date}
                </p>
              </div>
            </div>
            <div className="px-5 py-4 text-center">
              <h3 className="text-lg font-medium">
                {"id" in item ? item.name : t(item.title)}
              </h3>
              <p className="mt-1 text-sm text-foreground/62">
                {"id" in item
                  ? `${dateFormatter.format(new Date(item.startsAt))} · ${timeFormatter.format(new Date(item.startsAt))}`
                  : t(item.time)}
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

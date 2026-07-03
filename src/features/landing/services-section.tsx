import { Star, Users } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { SectionTitle } from "@/components/site/section-title";
import { images, lessonsPath } from "@/content/site-content";

export function ServicesSection({
  onNavigate,
}: {
  onNavigate: (path: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <section id="work" className="mx-auto max-w-6xl px-5 py-4 sm:px-8">
      <SectionTitle>{t("services.title")}</SectionTitle>
      <div className="mt-5 grid gap-8 md:grid-cols-2">
        <ServiceCard
          href={lessonsPath}
          icon={<Users />}
          image={images.leap}
          title={t("services.classes")}
          body={t("services.classesBody")}
          onNavigate={onNavigate}
        />
        <ServiceCard
          href={lessonsPath}
          icon={<Star />}
          image={images.private}
          title={t("services.private")}
          body={t("services.privateBody")}
          onNavigate={onNavigate}
        />
      </div>
    </section>
  );
}

function ServiceCard({
  href,
  image,
  title,
  body,
  icon,
  onNavigate,
}: {
  href: string;
  image: string;
  title: string;
  body: string;
  icon: ReactNode;
  onNavigate: (path: string) => void;
}) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
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
    <a
      href={href}
      onClick={handleClick}
      className="block overflow-hidden rounded-[1.3rem] bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-xl"
    >
      <img
        src={image}
        alt=""
        loading="lazy"
        decoding="async"
        className="h-64 w-full object-cover"
      />
      <div className="relative px-10 pb-8 pt-8">
        <div className="absolute -top-8 start-12 grid size-16 place-items-center rounded-full border-2 border-card bg-blush text-primary-foreground">
          {icon}
        </div>
        <h3 className="text-xl font-medium uppercase tracking-[0.08em]">
          {title}
        </h3>
        <p className="mt-2 max-w-xs text-sm leading-6 text-foreground/62">
          {body}
        </p>
      </div>
    </a>
  );
}

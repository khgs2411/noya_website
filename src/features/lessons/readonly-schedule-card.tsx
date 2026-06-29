import { MapPin, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ContactLine } from "@/components/site/contact-line";
import { TableCell } from "@/components/site/table-cell";
import { lessonRows } from "@/content/site-content";

export function ReadonlyScheduleCard({ className = "" }: { className?: string }) {
  const { t } = useTranslation();

  return (
    <section className={`rounded-[1.8rem] bg-card/78 p-6 shadow-soft sm:p-8 ${className}`}>
      <div className="grid gap-4 md:grid-cols-[0.75fr_1.25fr] md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blush-strong">
            {t("lessons.eyebrow")}
          </p>
          <h2 className="mt-2 font-serif text-4xl sm:text-5xl">
            {t("lessons.title")}
          </h2>
        </div>
        <div className="grid gap-2 text-base text-foreground/72 md:text-end">
          <p>{t("lessons.days")}</p>
          <p>{t("lessons.duration")}</p>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-[1.15rem] border border-blush/45">
        <div className="grid grid-cols-[1.2fr_0.75fr_0.8fr_1.2fr] bg-blush/35 text-sm font-bold md:text-base">
          <TableCell>{t("lessons.entry")}</TableCell>
          <TableCell>{t("lessons.count")}</TableCell>
          <TableCell>{t("lessons.price")}</TableCell>
          <TableCell>{t("lessons.validity")}</TableCell>
        </div>
        {lessonRows.map((row, index) => (
          <div
            key={`${row.count}-${row.price}`}
            className={`grid grid-cols-[1.2fr_0.75fr_0.8fr_1.2fr] ${index % 2 ? "bg-background/32" : "bg-card/35"}`}
          >
            <TableCell>{t(row.entry)}</TableCell>
            <TableCell>{row.count}</TableCell>
            <TableCell>{row.price}</TableCell>
            <TableCell>{t(row.validity)}</TableCell>
          </div>
        ))}
      </div>

      <div className="mt-7 grid gap-4 text-foreground/74 md:grid-cols-2">
        <ContactLine icon={<MapPin />} text={t("lessons.location")} />
        <ContactLine icon={<Phone />} text={t("lessons.phone")} />
      </div>
    </section>
  );
}

import type { MouseEvent } from "react";
import { ArrowRight, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { lessonsPath } from "@/content/site-content";
import { getLocalDateKey } from "@/features/classes/class-range";
import { cn } from "@/lib/utils";
import { calendarDaysUntil, deriveTimetable } from "./weekly-timetable-model";
import { useWeeklyTimetable } from "./use-weekly-timetable";

const dotColors = ["bg-blush-strong", "bg-status-open", "bg-status-done", "bg-status-unknown"];
const focusStyle = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring";

export function WeeklyTimetable({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { t, i18n } = useTranslation();
  const state = useWeeklyTimetable();
  const locations = state.status === "ready"
    ? deriveTimetable(state.lessons, state.now, t("timetable.unknownLocation"), i18n.language)
    : [];
  const rows = locations.flatMap((location) => location.days.flatMap((day) => day.rows));
  const types = [...new Set(rows.map((row) => row.type))];
  const soonest = rows.flatMap((row) => row.times).sort((a, b) => a.next.getTime() - b.next.getTime())[0];
  const weekdayFormatter = new Intl.DateTimeFormat(i18n.language, { weekday: "long" });
  const weekdayName = (weekday: number) => weekdayFormatter.format(new Date(2023, 0, 1 + weekday));
  const color = (type: string) => dotColors[types.indexOf(type) % dotColors.length];
  const relativeDays = soonest && state.status === "ready" ? calendarDaysUntil(soonest.next, state.now) : 0;
  const relativeDay = relativeDays === 0 ? t("timetable.today") : relativeDays === 1
    ? t("timetable.tomorrow") : t("timetable.inDays", { count: relativeDays });

  function navigate(event: MouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    event.preventDefault();
    onNavigate(event.currentTarget.getAttribute("href")!);
  }

  return (
    <section aria-labelledby="weekly-timetable-title" className="relative z-10 min-w-0 min-[900px]:pt-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b border-foreground pb-4">
        <h2 id="weekly-timetable-title" className="font-serif text-3xl font-medium">{t("timetable.title")}</h2>
        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <span aria-hidden="true" className="size-2 rounded-full bg-blush-strong" />{t("timetable.live")}
        </span>
      </div>
      {state.status === "loading" ? (
        <div role="status" aria-label={t("timetable.loading")} aria-busy="true" className="mt-5 space-y-8">
          {[0, 1].map((group) => <div key={group} aria-hidden="true">
            <div className="mb-3 h-6 w-32 rounded bg-border/50 motion-safe:animate-pulse" />
            {[0, 1, 2].map((row) => <div key={row} className="border-t border-border/80 py-5">
              <div className="h-4 w-2/3 rounded bg-border/50 motion-safe:animate-pulse" />
            </div>)}
          </div>)}
        </div>
      ) : locations.length === 0 ? (
        <p role="status" className="py-9 text-base leading-7 text-muted-foreground">{t("timetable.empty")}</p>
      ) : <>
        {types.length > 1 && <ul aria-label={t("timetable.types")} className="flex flex-wrap gap-x-5 gap-y-2 pb-1 pt-4 text-sm text-muted-foreground">
          {types.map((type) => <li key={type} className="inline-flex items-center gap-2">
            <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", color(type))} />{type}
          </li>)}
        </ul>}
        <div className="mt-5 grid gap-8">
          {locations.map((location) => {
            const comma = location.name.indexOf(",");
            const city = comma < 0 ? location.name : location.name.slice(0, comma).trim();
            const street = comma < 0 ? "" : location.name.slice(comma + 1).trim();
            return <article key={location.key}>
              <h3 className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 font-medium leading-tight">
                <MapPin aria-hidden="true" className="size-4 shrink-0 self-center text-blush-strong" />
                <span className="font-serif text-2xl font-semibold [overflow-wrap:anywhere]">{city}</span>
                {street && <span className="text-sm text-muted-foreground">{street}</span>}
                <span className="text-sm text-muted-foreground">{t("timetable.weeklyCount", { count: location.count })}</span>
              </h3>
              {location.days.map((day) => <div key={day.weekday} className="grid grid-cols-[minmax(4.6rem,max-content)_minmax(0,1fr)] border-t border-border/80 last:border-b">
                <div className="whitespace-nowrap py-4 pe-2 font-serif text-lg font-medium">
                  {weekdayName(day.weekday)}
                  {state.status === "ready" && day.weekday === state.now.getDay() && <small className="mt-1 block font-sans text-xs font-semibold text-blush-strong">{t("timetable.today")}</small>}
                </div>
                <div className="min-w-0">
                  {day.rows.map((row) => <div key={row.name} className="grid min-h-14 min-w-0 items-center gap-x-4 gap-y-2 py-3.5 not-first:border-t not-first:border-dashed not-first:border-border/70 min-[560px]:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
                      <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", color(row.type))} />
                      <span className="sr-only">{row.type}: </span>
                      <b className="text-base font-semibold [overflow-wrap:anywhere] min-[560px]:text-lg">{row.name}</b>
                      {row.times.includes(soonest) && <span className="text-xs text-blush-strong">{t("timetable.next", { day: relativeDay })}</span>}
                    </div>
                    <div className="flex flex-wrap gap-1.5 min-[560px]:max-w-56 min-[560px]:justify-end">
                      {row.times.map((slot) => <a key={slot.time}
                        href={`${lessonsPath}?date=${getLocalDateKey(slot.next)}&classId=${encodeURIComponent(slot.classId)}`}
                        onClick={navigate}
                        aria-label={t("timetable.timeLabel", { name: row.name, day: weekdayName(day.weekday), time: slot.time, location: location.name })}
                        className={cn("rounded-full border border-blush/45 px-3 py-2 text-sm font-semibold tabular-nums transition-colors hover:border-blush-strong hover:bg-blush/16", focusStyle, slot === soonest && "border-blush-strong bg-blush-strong text-background! hover:bg-blush-strong")}
                      ><bdi>{slot.time}</bdi></a>)}
                    </div>
                  </div>)}
                </div>
              </div>)}
            </article>;
          })}
        </div>
      </>}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
        {locations.length > 0 && <span>{t("timetable.note")}</span>}
        <a href={lessonsPath} onClick={navigate} className={cn("inline-flex items-center gap-2 border-b border-blush pb-1 text-base font-semibold text-foreground!", focusStyle)}>
          {t("timetable.allClasses")}<ArrowRight aria-hidden="true" className="size-4 rtl:rotate-180" />
        </a>
      </div>
    </section>
  );
}

import { siteDesign } from "@/components/site/design-guide";
import { ReadonlyScheduleCard } from "@/features/lessons/readonly-schedule-card";

export function ReadonlyScheduleSection() {
  return (
    <section className="bg-muted/36 py-10 sm:py-14">
      <div className={siteDesign.sectionFrame}>
        <ReadonlyScheduleCard />
      </div>
    </section>
  );
}

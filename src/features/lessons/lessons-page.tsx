import { useTranslation } from "react-i18next";

import { ReadonlyScheduleCard } from "./readonly-schedule-card";

export function LessonsPage() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-background px-5 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6 text-foreground sm:px-8 md:pb-10">
      <div className="mx-auto max-w-5xl">
        <a
          href="./"
          className="inline-flex text-sm font-semibold text-blush-strong underline-offset-4 hover:underline"
        >
          {t("actions.back")}
        </a>

        <ReadonlyScheduleCard className="mt-6" />
      </div>
    </main>
  );
}

import { ArrowLeft, CalendarDays, Mail, Phone } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

type PricingCategory = "pilates" | "dance";

type PricingPlan = {
  labelKey: string;
  price: number;
  pricePerClass: number;
};

const pricingPlans: Record<PricingCategory, PricingPlan[]> = {
  pilates: [
    { labelKey: "pricing.plans.single", price: 100, pricePerClass: 100 },
    { labelKey: "pricing.plans.tenClassCard", price: 890, pricePerClass: 89 },
    {
      labelKey: "pricing.plans.fiveClassMembership",
      price: 400,
      pricePerClass: 80,
    },
    {
      labelKey: "pricing.plans.nineClassMembership",
      price: 640,
      pricePerClass: 71,
    },
    {
      labelKey: "pricing.plans.thirteenClassMembership",
      price: 820,
      pricePerClass: 63,
    },
  ],
  dance: [
    { labelKey: "pricing.plans.single", price: 85, pricePerClass: 85 },
    { labelKey: "pricing.plans.threeClassCard", price: 247, pricePerClass: 82 },
    { labelKey: "pricing.plans.tenClassCard", price: 790, pricePerClass: 79 },
    {
      labelKey: "pricing.plans.weeklyMembership",
      price: 375,
      pricePerClass: 75,
    },
    {
      labelKey: "pricing.plans.twiceWeeklyMembership",
      price: 610,
      pricePerClass: 68,
    },
    {
      labelKey: "pricing.plans.threeTimesWeeklyMembership",
      price: 740,
      pricePerClass: 56,
    },
  ],
};

const pilatesSchedule = [
  { dayKey: "pricing.schedule.monday", times: ["07:00", "08:00", "09:00"] },
  { dayKey: "pricing.schedule.wednesday", times: ["06:30", "07:30"] },
  { dayKey: "pricing.schedule.friday", times: ["06:00"] },
];

function formatPrice(amount: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function PricingPage({
  onNavigate,
}: {
  onNavigate: (path: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const [category, setCategory] = useState<PricingCategory>("pilates");
  const plans = pricingPlans[category];

  return (
    <main className="min-h-screen overflow-x-hidden bg-background px-5 pb-14 pt-6 text-foreground sm:px-8">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blush-strong underline-offset-4 hover:underline"
          onClick={() => onNavigate("./")}
        >
          <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
          {t("actions.back")}
        </button>

        <section className="mt-7 overflow-hidden rounded-[1.4rem] border border-blush/28 bg-card/78 shadow-soft">
          <div className="border-b border-blush/24 px-5 py-7 sm:px-8 sm:py-9">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blush-strong">
              {t("pricing.eyebrow")}
            </p>
            <h1 className="mt-2 font-serif text-4xl text-foreground sm:text-5xl">
              {t("pricing.title")}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground/68 sm:text-base">
              {t("pricing.body")}
            </p>
          </div>

          <div className="px-4 py-5 sm:px-8 sm:py-7">
            <div
              className="grid grid-cols-2 gap-2 rounded-[1.1rem] bg-muted/70 p-1.5"
              role="tablist"
              aria-label={t("pricing.categoryLabel")}
            >
              {(["pilates", "dance"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={category === item}
                  aria-controls={`pricing-panel-${item}`}
                  id={`pricing-tab-${item}`}
                  className={cn(
                    "min-w-0 rounded-xl px-3 py-3 font-serif text-base leading-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-lg",
                    category === item
                      ? "bg-background text-blush-strong shadow-soft"
                      : "text-foreground/62 hover:bg-background/48 hover:text-foreground",
                  )}
                  onClick={() => setCategory(item)}
                >
                  {t(`pricing.categories.${item}`)}
                </button>
              ))}
            </div>

            <div
              className="mt-5"
              role="tabpanel"
              id={`pricing-panel-${category}`}
              aria-labelledby={`pricing-tab-${category}`}
            >
              <div className="overflow-hidden rounded-[1.1rem] border border-blush/25 bg-background/48">
                <table className="w-full table-fixed border-collapse text-start">
                  <thead className="bg-blush/14">
                    <tr>
                      <th
                        scope="col"
                        className="w-[46%] px-3 py-3 text-start text-xs font-semibold text-foreground/72 sm:px-5 sm:text-sm"
                      >
                        {t("pricing.table.plan")}
                      </th>
                      <th
                        scope="col"
                        className="w-[27%] px-2 py-3 text-center text-xs font-semibold text-foreground/72 sm:px-4 sm:text-sm"
                      >
                        {t("pricing.table.price")}
                      </th>
                      <th
                        scope="col"
                        className="w-[27%] px-2 py-3 text-center text-xs font-semibold text-foreground/72 sm:px-4 sm:text-sm"
                      >
                        {t("pricing.table.pricePerClass")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map((plan) => (
                      <tr
                        key={plan.labelKey}
                        className="border-t border-blush/20"
                      >
                        <th
                          scope="row"
                          className="px-3 py-4 text-start text-sm font-semibold leading-5 text-foreground sm:px-5 sm:text-base"
                        >
                          {t(plan.labelKey)}
                        </th>
                        <td className="px-2 py-4 text-center text-sm font-semibold text-blush-strong sm:px-4 sm:text-base">
                          {formatPrice(plan.price, i18n.language)}
                        </td>
                        <td className="px-2 py-4 text-center text-sm text-foreground/72 sm:px-4 sm:text-base">
                          {formatPrice(plan.pricePerClass, i18n.language)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {category === "pilates" && (
                <section className="mt-5 rounded-[1.1rem] border border-blush/25 bg-background/48 p-4 sm:p-5">
                  <div className="flex items-center gap-2">
                    <CalendarDays
                      className="size-4 text-blush-strong"
                      aria-hidden="true"
                    />
                    <h2 className="font-serif text-2xl text-foreground">
                      {t("pricing.schedule.title")}
                    </h2>
                  </div>
                  <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                    {pilatesSchedule.map((item) => (
                      <div
                        key={item.dayKey}
                        className="rounded-xl border border-blush/20 bg-card/72 px-4 py-3"
                      >
                        <dt className="text-sm font-semibold text-foreground">
                          {t(item.dayKey)}
                        </dt>
                        <dd className="mt-1 text-sm text-foreground/66">
                          {item.times.join(" · ")}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}

              <section className="mt-5 rounded-[1.1rem] border border-blush/25 bg-background/48 p-4 sm:p-5">
                <h2 className="font-serif text-2xl text-foreground">
                  {t("pricing.details.title")}
                </h2>
                <div className="mt-3 space-y-2 text-sm leading-6 text-foreground/68">
                  <p>{t("pricing.details.validity")}</p>
                  <p>{t("pricing.details.terms")}</p>
                  <p>{t("pricing.details.help")}</p>
                </div>
                <div className="mt-4 flex flex-col gap-2 text-sm sm:flex-row sm:gap-5">
                  <a
                    className="inline-flex items-center gap-2 font-semibold text-blush-strong underline-offset-4 hover:underline"
                    href="tel:0536237331"
                  >
                    <Phone className="size-4" aria-hidden="true" />
                    053-623-7331
                  </a>
                  <a
                    className="inline-flex min-w-0 items-center gap-2 font-semibold text-blush-strong underline-offset-4 hover:underline"
                    href="mailto:noyas2703@gmail.com"
                  >
                    <Mail className="size-4 shrink-0" aria-hidden="true" />
                    <span className="[overflow-wrap:anywhere]">
                      noyas2703@gmail.com
                    </span>
                  </a>
                </div>
              </section>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

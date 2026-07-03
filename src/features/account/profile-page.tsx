import { useProductContext } from "@class-kit/react";
import { ArrowLeft, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { images } from "@/content/site-content";

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-blush/20 bg-background/42 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/48">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold leading-6 text-foreground [overflow-wrap:anywhere]">
        {value}
      </p>
    </div>
  );
}

export function ProfilePage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { t } = useTranslation();
  const {
    productUser,
    session,
    signOut,
  } = useProductContext();

  async function handleSignOut() {
    await signOut();
    onNavigate("auth");
  }

  const classAccess = productUser
    ? t(`profile.statuses.${productUser.status}`)
    : t("profile.noProductUser");

  return (
    <main className="min-h-screen bg-background px-5 pb-12 pt-6 text-foreground sm:px-8">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blush-strong underline-offset-4 hover:underline"
          onClick={() => onNavigate("./")}
        >
          <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
          {t("actions.back")}
        </button>

        <div className="mt-7 grid gap-5 lg:grid-cols-[0.82fr_1.18fr] lg:items-stretch">
          <section className="relative min-h-80 overflow-hidden rounded-[1.4rem] border border-blush/24 shadow-soft lg:min-h-[34rem]">
            <img
              src={images.portrait}
              alt=""
              fetchPriority="high"
              loading="eager"
              decoding="async"
              className="absolute inset-0 size-full object-cover object-[50%_20%] grayscale"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/42 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
              <p className="font-display text-4xl leading-none text-foreground sm:text-5xl">
                {t("profile.welcome")}
              </p>
              <p className="mt-3 max-w-sm text-sm leading-6 text-foreground/72 sm:text-base">
                {t("profile.brandNote")}
              </p>
            </div>
          </section>

          <section className="min-w-0 rounded-[1.4rem] border border-blush/28 bg-card/78 p-5 shadow-soft sm:p-8">
            <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-start">
              <div className="min-w-0">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blush-strong">
                  {t("account.eyebrow")}
                </p>
                <h1 className="mt-2 font-serif text-4xl">{t("profile.title")}</h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-foreground/68">
                  {t("profile.body")}
                </p>
              </div>
              {session && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-fit rounded-full border-blush/38 bg-background/42 px-5 text-foreground hover:bg-blush/10"
                  onClick={handleSignOut}
                >
                  <LogOut aria-hidden="true" />
                  {t("profile.signOut")}
                </Button>
              )}
            </div>

            {!session ? (
              <div className="mt-8 rounded-xl border border-blush/24 bg-background/46 p-5">
                <p className="text-sm leading-6 text-foreground/72">
                  {t("profile.signedOut")}
                </p>
                <Button
                  type="button"
                  className="mt-4 h-11 rounded-full bg-blush px-6 text-primary-foreground hover:bg-blush-strong"
                  onClick={() => onNavigate("auth")}
                >
                  {t("profile.signIn")}
                </Button>
              </div>
            ) : (
              <>
                <div className="mt-8 grid gap-3">
                  <StatusRow
                    label={t("profile.email")}
                    value={session.user.email ?? t("profile.unknown")}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <StatusRow label={t("profile.classAccess")} value={classAccess} />
                    <StatusRow
                      label={t("profile.studio")}
                      value={t("brand.name")}
                    />
                  </div>
                </div>

                {!productUser && (
                  <div className="mt-6 rounded-xl border border-blush/30 bg-background/55 p-4 text-sm leading-6 text-foreground/72">
                    {t("profile.inviteRequired")}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

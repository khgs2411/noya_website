import { useProductContext } from "@class-kit/react";
import { ArrowLeft, Loader2, LogOut, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-blush/20 bg-background/42 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/48">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function ProfilePage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { t } = useTranslation();
  const {
    product,
    productUser,
    capabilities,
    session,
    loading,
    error,
    refreshProductContext,
    signOut,
  } = useProductContext();

  async function handleSignOut() {
    await signOut();
    onNavigate("auth");
  }

  const dashboard = capabilities.dashboard;
  const enabledCapabilities = [
    dashboard.can_enter && t("profile.capabilities.dashboard"),
    dashboard.can_manage_classes && t("profile.capabilities.classes"),
    dashboard.can_manage_roles && t("profile.capabilities.roles"),
    dashboard.can_manage_users && t("profile.capabilities.users"),
    dashboard.can_manage_auth_mode && t("profile.capabilities.authMode"),
  ].filter((capability): capability is string => Boolean(capability));

  return (
    <main className="min-h-screen bg-background px-5 pb-12 pt-6 text-foreground sm:px-8">
      <div className="mx-auto max-w-3xl">
        <a
          href="./"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blush-strong underline-offset-4 hover:underline"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" />
          {t("actions.back")}
        </a>

        <section className="mt-7 rounded-[1.4rem] border border-blush/28 bg-card/78 p-6 shadow-soft sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
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
                className="h-11 rounded-full border-blush/38 bg-background/42 px-5 text-foreground hover:bg-blush/10"
                onClick={handleSignOut}
              >
                <LogOut />
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
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <StatusRow
                  label={t("profile.email")}
                  value={session.user.email ?? t("profile.unknown")}
                />
                <StatusRow
                  label={t("profile.product")}
                  value={product?.name ?? t("profile.loading")}
                />
                <StatusRow
                  label={t("profile.accessStatus")}
                  value={
                    productUser
                      ? t(`profile.statuses.${productUser.status}`)
                      : t("profile.noProductUser")
                  }
                />
                <StatusRow
                  label={t("profile.role")}
                  value={
                    productUser
                      ? t(`profile.roles.${productUser.role}`, {
                          defaultValue: productUser.role,
                        })
                      : t("profile.none")
                  }
                />
              </div>

              {!productUser && (
                <div className="mt-6 rounded-xl border border-blush/30 bg-background/55 p-4 text-sm leading-6 text-foreground/72">
                  {t("profile.inviteRequired")}
                </div>
              )}

              <div className="mt-6 rounded-xl border border-blush/24 bg-background/46 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground/50">
                  {t("profile.capabilities.title")}
                </p>
                {enabledCapabilities.length ? (
                  <ul className="mt-3 grid gap-2 text-sm text-foreground/76">
                    {enabledCapabilities.map((capability) => (
                      <li key={capability} className="rounded-lg bg-card/52 px-3 py-2">
                        {capability}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-foreground/68">
                    {t("profile.capabilities.none")}
                  </p>
                )}
                {dashboard.can_enter && (
                  <p className="mt-4 rounded-lg border border-blush/24 bg-card/52 px-3 py-2 text-sm leading-6 text-foreground/70">
                    {t("profile.managerPending")}
                  </p>
                )}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-full border-blush/38 bg-background/42 px-5 text-foreground hover:bg-blush/10"
                  disabled={loading}
                  onClick={() => void refreshProductContext()}
                >
                  {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                  {t("profile.refresh")}
                </Button>
                {error && <p className="text-sm text-red-700 dark:text-red-200">{error}</p>}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

import {
  type ClassKitClient,
  useProductContext,
} from "@class-kit/react";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  CircleUserRound,
  Info,
  Loader2,
  LogOut,
  Phone,
  RefreshCw,
  Ticket,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { images } from "@/content/site-content";
import { getUserSupportingEmail } from "@/features/users/user-labels";

type ProductProfileResponse = NonNullable<
  Awaited<ReturnType<ClassKitClient["profile"]["get"]>>["data"]
>;
type ProductProfileMembershipGrant =
ProductProfileResponse["memberships"]["grants"][number];
type OnboardingStep = "name" | "phone";

function MetricTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-blush/20 bg-background/38 p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full border border-blush/24 text-blush-strong">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium leading-5 text-foreground/58">
            {label}
          </p>
          <p className="mt-0.5 text-base font-semibold leading-6 text-foreground [overflow-wrap:anywhere]">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function InlineFact({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-full border border-blush/24 text-blush-strong">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium leading-5 text-foreground/56">{label}</p>
        <p className="font-serif text-2xl leading-7 text-foreground [overflow-wrap:anywhere]">
          {value}
        </p>
      </div>
    </div>
  );
}

function ProfileInput({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  return (
    <label className="grid min-w-0 gap-2">
      <span className="text-sm font-medium text-foreground/68">{label}</span>
      <input
        className="min-h-12 rounded-xl border border-blush/24 bg-background/54 px-4 text-base text-foreground outline-none transition-colors [overflow-wrap:anywhere] placeholder:text-foreground/34 focus:border-blush-strong"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
      />
    </label>
  );
}

function isOnboardingComplete(profile: ProductProfileResponse | null) {
  return (
    profile?.user.metadata.onboarding_completed === true ||
    hasOnboardingProfileFields(profile)
  );
}

function hasOnboardingProfileFields(profile: ProductProfileResponse | null) {
  return Boolean(
    profile?.user.display_name?.trim() || profile?.user.phone_number?.trim(),
  );
}

function shouldBackfillOnboarding(profile: ProductProfileResponse | null) {
  return (
    profile?.user.metadata.onboarding_completed !== true &&
    hasOnboardingProfileFields(profile)
  );
}

function formatMembershipValidity(
  grant: ProductProfileMembershipGrant,
  locale: string,
  fallback: string,
) {
  if (!grant.valid_until) return fallback;

  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    new Date(grant.valid_until),
  );
}

function getMembershipStockValue(
  grant: ProductProfileMembershipGrant,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  if (grant.total_stock === null) return t("profile.memberships.unlimited");

  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-1">
      <span dir="ltr" className="inline-block">
        {grant.remaining_stock ?? 0} / {grant.total_stock}
      </span>
      <span>{t("profile.memberships.remainingSuffix")}</span>
    </span>
  );
}

export function ProfilePage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { t, i18n } = useTranslation();
  const {
    client,
    productUser,
    session,
    signOut,
  } = useProductContext();
  const [profile, setProfile] = useState<ProductProfileResponse | null>(null);
  const [loadStatus, setLoadStatus] =
    useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [saveStatus, setSaveStatus] =
    useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [phoneNumberInput, setPhoneNumberInput] = useState("");
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>("name");

  async function handleSignOut() {
    await signOut();
    onNavigate("auth");
  }

  const loadProfile = useCallback(async (options?: { silent?: boolean }) => {
    if (!session || !client) {
      setProfile(null);
      setLoadStatus("idle");
      setErrorMessage(null);
      return;
    }

    if (!options?.silent) {
      setLoadStatus("loading");
      setErrorMessage(null);
    }

    const result = await client.profile.get();

    if (result.error) {
      if (options?.silent) return;
      setProfile(null);
      setLoadStatus("error");
      setErrorMessage(result.error.message);
      return;
    }

    setProfile(result.data);
    setDisplayNameInput(result.data.user.display_name ?? "");
    setPhoneNumberInput(result.data.user.phone_number ?? "");
    setLoadStatus("loaded");
    setErrorMessage(null);

    if (shouldBackfillOnboarding(result.data)) {
      void client
        .profile
        .update({
          metadata: {
            onboarding_completed: true,
          },
        })
        .then((updateResult) => {
          if (updateResult.error) return;

          setProfile((current) =>
            current
              ? {
                  ...current,
                  user: {
                    ...current.user,
                    metadata: updateResult.data.product_user.metadata,
                  },
                }
              : current,
          );
        });
    }
  }, [client, session]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadProfile();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadProfile]);

  const profileUser = profile?.user ?? null;
  const classAccess = profileUser
    ? t(`profile.statuses.${profileUser.status}`)
    : productUser
      ? t(`profile.statuses.${productUser.status}`)
      : t("profile.noProductUser");
  const supportingEmail =
    getUserSupportingEmail(profileUser) ??
    profileUser?.email ??
    session?.user.email ??
    null;
  const onboardingComplete = isOnboardingComplete(profile);
  const activeGrant = profile?.memberships.active_grant ?? null;
  const membershipFacts = useMemo(() => {
    if (!activeGrant) return [];

    return [
      {
        icon: Ticket,
        label: t("profile.memberships.type"),
        value: activeGrant.type.name,
      },
      {
        icon: UsersRound,
        label: t("profile.memberships.stock"),
        value: getMembershipStockValue(activeGrant, t),
      },
      {
        icon: CalendarDays,
        label: t("profile.memberships.validUntil"),
        value: formatMembershipValidity(
          activeGrant,
          i18n.language,
          t("profile.memberships.noEndDate"),
        ),
      },
    ];
  }, [activeGrant, i18n.language, t]);
  const canSaveProfile =
    Boolean(client) &&
    Boolean(session) &&
    saveStatus !== "saving" &&
    displayNameInput.trim().length > 0;
  const canContinueOnboarding =
    saveStatus !== "saving" && displayNameInput.trim().length > 0;

  async function persistProfile(input: {
    displayName: string;
    phoneNumber: string;
    markOnboardingComplete: boolean;
  }) {
    if (!client || !session || saveStatus === "saving") return false;

    const displayName = input.displayName.trim();
    const phoneNumber = input.phoneNumber.trim();

    if (!displayName) {
      setSaveStatus("error");
      setSaveErrorMessage(t("profile.validation.displayNameRequired"));
      return false;
    }

    setSaveStatus("saving");
    setSaveErrorMessage(null);

    const result = await client.profile.update({
      displayName,
      phoneNumber: phoneNumber || null,
      metadata: input.markOnboardingComplete
        ? {
            onboarding_completed: true,
          }
        : undefined,
    });

    if (result.error) {
      setSaveStatus("error");
      setSaveErrorMessage(result.error.message);
      return false;
    }

    setProfile((current) =>
      current
        ? {
            ...current,
            user: {
              ...current.user,
              display_name: result.data.profile.display_name,
              phone_number: result.data.profile.phone_number,
              metadata: result.data.product_user.metadata,
            },
          }
        : current,
    );
    setDisplayNameInput(result.data.profile.display_name ?? "");
    setPhoneNumberInput(result.data.profile.phone_number ?? "");
    setSaveStatus("saved");
    void loadProfile({ silent: true });
    return true;
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await persistProfile({
      displayName: displayNameInput,
      phoneNumber: phoneNumberInput,
      markOnboardingComplete: true,
    });
  }

  async function completeOnboarding(phoneNumber: string) {
    await persistProfile({
      displayName: displayNameInput,
      phoneNumber,
      markOnboardingComplete: true,
    });
  }

  return (
    <main className="min-h-screen bg-background px-5 pb-12 pt-6 text-foreground sm:px-8">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blush-strong underline-offset-4 hover:underline"
          onClick={() => onNavigate("./")}
        >
          <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
          {t("actions.back")}
        </button>

        <div className="mt-7 grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-stretch">
          <section className="relative min-h-[13rem] overflow-hidden rounded-[1.4rem] border border-blush/24 shadow-soft sm:min-h-[18rem] lg:min-h-[44rem]">
            <img
              src={images.portrait}
              alt=""
              fetchPriority="high"
              loading="eager"
              decoding="async"
              className="absolute inset-0 size-full object-cover object-[50%_24%] grayscale lg:object-[50%_20%]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/36 to-background/4" />
            <div className="absolute inset-x-0 top-0 flex items-center gap-2 p-4 sm:gap-3 sm:p-6 lg:p-7">
              <span className="font-display text-4xl leading-none text-blush-strong sm:text-5xl">
                N
              </span>
              <div>
                <p className="font-serif text-base uppercase leading-none tracking-[0.12em] text-foreground sm:text-xl">
                  {t("brand.name")}
                </p>
                <p className="mt-1 text-[0.58rem] font-semibold uppercase tracking-[0.24em] text-foreground/58 sm:text-[0.65rem] sm:tracking-[0.28em]">
                  {t("profile.brandKicker")}
                </p>
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 lg:p-9">
              <p className="font-display text-4xl leading-none text-blush-strong sm:text-5xl lg:text-6xl">
                {t("profile.welcome")}
              </p>
              <div className="mt-2 h-px w-32 bg-blush-strong/70 sm:w-44" />
              <p className="mt-2 max-w-sm text-xs leading-5 text-foreground/72 sm:mt-4 sm:text-sm sm:leading-6 lg:text-base">
                {t("profile.brandNote")}
              </p>
            </div>
          </section>

          <section className="min-w-0 py-1 lg:py-8">
            <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-start">
              <div className="min-w-0">
                <h1 className="font-serif text-5xl leading-none sm:text-6xl">
                  {t("profile.title")}
                </h1>
                <p className="mt-4 max-w-xl text-base leading-7 text-foreground/68">
                  {t("profile.body")}
                </p>
              </div>
              {session && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-fit rounded-full border-blush/38 bg-background/42 px-6 text-foreground hover:bg-blush/10"
                  onClick={handleSignOut}
                >
                  <LogOut aria-hidden="true" />
                  {t("profile.signOut")}
                </Button>
              )}
            </div>

            {!session ? (
              <div className="mt-8 rounded-[1.4rem] border border-blush/24 bg-card/78 p-6 shadow-soft">
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
              <div className="mt-8 rounded-[1.4rem] border border-blush/28 bg-card/78 p-5 shadow-soft sm:p-7">
                {loadStatus === "loading" && (
                  <div className="flex items-center gap-3 rounded-xl border border-blush/24 bg-background/46 p-4 text-sm text-foreground/68">
                    <Loader2
                      className="size-4 animate-spin text-blush-strong"
                      aria-hidden="true"
                    />
                    {t("profile.loading")}
                  </div>
                )}

                {loadStatus === "error" && (
                  <div className="rounded-xl border border-blush/24 bg-background/46 p-4">
                    <p className="text-sm leading-6 text-blush-strong">
                      {errorMessage ?? t("profile.error")}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4 rounded-full"
                      onClick={() => void loadProfile()}
                    >
                      <RefreshCw className="size-4" aria-hidden="true" />
                      {t("profile.refresh")}
                    </Button>
                  </div>
                )}

                {profile && profileUser && !onboardingComplete && (
                  <section className="grid gap-6">
                    <div className="flex items-start gap-4">
                      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-blush-strong text-background">
                        {onboardingStep === "name" ? (
                          <CircleUserRound className="size-6" aria-hidden="true" />
                        ) : (
                          <Phone className="size-6" aria-hidden="true" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blush-strong">
                          {t("profile.onboarding")}
                        </p>
                        <h2 className="mt-2 font-serif text-3xl leading-8 text-foreground">
                          {onboardingStep === "name"
                            ? t("profile.onboardingNameTitle")
                            : t("profile.onboardingPhoneTitle")}
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground/64">
                          {onboardingStep === "name"
                            ? t("profile.onboardingNameBody")
                            : t("profile.onboardingPhoneBody")}
                        </p>
                      </div>
                    </div>

                    {onboardingStep === "name" ? (
                      <div className="grid gap-5">
                        <ProfileInput
                          label={t("profile.displayName")}
                          value={displayNameInput}
                          onChange={(value) => {
                            setDisplayNameInput(value);
                            setSaveStatus("idle");
                            setSaveErrorMessage(null);
                          }}
                          autoComplete="name"
                        />
                        {saveErrorMessage && (
                          <p className="text-sm leading-6 text-blush-strong">
                            {saveErrorMessage}
                          </p>
                        )}
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            className="h-12 w-full rounded-full bg-blush px-7 text-primary-foreground hover:bg-blush-strong sm:w-fit"
                            disabled={!canContinueOnboarding}
                            onClick={() => {
                              if (!displayNameInput.trim()) {
                                setSaveStatus("error");
                                setSaveErrorMessage(
                                  t("profile.validation.displayNameRequired"),
                                );
                                return;
                              }

                              setSaveStatus("idle");
                              setSaveErrorMessage(null);
                              setOnboardingStep("phone");
                            }}
                          >
                            {t("profile.onboardingContinue")}
                            <ChevronRight
                              className="size-4 rtl:rotate-180"
                              aria-hidden="true"
                            />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-5">
                        <ProfileInput
                          label={t("profile.phone")}
                          value={phoneNumberInput}
                          onChange={(value) => {
                            setPhoneNumberInput(value);
                            setSaveStatus("idle");
                            setSaveErrorMessage(null);
                          }}
                          autoComplete="tel"
                        />
                        <p className="flex items-start gap-3 rounded-xl border border-blush/20 bg-background/38 p-4 text-sm leading-6 text-foreground/66">
                          <Info
                            className="mt-1 size-4 shrink-0 text-blush-strong"
                            aria-hidden="true"
                          />
                          {t("profile.onboardingPhoneEncouragement")}
                        </p>
                        {saveErrorMessage && (
                          <p className="text-sm leading-6 text-blush-strong">
                            {saveErrorMessage}
                          </p>
                        )}
                        <div className="grid gap-3 sm:grid-cols-[auto_auto] sm:justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            className="h-12 rounded-full border-blush/38 bg-background/42 px-7 text-foreground hover:bg-blush/10"
                            disabled={saveStatus === "saving"}
                            onClick={() => void completeOnboarding("")}
                          >
                            {t("profile.onboardingSkipPhone")}
                          </Button>
                          <Button
                            type="button"
                            className="h-12 rounded-full bg-blush px-7 text-primary-foreground hover:bg-blush-strong"
                            disabled={saveStatus === "saving"}
                            onClick={() => void completeOnboarding(phoneNumberInput)}
                          >
                            {saveStatus === "saving" ? (
                              <Loader2
                                className="size-4 animate-spin"
                                aria-hidden="true"
                              />
                            ) : (
                              <Check className="size-4" aria-hidden="true" />
                            )}
                            {t("profile.onboardingFinish")}
                          </Button>
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {profile && profileUser && onboardingComplete && (
                  <>
                    <form className="grid gap-6" onSubmit={saveProfile}>
                      <div className="flex items-start gap-4">
                        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-blush-strong text-background">
                          <CircleUserRound className="size-6" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <h2 className="font-serif text-2xl leading-7 text-foreground">
                            {t("profile.detailsTitle")}
                          </h2>
                          <p className="mt-1 text-sm leading-6 text-foreground/64">
                            {t("profile.detailsBody")}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <ProfileInput
                          label={t("profile.displayName")}
                          value={displayNameInput}
                          onChange={(value) => {
                            setDisplayNameInput(value);
                            setSaveStatus("idle");
                            setSaveErrorMessage(null);
                          }}
                          autoComplete="name"
                        />
                        <ProfileInput
                          label={t("profile.phone")}
                          value={phoneNumberInput}
                          onChange={(value) => {
                            setPhoneNumberInput(value);
                            setSaveStatus("idle");
                            setSaveErrorMessage(null);
                          }}
                          autoComplete="tel"
                        />
                      </div>

                      {supportingEmail && (
                        <p className="text-sm leading-6 text-foreground/62 [overflow-wrap:anywhere]">
                          {t("profile.email")}:{" "}
                          <span className="text-blush-strong">
                            {supportingEmail}
                          </span>
                        </p>
                      )}

                      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                        <div className="min-w-0">
                          {!onboardingComplete && (
                            <p className="flex items-start gap-3 text-sm leading-6 text-foreground/64">
                              <Info
                                className="mt-1 size-4 shrink-0 text-blush-strong"
                                aria-hidden="true"
                              />
                              {t("profile.onboardingBody")}
                            </p>
                          )}
                          {saveErrorMessage && (
                            <p className="text-sm leading-6 text-blush-strong">
                              {saveErrorMessage}
                            </p>
                          )}
                          {saveStatus === "saved" && (
                            <p className="text-sm leading-6 text-foreground/68">
                              {t("profile.saved")}
                            </p>
                          )}
                        </div>
                        <Button
                          type="submit"
                          className="h-12 w-full rounded-full bg-blush px-7 text-primary-foreground hover:bg-blush-strong sm:w-fit"
                          disabled={!canSaveProfile}
                        >
                          {saveStatus === "saving" ? (
                            <Loader2
                              className="size-4 animate-spin"
                              aria-hidden="true"
                            />
                          ) : (
                            <Check className="size-4" aria-hidden="true" />
                          )}
                          {t("profile.saveProfile")}
                        </Button>
                      </div>
                    </form>

                    <div className="my-7 h-px bg-blush/18" />

                    <section className="grid gap-5">
                      <div className="flex items-start gap-4">
                        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-blush-strong text-background">
                          <Ticket className="size-6" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <h2 className="font-serif text-2xl leading-7 text-foreground">
                            {t("profile.memberships.title")}
                          </h2>
                          <p className="mt-1 text-sm leading-6 text-foreground/64">
                            {profile.memberships.has_active_membership
                              ? t("profile.memberships.active")
                              : t("profile.memberships.inactive")}
                          </p>
                        </div>
                      </div>

                      {activeGrant ? (
                        <div className="grid gap-3 md:grid-cols-3">
                          {membershipFacts.map((fact) => (
                            <MetricTile
                              key={fact.label}
                              icon={fact.icon}
                              label={fact.label}
                              value={fact.value}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="rounded-xl border border-blush/20 bg-background/38 p-4 text-sm leading-6 text-foreground/68">
                          {t("profile.memberships.none")}
                        </p>
                      )}

                      <div className="h-px bg-blush/18" />

                      <div className="grid gap-4 sm:grid-cols-2">
                        <InlineFact
                          icon={UsersRound}
                          label={t("profile.classAccess")}
                          value={classAccess}
                        />
                        <InlineFact
                          icon={Building2}
                          label={t("profile.studio")}
                          value={t("brand.name")}
                        />
                      </div>
                    </section>
                  </>
                )}

                {!profileUser && loadStatus !== "loading" && loadStatus !== "error" && (
                  <div className="grid gap-5">
                    <MetricTile
                      icon={CircleUserRound}
                      label={t("profile.email")}
                      value={session.user.email ?? t("profile.unknown")}
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <InlineFact
                        icon={UsersRound}
                        label={t("profile.classAccess")}
                        value={classAccess}
                      />
                      <InlineFact
                        icon={Building2}
                        label={t("profile.studio")}
                        value={t("brand.name")}
                      />
                    </div>
                  </div>
                )}

                {!productUser && (
                  <div className="mt-6 rounded-xl border border-blush/30 bg-background/55 p-4 text-sm leading-6 text-foreground/72">
                    {t("profile.inviteRequired")}
                  </div>
                )}

                {loadStatus === "loaded" && (
                  <div className="mt-6 flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full border-blush/30 bg-background/30 text-foreground/72 hover:bg-blush/10"
                      onClick={() => void loadProfile()}
                    >
                      <RefreshCw className="size-4" aria-hidden="true" />
                      {t("profile.refresh")}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

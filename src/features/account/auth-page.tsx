import { useProductContext } from "@class-kit/react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { authPath, images } from "@/content/site-content";

type AuthMode = "signin" | "signup";

export function AuthPage({
  requestedMode,
  onNavigate,
}: {
  requestedMode: AuthMode;
  onNavigate: (path: string) => void;
}) {
  const { t } = useTranslation();
  const {
    product,
    session,
    loading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
  } = useProductContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const canUsePassword = Boolean(product?.email_password_enabled);
  const canUseGoogle = Boolean(product?.google_oauth_enabled);
  const canSignUp =
    product?.auth_mode === "open" && Boolean(product.email_password_enabled);
  const canGoogleSignUp =
    product?.auth_mode === "open" && Boolean(product.google_oauth_enabled);

  const visibleMode = canSignUp ? requestedMode : "signin";

  useEffect(() => {
    if (session) onNavigate("profile");
  }, [onNavigate, session]);

  const unavailableMessage = useMemo(() => {
    if (loading) return t("auth.loadingPolicy");
    if (!product) return t("auth.unavailable");
    if (visibleMode === "signin" && !canUsePassword && !canUseGoogle) {
      return t("auth.signinUnavailable");
    }
    if (visibleMode === "signup" && !canSignUp && !canGoogleSignUp) {
      return t("auth.signupUnavailable");
    }
    return null;
  }, [
    canGoogleSignUp,
    canSignUp,
    canUseGoogle,
    canUsePassword,
    loading,
    product,
    t,
    visibleMode,
  ]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setSubmitting(true);

    try {
      if (visibleMode === "signup") {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setSubmitted(true);
    setSubmitting(true);

    try {
      await signInWithGoogle();
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(nextMode: AuthMode) {
    setSubmitted(false);
    onNavigate(nextMode === "signup" ? `${authPath}?mode=signup` : authPath);
  }

  return (
    <main className="min-h-screen bg-background px-5 pb-12 pt-6 text-foreground sm:px-8">
      <div className="mx-auto max-w-5xl">
        <a
          href="./"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blush-strong underline-offset-4 hover:underline"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" />
          {t("actions.back")}
        </a>

        <div className="mt-7 grid gap-5 md:grid-cols-[0.95fr_1fr] md:items-stretch">
          <section className="relative min-h-72 overflow-hidden rounded-[1.4rem] border border-blush/24 shadow-soft md:min-h-[34rem]">
            <img
              src={images.group}
              alt=""
              className="absolute inset-0 size-full object-cover grayscale"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/48 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <p className="font-display text-4xl leading-none text-foreground sm:text-5xl">
                {t("brand.name")}
              </p>
              <p className="mt-3 max-w-sm text-sm leading-6 text-foreground/72">
                {t("auth.brandNote")}
              </p>
            </div>
          </section>

          <section className="rounded-[1.4rem] border border-blush/28 bg-card/78 p-6 shadow-soft sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blush-strong">
              {t("account.eyebrow")}
            </p>
            <h1 className="mt-2 font-serif text-4xl">
              {visibleMode === "signup" ? t("auth.signupTitle") : t("auth.signinTitle")}
            </h1>
            <p className="mt-3 text-sm leading-6 text-foreground/68">
              {visibleMode === "signup" ? t("auth.signupBody") : t("auth.signinBody")}
            </p>

            {canSignUp && (
              <div className="mt-6 grid grid-cols-2 rounded-full border border-blush/24 bg-background/48 p-1 text-sm font-semibold">
                <button
                  type="button"
                  className={`rounded-full px-4 py-2 transition ${
                    visibleMode === "signin"
                      ? "bg-blush text-primary-foreground"
                      : "text-foreground/68 hover:text-foreground"
                  }`}
                  onClick={() => switchMode("signin")}
                >
                  {t("auth.signinTab")}
                </button>
                <button
                  type="button"
                  className={`rounded-full px-4 py-2 transition ${
                    visibleMode === "signup"
                      ? "bg-blush text-primary-foreground"
                      : "text-foreground/68 hover:text-foreground"
                  }`}
                  onClick={() => switchMode("signup")}
                >
                  {t("auth.signupTab")}
                </button>
              </div>
            )}

            {unavailableMessage && (
              <div className="mt-6 rounded-xl border border-blush/30 bg-background/55 p-4 text-sm leading-6 text-foreground/72">
                {unavailableMessage}
              </div>
            )}

            {(visibleMode === "signin" ? canUsePassword : canSignUp) && (
              <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
                <label className="grid gap-2 text-sm font-semibold text-foreground/76">
                  {t("auth.email")}
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    className="h-12 rounded-xl border border-blush/30 bg-background/68 px-4 text-base text-foreground outline-none transition focus:border-blush focus:ring-2 focus:ring-blush/20"
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-foreground/76">
                  {t("auth.password")}
                  <input
                    type="password"
                    autoComplete={
                      visibleMode === "signup" ? "new-password" : "current-password"
                    }
                    required
                    minLength={6}
                    value={password}
                    className="h-12 rounded-xl border border-blush/30 bg-background/68 px-4 text-base text-foreground outline-none transition focus:border-blush focus:ring-2 focus:ring-blush/20"
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </label>
                <Button
                  type="submit"
                  className="mt-1 h-12 rounded-full bg-blush text-primary-foreground hover:bg-blush-strong"
                  disabled={submitting || loading}
                >
                  {submitting && <Loader2 className="animate-spin" />}
                  {visibleMode === "signup" ? t("auth.signupSubmit") : t("auth.signinSubmit")}
                </Button>
              </form>
            )}

            {(visibleMode === "signin" ? canUseGoogle : canGoogleSignUp) && (
              <Button
                type="button"
                variant="outline"
                className="mt-4 h-12 w-full rounded-full border-blush/38 bg-background/40 text-foreground hover:bg-blush/10"
                disabled={submitting || loading}
                onClick={handleGoogle}
              >
                {visibleMode === "signup" ? t("auth.googleSignup") : t("auth.googleSignin")}
              </Button>
            )}

            {submitted && error && (
              <p className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm leading-6 text-red-700 dark:text-red-200">
                {error}
              </p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

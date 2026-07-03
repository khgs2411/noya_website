import { useProductContext } from "@class-kit/react";
import { Loader2 } from "lucide-react";
import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import {
  authPath,
  isAuthPath,
  isLessonsPath,
  isManagerPath,
  isProfilePath,
  managerPath,
  profilePath,
} from "@/content/site-content";
import { SiteHeader } from "@/components/site/site-header";
import type { ManagerAccessSnapshot } from "@/features/manager/manager-page";
import { useTheme } from "@/hooks/use-theme";
import { captureActiveElement, restoreFocus } from "@/lib/focus";

const MANAGER_ACCESS_CACHE_KEY = "noya.manager.lastAccess";
const MANAGER_ACCESS_CACHE_TTL_MS = 5 * 60 * 1000;

const AuthPage = lazy(() =>
  import("@/features/account/auth-page").then((module) => ({
    default: module.AuthPage,
  })),
);
const ProfilePage = lazy(() =>
  import("@/features/account/profile-page").then((module) => ({
    default: module.ProfilePage,
  })),
);
const LandingPage = lazy(() =>
  import("@/features/landing/landing-page").then((module) => ({
    default: module.LandingPage,
  })),
);
const MobileMenu = lazy(() =>
  import("@/features/landing/mobile-menu").then((module) => ({
    default: module.MobileMenu,
  })),
);
const LessonsPage = lazy(() =>
  import("@/features/lessons/lessons-page").then((module) => ({
    default: module.LessonsPage,
  })),
);
const ManagerPage = lazy(() =>
  import("@/features/manager/manager-page").then((module) => ({
    default: module.ManagerPage,
  })),
);

type StoredManagerAccess = ManagerAccessSnapshot & {
  userId: string;
  checkedAt: number;
};

function RouteFallback() {
  const { t } = useTranslation();

  return (
    <div
      className="grid min-h-[45vh] place-items-center bg-background px-5 py-10 text-foreground"
      aria-busy="true"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-blush/24 bg-card/72 px-5 py-4 text-sm text-foreground/68 shadow-soft">
        <Loader2
          className="size-4 shrink-0 animate-spin text-blush-strong"
          aria-hidden="true"
        />
        {t("app.loading")}
      </div>
    </div>
  );
}

function getCurrentRoute() {
  return {
    pathname: window.location.pathname,
    search: window.location.search,
  };
}

function readStoredManagerAccess(userId: string | null) {
  if (!userId) return null;

  try {
    const rawValue = window.localStorage.getItem(MANAGER_ACCESS_CACHE_KEY);
    if (!rawValue) return null;

    const parsed = JSON.parse(rawValue) as Partial<StoredManagerAccess>;
    const expired =
      typeof parsed.checkedAt !== "number" ||
      Date.now() - parsed.checkedAt > MANAGER_ACCESS_CACHE_TTL_MS;

    if (parsed.userId !== userId || expired) {
      window.localStorage.removeItem(MANAGER_ACCESS_CACHE_KEY);
      return null;
    }

    if (!parsed.dashboard || !Array.isArray(parsed.permissions)) return null;

    return {
      dashboard: {
        can_manage_classes: Boolean(parsed.dashboard.can_manage_classes),
        can_manage_roles: Boolean(parsed.dashboard.can_manage_roles),
        can_manage_users: Boolean(parsed.dashboard.can_manage_users),
      },
      permissions: parsed.permissions.filter(
        (permission): permission is string => typeof permission === "string",
      ),
    };
  } catch {
    window.localStorage.removeItem(MANAGER_ACCESS_CACHE_KEY);
    return null;
  }
}

function writeStoredManagerAccess(
  userId: string,
  snapshot: ManagerAccessSnapshot,
) {
  window.localStorage.setItem(
    MANAGER_ACCESS_CACHE_KEY,
    JSON.stringify({
      ...snapshot,
      userId,
      checkedAt: Date.now(),
    } satisfies StoredManagerAccess),
  );
}

export default function App() {
  const { capabilities, loading, session } = useProductContext();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [route, setRoute] = useState(getCurrentRoute);
  const [managerAccessSnapshot, setManagerAccessSnapshot] =
    useState<ManagerAccessSnapshot | null>(null);
  const menuFocusReturnRef = useRef<HTMLElement | null>(null);
  const imageFocusReturnRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    function handleNavigation() {
      setRoute(getCurrentRoute());
    }

    window.addEventListener("popstate", handleNavigation);
    return () => window.removeEventListener("popstate", handleNavigation);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen || activeImage ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, activeImage]);

  useEffect(() => {
    if (!menuOpen && !activeImage) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      if (activeImage) {
        closeImage();
        return;
      }

      closeMenu();
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [activeImage, menuOpen]);

  const canEnterManager = capabilities.dashboard.can_enter;
  const managerUserId = session?.user.id ?? null;

  useEffect(() => {
    let timeoutId: number | null = null;

    function setCachedSnapshot(snapshot: ManagerAccessSnapshot | null) {
      timeoutId = window.setTimeout(() => {
        setManagerAccessSnapshot(snapshot);
      }, 0);
    }

    if (!isManagerPath(route.pathname) || !managerUserId) {
      setCachedSnapshot(null);
    } else {
      setCachedSnapshot(readStoredManagerAccess(managerUserId));
    }

    return () => {
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [managerUserId, route.pathname]);

  useEffect(() => {
    if (!isManagerPath(route.pathname) || loading || !managerUserId) return;
    let timeoutId: number | null = null;

    function setCachedSnapshot(snapshot: ManagerAccessSnapshot | null) {
      timeoutId = window.setTimeout(() => {
        setManagerAccessSnapshot(snapshot);
      }, 0);
    }

    if (canEnterManager) {
      const snapshot = {
        dashboard: {
          can_manage_classes: Boolean(
            capabilities.dashboard.can_manage_classes,
          ),
          can_manage_roles: Boolean(capabilities.dashboard.can_manage_roles),
          can_manage_users: Boolean(capabilities.dashboard.can_manage_users),
        },
        permissions: capabilities.permissions,
      };
      writeStoredManagerAccess(managerUserId, snapshot);
      setCachedSnapshot(snapshot);
    } else {
      window.localStorage.removeItem(MANAGER_ACCESS_CACHE_KEY);
      setCachedSnapshot(null);
    }

    return () => {
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [
    canEnterManager,
    capabilities.dashboard.can_manage_classes,
    capabilities.dashboard.can_manage_roles,
    capabilities.dashboard.can_manage_users,
    capabilities.permissions,
    loading,
    managerUserId,
    route.pathname,
  ]);

  useEffect(() => {
    if (
      !isManagerPath(route.pathname) ||
      loading ||
      canEnterManager ||
      managerAccessSnapshot
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      window.history.replaceState({}, "", "./");
      setRoute(getCurrentRoute());
      setMenuOpen(false);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [canEnterManager, loading, managerAccessSnapshot, route.pathname]);

  function navigateTo(path: string) {
    const nextUrl = new URL(path, window.location.href);
    window.history.pushState(
      {},
      "",
      `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`,
    );
    setRoute(getCurrentRoute());
    closeMenu({ restore: false });

    window.setTimeout(() => {
      if (nextUrl.hash) {
        const target = document.getElementById(
          decodeURIComponent(nextUrl.hash.slice(1)),
        );
        target?.scrollIntoView({ block: "start" });
        return;
      }

      window.scrollTo({ top: 0 });
    }, 0);
  }

  function openManager() {
    navigateTo(managerPath);
  }

  function openAccount() {
    navigateTo(session ? profilePath : authPath);
  }

  function openMenu() {
    menuFocusReturnRef.current = captureActiveElement();
    setMenuOpen(true);
  }

  function closeMenu(options: { restore?: boolean } = {}) {
    setMenuOpen(false);
    if (options.restore !== false) {
      restoreFocus(menuFocusReturnRef.current);
    }
  }

  function selectImage(image: string) {
    imageFocusReturnRef.current = captureActiveElement();
    setActiveImage(image);
  }

  function closeImage() {
    setActiveImage(null);
    restoreFocus(imageFocusReturnRef.current);
  }

  const authMode =
    new URLSearchParams(route.search).get("mode") === "signup"
      ? "signup"
      : "signin";

  function renderWithMenu(page: ReactNode, showHeader: boolean) {
    return (
      <>
        {showHeader && (
          <div className="bg-background text-foreground">
            <SiteHeader
              theme={theme}
              menuOpen={menuOpen}
              onToggleTheme={toggleTheme}
              onOpenAccount={openAccount}
              onOpenMenu={openMenu}
            />
          </div>
        )}
        <Suspense fallback={<RouteFallback />}>{page}</Suspense>
        {menuOpen && (
          <Suspense fallback={null}>
            <MobileMenu
              theme={theme}
              onToggleTheme={toggleTheme}
              onOpenAccount={openAccount}
              onOpenManager={openManager}
              canEnterManager={canEnterManager}
              onClose={closeMenu}
              onNavigate={navigateTo}
            />
          </Suspense>
        )}
      </>
    );
  }

  if (isAuthPath(route.pathname)) {
    return renderWithMenu(
      <AuthPage requestedMode={authMode} onNavigate={navigateTo} />,
      true,
    );
  }

  if (isProfilePath(route.pathname)) {
    return renderWithMenu(<ProfilePage onNavigate={navigateTo} />, true);
  }

  if (isManagerPath(route.pathname)) {
    if (loading) {
      if (managerAccessSnapshot) {
        return renderWithMenu(
          <ManagerPage
            accessSnapshot={managerAccessSnapshot}
            onNavigate={navigateTo}
          />,
          true,
        );
      }

      return renderWithMenu(
        <ManagerPage loading onNavigate={navigateTo} />,
        true,
      );
    }

    if (canEnterManager) {
      return renderWithMenu(<ManagerPage onNavigate={navigateTo} />, true);
    }
  }

  if (isLessonsPath(route.pathname)) {
    return renderWithMenu(<LessonsPage onNavigate={navigateTo} />, true);
  }

  return renderWithMenu(
    <LandingPage
      theme={theme}
      menuOpen={menuOpen}
      aboutExpanded={aboutExpanded}
      activeImage={activeImage}
      onToggleTheme={toggleTheme}
      onOpenAccount={openAccount}
      onOpenMenu={openMenu}
      onToggleAbout={() => setAboutExpanded((current) => !current)}
      onSelectImage={selectImage}
      onCloseImage={closeImage}
      onNavigate={navigateTo}
    />,
    false,
  );
}

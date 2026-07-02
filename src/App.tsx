import { useProductContext } from "@class-kit/react";
import { useEffect, useState, type ReactNode } from "react";

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
import { AuthPage } from "@/features/account/auth-page";
import { ProfilePage } from "@/features/account/profile-page";
import { LandingPage } from "@/features/landing/landing-page";
import { MobileMenu } from "@/features/landing/mobile-menu";
import { LessonsPage } from "@/features/lessons/lessons-page";
import {
  ManagerPage,
  type ManagerAccessSnapshot,
} from "@/features/manager/manager-page";
import { useTheme } from "@/hooks/use-theme";

const MANAGER_ACCESS_CACHE_KEY = "noya.manager.lastAccess";
const MANAGER_ACCESS_CACHE_TTL_MS = 5 * 60 * 1000;

type StoredManagerAccess = ManagerAccessSnapshot & {
  userId: string;
  checkedAt: number;
};

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
    window.history.pushState({}, "", path);
    setRoute(getCurrentRoute());
    setMenuOpen(false);
  }

  function openManager() {
    navigateTo(managerPath);
  }

  function openAccount() {
    navigateTo(session ? profilePath : authPath);
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
              onOpenMenu={() => setMenuOpen(true)}
            />
          </div>
        )}
        {page}
        {menuOpen && (
          <MobileMenu
            theme={theme}
            onToggleTheme={toggleTheme}
            onOpenAccount={openAccount}
            onOpenManager={openManager}
            canEnterManager={canEnterManager}
            onClose={() => setMenuOpen(false)}
          />
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
          <ManagerPage accessSnapshot={managerAccessSnapshot} />,
          true,
        );
      }

      return renderWithMenu(<ManagerPage loading />, true);
    }

    if (canEnterManager) {
      return renderWithMenu(<ManagerPage />, true);
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
      onOpenMenu={() => setMenuOpen(true)}
      onToggleAbout={() => setAboutExpanded((current) => !current)}
      onSelectImage={setActiveImage}
      onCloseImage={() => setActiveImage(null)}
    />,
    false,
  );
}

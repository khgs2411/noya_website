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
import { ManagerPage } from "@/features/manager/manager-page";
import { useTheme } from "@/hooks/use-theme";

function getCurrentRoute() {
  return {
    pathname: window.location.pathname,
    search: window.location.search,
  };
}

export default function App() {
  const { capabilities, loading, session } = useProductContext();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [route, setRoute] = useState(getCurrentRoute);

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

  useEffect(() => {
    if (!isManagerPath(route.pathname) || loading || canEnterManager) return;

    const timeoutId = window.setTimeout(() => {
      window.history.replaceState({}, "", "./");
      setRoute(getCurrentRoute());
      setMenuOpen(false);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [canEnterManager, loading, route.pathname]);

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

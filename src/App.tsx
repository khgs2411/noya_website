import { useProductContext } from "@class-kit/react";
import { useEffect, useState } from "react";

import {
  authPath,
  isAuthPath,
  isLessonsPath,
  isManagerPath,
  isProfilePath,
  managerPath,
  profilePath,
} from "@/content/site-content";
import { AuthPage } from "@/features/account/auth-page";
import { ProfilePage } from "@/features/account/profile-page";
import { LandingPage } from "@/features/landing/landing-page";
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

    window.history.replaceState({}, "", "./");
    setRoute(getCurrentRoute());
    setMenuOpen(false);
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

  if (isAuthPath(route.pathname)) {
    return <AuthPage requestedMode={authMode} onNavigate={navigateTo} />;
  }

  if (isProfilePath(route.pathname)) {
    return <ProfilePage onNavigate={navigateTo} />;
  }

  if (isManagerPath(route.pathname)) {
    if (loading) {
      return <ManagerPage loading />;
    }

    if (canEnterManager) {
      return <ManagerPage />;
    }
  }

  if (isLessonsPath(route.pathname)) {
    return <LessonsPage />;
  }

  return (
    <LandingPage
      theme={theme}
      menuOpen={menuOpen}
      aboutExpanded={aboutExpanded}
      activeImage={activeImage}
      onToggleTheme={toggleTheme}
      onOpenAccount={openAccount}
      onOpenManager={openManager}
      canEnterManager={canEnterManager}
      onOpenMenu={() => setMenuOpen(true)}
      onCloseMenu={() => setMenuOpen(false)}
      onToggleAbout={() => setAboutExpanded((current) => !current)}
      onSelectImage={setActiveImage}
      onCloseImage={() => setActiveImage(null)}
    />
  );
}

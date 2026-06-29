import { useEffect, useState } from "react";

import { isLessonsPath } from "@/content/site-content";
import { LandingPage } from "@/features/landing/landing-page";
import { LessonsPage } from "@/features/lessons/lessons-page";
import { useTheme } from "@/hooks/use-theme";

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    function handleNavigation() {
      setPath(window.location.pathname);
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

  if (isLessonsPath(path)) {
    return <LessonsPage />;
  }

  return (
    <LandingPage
      theme={theme}
      menuOpen={menuOpen}
      aboutExpanded={aboutExpanded}
      activeImage={activeImage}
      onToggleTheme={toggleTheme}
      onOpenMenu={() => setMenuOpen(true)}
      onCloseMenu={() => setMenuOpen(false)}
      onToggleAbout={() => setAboutExpanded((current) => !current)}
      onSelectImage={setActiveImage}
      onCloseImage={() => setActiveImage(null)}
    />
  );
}

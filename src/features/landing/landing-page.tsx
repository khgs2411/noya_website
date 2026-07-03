import { AboutSection } from "./about-section";
import { ContactSection } from "./contact-section";
import { FeaturedClassesSection } from "./featured-classes-section";
import { GallerySection } from "./gallery-section";
import { HeroSection } from "./hero-section";
import { ImageLightbox } from "./image-lightbox";
import { ReadonlyScheduleSection } from "./readonly-schedule-section";
import { ServicesSection } from "./services-section";

export function LandingPage({
  theme,
  menuOpen,
  aboutExpanded,
  activeImage,
  onToggleTheme,
  onOpenAccount,
  onOpenMenu,
  onToggleAbout,
  onSelectImage,
  onCloseImage,
  onNavigate,
}: {
  theme: string;
  menuOpen: boolean;
  aboutExpanded: boolean;
  activeImage: string | null;
  onToggleTheme: () => void;
  onOpenAccount: () => void;
  onOpenMenu: () => void;
  onToggleAbout: () => void;
  onSelectImage: (image: string) => void;
  onCloseImage: () => void;
  onNavigate: (path: string) => void;
}) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <HeroSection
        theme={theme}
        menuOpen={menuOpen}
        onToggleTheme={onToggleTheme}
        onOpenAccount={onOpenAccount}
        onOpenMenu={onOpenMenu}
        onNavigate={onNavigate}
      />
      <AboutSection expanded={aboutExpanded} onToggleExpanded={onToggleAbout} />
      <ServicesSection onNavigate={onNavigate} />
      <FeaturedClassesSection onNavigate={onNavigate} />
      <GallerySection onSelectImage={onSelectImage} />
      <ReadonlyScheduleSection />
      <ContactSection />

      {activeImage && (
        <ImageLightbox image={activeImage} onClose={onCloseImage} />
      )}
    </main>
  );
}

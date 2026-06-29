import { AboutSection } from "./about-section";
import { ContactSection } from "./contact-section";
import { FeaturedClassesSection } from "./featured-classes-section";
import { GallerySection } from "./gallery-section";
import { HeroSection } from "./hero-section";
import { ImageLightbox } from "./image-lightbox";
import { MobileMenu } from "./mobile-menu";
import { ServicesSection } from "./services-section";

export function LandingPage({
  theme,
  menuOpen,
  aboutExpanded,
  activeImage,
  onToggleTheme,
  onOpenMenu,
  onCloseMenu,
  onToggleAbout,
  onSelectImage,
  onCloseImage,
}: {
  theme: string;
  menuOpen: boolean;
  aboutExpanded: boolean;
  activeImage: string | null;
  onToggleTheme: () => void;
  onOpenMenu: () => void;
  onCloseMenu: () => void;
  onToggleAbout: () => void;
  onSelectImage: (image: string) => void;
  onCloseImage: () => void;
}) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <HeroSection
        theme={theme}
        menuOpen={menuOpen}
        onToggleTheme={onToggleTheme}
        onOpenMenu={onOpenMenu}
      />
      <AboutSection expanded={aboutExpanded} onToggleExpanded={onToggleAbout} />
      <ServicesSection />
      <FeaturedClassesSection />
      <GallerySection onSelectImage={onSelectImage} />
      <ContactSection />

      {menuOpen && (
        <MobileMenu
          theme={theme}
          onToggleTheme={onToggleTheme}
          onClose={onCloseMenu}
        />
      )}

      {activeImage && (
        <ImageLightbox image={activeImage} onClose={onCloseImage} />
      )}
    </main>
  );
}

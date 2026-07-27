import { useTranslation } from "react-i18next";

import { ScrollReveal } from "@/components/site/scroll-reveal";
import { galleryImages } from "@/content/site-content";

function GalleryImages({
  onSelectImage,
  repeated = false,
}: {
  onSelectImage: (image: string) => void;
  repeated?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div
      className={repeated ? "gallery-carousel-copy flex shrink-0 gap-3" : "flex shrink-0 gap-3"}
      aria-hidden={repeated || undefined}
    >
      {galleryImages.map((image, index) => (
        <button
          key={`${image}-${index}`}
          type="button"
          className="group relative w-44 shrink-0 overflow-hidden rounded-xl transition duration-300 hover:z-10 hover:-translate-y-1 hover:scale-[1.04] hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-52"
          aria-label={repeated ? undefined : t("gallery.openImage", { count: index + 1 })}
          tabIndex={repeated ? -1 : undefined}
          onClick={() => onSelectImage(image)}
        >
          <img
            src={image}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-28 w-full object-cover grayscale transition duration-300 group-hover:scale-[1.03] group-hover:grayscale-0 sm:h-32"
          />
        </button>
      ))}
    </div>
  );
}

export function GallerySection({
  onSelectImage,
}: {
  onSelectImage: (image: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <section className="bg-muted/50 py-7">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <ScrollReveal>
          <h2 className="font-serif text-4xl sm:text-5xl">
            {t("gallery.title")}
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={100}>
          <div className="gallery-carousel mt-5 overflow-hidden py-2" dir="ltr">
            <div className="gallery-carousel-track flex w-max gap-3">
              <GalleryImages onSelectImage={onSelectImage} />
              <GalleryImages onSelectImage={onSelectImage} repeated />
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

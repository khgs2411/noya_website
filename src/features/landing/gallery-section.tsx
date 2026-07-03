import { useTranslation } from "react-i18next";

import { galleryImages } from "@/content/site-content";

export function GallerySection({
  onSelectImage,
}: {
  onSelectImage: (image: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <section className="bg-muted/50 py-7">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <h2 className="font-serif text-4xl sm:text-5xl">
          {t("gallery.title")}
        </h2>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {galleryImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              className="group relative overflow-hidden rounded-xl transition duration-300 hover:z-10 hover:-translate-y-1 hover:scale-[1.04] hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={t("gallery.openImage", { count: index + 1 })}
              onClick={() => onSelectImage(image)}
            >
              <img
                src={image}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-28 w-full object-cover grayscale transition duration-300 group-hover:scale-[1.03] group-hover:grayscale-0"
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

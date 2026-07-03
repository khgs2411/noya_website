import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

export function ImageLightbox({
  image,
  onClose,
}: {
  image: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("gallery.preview")}
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/86 p-4 backdrop-blur-sm"
    >
      <button
        type="button"
        className="absolute inset-0"
        aria-label={t("actions.close")}
        onClick={onClose}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute end-4 top-4 z-10 size-12 rounded-full bg-background/86 text-foreground hover:bg-background [&_svg]:!size-6"
        aria-label={t("actions.close")}
        onClick={onClose}
      >
        <X aria-hidden="true" />
      </Button>
      <img
        src={image}
        alt={t("gallery.preview")}
        loading="eager"
        decoding="async"
        className="relative max-h-[88vh] max-w-[92vw] rounded-xl object-contain shadow-2xl"
      />
    </div>
  );
}

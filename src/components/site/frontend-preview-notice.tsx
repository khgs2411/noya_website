import { useTranslation } from "react-i18next";

export function FrontendPreviewNotice() {
  const { t } = useTranslation();

  return (
    <aside className="border-b border-blush-strong/40 bg-background px-5 py-3 text-foreground">
      <div className="mx-auto max-w-6xl text-sm leading-relaxed">
        <p className="font-semibold">{t("frontendPreview.title")}</p>
        <p>{t("frontendPreview.body")}</p>
      </div>
    </aside>
  );
}

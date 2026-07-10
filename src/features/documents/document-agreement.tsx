import { ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

type DocumentAgreementProps = {
  checked: boolean;
  labelKey: string;
  linkLabelKey: string;
  documentPath: string;
  disabled?: boolean;
  error?: string | null;
  className?: string;
  onCheckedChange: (checked: boolean) => void;
};

export function DocumentAgreement({
  checked,
  labelKey,
  linkLabelKey,
  documentPath,
  disabled = false,
  error = null,
  className,
  onCheckedChange,
}: DocumentAgreementProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "grid gap-2 rounded-xl border border-blush/24 bg-background/46 p-3 text-sm",
        className,
      )}
    >
      <label className="flex min-w-0 items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 size-4 shrink-0 accent-blush-strong"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onCheckedChange(event.target.checked)}
        />
        <span className="min-w-0 leading-6 text-foreground/72">
          {t(labelKey)}{" "}
          <a
            className="inline-flex items-center gap-1 font-semibold text-blush-strong underline-offset-4 hover:underline"
            href={documentPath}
            target="_blank"
            rel="noreferrer"
          >
            {t(linkLabelKey)}
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
        </span>
      </label>
      {error && <p className="text-sm leading-6 text-blush-strong">{error}</p>}
    </div>
  );
}

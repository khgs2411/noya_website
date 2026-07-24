import {
  getGoogleMapsNavigationLink,
  getWazeNavigationLink,
  type LocationSnapshot,
} from "@class-kit/react";
import { MapPin, Navigation } from "lucide-react";
import { useTranslation } from "react-i18next";

type LocationDisplayProps = {
  text: string | null | undefined;
  snapshot: LocationSnapshot | null | undefined;
  variant: "compact" | "detailed";
  className?: string;
};

function getLocationDisplayText(
  text: string | null | undefined,
  snapshot: LocationSnapshot | null | undefined,
) {
  return text?.trim() || snapshot?.label || null;
}

function isSafeHttpsUrl(value: string | null): value is string {
  if (!value) return false;

  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function LocationDisplay({
  text,
  snapshot,
  variant,
  className,
}: LocationDisplayProps) {
  const { t } = useTranslation();
  const displayText = getLocationDisplayText(text, snapshot);

  if (!displayText) return null;

  if (variant === "compact") {
    return (
      <p className={className ?? "flex items-start gap-2 text-sm text-foreground/68"}>
        <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span className="break-words">{displayText}</span>
      </p>
    );
  }

  const googleMapsLink = getGoogleMapsNavigationLink(snapshot, displayText);
  const wazeLink = getWazeNavigationLink(snapshot, displayText);

  return (
    <div className={className ?? "grid gap-3"}>
      <p className="flex items-start gap-2 break-words text-foreground/72">
        <MapPin className="mt-0.5 size-4 shrink-0 text-blush-strong" aria-hidden="true" />
        <span>{displayText}</span>
      </p>
      {(googleMapsLink || wazeLink) && (
        <div className="flex flex-wrap gap-2">
          {googleMapsLink && (
            <a
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-blush/24 px-3 py-2 text-xs font-semibold text-foreground/72 transition-colors hover:border-blush-strong hover:bg-blush-strong/10"
              href={googleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("location.googleMapsAria", { location: displayText })}
            >
              <Navigation className="size-3.5" aria-hidden="true" />
              {t("location.googleMaps")}
            </a>
          )}
          {wazeLink && (
            <a
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-blush/24 px-3 py-2 text-xs font-semibold text-foreground/72 transition-colors hover:border-blush-strong hover:bg-blush-strong/10"
              href={wazeLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("location.wazeAria", { location: displayText })}
            >
              <Navigation className="size-3.5" aria-hidden="true" />
              {t("location.waze")}
            </a>
          )}
        </div>
      )}
      {snapshot && snapshot.attributions.length > 0 && (
        <div className="grid gap-1 border-t border-blush/18 pt-3 text-xs leading-5 text-foreground/56">
          <p className="font-semibold text-foreground/64">{t("location.attribution")}</p>
          {snapshot.attributions.map((attribution, index) =>
            isSafeHttpsUrl(attribution.url) ? (
              <a
                key={`${attribution.text}-${index}`}
                className="w-fit break-words underline underline-offset-2 hover:text-foreground"
                href={attribution.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {attribution.text}
              </a>
            ) : (
              <p key={`${attribution.text}-${index}`} className="break-words">
                {attribution.text}
              </p>
            ),
          )}
        </div>
      )}
    </div>
  );
}

import type { ClassKitClient, LocationSnapshot } from "@class-kit/react";
import { Loader2, MapPin } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  type LocationDraft,
  selectLocationDraftSnapshot,
  updateLocationDraftText,
} from "@/features/locations/location-draft";
import { cn } from "@/lib/utils";

type AutocompleteResponse = {
  draft: LocationDraft;
  locale: string;
  query: string;
  suggestions: LocationSnapshot[];
  status: "empty" | "unavailable" | null;
};

type LocationAutocompleteFieldProps = {
  client: ClassKitClient | null;
  canAutocompleteLocations: boolean;
  locale: string;
  draft: LocationDraft;
  onChange: (draft: LocationDraft) => void;
};

function normalizeLocationLocale(locale: string) {
  const language = locale.split("-")[0]?.toLowerCase();
  return language === "he" || language === "ru" ? language : "en";
}

function isEligibleQuery(query: string) {
  const length = Array.from(query.trim()).length;
  return length >= 2 && length <= 200;
}

export function LocationAutocompleteField({
  client,
  canAutocompleteLocations,
  locale,
  draft,
  onChange,
}: LocationAutocompleteFieldProps) {
  const { t } = useTranslation();
  const inputId = useId();
  const listboxId = `${inputId}-suggestions`;
  const statusId = `${inputId}-status`;
  const requestIdRef = useRef(0);
  const [response, setResponse] = useState<AutocompleteResponse | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const query = draft.text.trim();
  const normalizedLocale = normalizeLocationLocale(locale);
  const queryIsEligible = isEligibleQuery(query);
  const responseMatchesQuery =
    response?.draft === draft &&
    response.locale === normalizedLocale &&
    response.query === query &&
    !draft.snapshot
      ? response
      : null;
  const suggestions = responseMatchesQuery?.suggestions ?? [];
  const isLoading =
    queryIsEligible &&
    !draft.snapshot &&
    Boolean(client && canAutocompleteLocations) &&
    !responseMatchesQuery;
  const unavailable =
    queryIsEligible &&
    !draft.snapshot &&
    (!client || !canAutocompleteLocations || responseMatchesQuery?.status === "unavailable");
  const empty = responseMatchesQuery?.status === "empty";
  const isOpen = open && suggestions.length > 0;

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (draft.snapshot || !queryIsEligible || !client || !canAutocompleteLocations) return;

    const timeoutId = window.setTimeout(() => {
      void client.management.locations
        .autocomplete({
          query,
          limit: 5,
          language: normalizedLocale,
        })
        .then((result) => {
          if (requestIdRef.current !== requestId) return;

          if (result.availability === "temporarily_unavailable") {
            setResponse({
              draft,
              locale: normalizedLocale,
              query,
              suggestions: [],
              status: "unavailable",
            });
            return;
          }

          setResponse({
            draft,
            locale: normalizedLocale,
            query,
            suggestions: result.suggestions,
            status: result.suggestions.length === 0 ? "empty" : null,
          });
          setOpen(result.suggestions.length > 0);
        })
        .catch(() => {
          if (requestIdRef.current !== requestId) return;
          setResponse({
            draft,
            locale: normalizedLocale,
            query,
            suggestions: [],
            status: "unavailable",
          });
        });
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
      requestIdRef.current += 1;
    };
  }, [
    canAutocompleteLocations,
    client,
    draft,
    normalizedLocale,
    query,
    queryIsEligible,
  ]);

  function selectSuggestion(snapshot: LocationSnapshot) {
    requestIdRef.current += 1;
    setResponse(null);
    setActiveIndex(-1);
    setOpen(false);
    onChange(selectLocationDraftSnapshot(snapshot));
  }

  function moveActiveIndex(direction: 1 | -1) {
    if (suggestions.length === 0) return;
    setOpen(true);
    setActiveIndex((current) => {
      const next = current + direction;
      if (next < 0) return suggestions.length - 1;
      return next % suggestions.length;
    });
  }

  function updateText(text: string) {
    requestIdRef.current += 1;
    setResponse(null);
    setActiveIndex(-1);
    setOpen(false);
    onChange(updateLocationDraftText(draft, text));
  }

  return (
    <div className="grid gap-2">
      <label className="block text-sm text-foreground/68" htmlFor={inputId}>
        <span>{t("location.fieldLabel")}</span>
      </label>
      <div className="relative">
        <input
          id={inputId}
          className="min-h-11 w-full rounded-xl border border-blush/24 bg-background/70 px-3 pe-10 text-foreground outline-none focus:border-blush-strong focus-visible:ring-2 focus-visible:ring-blush-strong/55"
          type="text"
          value={draft.text}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={isOpen}
          aria-activedescendant={
            isOpen && activeIndex >= 0
              ? `${inputId}-option-${activeIndex}`
              : undefined
          }
          aria-describedby={statusId}
          onChange={(event) => updateText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              moveActiveIndex(1);
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              moveActiveIndex(-1);
            } else if (event.key === "Enter" && isOpen && activeIndex >= 0) {
              event.preventDefault();
              selectSuggestion(suggestions[activeIndex]);
            } else if (event.key === "Escape") {
              setOpen(false);
              setActiveIndex(-1);
            }
          }}
        />
        {isLoading && (
          <Loader2
            className="pointer-events-none absolute inset-y-0 end-3 my-auto size-4 animate-spin text-blush-strong"
            aria-hidden="true"
          />
        )}
        {isOpen && (
          <ul
            id={listboxId}
            role="listbox"
            aria-label={t("location.suggestionsLabel")}
            className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-blush/24 bg-card p-1 shadow-soft"
          >
            {suggestions.map((suggestion, index) => (
              <li
                id={`${inputId}-option-${index}`}
                key={`${suggestion.provider.reference}-${suggestion.label}`}
                role="option"
                aria-selected={index === activeIndex}
                className={cn(
                  "cursor-pointer rounded-lg px-3 py-2 text-start text-sm text-foreground transition-colors hover:bg-blush-strong/10",
                  index === activeIndex && "bg-blush-strong/10",
                )}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectSuggestion(suggestion)}
              >
                <span className="block break-words font-semibold">{suggestion.label}</span>
                {suggestion.formatted_address !== suggestion.label && (
                  <span className="mt-0.5 block break-words text-xs text-foreground/58">
                    {suggestion.formatted_address}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <p id={statusId} className="min-h-5 text-xs leading-5 text-foreground/56" aria-live="polite">
        {isLoading && t("location.loading")}
        {empty && t("location.empty")}
        {unavailable && t("location.unavailable")}
        {!isLoading && !empty && !unavailable && t("location.freeTextHint")}
      </p>
      {draft.snapshot && (
        <div className="rounded-xl border border-blush/18 bg-background/46 p-3 text-xs leading-5 text-foreground/64">
          <p className="flex items-center gap-2 font-semibold text-foreground/76">
            <MapPin className="size-4 shrink-0 text-blush-strong" aria-hidden="true" />
            {t("location.selected")}
          </p>
          {draft.snapshot.attributions.length > 0 && (
            <p className="mt-1 break-words">
              {draft.snapshot.attributions.map((attribution) => attribution.text).join(" · ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

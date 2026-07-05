import { lessonsPath } from "@/content/site-content";
import type { VisibleRange } from "@/features/classes/class-range";

export const signupQueryParam = "signup";

export type ResolvedSignupFilter =
  | { type: "range"; range: VisibleRange }
  | { type: "unsupported" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isIsoDateRange(value: unknown): value is VisibleRange {
  if (!isRecord(value)) return false;

  return typeof value.start === "string" && typeof value.end === "string";
}

export function getSignupSlugFromSearch(search: string) {
  return new URLSearchParams(search).get(signupQueryParam);
}

export function getSignupLinkUrl(slug: string) {
  const url = new URL(
    `${import.meta.env.BASE_URL}${lessonsPath}`,
    window.location.origin,
  );
  url.searchParams.set(signupQueryParam, slug);
  return url.toString();
}

export function getRangeSignupFilters(range: VisibleRange) {
  return { range };
}

export function resolveSignupFilters(
  filters: Record<string, unknown>,
): ResolvedSignupFilter {
  if (isIsoDateRange(filters.range)) {
    return { type: "range", range: filters.range };
  }

  return { type: "unsupported" };
}

export const termsAcceptanceVersionKey = "terms_accepted_version";

export function getTermsAcceptanceVersion(
  metadata: Record<string, unknown> | null | undefined,
) {
  const value = metadata?.[termsAcceptanceVersionKey];
  return Number.isInteger(value) && typeof value === "number" && value > 0
    ? value
    : null;
}

export function hasAcceptedTerms(
  metadata: Record<string, unknown> | null | undefined,
  version: number,
) {
  return getTermsAcceptanceVersion(metadata) === version;
}

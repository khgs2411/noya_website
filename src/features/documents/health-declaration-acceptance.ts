export const healthDeclarationAcceptanceVersionKey =
  "health_declaration_accepted_version";

export function getHealthDeclarationAcceptanceVersion(
  metadata: Record<string, unknown> | null | undefined,
) {
  const value = metadata?.[healthDeclarationAcceptanceVersionKey];
  return Number.isInteger(value) && typeof value === "number" && value > 0
    ? value
    : null;
}

export function hasAcceptedHealthDeclaration(
  metadata: Record<string, unknown> | null | undefined,
  version: number,
) {
  return getHealthDeclarationAcceptanceVersion(metadata) === version;
}

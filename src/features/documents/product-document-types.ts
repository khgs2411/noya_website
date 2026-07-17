export const productDocumentTypes = {
  terms: "terms",
  healthDeclaration: "health_declaration",
} as const;

export type ProductDocumentType =
  (typeof productDocumentTypes)[keyof typeof productDocumentTypes];

export const productDocumentFallbackLocale = "en";

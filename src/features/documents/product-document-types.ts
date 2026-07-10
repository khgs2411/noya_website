export const productDocumentTypes = {
  terms: "terms",
} as const;

export type ProductDocumentType =
  (typeof productDocumentTypes)[keyof typeof productDocumentTypes];

export const productDocumentFallbackLocale = "en";

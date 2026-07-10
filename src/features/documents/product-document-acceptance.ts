import type { ClassKitClient } from "@class-kit/react";

import {
  productDocumentFallbackLocale,
  type ProductDocumentType,
} from "@/features/documents/product-document-types";

export async function acceptProductDocument(
  client: ClassKitClient,
  documentType: ProductDocumentType,
  locale: string,
  context: string,
) {
  return client.productDocuments.accept(documentType, {
    locale,
    fallbackLocale: productDocumentFallbackLocale,
    context,
  });
}

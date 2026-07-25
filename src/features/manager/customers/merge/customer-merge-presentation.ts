import type {
  Customer,
  CustomerMergeAllowedSelection,
  CustomerMergeFieldResolutionsInput,
  CustomerMergeJsonValue,
  CustomerMergePreview,
  CustomerMergeSelection,
} from "@class-kit/react";

export type MergeResolutionDraft = {
  selection?: CustomerMergeSelection;
  replacement?: string;
};

export type MergeResolutionDrafts = {
  displayName?: MergeResolutionDraft;
  contactEmail?: MergeResolutionDraft;
  phoneNumber?: MergeResolutionDraft;
  metadata: Record<string, MergeResolutionDraft>;
};

export function isEligibleMergeSource(customer: Customer) {
  return customer.status === "active"
    && customer.customerOrigin === "manager_created"
    && customer.userId === null
    && customer.identityStatus === "unlinked";
}

export function getMergeSurvivorAvailability(sourceCustomerId: string, candidate: Customer) {
  if (candidate.customerId === sourceCustomerId) return { selectable: false, reason: "source" as const };
  if (candidate.userId === null || candidate.identityStatus !== "linked") return { selectable: false, reason: "unlinked" as const };
  return { selectable: true };
}

export function parseMergeJsonValue(value: string): { value?: CustomerMergeJsonValue; error?: "invalid_json" } {
  try {
    const parsed: unknown = JSON.parse(value);
    if (isJsonValue(parsed)) return { value: parsed };
  } catch {
    // The UI presents the parse error rather than sending an invalid value.
  }
  return { error: "invalid_json" };
}

function isJsonValue(value: unknown): value is CustomerMergeJsonValue {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.every(isJsonValue);
  return typeof value === "object" && Object.values(value).every(isJsonValue);
}

function scalarResolution(
  field: "displayName" | "contactEmail" | "phoneNumber",
  draft: MergeResolutionDraft | undefined,
  allowedSelections: CustomerMergeAllowedSelection[],
): { value?: { selection: "source" | "survivor" | "replacement"; value?: string | null }; valid: boolean } {
  if (!draft?.selection || !allowedSelections.includes(draft.selection)) return { valid: false };
  if (draft.selection !== "replacement") return { value: { selection: draft.selection }, valid: true };
  const replacement = draft.replacement?.trim() || null;
  return { value: { selection: "replacement", value: replacement }, valid: isValidMergeScalarReplacement(field, replacement) };
}

export function isValidMergeScalarReplacement(
  field: "displayName" | "contactEmail" | "phoneNumber",
  value: string | null,
) {
  if (value === null || field === "displayName") return true;
  if (field === "contactEmail") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  return /^[+()\-\s\d]{3,}$/.test(value);
}

export function buildMergeFieldResolutions(
  preview: CustomerMergePreview,
  drafts: MergeResolutionDrafts,
): { value?: CustomerMergeFieldResolutionsInput; invalidScalarFields?: string[]; invalidMetadataKeys: string[] } {
  const displayName = scalarResolution("displayName", drafts.displayName, preview.fieldComparisons.displayName.allowedSelections);
  const contactEmail = scalarResolution("contactEmail", drafts.contactEmail, preview.fieldComparisons.contactEmail.allowedSelections);
  const phoneNumber = scalarResolution("phoneNumber", drafts.phoneNumber, preview.fieldComparisons.phoneNumber.allowedSelections);
  const invalidMetadataKeys: string[] = [];
  const invalidScalarFields = ([
    ["displayName", displayName],
    ["contactEmail", contactEmail],
    ["phoneNumber", phoneNumber],
  ] as const).filter(([, resolution]) => !resolution.valid).map(([field]) => field);
  const conflicts: CustomerMergeFieldResolutionsInput["metadata"]["conflicts"] = {};

  for (const conflict of preview.fieldComparisons.metadata.conflicts) {
    const draft = drafts.metadata[conflict.key];
    if (!draft?.selection || !conflict.allowedSelections.includes(draft.selection)) {
      invalidMetadataKeys.push(conflict.key);
      continue;
    }
    if (draft.selection === "replacement") {
      const parsed = parseMergeJsonValue(draft.replacement ?? "");
      if (parsed.error) {
        invalidMetadataKeys.push(conflict.key);
        continue;
      }
      conflicts[conflict.key] = { selection: "replacement", value: parsed.value! };
    } else {
      conflicts[conflict.key] = { selection: draft.selection };
    }
  }

  if (invalidScalarFields.length || invalidMetadataKeys.length) {
    return { invalidScalarFields, invalidMetadataKeys };
  }

  return {
    value: {
      displayName: displayName.value! as CustomerMergeFieldResolutionsInput["displayName"],
      contactEmail: contactEmail.value! as CustomerMergeFieldResolutionsInput["contactEmail"],
      phoneNumber: phoneNumber.value! as CustomerMergeFieldResolutionsInput["phoneNumber"],
      metadata: { conflicts },
    },
    invalidScalarFields,
    invalidMetadataKeys,
  };
}

export function formatMergeJsonValue(value: CustomerMergeJsonValue) {
  return JSON.stringify(value, null, 2);
}

export function knownMergeOutcomeKey(value: string) {
  const known = new Set([
    "no_active_membership", "source_membership_moved", "survivor_membership_preserved", "linked_customer_membership_preserved",
    "approved_over_pending", "earliest_pending", "survivor_approved",
  ]);
  return known.has(value) ? value : null;
}

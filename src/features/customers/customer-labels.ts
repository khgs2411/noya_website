export type CustomerPresentationInput = {
  displayName: string | null | undefined;
  contactEmail: string | null | undefined;
  phoneNumber: string | null | undefined;
  customerOrigin: string | null | undefined;
};

function clean(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed || null;
}

export function getCustomerLabel(
  customer: CustomerPresentationInput,
  unnamedLabel: string,
) {
  return (
    clean(customer.displayName) ??
    clean(customer.contactEmail) ??
    clean(customer.phoneNumber) ??
    unnamedLabel
  );
}

export function getCustomerContact(customer: CustomerPresentationInput) {
  return clean(customer.contactEmail) ?? clean(customer.phoneNumber);
}

export function getCustomerInitials(
  customer: CustomerPresentationInput,
  unnamedLabel: string,
) {
  const parts = getCustomerLabel(customer, unnamedLabel)
    .split(/\s+/)
    .filter(Boolean);

  return parts.length > 1
    ? `${parts[0][0]}${parts.at(-1)![0]}`.toUpperCase()
    : (parts[0]?.slice(0, 2).toUpperCase() ?? "?");
}

export function getCustomerOriginKey(customerOrigin: string | null | undefined) {
  switch (customerOrigin) {
    case "manager_created":
      return "managerCreated";
    case "signup":
      return "signup";
    default:
      return "other";
  }
}

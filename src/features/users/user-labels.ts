type UserIdentity = {
  user_id?: string | null;
  id?: string | null;
  display_name?: string | null;
  displayName?: string | null;
  email?: string | null;
  phone_number?: string | null;
  phoneNumber?: string | null;
};

export function getUserDisplayName(user?: UserIdentity | null) {
  return user?.display_name ?? user?.displayName ?? user?.email ?? user?.user_id ?? user?.id ?? "";
}

export function getUserSupportingEmail(user?: UserIdentity | null) {
  const displayName = user?.display_name ?? user?.displayName;
  const email = user?.email ?? null;
  return displayName && email ? email : null;
}

export function getUserPhoneNumber(user?: UserIdentity | null) {
  return user?.phone_number ?? user?.phoneNumber ?? null;
}

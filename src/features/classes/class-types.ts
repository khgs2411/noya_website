type RegistrationStatusValue = "pending" | "approved" | "rejected" | "cancelled";
type ClassTemporalStatusValue = "upcoming" | "started" | "ended" | "cancelled";
type ClassLifecycleStatusValue =
  | "created"
  | "cancelled"
  | "in_progress"
  | "completed";
type MembershipRequirementValue = "none" | "required";
type RegistrationPolicyValue =
  | "auto_approve"
  | "member_auto_approve"
  | "approval_required";

export type ClassViewItem = {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  startsAt: string;
  endsAt: string;
  location: string | null;
  capacity: number;
  registeredUsersCount?: number;
  membershipRequirement?: MembershipRequirementValue;
  cancellationCutoffHours?: number;
  registrationPolicy?: RegistrationPolicyValue;
  registrationOpen?: boolean;
  pendingRegistrationCount?: number;
  canRegister?: boolean;
  canCancelRegistration?: boolean;
  userRegistrationState?: { id: string; status: RegistrationStatusValue } | null;
  temporalStatus?: ClassTemporalStatusValue;
  lifecycleStatus?: ClassLifecycleStatusValue;
  statusLabel?: string;
  capacityLabel?: string;
};

export type ClassViewDateGroup = {
  dateKey: string;
  label: string;
  items: ClassViewItem[];
};

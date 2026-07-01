type RegistrationStatusValue = "pending" | "approved" | "rejected" | "cancelled";
type ClassTemporalStatusValue = "upcoming" | "started" | "ended" | "cancelled";

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
  registrationOpen?: boolean;
  canRegister?: boolean;
  canCancelRegistration?: boolean;
  userRegistrationState?: { id: string; status: RegistrationStatusValue } | null;
  temporalStatus?: ClassTemporalStatusValue;
  statusLabel?: string;
  capacityLabel?: string;
};

export type ClassViewDateGroup = {
  dateKey: string;
  label: string;
  items: ClassViewItem[];
};

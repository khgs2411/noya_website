import { useProductContext } from "@class-kit/react";

import { PendingRegistrationsPanel } from "@/features/manager/registrations/pending-registrations-panel";

type PendingRegistrationManagementTabProps = {
  canManageRegistrations: boolean;
};

export function PendingRegistrationManagementTab({
  canManageRegistrations,
}: PendingRegistrationManagementTabProps) {
  const { client } = useProductContext();

  return (
    <section className="rounded-[1.4rem] border border-blush/24 bg-card/78 p-4 shadow-soft sm:p-5">
      <PendingRegistrationsPanel
        client={client}
        canManageRegistrations={canManageRegistrations}
      />
    </section>
  );
}

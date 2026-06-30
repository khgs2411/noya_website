import type { ManagedClass } from "@class-kit/react";

import { ClassCard } from "@/features/manager/classes/class-card";

type ClassDateGroup = {
  dateKey: string;
  label: string;
  classes: ManagedClass[];
};

type ClassListViewProps = {
  groups: ClassDateGroup[];
  selectedClassId: string | null;
  canManageClasses: boolean;
  isMutating: boolean;
  onSelectClass: (classId: string) => void;
  onPublishClass: (classId: string) => void;
  onDraftClass: (classId: string) => void;
};

export function ClassListView({
  groups,
  selectedClassId,
  canManageClasses,
  isMutating,
  onSelectClass,
  onPublishClass,
  onDraftClass,
}: ClassListViewProps) {
  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) => (
        <section key={group.dateKey} className="flex flex-col gap-3">
          <h2 className="font-serif text-2xl text-foreground">{group.label}</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {group.classes.map((managedClass) => (
              <ClassCard
                key={managedClass.id}
                managedClass={managedClass}
                canManageClasses={canManageClasses}
                isSelected={managedClass.id === selectedClassId}
                isMutating={isMutating}
                onSelect={onSelectClass}
                onPublish={onPublishClass}
                onDraft={onDraftClass}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

// Retiring a template or schedule does not retire its concrete classes.
// Only the class's authoritative lifecycle determines whether it is cancelled.
export function isCancelledClass(managedClass: {
  lifecycle_status?: string;
  temporal_status: string;
}) {
  return managedClass.lifecycle_status === "cancelled" ||
    managedClass.temporal_status === "cancelled";
}

function isArchivedSchedule(schedule: { status: string }) {
  return schedule.status === "archived";
}

export function isDeletableRecord(...[kind, record]:
  | [kind: "classes", record: { lifecycle_status?: string; temporal_status: string }]
  | [kind: "schedules", record: { status: string }]
  | [kind: "customers", record: { status: string }]
) {
  if (kind === "classes") return isCancelledClass(record);
  if (kind === "schedules") return isArchivedSchedule(record);
  return record.status === "inactive";
}

export function getVisibleTemplates<T extends { status: string }>(
  templates: readonly T[],
  showInactive: boolean,
) {
  return templates.filter((template) => showInactive || template.status === "active");
}

export function getVisibleSchedules<T extends { status: string }>(
  schedules: readonly T[],
  showArchived: boolean,
) {
  return schedules.filter((schedule) => showArchived || !isArchivedSchedule(schedule));
}

export function getVisibleManagedClasses<T extends {
  lifecycle_status?: string;
  temporal_status: string;
}>(classes: readonly T[], showCancelled: boolean) {
  return classes.filter((managedClass) => showCancelled || !isCancelledClass(managedClass));
}

export function getVisibleLessons<T extends { temporalStatus: string }>(classes: readonly T[]) {
  return classes.filter((lesson) => lesson.temporalStatus !== "cancelled");
}

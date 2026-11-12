export function isScheduleTemplateChange(
  schedule: { template_id: string } | null,
  templateId: string,
): boolean {
  return schedule !== null && schedule.template_id !== templateId;
}

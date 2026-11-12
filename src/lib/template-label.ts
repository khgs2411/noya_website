export function getTemplateLabel(template: {
  name: string;
  default_location_snapshot?: { label: string } | null;
  default_location?: string | null;
}) {
  const location = template.default_location_snapshot?.label.trim() ||
    template.default_location?.trim();
  return location ? `${template.name} - ${location}` : template.name;
}

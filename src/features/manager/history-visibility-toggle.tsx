type HistoryVisibilityToggleProps = {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
};

export function HistoryVisibilityToggle({
  checked,
  label,
  onChange,
}: HistoryVisibilityToggleProps) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-foreground/68">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

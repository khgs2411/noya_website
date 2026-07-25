import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { ClassViewItem } from "@/features/classes/class-types";
import { cn } from "@/lib/utils";

type ClassRegistrationStatusProps = {
  status: NonNullable<ClassViewItem["userRegistrationState"]>["status"] | null | undefined;
  compact?: boolean;
  className?: string;
};

export function ClassRegistrationStatus({
  status,
  compact = false,
  className,
}: ClassRegistrationStatusProps) {
  const { t } = useTranslation();

  if (!status) return null;

  const Icon = status === "pending" ? Clock3 : status === "approved" ? CheckCircle2 : XCircle;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-blush-strong/45 bg-blush-strong/10 font-semibold text-blush-strong",
        compact
          ? "px-2 py-0.5 text-[0.66rem]"
          : "px-3 py-1 text-xs",
        className,
      )}
    >
      <Icon
        className={cn("shrink-0", compact ? "size-3" : "size-3.5")}
        aria-hidden="true"
      />
      {t(`classes.registrationStatus.${status}`)}
    </span>
  );
}

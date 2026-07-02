import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant?: "success" | "info" | "error";
};

type ToastStackProps = {
  toasts: ToastItem[];
  dir: "ltr" | "rtl";
  onDismiss: (toastId: string) => void;
};

export function ToastStack({ toasts, dir, onDismiss }: ToastStackProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-3 top-3 z-[70] grid gap-2 sm:inset-x-auto sm:w-96 md:bottom-4 md:top-auto",
        dir === "rtl" ? "md:right-4" : "md:left-4",
      )}
      dir={dir}
      aria-live="polite"
      aria-relevant="additions text"
    >
      {toasts.map((toast) => {
        const Icon =
          toast.variant === "error"
            ? AlertCircle
            : toast.variant === "info"
              ? Info
              : CheckCircle2;

        return (
          <div
            key={toast.id}
            className={cn(
              "grid grid-cols-[auto_1fr_auto] items-start gap-3 rounded-xl border bg-card/95 p-4 text-foreground shadow-soft backdrop-blur",
              toast.variant === "error" ? "border-blush-strong/55" : "border-blush/28",
            )}
            role="status"
          >
            <Icon className="mt-0.5 size-5 shrink-0 text-blush-strong" aria-hidden="true" />
            <div className="min-w-0">
              <p className="font-serif text-lg leading-6">{toast.title}</p>
              {toast.description && (
                <p className="mt-1 text-sm leading-5 text-foreground/68">
                  {toast.description}
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 rounded-full"
              aria-label="Close"
              onClick={() => onDismiss(toast.id)}
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}

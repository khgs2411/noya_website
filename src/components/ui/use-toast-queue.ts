import { useCallback, useEffect, useRef, useState } from "react";

import type { ToastItem } from "@/components/ui/toast";

const TOAST_DURATION_MS = 4200;

export function useToastQueue() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeoutsRef = useRef(new Map<string, number>());

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeouts.clear();
    };
  }, []);

  const dismissToast = useCallback((toastId: string) => {
    const timeoutId = timeoutsRef.current.get(toastId);
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
      timeoutsRef.current.delete(toastId);
    }
    setToasts((current) => current.filter((toast) => toast.id !== toastId));
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastItem, "id">) => {
      const toastId = crypto.randomUUID();
      setToasts((current) => [...current.slice(-2), { ...toast, id: toastId }]);
      timeoutsRef.current.set(
        toastId,
        window.setTimeout(() => dismissToast(toastId), TOAST_DURATION_MS),
      );
    },
    [dismissToast],
  );

  return { toasts, showToast, dismissToast };
}

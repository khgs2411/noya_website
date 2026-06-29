import type { ReactNode } from "react";

export function TableCell({ children }: { children: ReactNode }) {
  return (
    <div className="border-e border-t border-blush/45 px-3 py-3 text-center text-sm sm:px-4 sm:text-base">
      {children}
    </div>
  );
}

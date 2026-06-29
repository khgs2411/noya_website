import type { ReactNode } from "react";

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="text-center">
      <h2 className="font-serif text-5xl leading-none">{children}</h2>
      <div className="mx-auto mt-2 h-0.5 w-28 bg-blush" />
    </div>
  );
}

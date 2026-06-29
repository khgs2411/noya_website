import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

export function PillLink({
  href,
  children,
  variant = "solid",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: "solid" | "outline";
  className?: string;
}) {
  return (
    <a
      href={href}
      className={`inline-flex h-12 items-center justify-center gap-5 rounded-full px-8 text-sm font-semibold uppercase tracking-[0.18em] transition ${
        variant === "solid"
          ? "bg-blush text-primary-foreground hover:bg-blush-strong"
          : "border border-blush bg-transparent text-blush-strong hover:bg-blush/10"
      } ${className}`}
    >
      {children}
      <ArrowRight className="size-5" />
    </a>
  );
}

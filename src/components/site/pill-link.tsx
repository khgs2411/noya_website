import { ArrowRight } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";

export function PillLink({
  href,
  children,
  variant = "solid",
  className = "",
  onNavigate,
}: {
  href: string;
  children: ReactNode;
  variant?: "solid" | "outline";
  className?: string;
  onNavigate?: (href: string) => void;
}) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      !onNavigate ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey ||
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      /^https?:\/\//.test(href)
    ) {
      return;
    }

    event.preventDefault();
    onNavigate(href);
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      className={`inline-flex h-12 items-center justify-center gap-5 rounded-full px-8 text-sm font-semibold uppercase tracking-[0.18em] transition ${
        variant === "solid"
          ? "bg-blush text-primary-foreground hover:bg-blush-strong"
          : "border border-blush bg-transparent text-blush-strong hover:bg-blush/10"
      } ${className}`}
    >
      {children}
      <ArrowRight
        className="size-5 rtl:rotate-180"
        aria-hidden="true"
      />
    </a>
  );
}

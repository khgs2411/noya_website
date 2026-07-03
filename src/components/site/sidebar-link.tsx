import { ArrowRight } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";

export function SidebarLink({
  href,
  onClick,
  onNavigate,
  children,
}: {
  href: string;
  onClick: () => void;
  onNavigate?: (href: string) => void;
  children: ReactNode;
}) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick();

    if (
      !onNavigate ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey ||
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
      className="group flex items-center justify-between rounded-[0.95rem] border border-blush/24 bg-background/52 px-3.5 py-2.5 text-lg font-serif text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-blush/45 hover:bg-background/78 hover:text-blush-strong hover:shadow-soft"
      onClick={handleClick}
    >
      <span>{children}</span>
      <ArrowRight
        className="size-3.5 opacity-45 transition group-hover:translate-x-1 group-hover:opacity-80 rtl:rotate-180 rtl:group-hover:-translate-x-1"
        aria-hidden="true"
      />
    </a>
  );
}

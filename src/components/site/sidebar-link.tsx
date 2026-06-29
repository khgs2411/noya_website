import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

export function SidebarLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className="group flex items-center justify-between rounded-[0.95rem] border border-blush/24 bg-background/52 px-3.5 py-2.5 text-lg font-serif text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-blush/45 hover:bg-background/78 hover:text-blush-strong hover:shadow-soft"
      onClick={onClick}
    >
      <span>{children}</span>
      <ArrowRight className="size-3.5 opacity-45 transition group-hover:translate-x-1 group-hover:opacity-80 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
    </a>
  );
}

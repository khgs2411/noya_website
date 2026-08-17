import type { ReactNode } from "react";

export function ContactLine({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <p className="flex items-center gap-4">
      <span className="shrink-0 text-blush-strong [&_svg]:size-5">{icon}</span>
      <span className="min-w-0 whitespace-pre-line">{text}</span>
    </p>
  );
}

export function ContactLink({
  href,
  icon,
  text,
  external = true,
}: {
  href: string;
  icon: ReactNode;
  text: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className="flex items-center gap-4 transition hover:text-blush-strong"
    >
      <span className="text-blush-strong [&_svg]:size-5">{icon}</span>
      <span>{text}</span>
    </a>
  );
}

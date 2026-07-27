import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type RevealDirection = "up" | "start" | "end";

const hiddenDirectionClasses: Record<RevealDirection, string> = {
  up: "translate-y-8",
  start: "ltr:-translate-x-8 rtl:translate-x-8",
  end: "ltr:translate-x-8 rtl:-translate-x-8",
};

function shouldRevealImmediately() {
  return (
    typeof window !== "undefined" &&
    (window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window))
  );
}

export function ScrollReveal({
  children,
  className,
  delay = 0,
  direction = "up",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: RevealDirection;
}) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(shouldRevealImmediately);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      {
        threshold: 0.12,
      },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={elementRef}
      data-scroll-reveal
      data-visible={visible}
      className={cn(
        "transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:translate-x-0 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none",
        visible
          ? "translate-x-0 translate-y-0 opacity-100"
          : cn(
            "opacity-0 will-change-[opacity,transform]",
            hiddenDirectionClasses[direction],
          ),
        className,
      )}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

import { useMemo } from "react";

export function MarkdownContent({ markdown }: { markdown: string }) {
  const blocks = useMemo(() => markdown.split(/\n{2,}/), [markdown]);

  return (
    <div className="grid gap-4 text-sm leading-7 text-foreground/74 sm:text-base sm:leading-8">
      {blocks.map((block, index) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={index} className="font-serif text-2xl text-foreground">
              {trimmed.slice(4)}
            </h3>
          );
        }

        if (trimmed.startsWith("## ")) {
          return (
            <h2 key={index} className="font-serif text-3xl text-foreground">
              {trimmed.slice(3)}
            </h2>
          );
        }

        if (trimmed.startsWith("# ")) {
          return (
            <h1 key={index} className="font-serif text-4xl text-foreground">
              {trimmed.slice(2)}
            </h1>
          );
        }

        const lines = trimmed.split("\n");
        if (lines.every((line) => line.trim().startsWith("- "))) {
          return (
            <ul key={index} className="grid list-disc gap-2 ps-6">
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>{line.trim().slice(2)}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={index} className="whitespace-pre-line [overflow-wrap:anywhere]">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

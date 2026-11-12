import { useEffect, useState } from "react";
import { useProductContext, type ClassSummary } from "@class-kit/react";
import { addDays, startOfLocalDay } from "@/features/classes/class-range";

type TimetableState =
  | { status: "loading" }
  | { status: "ready"; lessons: ClassSummary[]; now: Date }
  | { status: "error" };

export function useWeeklyTimetable() {
  const { client, error } = useProductContext();
  const [result, setResult] = useState<{ client: typeof client; state: TimetableState } | null>(null);

  useEffect(() => {
    if (!client) return;
    let cancelled = false;
    async function load() {
      const today = startOfLocalDay(new Date());
      try {
        const response = await client!.classes.list({
          range: { start: today.toISOString(), end: addDays(today, 14).toISOString() },
          fields: ["category"],
        });
        if (cancelled) return;
        setResult({ client, state: response.error
          ? { status: "error" }
          : { status: "ready", lessons: response.data.classes, now: new Date() } });
      } catch {
        if (!cancelled) setResult({ client, state: { status: "error" } });
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [client]);

  if (!client && error) return { status: "error" } as const;
  return result?.client === client ? result.state : { status: "loading" } as const;
}

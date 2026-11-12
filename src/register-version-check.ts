import { isFrontendPreview } from "./lib/frontend-preview";
import { shouldReload } from "./lib/stale-client";

const RELOADED_VERSION_KEY = "noya-reloaded-version";

export function registerVersionCheck() {
  if (import.meta.env.DEV || isFrontendPreview) return;

  async function checkVersion() {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}version.json`, {
        cache: "no-store",
      });
      if (!response.ok) return;

      const data = await response.json();
      const remote: unknown = data?.version;
      const alreadyReloadedFor = sessionStorage.getItem(RELOADED_VERSION_KEY);
      if (!shouldReload({ current: __APP_VERSION__, remote, alreadyReloadedFor })) return;

      // Persist before reloading; if storage fails, avoid an unguarded reload loop.
      sessionStorage.setItem(RELOADED_VERSION_KEY, remote as string);
      window.location.reload();
    } catch {
      // Offline, invalid responses, or unavailable storage leave the app usable.
    }
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void checkVersion();
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) void checkVersion();
  });
}

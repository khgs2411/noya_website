import { isFrontendPreview } from "./lib/frontend-preview";

export function registerServiceWorker() {
  if (isFrontendPreview) return;
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}service-worker.js`)
      .catch(() => undefined);
  });
}

export const STORAGE_NOTICE_KEY = "noya.browserStorageNoticeAccepted";
export const STORAGE_NOTICE_ACCEPTED_EVENT = "noya:browser-storage-notice-accepted";

export function hasAcceptedStorageNotice() {
  return window.localStorage.getItem(STORAGE_NOTICE_KEY) === "true";
}

export function acceptStorageNotice() {
  window.localStorage.setItem(STORAGE_NOTICE_KEY, "true");
  window.dispatchEvent(new Event(STORAGE_NOTICE_ACCEPTED_EVENT));
}

export function captureActiveElement() {
  const activeElement = document.activeElement;
  return activeElement instanceof HTMLElement ? activeElement : null;
}

export function restoreFocus(element: HTMLElement | null) {
  if (!element?.isConnected) return;

  window.setTimeout(() => {
    element.focus({ preventScroll: true });
  }, 0);
}

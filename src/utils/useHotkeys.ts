import { useEffect } from "react";

export interface HotkeyListeners {
  [key: string]: (ev: KeyboardEvent) => unknown;
}

export const useHotkeys = (listeners: HotkeyListeners) => {
  useEffect(() => {
    const handler = (ev: KeyboardEvent) => {
      const listener = listeners[ev.key];
      if (!listener) {
        return;
      }

      const target = ev.target as any;
      const isInput = target.nodeName === "INPUT" || target.isContentEditable;

      const presentations = document.querySelectorAll<HTMLDivElement>(
        '[role="presentation"]:not([aria-hidden="true"])',
      );
      const isBackdropOpen = [...presentations].some((presentation) => {
        return (
          presentation.dataset.shortcutIgnore !== "true" &&
          presentation.dataset.shortcut !== ev.key.toLowerCase()
        );
      });

      if (!isBackdropOpen && !isInput && listener) {
        ev.preventDefault();
        listener(ev);
      }
    };

    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
    };
  }, [listeners]);
};

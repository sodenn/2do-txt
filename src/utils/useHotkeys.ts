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

      const menus = document.querySelectorAll<HTMLDivElement>(
        '[role="listbox"]:not([style*="display: none"]),[role="menu"]',
      );
      const menuOpen = menus.length > 0;

      const presentations = document.querySelectorAll<HTMLDivElement>(
        '[role="presentation"]:not([aria-hidden="true"])',
      );
      const backdropOpen = [...presentations].some((presentation) => {
        const keepEnabled = presentation.dataset.hotkeysKeepEnabled;
        return keepEnabled !== "true" && keepEnabled !== ev.key.toLowerCase();
      });

      if (!menuOpen && !backdropOpen && !isInput && listener) {
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

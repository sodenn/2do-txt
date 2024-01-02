import { useEffect, useRef } from "react";

interface HotkeyListeners {
  [key: string]: (ev: KeyboardEvent) => unknown;
}

const isInputTarget = (target: any) =>
  !!target && (target.nodeName === "INPUT" || target.isContentEditable);

const isMenuOpen = () => {
  const menus = document.querySelectorAll<HTMLDivElement>(
    '[role="listbox"]:not([style*="display: none"]),[role="menu"]',
  );
  return menus.length > 0;
};

const isBackdropOpen = (ev: KeyboardEvent) => {
  const presentations = document.querySelectorAll<HTMLDivElement>(
    '[role="presentation"]:not([aria-hidden="true"])',
  );
  return [...presentations].some((presentation) => {
    const keepEnabled = presentation.dataset.hotkeysKeepEnabled;
    return keepEnabled !== "true" && keepEnabled !== ev.key.toLowerCase();
  });
};

export const useHotkeys = (listeners: HotkeyListeners) => {
  const listenersRef = useRef(listeners);

  // update listenersRef when listeners change
  useEffect(() => {
    listenersRef.current = listeners;
  }, [listeners]);

  useEffect(() => {
    const handler = (ev: KeyboardEvent) => {
      const listener = listenersRef.current[ev.key];
      if (!listener) {
        return;
      }

      const target = ev.target;

      if (
        !isMenuOpen() &&
        !isBackdropOpen(ev) &&
        !isInputTarget(target) &&
        listener
      ) {
        listener(ev);
      }
    };

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, []);
};

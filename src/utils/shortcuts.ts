import { useEffect, useMemo } from "react";
import useSideSheet from "../data/side-sheet-store";

interface ListenerMap {
  [key: string]: (ev: KeyboardEvent) => unknown;
}

export const useAddShortcutListener = (listeners: ListenerMap) => {
  useEffect(() => {
    const handler = (ev: KeyboardEvent) => {
      const listener = listeners[ev.key];
      if (!listener) {
        return;
      }

      const target = ev.target as any;
      const isInput = target.nodeName === "INPUT" || target.isContentEditable;

      const presentations = document.querySelectorAll<HTMLDivElement>(
        '[role="presentation"]'
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

export function useShortcuts() {
  const toggleSideSheet = useSideSheet((state) => state.toggleSideSheet);

  const shortcutListeners = useMemo(
    () => ({ m: toggleSideSheet }),
    [toggleSideSheet]
  );

  useAddShortcutListener(shortcutListeners);
}

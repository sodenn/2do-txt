import { useEffect } from "react";

export const useAddShortcutListener = (
  listener: (event: KeyboardEvent) => void,
  key: string,
  deps?: any[]
) => {
  useEffect(() => {
    const handler = (ev: KeyboardEvent) => {
      const sameKey = ev.key.toLowerCase() === key.toLowerCase();
      const target = ev.target as any;
      const isInput = target.nodeName === "INPUT" || target.isContentEditable;

      const presentations = document.querySelectorAll<HTMLDivElement>(
        '[role="presentation"]'
      );
      const isBackdropOpen = [...presentations].some((presentation) => {
        return (
          !!presentation &&
          presentation.dataset.shortcutsIgnore !== "true" &&
          !presentation.dataset.shortcuts
            ?.split(",")
            ?.includes(ev.key.toLowerCase())
        );
      });

      if (!isBackdropOpen && !isInput && sameKey) {
        ev.preventDefault();
        listener(ev);
      }
    };

    document.addEventListener("keydown", handler);

    return () => {
      document.removeEventListener("keydown", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, deps]);
};

import { useEffect } from "react";

export const useAddShortcutListener = (
  listener: (key: string) => void,
  key: string,
  deps?: any[]
) => {
  useEffect(() => {
    const handler = (ev: any) => {
      const sameKey = ev.key.toLowerCase() === key.toLowerCase();
      const isInput =
        ev.target.nodeName === "INPUT" || ev.target.isContentEditable;

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
        listener(key);
      }
    };

    document.addEventListener("keydown", handler);

    return () => {
      document.removeEventListener("keydown", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(key), deps]);
};

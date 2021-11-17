import { useEffect } from "react";
import { useSideSheet } from "../data/SideSheetContext";
import { useTask } from "../data/TaskContext";

export const useAddShortcutListener = (
  listener: (key: string) => void,
  key: string,
  deps?: any[]
) => {
  const { sideSheetOpen } = useSideSheet();
  const { taskDialogOpen } = useTask();

  useEffect(() => {
    const handler = (ev: any) => {
      const sameKey = ev.key.toLowerCase() === key.toLowerCase();
      const isInput =
        ev.target.nodeName === "INPUT" || ev.target.isContentEditable;
      const isBackdropOpen = sideSheetOpen || taskDialogOpen;
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
  }, [JSON.stringify(key), sideSheetOpen, taskDialogOpen, deps]);
};

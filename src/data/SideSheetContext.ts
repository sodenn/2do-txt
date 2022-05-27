import { useCallback, useState } from "react";
import { createContext } from "../utils/Context";
import { useAddShortcutListener } from "../utils/shortcuts";

const [SideSheetProvider, useSideSheet] = createContext(() => {
  const [sideSheetOpen, setSideSheetOpen] = useState(false);

  const toggleSideSheet = useCallback(() => {
    setSideSheetOpen(!sideSheetOpen);
  }, [sideSheetOpen]);

  useAddShortcutListener(toggleSideSheet, "m", [toggleSideSheet]);

  return {
    sideSheetOpen,
    toggleSideSheet,
    setSideSheetOpen,
  };
});

export { SideSheetProvider, useSideSheet };

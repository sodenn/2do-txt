import { useCallback, useState } from "react";
import { createContext } from "../utils/Context";
import { useAddShortcutListener } from "../utils/shortcuts";

const [SideSheetProvider, useSideSheet] = createContext(() => {
  const [sideSheetOpen, setSideSheetOpen] = useState(false);

  useAddShortcutListener(
    () => {
      toggleSideSheet();
    },
    "m",
    []
  );

  const toggleSideSheet = useCallback(() => {
    setSideSheetOpen(!sideSheetOpen);
  }, [sideSheetOpen]);

  return {
    sideSheetOpen,
    toggleSideSheet,
    setSideSheetOpen,
  };
});

export { SideSheetProvider, useSideSheet };

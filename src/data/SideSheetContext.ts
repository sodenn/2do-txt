import { useCallback, useMemo, useState } from "react";
import { createContext } from "../utils/Context";
import { useAddShortcutListener } from "../utils/shortcuts";

const [SideSheetProvider, useSideSheet] = createContext(() => {
  const [sideSheetOpen, setSideSheetOpen] = useState(false);

  const toggleSideSheet = useCallback(() => {
    setSideSheetOpen(!sideSheetOpen);
  }, [sideSheetOpen]);

  const shortcutListeners = useMemo(
    () => ({ m: toggleSideSheet }),
    [toggleSideSheet]
  );

  useAddShortcutListener(shortcutListeners);

  return {
    sideSheetOpen,
    toggleSideSheet,
    setSideSheetOpen,
  };
});

export { SideSheetProvider, useSideSheet };

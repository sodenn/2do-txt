import { useState } from "react";
import { createContext } from "../utils/Context";

const [SideSheetProvider, useSideSheet] = createContext(() => {
  const [sideSheetOpen, setSideSheetOpen] = useState(false);
  return {
    sideSheetOpen,
    setSideSheetOpen,
  };
});

export { SideSheetProvider, useSideSheet };

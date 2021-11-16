import { useState } from "react";
import { createContext } from "../utils/Context";

const [SideSheetContextProvider, useSideSheet] = createContext(() => {
  const [sideSheetOpen, setSideSheetOpen] = useState(false);
  return {
    sideSheetOpen,
    setSideSheetOpen,
  };
});

export { SideSheetContextProvider, useSideSheet };

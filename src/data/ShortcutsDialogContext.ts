import { useState } from "react";
import { createContext } from "../utils/Context";

const [ShortcutsDialogProvider, useShortcutsDialog] = createContext(() => {
  const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false);

  return {
    shortcutsDialogOpen,
    setShortcutsDialogOpen,
  };
});

export { ShortcutsDialogProvider, useShortcutsDialog };

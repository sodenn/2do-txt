import { useState } from "react";
import { createContext } from "../utils/Context";

const [FileCreateDialogProvider, useFileCreateDialog] = createContext(() => {
  const [fileCreateDialogOpen, setFileCreateDialogOpen] = useState(false);

  return {
    fileCreateDialogOpen,
    setFileCreateDialogOpen,
  };
});

export { FileCreateDialogProvider, useFileCreateDialog };

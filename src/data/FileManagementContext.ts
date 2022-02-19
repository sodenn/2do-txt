import { useState } from "react";
import { createContext } from "../utils/Context";

const [FileManagementProvider, useFileManagementDialog] = createContext(() => {
  const [fileManagementDialogOpen, setFileManagementDialogOpen] =
    useState(false);

  return {
    fileManagementDialogOpen,
    setFileManagementDialogOpen,
  };
});

export { FileManagementProvider, useFileManagementDialog };

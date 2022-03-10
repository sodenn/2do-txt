import { useState } from "react";
import { createContext } from "../utils/Context";

const [FileManagementDialogProvider, useFileManagementDialog] = createContext(
  () => {
    const [fileManagementDialogOpen, setFileManagementDialogOpen] =
      useState(false);

    return {
      fileManagementDialogOpen,
      setFileManagementDialogOpen,
    };
  }
);

export { FileManagementDialogProvider, useFileManagementDialog };

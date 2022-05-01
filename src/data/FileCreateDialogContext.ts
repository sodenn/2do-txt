import { useState } from "react";
import { createContext } from "../utils/Context";

interface FileCreateDialogProps {
  open: boolean;
  createFirstTask?: boolean;
  createExampleFile?: boolean;
}

const [FileCreateDialogProvider, useFileCreateDialog] = createContext(() => {
  const [fileCreateDialog, setFileCreateDialog] =
    useState<FileCreateDialogProps>({
      open: false,
      createFirstTask: false,
      createExampleFile: false,
    });

  return {
    fileCreateDialog,
    setFileCreateDialog,
  };
});

export { FileCreateDialogProvider, useFileCreateDialog };

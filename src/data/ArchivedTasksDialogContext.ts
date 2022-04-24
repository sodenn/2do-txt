import { useState } from "react";
import { createContext } from "../utils/Context";

interface ArchivedTasksDialogProps {
  open: boolean;
  filePath?: string;
}

const [ArchivedTasksDialogProvider, useArchivedTasksDialog] = createContext(
  () => {
    const [archivedTasksDialog, setArchivedTasksDialog] =
      useState<ArchivedTasksDialogProps>({
        open: false,
      });

    return {
      archivedTasksDialog,
      setArchivedTasksDialog,
    };
  }
);

export { ArchivedTasksDialogProvider, useArchivedTasksDialog };

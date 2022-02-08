import { FC, useCallback, useState } from "react";
import FileManagementDialog from "../components/FileManagementDialog";
import { createContext } from "../utils/Context";

export interface FileManagementDialogProps {
  open: boolean;
}

const [FileManagerDialogContext, useFileManagerDialog] = createContext(() => {
  const [{ open }, setFileManagementDialog] =
    useState<FileManagementDialogProps>({ open: false });

  const openFileManagerDialog = useCallback(() => {
    setFileManagementDialog({ open: true });
  }, []);

  return {
    open,
    openFileManagerDialog,
    setFileManagementDialog,
  };
});

const FileManagerContextProvider: FC = ({ children }) => {
  return (
    <FileManagerDialogContext>
      {children}
      <FileManagementDialog />
    </FileManagerDialogContext>
  );
};

export { FileManagerContextProvider, useFileManagerDialog };

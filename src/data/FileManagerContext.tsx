import { FC, useCallback, useState } from "react";
import FileManagementDialog from "../components/FileManagementDialog";
import { createContext } from "../utils/Context";

export interface FileManagementDialogProps {
  open: boolean;
}

const [FileManagementProviderInternal, useFileManagerDialog] = createContext(
  () => {
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
  }
);

const FileManagementProvider: FC = ({ children }) => {
  return (
    <FileManagementProviderInternal>
      {children}
      <FileManagementDialog />
    </FileManagementProviderInternal>
  );
};

export { FileManagementProvider, useFileManagerDialog };

import { FC, useCallback, useState } from "react";
import FileManagementDialog from "../components/FileManagementDialog";
import { createContext } from "../utils/Context";

export interface FileManagementDialogProps {
  open: boolean;
}

const [FileManagementProviderInternal, useFileManagementDialog] = createContext(
  () => {
    const [{ open }, setFileManagementDialog] =
      useState<FileManagementDialogProps>({ open: false });

    const openFileManagementDialog = useCallback(() => {
      setFileManagementDialog({ open: true });
    }, []);

    return {
      open,
      openFileManagementDialog,
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

export { FileManagementProvider, useFileManagementDialog };

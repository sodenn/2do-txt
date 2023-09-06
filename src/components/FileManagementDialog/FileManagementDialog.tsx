import {
  ResponsiveDialog,
  ResponsiveDialogActions,
  ResponsiveDialogContent,
  ResponsiveDialogTitle,
} from "@/components/ResponsiveDialog";
import { useFileManagementDialogStore } from "@/stores/file-management-dialog-store";
import { useTask } from "@/utils/useTask";
import { useTranslation } from "react-i18next";
import { FileList } from "./FileList";
import { FileManagementActions } from "./FileManagementActions";

export function FileManagementDialog() {
  const fileManagementDialogOpen = useFileManagementDialogStore(
    (state) => state.open,
  );
  const closeFileManagementDialog = useFileManagementDialogStore(
    (state) => state.closeFileManagementDialog,
  );
  const { t } = useTranslation();
  const { taskLists } = useTask();

  const handleCloseFile = async () => {
    if (taskLists.length === 1) {
      closeFileManagementDialog();
    }
  };

  return (
    <ResponsiveDialog
      fullWidth
      open={fileManagementDialogOpen}
      onClose={closeFileManagementDialog}
    >
      <ResponsiveDialogTitle>{t("Files")}</ResponsiveDialogTitle>
      <ResponsiveDialogContent>
        <FileList onClose={handleCloseFile} />
      </ResponsiveDialogContent>
      <ResponsiveDialogActions>
        <FileManagementActions />
      </ResponsiveDialogActions>
    </ResponsiveDialog>
  );
}

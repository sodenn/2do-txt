import { useFileCreateDialogStore } from "@/stores/file-create-dialog-store";
import AddTaskIcon from "@mui/icons-material/AddTask";
import { Button } from "@mui/material";
import { useTranslation } from "react-i18next";

export function NewFileButton() {
  const { t } = useTranslation();
  const openFileCreateDialog = useFileCreateDialogStore(
    (state) => state.openFileCreateDialog,
  );
  return (
    <Button
      aria-label="Create task"
      onClick={() =>
        openFileCreateDialog({
          createFirstTask: true,
          createExampleFile: false,
        })
      }
      startIcon={<AddTaskIcon />}
      variant="contained"
    >
      {t("Create Task")}
    </Button>
  );
}

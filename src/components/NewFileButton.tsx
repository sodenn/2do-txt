import { useFileCreateDialogStore } from "@/stores/file-create-dialog-store";
import AddTaskIcon from "@mui/icons-material/AddTask";
import Button from "@mui/joy/Button";
import { useTranslation } from "react-i18next";

export function NewFileButton() {
  const { t } = useTranslation();
  const openFileCreateDialog = useFileCreateDialogStore(
    (state) => state.openFileCreateDialog,
  );
  return (
    <Button
      fullWidth
      variant="solid"
      aria-label="Create task"
      onClick={() =>
        openFileCreateDialog({
          createFirstTask: true,
          createExampleFile: false,
        })
      }
      startDecorator={<AddTaskIcon />}
    >
      {t("Create Task")}
    </Button>
  );
}

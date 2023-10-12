import { useFileCreateDialogStore } from "@/stores/file-create-dialog-store";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import Button from "@mui/joy/Button";
import { useTranslation } from "react-i18next";

export function ExampleFileButton() {
  const { t } = useTranslation();
  const openFileCreateDialog = useFileCreateDialogStore(
    (state) => state.openFileCreateDialog,
  );

  const handleClick = () => {
    openFileCreateDialog({ createExampleFile: true, createFirstTask: false });
  };

  return (
    <Button
      tabIndex={0}
      color="neutral"
      variant="outlined"
      fullWidth
      aria-label="Create example file"
      onClick={handleClick}
      startDecorator={<LightbulbIcon />}
    >
      {t("Create example file")}
    </Button>
  );
}

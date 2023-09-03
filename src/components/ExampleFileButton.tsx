import { useFileCreateDialogStore } from "@/stores/file-create-dialog-store";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
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
      color="neutral"
      variant="outlined"
      aria-label="Create example file"
      onClick={handleClick}
      startDecorator={<LightbulbOutlinedIcon />}
    >
      {t("Create example file")}
    </Button>
  );
}

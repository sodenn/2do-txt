import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import { Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import useFileCreateDialogStore from "../stores/file-create-dialog-store";

const ExampleFileButton = () => {
  const { t } = useTranslation();
  const openFileCreateDialog = useFileCreateDialogStore(
    (state) => state.openFileCreateDialog
  );

  const handleClick = () => {
    openFileCreateDialog({ createExampleFile: true, createFirstTask: false });
  };

  return (
    <Button
      aria-label="Create example file"
      onClick={handleClick}
      startIcon={<LightbulbOutlinedIcon />}
      variant="outlined"
    >
      {t("Create example file")}
    </Button>
  );
};

export default ExampleFileButton;

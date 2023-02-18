import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import { Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import useFileCreateDialog from "../data/file-create-dialog-store";

const CreateExampleFileButton = () => {
  const { t } = useTranslation();
  const openFileCreateDialog = useFileCreateDialog(
    (state) => state.openFileCreateDialog
  );

  const handleClick = () => {
    openFileCreateDialog({ createExampleFile: true });
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

export default CreateExampleFileButton;

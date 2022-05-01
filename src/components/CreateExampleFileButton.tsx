import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import { Button } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { useFileCreateDialog } from "../data/FileCreateDialogContext";

const CreateExampleFileButton = () => {
  const { t } = useTranslation();
  const { setFileCreateDialog } = useFileCreateDialog();

  const handleClick = () => {
    setFileCreateDialog({ open: true, createExampleFile: true });
  };

  return (
    <Button
      aria-label="Create task"
      onClick={handleClick}
      startIcon={<LightbulbOutlinedIcon />}
      variant="outlined"
    >
      {t("Create example file")}
    </Button>
  );
};

export default CreateExampleFileButton;

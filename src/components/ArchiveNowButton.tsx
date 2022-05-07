import { Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useTask } from "../data/TaskContext";

const ArchiveNowButton = () => {
  const { t } = useTranslation();
  const { archiveAllTask } = useTask();
  return (
    <Button variant="outlined" onClick={archiveAllTask}>
      {t("Archive now")}
    </Button>
  );
};

export default ArchiveNowButton;

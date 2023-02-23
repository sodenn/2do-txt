import { Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import useTask from "../utils/useTask";

const ArchiveNowButton = () => {
  const { t } = useTranslation();
  const { archiveTasks } = useTask();
  return (
    <Button variant="outlined" aria-label="Archive now" onClick={archiveTasks}>
      {t("Archive now")}
    </Button>
  );
};

export default ArchiveNowButton;

import { MenuItem, Select } from "@mui/material";
import { useTranslation } from "react-i18next";
import { ArchiveMode, useSettings } from "../data/SettingsContext";
import { useTask } from "../data/TaskContext";

const ArchiveModeSelect = () => {
  const { t } = useTranslation();
  const { archiveMode, setArchiveMode } = useSettings();
  const { archiveAllTask, restoreAllArchivedTask } = useTask();

  const handleChange = (value: ArchiveMode) => {
    setArchiveMode(value);
    if (value === "automatic") {
      archiveAllTask();
    } else if (value === "no-archiving") {
      restoreAllArchivedTask();
    }
  };

  return (
    <Select
      fullWidth
      size="small"
      value={archiveMode}
      aria-label="Select archive mode"
      onChange={(event) => handleChange(event.target.value as ArchiveMode)}
    >
      <MenuItem value="no-archiving">{t("No archiving")}</MenuItem>
      <MenuItem value="manual">{t("Archive manually")}</MenuItem>
      <MenuItem value="automatic">{t("Archive automatically")}</MenuItem>
    </Select>
  );
};

export default ArchiveModeSelect;

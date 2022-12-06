import { MenuItem, Select } from "@mui/material";
import { useTranslation } from "react-i18next";
import { ArchiveMode, useSettings } from "../data/SettingsContext";
import { useTask } from "../data/TaskContext";

const ArchiveModeSelect = () => {
  const { t } = useTranslation();
  const { archiveMode, setArchiveMode } = useSettings();
  const { archiveTasks, restoreArchivedTasks } = useTask();

  const handleChange = (value: ArchiveMode) => {
    setArchiveMode(value);
    if (value === "automatic") {
      archiveTasks();
    } else if (value === "no-archiving") {
      restoreArchivedTasks();
    }
  };

  return (
    <Select
      fullWidth
      size="small"
      value={archiveMode}
      inputProps={{ "aria-label": "Select archive mode" }}
      onChange={(event) => handleChange(event.target.value as ArchiveMode)}
    >
      <MenuItem value="no-archiving" aria-label="No archiving">
        {t("No archiving")}
      </MenuItem>
      <MenuItem value="manual" aria-label="Archive manually">
        {t("Archive manually")}
      </MenuItem>
      <MenuItem value="automatic" aria-label="Archive automatically">
        {t("Archive automatically")}
      </MenuItem>
    </Select>
  );
};

export default ArchiveModeSelect;

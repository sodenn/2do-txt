import { MenuItem, Select } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { ArchivalMode, useSettings } from "../data/SettingsContext";
import { useTask } from "../data/TaskContext";

const ArchivalModeSelect = () => {
  const { t } = useTranslation();
  const { archivalMode, setArchivalMode } = useSettings();
  const { archiveAllTask, restoreAllArchivedTask } = useTask();

  const handleChange = (value: ArchivalMode) => {
    setArchivalMode(value);
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
      value={archivalMode}
      aria-label="Select archival mode"
      onChange={(event) => handleChange(event.target.value as ArchivalMode)}
    >
      <MenuItem value="no-archiving">{t("No archiving")}</MenuItem>
      <MenuItem value="manual">{t("Archive manually")}</MenuItem>
      <MenuItem value="automatic">{t("Archive automatically")}</MenuItem>
    </Select>
  );
};

export default ArchivalModeSelect;

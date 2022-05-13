import { MenuItem, Select } from "@mui/material";
import { useTranslation } from "react-i18next";
import { PriorityTransformation, useSettings } from "../data/SettingsContext";

const PriorityTransformationSelect = () => {
  const { t } = useTranslation();
  const { priorityTransformation, setCompletedTaskPriority } = useSettings();

  return (
    <Select
      fullWidth
      size="small"
      value={priorityTransformation}
      aria-label="Select completed task priority handling"
      onChange={(event) =>
        setCompletedTaskPriority(event.target.value as PriorityTransformation)
      }
    >
      <MenuItem value="keep">{t("Keep priority")}</MenuItem>
      <MenuItem value="remove">{t("Remove priority")}</MenuItem>
      <MenuItem value="archive">{t("Archive priority")}</MenuItem>
    </Select>
  );
};

export default PriorityTransformationSelect;

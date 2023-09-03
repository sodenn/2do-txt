import { ArchiveMode, useSettingsStore } from "@/stores/settings-store";
import { useTask } from "@/utils/useTask";
import { Option, Select, SelectProps } from "@mui/joy";
import { useTranslation } from "react-i18next";

export function ArchiveModeSelect() {
  const { t } = useTranslation();
  const archiveMode = useSettingsStore((state) => state.archiveMode);
  const setArchiveMode = useSettingsStore((state) => state.setArchiveMode);
  const { archiveTasks, restoreArchivedTasks } = useTask();

  const handleChange: SelectProps<ArchiveMode>["onChange"] = (_, value) => {
    const newValue = value || "no-archiving";
    setArchiveMode(newValue);
    if (newValue === "automatic") {
      archiveTasks();
    } else if (newValue === "no-archiving") {
      restoreArchivedTasks();
    }
  };

  return (
    <Select
      value={archiveMode}
      onChange={handleChange}
      slotProps={{
        button: {
          "aria-label": "Select archive mode",
        },
      }}
    >
      <Option value="no-archiving" aria-label="No archiving">
        {t("No archiving")}
      </Option>
      <Option value="manual" aria-label="Archive manually">
        {t("Archive manually")}
      </Option>
      <Option value="automatic" aria-label="Archive automatically">
        {t("Archive automatically")}
      </Option>
    </Select>
  );
}

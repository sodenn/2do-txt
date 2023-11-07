import { ArchiveMode, useSettingsStore } from "@/stores/settings-store";
import { useTask } from "@/utils/useTask";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import {
  Button,
  FormControl,
  FormLabel,
  Option,
  Select,
  SelectProps,
  Stack,
  Tooltip,
} from "@mui/joy";
import { Trans, useTranslation } from "react-i18next";

export function ArchiveModeSelect() {
  const { t } = useTranslation();
  const archiveMode = useSettingsStore((state) => state.archiveMode);
  const setArchiveMode = useSettingsStore((state) => state.setArchiveMode);
  const { archiveTasks, restoreArchivedTasks } = useTask();

  const handleChange: SelectProps<ArchiveMode, false>["onChange"] = (
    _,
    value,
  ) => {
    const newValue = value || "no-archiving";
    setArchiveMode(newValue);
    if (newValue === "automatic") {
      archiveTasks();
    } else if (newValue === "no-archiving") {
      restoreArchivedTasks();
    }
  };

  return (
    <Stack spacing={1}>
      <FormControl>
        <FormLabel>
          {t("Archiving")}{" "}
          <Tooltip
            disableTouchListener={false}
            enterTouchDelay={0}
            leaveTouchDelay={2000}
            title={
              <Trans i18nKey="Completed tasks are archived in a second file called done.txt" />
            }
          >
            <HelpOutlineIcon fontSize="small" />
          </Tooltip>
        </FormLabel>
        <Select
          value={archiveMode}
          onChange={handleChange}
          slotProps={{
            root: {
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
      </FormControl>
      {archiveMode === "manual" && (
        <Button
          variant="outlined"
          aria-label="Archive now"
          onClick={archiveTasks}
        >
          {t("Archive now")}
        </Button>
      )}
    </Stack>
  );
}

import {
  PriorityTransformation,
  useSettingsStore,
} from "@/stores/settings-store";
import { Option, Select } from "@mui/joy";
import { useTranslation } from "react-i18next";

export function PriorityTransformationSelect() {
  const { t } = useTranslation();
  const priorityTransformation = useSettingsStore(
    (state) => state.priorityTransformation,
  );
  const setCompletedTaskPriority = useSettingsStore(
    (state) => state.setCompletedTaskPriority,
  );

  return (
    <Select
      value={priorityTransformation}
      onChange={(_, value) =>
        setCompletedTaskPriority(value as PriorityTransformation)
      }
      slotProps={{
        button: {
          "aria-label": "Select completed task priority handling",
        },
      }}
    >
      <Option value="keep">{t("Keep priority")}</Option>
      <Option value="remove">{t("Remove priority")}</Option>
      <Option value="archive">{t("Archive priority")}</Option>
    </Select>
  );
}

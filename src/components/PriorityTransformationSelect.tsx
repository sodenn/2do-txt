import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PriorityTransformation,
  useSettingsStore,
} from "@/stores/settings-store";
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
    <div className="space-y-2">
      <div className="font-semibold">{t("Completed tasks")}</div>
      <Select
        value={priorityTransformation}
        onValueChange={(value) =>
          setCompletedTaskPriority(value as PriorityTransformation)
        }
        aria-label="Select completed task priority handling"
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="keep">{t("Keep priority")}</SelectItem>
          <SelectItem value="remove">{t("Remove priority")}</SelectItem>
          <SelectItem value="archive">{t("Archive priority")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

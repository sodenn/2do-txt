import { Kbd } from "@/components/Kbd";
import { useTaskDialogStore } from "@/stores/task-dialog-store";
import { useHotkeys } from "@/utils/useHotkeys";
import AddIcon from "@mui/icons-material/Add";
import { IconButton, IconButtonProps, Tooltip } from "@mui/joy";
import { useTranslation } from "react-i18next";

export function AddTaskButton(props: IconButtonProps) {
  const { t } = useTranslation();
  const openTaskDialog = useTaskDialogStore((state) => state.openTaskDialog);

  const handleClick: IconButtonProps["onClick"] = () => {
    openTaskDialog();
  };

  useHotkeys({ n: () => openTaskDialog() });

  return (
    <Tooltip
      title={
        <>
          {t("Create Task")}
          <Kbd>N</Kbd>
        </>
      }
    >
      <IconButton
        color="primary"
        variant="soft"
        tabIndex={-1}
        aria-label="Add task"
        size="md"
        onClick={handleClick}
        {...props}
      >
        <AddIcon />
      </IconButton>
    </Tooltip>
  );
}

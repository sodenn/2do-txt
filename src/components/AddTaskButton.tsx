import Kbd from "@/components/Kbd";
import useTaskDialogStore from "@/stores/task-dialog-store";
import { useHotkeys } from "@/utils/useHotkeys";
import AddIcon from "@mui/icons-material/Add";
import { Box, IconButton, IconButtonProps, Tooltip } from "@mui/material";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export default function AddTaskButton(props: IconButtonProps) {
  const { t } = useTranslation();
  const openTaskDialog = useTaskDialogStore((state) => state.openTaskDialog);

  const handleClick: IconButtonProps["onClick"] = (event) => {
    event.currentTarget.blur();
    openTaskDialog();
  };

  const hotkeys = useMemo(
    () => ({ n: () => openTaskDialog() }),
    [openTaskDialog],
  );

  useHotkeys(hotkeys);

  return (
    <Tooltip
      title={
        <>
          {t("Create Task")}
          <Box component="span" sx={{ ml: 0.5 }}>
            <Kbd>N</Kbd>
          </Box>
        </>
      }
    >
      <IconButton
        tabIndex={-1}
        aria-label="Add task"
        size="large"
        color="inherit"
        onClick={handleClick}
        {...props}
      >
        <AddIcon />
      </IconButton>
    </Tooltip>
  );
}

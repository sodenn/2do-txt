import AddIcon from "@mui/icons-material/Add";
import { Box, IconButton, IconButtonProps, Tooltip } from "@mui/material";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useTaskDialog } from "../data/TaskDialogContext";
import { useAddShortcutListener } from "../utils/shortcuts";
import Kbd from "./Kbd";

const AddTaskButton = (props: IconButtonProps) => {
  const { t } = useTranslation();
  const { setTaskDialogOptions } = useTaskDialog();

  const handleClick: IconButtonProps["onClick"] = (event) => {
    event.currentTarget.blur();
    setTaskDialogOptions({ open: true });
  };

  const shortcutListeners = useMemo(
    () => ({ n: () => setTaskDialogOptions({ open: true }) }),
    [setTaskDialogOptions]
  );

  useAddShortcutListener(shortcutListeners);

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
};

export default AddTaskButton;

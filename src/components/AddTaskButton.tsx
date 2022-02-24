import AddIcon from "@mui/icons-material/Add";
import { Box, IconButton, IconButtonProps, Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useTask } from "../data/TaskContext";
import { useAddShortcutListener } from "../utils/shortcuts";
import Kbd from "./Kbd";

const AddTaskButton = (props: IconButtonProps) => {
  const { t } = useTranslation();
  const { openTaskDialog } = useTask();

  useAddShortcutListener(() => openTaskDialog(), "n");

  return (
    <Tooltip
      disableTouchListener
      title={
        <>
          {t("Create Task")}{" "}
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
        onClick={() => openTaskDialog()}
        {...props}
      >
        <AddIcon />
      </IconButton>
    </Tooltip>
  );
};

export default AddTaskButton;

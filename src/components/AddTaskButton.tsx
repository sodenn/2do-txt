import AddIcon from "@mui/icons-material/Add";
import { Box, IconButton, Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useTask } from "../data/TaskContext";
import { useAddShortcutListener } from "../utils/shortcuts";
import Kbd from "./Kbd";

interface AddTaskButtonProps {
  edgeEnd: boolean;
}

const AddTaskButton = ({ edgeEnd }: AddTaskButtonProps) => {
  const { t } = useTranslation();
  const { openTaskDialog } = useTask();

  useAddShortcutListener(() => {
    openTaskDialog(true);
  }, "n");

  return (
    <Tooltip
      disableTouchListener
      title={
        <>
          {t("Add task")}{" "}
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
        edge={edgeEnd ? "end" : undefined}
        color="inherit"
        onClick={() => openTaskDialog(true)}
      >
        <AddIcon />
      </IconButton>
    </Tooltip>
  );
};

export default AddTaskButton;

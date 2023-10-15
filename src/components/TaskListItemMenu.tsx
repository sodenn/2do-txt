import { Kbd } from "@/components/Kbd";
import { Menu } from "@/components/Menu";
import { useConfirmationDialogStore } from "@/stores/confirmation-dialog-store";
import { useTaskDialogStore } from "@/stores/task-dialog-store";
import { Task } from "@/utils/task";
import { useTask } from "@/utils/useTask";
import MoreVert from "@mui/icons-material/MoreVert";
import {
  Box,
  Dropdown,
  DropdownProps,
  IconButton,
  MenuButton,
  MenuItem,
  styled,
} from "@mui/joy";
import { useTranslation } from "react-i18next";

interface TaskListItemMenuProps extends Pick<DropdownProps, "onOpenChange"> {
  task: Task;
}

const TaskMenuItem = styled(MenuItem)(({ theme }) => ({
  flex: 1,
  display: "flex",
  gap: theme.spacing(2),
  justifyContent: "space-between",
}));

export function TaskListItemMenu({
  task,
  onOpenChange,
}: TaskListItemMenuProps) {
  const { t } = useTranslation();
  const { deleteTask } = useTask();
  const openConfirmationDialog = useConfirmationDialogStore(
    (state) => state.openConfirmationDialog,
  );
  const openTaskDialog = useTaskDialogStore((state) => state.openTaskDialog);

  const handleEdit = () => {
    openTaskDialog(task);
  };

  const handleDelete = () => {
    openConfirmationDialog({
      title: t("Delete task"),
      content: t("Are you sure you want to delete this task?"),
      buttons: [
        {
          text: t("Delete"),
          color: "danger",
          handler: () => {
            deleteTask(task);
          },
        },
      ],
    });
  };

  const handleListKeyDown = (event: any) => {
    event.stopPropagation();
  };

  return (
    <Dropdown onOpenChange={onOpenChange}>
      <MenuButton
        slots={{ root: IconButton }}
        slotProps={{ root: { variant: "plain", color: "neutral" } }}
        aria-label="Task menu"
        aria-haspopup="true"
        tabIndex={-1}
      >
        <MoreVert />
      </MenuButton>
      <Menu onKeyDown={handleListKeyDown} placement="bottom-end">
        <TaskMenuItem onClick={handleEdit} aria-label="Edit task">
          <Box>{t("Edit")}</Box>
          <Kbd>E</Kbd>
        </TaskMenuItem>
        <TaskMenuItem onClick={handleDelete} aria-label="Delete task">
          <Box>{t("Delete")}</Box>
          <Kbd>D</Kbd>
        </TaskMenuItem>
      </Menu>
    </Dropdown>
  );
}

import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import {
  Box,
  ClickAwayListener,
  Grow,
  IconButton,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  styled,
} from "@mui/material";
import { FC, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTask } from "../data/TaskContext";
import { Task } from "../utils/task";
import Kbd from "./Kbd";

const ListIconButton = styled(IconButton)`
  padding: 9px;
`;

const TaskListItemMenu: FC<{ task: Task }> = ({ task }) => {
  const { t } = useTranslation();
  const { openTaskDialog, deleteTask } = useTask();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleEdit = () => {
    handleClose();
    openTaskDialog(true, task);
  };

  const handleDelete = () => {
    handleClose();
    deleteTask(task);
  };

  const handleClose = (event?: any) => {
    if (
      event &&
      anchorRef.current &&
      anchorRef.current.contains(event.target)
    ) {
      return;
    }
    setOpen(false);
  };

  const handleListKeyDown = (event: any) => {
    if (event.key === "Tab") {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  // return focus to the button when we transitioned from !open -> open
  const prevOpen = useRef(open);
  useEffect(() => {
    if (anchorRef.current && prevOpen.current && !open) {
      anchorRef.current.focus();
    }
    prevOpen.current = open;
  }, [open]);

  return (
    <>
      <ListIconButton
        role="menu"
        ref={anchorRef}
        onClick={handleToggle}
        tabIndex={-1}
        edge="end"
      >
        <MoreHorizIcon />
      </ListIconButton>
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        placement="bottom-end"
        transition
        style={{ zIndex: 1 }}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps}>
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList
                  role="menu"
                  autoFocusItem={open}
                  onKeyDown={handleListKeyDown}
                >
                  <MenuItem role="menuitem" onClick={handleEdit}>
                    <Box sx={{ display: "flex", width: "100%" }}>
                      <Box sx={{ flex: 1, mr: 2 }}>{t("Edit")}</Box>
                      <Kbd>E</Kbd>
                    </Box>
                  </MenuItem>
                  <MenuItem onClick={handleDelete}>
                    <Box sx={{ display: "flex", width: "100%" }}>
                      <Box sx={{ flex: 1, mr: 2 }}>{t("Delete")}</Box>
                      <Kbd>D</Kbd>
                    </Box>
                  </MenuItem>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
};

export default TaskListItemMenu;

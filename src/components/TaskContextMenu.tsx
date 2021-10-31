import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import {
  ClickAwayListener,
  Grow,
  IconButton,
  MenuItem,
  MenuList,
  Paper,
  Popper,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTask } from "../data/TaskContext";
import { Task } from "../utils/task";
import { Kbd } from "./Kbd";

const TaskContextMenu: React.FC<{ task: Task }> = ({ task }) => {
  const { t } = useTranslation();
  const { openTaskDialog, deleteTask } = useTask();
  const [open, setOpen] = useState(false);
  const anchorRef = React.useRef<HTMLButtonElement>(null);

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
  const prevOpen = React.useRef(open);
  useEffect(() => {
    if (anchorRef.current && prevOpen.current && !open) {
      anchorRef.current.focus();
    }
    prevOpen.current = open;
  }, [open]);

  return (
    <>
      <IconButton
        role="menu"
        ref={anchorRef}
        onClick={handleToggle}
        tabIndex={-1}
        edge="end"
      >
        <MoreHorizIcon />
      </IconButton>
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        placement="bottom-end"
        transition
      >
        {({ TransitionProps, placement }) => (
          <Grow {...TransitionProps}>
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList
                  role="menu"
                  autoFocusItem={open}
                  onKeyDown={handleListKeyDown}
                >
                  <MenuItem role="menuitem" onClick={handleEdit}>
                    {t("Edit")} <Kbd>E</Kbd>
                  </MenuItem>
                  <MenuItem onClick={handleDelete}>
                    {t("Delete")} <Kbd>D</Kbd>
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

export default TaskContextMenu;

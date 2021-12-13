import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { useTask } from "../data/TaskContext";

const DeleteConfirmationDialog = () => {
  const { t } = useTranslation();
  const {
    deleteConfirmationDialogOpen,
    openDeleteConfirmationDialog,
    selectedTask,
    deleteTask,
  } = useTask();

  const handleClose = () => {
    openDeleteConfirmationDialog(false);
  };

  const handleDelete = () => {
    if (selectedTask) {
      openDeleteConfirmationDialog(false);
      deleteTask(selectedTask);
    }
  };

  return (
    <Dialog
      aria-label="Delete confirmation dialog"
      fullWidth
      maxWidth="sm"
      open={deleteConfirmationDialogOpen}
      onClose={handleClose}
    >
      <DialogTitle>{t("Delete task")}</DialogTitle>
      <DialogContent>
        {t("Are you sure you want to delete this task?")}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t("Cancel")}</Button>
        <Button aria-label="Delete task" onClick={handleDelete}>
          {t("Delete")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;

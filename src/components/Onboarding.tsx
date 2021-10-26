import AddTaskIcon from "@mui/icons-material/AddTask";
import { Box, Button, Stack, Typography } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { useTask } from "../data/TaskContext";
import TodoFilePicker from "./TodoFilePicker";

const Onboarding = () => {
  const { t } = useTranslation();
  const {
    init,
    taskList,
    saveTodoFile,
    tasksLoaded,
    openTaskDialog,
    setTodoFilePath,
  } = useTask();

  const handleCreateTaskClick = async () => {
    if (!tasksLoaded) {
      await setTodoFilePath();
      await saveTodoFile();
    }
    openTaskDialog(true);
  };

  return (
    <>
      {init && taskList.length === 0 && (
        <Box
          sx={{
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Stack spacing={2}>
            <Box sx={{ py: 1, textAlign: "center" }}>
              <img
                src="logo512.png"
                alt="Logo"
                height={96}
                style={{ opacity: 0.2 }}
              />
            </Box>
            <Typography sx={{ textAlign: "center" }} gutterBottom variant="h4">
              {t("Get Started")}
            </Typography>
            <Button
              onClick={handleCreateTaskClick}
              startIcon={<AddTaskIcon />}
              variant="contained"
            >
              {t("Create Task")}
            </Button>
            {!tasksLoaded && (
              <TodoFilePicker>{t("Open todo.txt")}</TodoFilePicker>
            )}
          </Stack>
        </Box>
      )}
    </>
  );
};

export default Onboarding;

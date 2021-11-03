import AddTaskIcon from "@mui/icons-material/AddTask";
import { Box, Button, Stack, styled, Typography } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { useTask } from "../data/TaskContext";
import logo from "../images/logo.png";
import TodoFilePicker from "./TodoFilePicker";

const StyledBox = styled("div")`
  display: flex;
  justify-content: center;
  padding-top: ${({ theme }) => theme.spacing(10)};
  padding-bottom: ${({ theme }) => theme.spacing(5)};
  @media screen and (max-height: 480px) {
    padding-top: 0;
    padding-bottom: 0;
  }
`;

const Onboarding = () => {
  const { t } = useTranslation();
  const {
    init,
    taskList,
    saveTodoFile,
    tasksLoaded,
    openTaskDialog,
    selectTodoFile,
  } = useTask();

  const handleCreateTaskClick = async () => {
    if (!tasksLoaded) {
      await selectTodoFile();
      await saveTodoFile();
    }
    openTaskDialog(true);
  };

  return (
    <>
      {init && taskList.length === 0 && (
        <StyledBox>
          <Stack spacing={2}>
            <Box sx={{ py: 1, textAlign: "center" }}>
              <img src={logo} alt="Logo" height={96} style={{ opacity: 0.2 }} />
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
        </StyledBox>
      )}
    </>
  );
};

export default Onboarding;

import AddTaskIcon from "@mui/icons-material/AddTask";
import { Box, Button, Stack, styled, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useTask } from "../data/TaskContext";
import logo from "../images/logo.png";
import { usePlatform } from "../utils/platform";
import FilePicker from "./FilePicker";

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
  const platform = usePlatform();
  const { taskLists, openTodoFileCreateDialog } = useTask();

  const handleClick = async () => {
    openTodoFileCreateDialog(true);
  };

  return (
    <StyledBox sx={{ display: taskLists.length === 0 ? "flex" : "none" }}>
      <Stack spacing={2}>
        <Box sx={{ py: 1, textAlign: "center" }}>
          <img src={logo} alt="Logo" height={96} style={{ opacity: 0.2 }} />
        </Box>
        <Typography
          sx={{ textAlign: "center" }}
          gutterBottom
          component="h1"
          variant="h4"
          role="heading"
          aria-label="Onboarding"
        >
          {t("Get Started")}
        </Typography>
        <Button
          aria-label="Create task"
          onClick={handleClick}
          startIcon={<AddTaskIcon />}
          variant="contained"
        >
          {t("Create Task")}
        </Button>
        <FilePicker>
          {platform === "electron" ? t("Open todo.txt") : t("Import todo.txt")}
        </FilePicker>
      </Stack>
    </StyledBox>
  );
};

export default Onboarding;

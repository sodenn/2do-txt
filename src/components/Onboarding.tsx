import AddTaskIcon from "@mui/icons-material/AddTask";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import { Box, Button, Stack, styled, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useFileCreateDialog } from "../data/FileCreateDialogContext";
import { useTask } from "../data/TaskContext";
import logo from "../images/logo.png";
import { getPlatform } from "../utils/platform";
import CloudFileImportButtons from "./CloudFileImportButtons";
import CloudStorageConnectionButtons from "./CloudStorageConnectionButtons";
import CreateExampleFileButton from "./CreateExampleFileButton";

const StyledBox = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  paddingTop: theme.spacing(10),
  paddingBottom: theme.spacing(5),
  "@media screen and (max-height: 480px)": {
    paddingTop: 0,
    paddingBottom: 0,
  },
}));

const Onboarding = () => {
  const { t } = useTranslation();
  const platform = getPlatform();
  const { setFileCreateDialog } = useFileCreateDialog();
  const { taskLists, openTodoFilePicker, initialized } = useTask();

  return (
    <StyledBox
      sx={{ display: initialized && taskLists.length === 0 ? "flex" : "none" }}
    >
      <Stack spacing={1}>
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
          onClick={() =>
            setFileCreateDialog({ open: true, createFirstTask: true })
          }
          startIcon={<AddTaskIcon />}
          variant="contained"
        >
          {t("Create Task")}
        </Button>
        <CreateExampleFileButton />
        <Button
          onClick={openTodoFilePicker}
          aria-label="Open todo.txt"
          startIcon={<FolderOpenOutlinedIcon />}
          fullWidth
          variant="outlined"
          component="span"
        >
          {platform === "electron" ? t("Open todo.txt") : t("Import todo.txt")}
        </Button>
        <CloudFileImportButtons />
        <CloudStorageConnectionButtons disconnect={false} />
      </Stack>
    </StyledBox>
  );
};

export default Onboarding;

import AddTaskIcon from "@mui/icons-material/AddTask";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import { Box, Button, Stack, styled, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import logo from "../images/logo.png";
import useFileCreateDialogStore from "../stores/file-create-dialog-store";
import usePlatformStore from "../stores/platform-store";
import useFilePicker from "../utils/useFilePicker";
import useTask from "../utils/useTask";
import CloudStorageOnboarding from "./CloudStorageOnboarding";
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
  const platform = usePlatformStore((state) => state.platform);
  const openFileCreateDialog = useFileCreateDialogStore(
    (state) => state.openFileCreateDialog
  );
  const { taskLists } = useTask();
  const { openFileDialog } = useFilePicker();

  return (
    <StyledBox sx={{ display: taskLists.length === 0 ? "flex" : "none" }}>
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
          onClick={() => openFileCreateDialog({ createFirstTask: true })}
          startIcon={<AddTaskIcon />}
          variant="contained"
        >
          {t("Create Task")}
        </Button>
        <CreateExampleFileButton />
        <Button
          onClick={openFileDialog}
          aria-label={
            platform === "desktop" ? "Open todo.txt" : "Import todo.txt"
          }
          startIcon={<FolderOpenOutlinedIcon />}
          fullWidth
          variant="outlined"
          component="span"
        >
          {platform === "desktop" ? t("Open todo.txt") : t("Import todo.txt")}
        </Button>
        <CloudStorageOnboarding />
      </Stack>
    </StyledBox>
  );
};

export default Onboarding;

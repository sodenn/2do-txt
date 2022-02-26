import AddTaskIcon from "@mui/icons-material/AddTask";
import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";
import { Box, Button, Stack, styled, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useCloudStorage } from "../data/CloudStorageContext";
import { useTask } from "../data/TaskContext";
import logo from "../images/logo.png";
import { usePlatform } from "../utils/platform";
import CloudStorageButton from "./CloudStorageButton";
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
  const {
    cloudStorage,
    cloudStorageEnabled,
    cloudStorageConnected,
    setCloudStorageFileDialogOpen,
  } = useCloudStorage();
  const { taskLists, openTodoFileCreateDialog } = useTask();

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
          onClick={() => openTodoFileCreateDialog(true)}
          startIcon={<AddTaskIcon />}
          variant="contained"
        >
          {t("Create Task")}
        </Button>
        <FilePicker>
          {platform === "electron" ? t("Open todo.txt") : t("Import todo.txt")}
        </FilePicker>
        {cloudStorageEnabled && cloudStorageConnected && (
          <Button
            aria-label="Import todo.txt from Cloud Storage"
            onClick={() => setCloudStorageFileDialogOpen(true)}
            startIcon={<CloudOutlinedIcon />}
            variant="outlined"
          >
            {t("Import from Cloud Storage", { cloudStorage })}
          </Button>
        )}
        <CloudStorageButton disconnect={false} cloudStorage="Dropbox" />
      </Stack>
    </StyledBox>
  );
};

export default Onboarding;

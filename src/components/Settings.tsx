import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  styled,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useSettings } from "../data/SettingsContext";
import { useSideSheet } from "../data/SideSheetContext";
import { useTask } from "../data/TaskContext";
import { useNotifications } from "../utils/notifications";
import LanguageSelect from "./LanguageSelect";
import ThemeModeSelect from "./ThemeModeSelect";

const FilePath = styled("span")`
  word-break: break-all;
  user-select: text;
  font-family: monospace, monospace;
`;

const Settings = () => {
  const { t } = useTranslation();
  const { checkNotificationPermissions, requestNotificationPermissions } =
    useNotifications();
  const { taskLists, closeTodoFile } = useTask();
  const {
    showNotifications,
    setShowNotifications,
    createCompletionDate,
    createCreationDate,
    toggleCreateCompletionDate,
    toggleCreateCreationDate,
  } = useSettings();
  const { setSideSheetOpen } = useSideSheet();

  const handleCloseFileClick = (filePath: string) => {
    closeTodoFile(filePath);
    setSideSheetOpen(false);
  };

  const handleShowNotifications = async () => {
    const currentState = await checkNotificationPermissions();
    if (!showNotifications && currentState.display !== "granted") {
      const response = await requestNotificationPermissions();
      setShowNotifications(response.display === "granted");
    } else {
      setShowNotifications(!showNotifications);
    }
  };

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <Typography component="div" variant="subtitle1" gutterBottom>
          {t("Appearance")}
        </Typography>
        <ThemeModeSelect />
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography component="div" variant="subtitle1" gutterBottom>
          {t("Language")}
        </Typography>
        <LanguageSelect />
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography component="div" variant="subtitle1">
          {t("Dates")}
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={createCreationDate}
              onChange={() => toggleCreateCreationDate()}
            />
          }
          label={t("Set creation date") as string}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={createCompletionDate}
              onChange={() => toggleCreateCompletionDate()}
            />
          }
          label={t("Set completion date") as string}
        />
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography component="div" variant="subtitle1">
          {t("Notifications")}
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={showNotifications}
              onChange={() => handleShowNotifications()}
            />
          }
          label={t("Due tasks") as string}
        />
      </Box>
      <Typography component="div" variant="subtitle1" gutterBottom>
        todo.txt
      </Typography>
      {taskLists.length > 0 && (
        <Stack spacing={1}>
          {taskLists.map((taskList, idx) => (
            <Alert
              key={idx}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => handleCloseFileClick(taskList.filePath)}
                >
                  {t("Close")}
                </Button>
              }
              severity="info"
              icon={false}
            >
              <FilePath>{taskList.filePath}</FilePath>
            </Alert>
          ))}
        </Stack>
      )}
    </>
  );
};

export default Settings;

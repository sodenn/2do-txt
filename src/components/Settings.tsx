import CloseIcon from "@mui/icons-material/Close";
import {
  Alert,
  AlertTitle,
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
import { usePlatform } from "../utils/platform";
import LanguageSelect from "./LanguageSelect";
import ThemeModeSelect from "./ThemeModeSelect";
import TodoFilePicker from "./TodoFilePicker";

const FilePath = styled("span")`
  word-break: break-all;
  user-select: text;
  font-family: monospace, monospace;
`;

const Settings = () => {
  const { t } = useTranslation();
  const platform = usePlatform();
  const { checkNotificationPermissions, requestNotificationPermissions } =
    useNotifications();
  const { todoFilePath, closeTodoFile, tasksLoaded } = useTask();
  const {
    showNotifications,
    setShowNotifications,
    createCompletionDate,
    createCreationDate,
    toggleCreateCompletionDate,
    toggleCreateCreationDate,
  } = useSettings();
  const { setSideSheetOpen } = useSideSheet();

  const handleCloseFileClick = () => {
    closeTodoFile();
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

  const showTodoFilePath = !!todoFilePath && platform === "electron";

  return (
    <>
      <Typography component="div" variant="subtitle1" gutterBottom>
        {t("Appearance")}
      </Typography>
      <Box sx={{ mb: 2 }}>
        <ThemeModeSelect />
      </Box>
      <Typography component="div" variant="subtitle1" gutterBottom>
        {t("Language")}
      </Typography>
      <Box sx={{ mb: 2 }}>
        <LanguageSelect />
      </Box>
      <Typography component="div" variant="subtitle1" gutterBottom>
        todo.txt
      </Typography>
      <Stack direction="row" spacing={1} sx={{ mb: showTodoFilePath ? 1 : 2 }}>
        <TodoFilePicker onSelect={() => setSideSheetOpen(false)}>
          {t("Open")}
        </TodoFilePicker>
        {tasksLoaded && (
          <Button
            onClick={handleCloseFileClick}
            startIcon={<CloseIcon />}
            fullWidth
            variant="outlined"
          >
            {t("Close")}
          </Button>
        )}
      </Stack>
      {showTodoFilePath && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <AlertTitle>{t("Current file")}</AlertTitle>
          <FilePath>{todoFilePath}</FilePath>
        </Alert>
      )}
      <Typography component="div" variant="subtitle1">
        {t("Dates")}
      </Typography>
      <Box sx={{ mb: 2 }}>
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
    </>
  );
};

export default Settings;

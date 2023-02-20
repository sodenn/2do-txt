import {
  Alert,
  AlertTitle,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import useWebDAVDialogStore from "../stores/webdav-dialog-store";
import { useCloudStorage } from "../utils/CloudStorage";
import { saveWebDAVCredentials } from "../utils/CloudStorage/webdav-storage";
import FullScreenDialog from "./FullScreenDialog/FullScreenDialog";
import FullScreenDialogContent from "./FullScreenDialog/FullScreenDialogContent";
import FullScreenDialogTitle from "./FullScreenDialog/FullScreenDialogTitle";

const WebDavDialog = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const webDAVDialogOpen = useWebDAVDialogStore((state) => state.open);
  const closeCloudFileDialog = useWebDAVDialogStore(
    (state) => state.closeCloudFileDialog
  );
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<any>();
  const { createClient, openStorageConnectedAlert } = useCloudStorage();
  const fullScreenDialog = useMediaQuery(theme.breakpoints.down("sm"));

  const handleSubmit = async () => {
    setError(undefined);
    try {
      await saveWebDAVCredentials({ username, password, url });
      closeCloudFileDialog();
      await createClient("WebDAV");
      await openStorageConnectedAlert("WebDAV");
    } catch (error) {
      setError(error);
    }
  };

  const handleExited = () => {
    setUrl("");
    setUsername("");
    setPassword("");
    setError(undefined);
  };

  const handleEnter = () => {
    setUrl(import.meta.env.VITE_WEBDAV_URL);
    setUsername(import.meta.env.VITE_WEBDAV_USERNAME);
    setPassword(import.meta.env.VITE_WEBDAV_PASSWORD);
  };

  const handleClose = () => {
    closeCloudFileDialog();
  };

  const disabled = !username || !password || !url;

  const dialogContent = (
    <Stack sx={{ mt: 2 }} spacing={2}>
      <TextField
        value={url}
        onChange={(ev) => setUrl(ev.target.value)}
        autoFocus
        label={t("URL")}
        fullWidth
        variant="outlined"
        type="url"
        helperText={t("WebDAV example URL")}
        inputProps={{
          "aria-label": "URL",
        }}
      />
      <TextField
        value={username}
        onChange={(ev) => setUsername(ev.target.value)}
        label={t("Username")}
        fullWidth
        variant="outlined"
        type="url"
        inputProps={{
          "aria-label": "Username",
        }}
      />
      <TextField
        value={password}
        onChange={(ev) => setPassword(ev.target.value)}
        label={t("Password")}
        fullWidth
        variant="outlined"
        type="password"
        inputProps={{
          "aria-label": "Password",
        }}
      />
      {error && (
        <Alert severity="warning" variant="outlined">
          <AlertTitle>{t("Connection Error")}</AlertTitle>
          {error.message}
        </Alert>
      )}
    </Stack>
  );

  const TransitionProps = {
    onExited: handleExited,
    onEnter: handleEnter,
  };

  if (fullScreenDialog) {
    return (
      <FullScreenDialog
        data-testid="webdav-dialog"
        open={webDAVDialogOpen}
        onClose={handleClose}
        TransitionProps={TransitionProps}
      >
        <FullScreenDialogTitle
          onClose={handleClose}
          accept={{
            text: t("Connect"),
            disabled,
            onClick: handleSubmit,
            "aria-label": "Connect",
          }}
        >
          {t("WebDAV Server")}
        </FullScreenDialogTitle>
        <FullScreenDialogContent>{dialogContent}</FullScreenDialogContent>
      </FullScreenDialog>
    );
  }

  return (
    <Dialog
      maxWidth="xs"
      fullWidth
      open={webDAVDialogOpen}
      onClose={handleClose}
      TransitionProps={TransitionProps}
    >
      <DialogTitle>{t("WebDAV Server")}</DialogTitle>
      <DialogContent>{dialogContent}</DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t("Close")}</Button>
        <Button aria-label="Connect" onClick={handleSubmit} disabled={disabled}>
          {t("Connect")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WebDavDialog;

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
import {
  useCloudFileDialog,
  useCloudStorage,
  useWebDAVDialog,
} from "../data/CloudStorageContext";
import { saveWebDAVCredentials } from "../data/CloudStorageContext/webdav-storage";
import FullScreenDialog from "./FullScreenDialog/FullScreenDialog";
import FullScreenDialogContent from "./FullScreenDialog/FullScreenDialogContent";
import FullScreenDialogTitle from "./FullScreenDialog/FullScreenDialogTitle";

const WebDavDialog = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { webDAVDialogOpen, setWebDAVDialogOpen } = useWebDAVDialog();
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<any>();
  const { createClient, openStorageConnectedAlert } = useCloudStorage();
  const { setCloudFileDialogOptions } = useCloudFileDialog();
  const fullScreenDialog = useMediaQuery(theme.breakpoints.down("sm"));

  const handleSubmit = async () => {
    setError(undefined);
    try {
      await saveWebDAVCredentials({ username, password, url });
      setWebDAVDialogOpen(false);
      await createClient("WebDAV");
      await openStorageConnectedAlert("WebDAV");
      await setCloudFileDialogOptions({ cloudStorage: "WebDAV", open: true });
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

  const handleClose = () => {
    setWebDAVDialogOpen(false);
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
      maxWidth="sm"
      fullWidth
      open={webDAVDialogOpen}
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

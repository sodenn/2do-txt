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
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCloudStorage, useWebDAVDialog } from "../data/CloudStorageContext";
import { saveWebDAVCredentials } from "../data/CloudStorageContext/webdav-storage";

const WebDavDialog = () => {
  const { webDAVDialogOpen, setWebDAVDialogOpen } = useWebDAVDialog();
  const { t } = useTranslation();
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<any>();
  const { createClient, openStorageConnectedAlert } = useCloudStorage();

  const handleSubmit = async () => {
    setError(undefined);
    try {
      await saveWebDAVCredentials({ username, password, url });
      setWebDAVDialogOpen(false);
      await createClient("WebDAV");
      await openStorageConnectedAlert("WebDAV");
    } catch (error) {
      setError(error);
    }
  };

  const handleExit = () => {
    setUrl("");
    setUsername("");
    setPassword("");
    setError(undefined);
  };

  return (
    <Dialog
      maxWidth="sm"
      fullWidth
      open={webDAVDialogOpen}
      TransitionProps={{
        onExited: handleExit,
      }}
    >
      <DialogTitle>{t("WebDAV Server")}</DialogTitle>
      <DialogContent>
        <Stack sx={{ mt: 2 }} spacing={2}>
          <TextField
            value={url}
            onChange={(ev) => setUrl(ev.target.value)}
            autoFocus
            label={t("URL")}
            fullWidth
            variant="outlined"
            type="url"
            placeholder="E.g. https://example.com/remote.php/webdav"
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
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setWebDAVDialogOpen(false)}>{t("Close")}</Button>
        <Button aria-label="Connect" onClick={handleSubmit}>
          {t("Connect")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WebDavDialog;

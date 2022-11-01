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
import { useWebDAVDialog } from "../data/CloudStorageContext/WebDAVDialogContext";

const WebDavDialog = () => {
  const {
    webDAVDialog: { open, onClose },
    setWebDAVDialog,
  } = useWebDAVDialog();
  const { t } = useTranslation();
  const [connected, setConnected] = useState(false);
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();

  const handleSubmit = () => {
    setError(undefined);
    setConnected(true);
    setWebDAVDialog({ open: false });
  };

  const handleClose = () => {
    onClose?.(connected);
  };

  const handleExit = () => {
    setUrl("");
    setUsername("");
    setPassword("");
  };

  return (
    <Dialog
      maxWidth="sm"
      fullWidth
      open={open}
      onClose={handleClose}
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
            <Alert severity="error">
              <AlertTitle>{t("Connection Error")}</AlertTitle>
              {error}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setWebDAVDialog({ open: false })}>
          {t("Close")}
        </Button>
        <Button aria-label="Connect" onClick={handleSubmit}>
          {t("Connect")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WebDavDialog;

import {
  ResponsiveDialog,
  ResponsiveDialogActions,
  ResponsiveDialogContent,
  ResponsiveDialogTitle,
} from "@/components/ResponsiveDialog";
import { useWebDAVDialogStore } from "@/stores/webdav-dialog-store";
import { useCloudStorage } from "@/utils/CloudStorage";
import {
  Alert,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  Stack,
  Typography,
} from "@mui/joy";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export function WebDAVDialog() {
  const { t } = useTranslation();
  const webDAVDialogOpen = useWebDAVDialogStore((state) => state.open);
  const closeWebDAVDialog = useWebDAVDialogStore(
    (state) => state.closeWebDAVDialog,
  );
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<any>();
  const [loading, setLoading] = useState(false);
  const { createWebDAVStorage } = useCloudStorage();

  const handleSubmit = async () => {
    setError(undefined);
    setLoading(true);
    try {
      await createWebDAVStorage({
        baseUrl: url,
        basicAuth: { username, password },
      });
      closeWebDAVDialog();
    } catch (error) {
      setError(error);
      setLoading(false);
    }
  };

  const handleExited = () => {
    setUrl("");
    setUsername("");
    setPassword("");
    setError(undefined);
    setLoading(false);
  };

  const handleEnter = () => {
    setUrl(import.meta.env.VITE_WEBDAV_URL);
    setUsername(import.meta.env.VITE_WEBDAV_USERNAME);
    setPassword(import.meta.env.VITE_WEBDAV_PASSWORD);
  };

  const handleClose = () => {
    closeWebDAVDialog();
  };

  const disabled = !username || !password || !url;

  return (
    <ResponsiveDialog
      fullWidth
      open={webDAVDialogOpen}
      onClose={handleClose}
      onExited={handleExited}
      onEnter={handleEnter}
    >
      <ResponsiveDialogTitle>{t("WebDAV Server")}</ResponsiveDialogTitle>
      <ResponsiveDialogContent>
        <Stack spacing={2}>
          <FormControl>
            <FormLabel>{t("URL")}</FormLabel>
            <Input
              value={url}
              onChange={(ev) => setUrl(ev.target.value)}
              autoFocus
              fullWidth
              variant="outlined"
              type="url"
              slotProps={{
                input: {
                  "aria-label": "URL",
                },
              }}
            />
            <FormHelperText>{t("WebDAV example URL")}</FormHelperText>
          </FormControl>
          <FormControl>
            <FormLabel>{t("Username")}</FormLabel>
            <Input
              value={username}
              onChange={(ev) => setUsername(ev.target.value)}
              fullWidth
              variant="outlined"
              type="text"
              slotProps={{
                input: {
                  "aria-label": "Username",
                },
              }}
            />
          </FormControl>
          <FormControl>
            <FormLabel>{t("Password")}</FormLabel>
            <Input
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              fullWidth
              variant="outlined"
              type="password"
              slotProps={{
                input: {
                  "aria-label": "Password",
                },
              }}
            />
          </FormControl>
          {error && (
            <Alert color="warning" variant="soft">
              <div>
                <Typography level="title-md">
                  {t("Connection Error")}
                </Typography>
                <Typography level="body-sm">{error.message}</Typography>
              </div>
            </Alert>
          )}
        </Stack>
      </ResponsiveDialogContent>
      <ResponsiveDialogActions>
        <Button
          aria-label="Connect"
          onClick={handleSubmit}
          disabled={disabled}
          loading={loading}
        >
          {t("Connect")}
        </Button>
      </ResponsiveDialogActions>
    </ResponsiveDialog>
  );
}

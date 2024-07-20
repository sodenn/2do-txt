import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { useWebDAVDialogStore } from "@/stores/webdav-dialog-store";
import { useCloudStorage } from "@/utils/CloudStorage";
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

  const handleOpen = () => {
    setUrl(import.meta.env.VITE_WEBDAV_URL);
    setUsername(import.meta.env.VITE_WEBDAV_USERNAME);
    setPassword(import.meta.env.VITE_WEBDAV_PASSWORD);
  };

  const handleClose = () => {
    closeWebDAVDialog();
  };

  const handleExit = () => {
    setUrl("");
    setUsername("");
    setPassword("");
    setError(undefined);
    setLoading(false);
  };

  const disabled = !username || !password || !url;

  return (
    <ResponsiveDialog
      open={webDAVDialogOpen}
      onOpen={handleOpen}
      onClose={handleClose}
      onExit={handleExit}
    >
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{t("WebDAV Server")}</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <div className="mb-1 flex flex-col gap-2">
            <div className="space-y-1">
              <Label>{t("URL")}</Label>
              <Input
                value={url}
                onChange={(ev) => setUrl(ev.target.value)}
                autoFocus
                type="url"
                aria-label="URL"
                className="w-full"
              />
              <p className="text-[0.8rem] text-muted-foreground">
                {t("WebDAV example URL")}
              </p>
            </div>
            <div className="space-y-1">
              <Label>{t("Username")}</Label>
              <Input
                value={username}
                onChange={(ev) => setUsername(ev.target.value)}
                type="text"
                aria-label="Username"
                className="w-full"
              />
            </div>
            <div className="space-y-1">
              <Label>{t("Password")}</Label>
              <Input
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                type="password"
                aria-label="Password"
                className="w-full"
              />
            </div>
          </div>
          {error && (
            <Alert variant="warning">
              <AlertTitle>{t("Connection Error")}</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <Button
            aria-label="Connect"
            onClick={handleSubmit}
            disabled={disabled}
            loading={loading}
          >
            {t("Connect")}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

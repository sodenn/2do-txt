import logo from "@/images/logo.png";
import { hideSplashScreen } from "@/native-api/splash-screen";
import { Alert, CssBaseline, Stack, Typography } from "@mui/joy";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRouteError } from "react-router-dom";

export function ErrorBoundary() {
  const { t } = useTranslation();
  const error = useRouteError() as any;
  const message = error.message;

  useEffect(() => {
    hideSplashScreen();
  }, []);

  return (
    <>
      <CssBaseline />
      <Stack
        spacing={1}
        direction="row"
        alignItems="center"
        sx={{ py: 2, px: 3 }}
      >
        <img src={logo} alt="Logo" height={28} />
        <Typography level="title-lg" component="div">
          {t("Error")}
        </Typography>
      </Stack>
      <Stack spacing={2} sx={{ my: 2, mx: 3 }}>
        <Typography gutterBottom level="body-md">
          {t("An error has occurred")}
        </Typography>
        {message && (
          <Alert variant="outlined" color="danger" sx={{ userSelect: "text" }}>
            {t("Error message")}: <code>{message}</code>
          </Alert>
        )}
      </Stack>
    </>
  );
}

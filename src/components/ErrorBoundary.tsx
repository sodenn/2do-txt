import {
  Alert,
  AppBar,
  Box,
  CssBaseline,
  Toolbar,
  Typography,
} from "@mui/material";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRouteError } from "react-router-dom";
import logo from "@/images/logo.png";
import { hideSplashScreen } from "@/native-api/splash-screen";

export default function ErrorBoundary() {
  const { t } = useTranslation();
  const error = useRouteError() as any;
  const message = error.message;

  useEffect(() => {
    hideSplashScreen();
  }, []);

  return (
    <>
      <CssBaseline />
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar sx={{ gap: 1 }}>
          <img src={logo} alt="Logo" height={28} />
          <Typography variant="h6" component="div">
            {t("Error")}
          </Typography>
        </Toolbar>
      </AppBar>
      <Box sx={{ mx: 3, my: 2 }}>
        <Typography gutterBottom variant="subtitle1">
          {t("An error has occurred")}
        </Typography>
        {message && (
          <Alert icon={false} severity="warning">
            <Typography variant="caption">{t("Error message")}: </Typography>
            <code>{message}</code>
          </Alert>
        )}
      </Box>
    </>
  );
}

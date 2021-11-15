import { CssBaseline, ThemeProvider } from "@mui/material";
import { FC } from "react";
import { SettingsContextProvider, useSettings } from "../data/SettingsContext";

const AppTheme: FC = ({ children }) => {
  return (
    <SettingsContextProvider>
      <AppThemeChild>{children}</AppThemeChild>
    </SettingsContextProvider>
  );
};

const AppThemeChild: FC = ({ children }) => {
  const { theme } = useSettings();
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export default AppTheme;

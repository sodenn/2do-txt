import { CssBaseline, ThemeProvider } from "@mui/material";
import React from "react";
import { AppThemeProvider, useAppTheme } from "../data/AppThemeContext";

const AppTheme: React.FC = ({ children }) => {
  return (
    <AppThemeProvider>
      <AppThemeChild>{children}</AppThemeChild>
    </AppThemeProvider>
  );
};

const AppThemeChild: React.FC = ({ children }) => {
  const { theme } = useAppTheme();
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export default AppTheme;

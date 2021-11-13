import { CssBaseline, ThemeProvider } from "@mui/material";
import { FC } from "react";
import { AppThemeProvider, useAppTheme } from "../data/AppThemeContext";

const AppTheme: FC = ({ children }) => {
  return (
    <AppThemeProvider>
      <AppThemeChild>{children}</AppThemeChild>
    </AppThemeProvider>
  );
};

const AppThemeChild: FC = ({ children }) => {
  const { theme } = useAppTheme();
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export default AppTheme;

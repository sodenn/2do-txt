import { Grow } from "@mui/material";
import { SnackbarProvider } from "notistack";
import { Suspense } from "react";
import AppRouter from "./components/AppRouter";
import { AppTheme } from "./data/AppThemeContext";
import { ConfirmationDialogContextProvider } from "./data/ConfirmationDialogContext";
import { FileManagerContextProvider } from "./data/FileManagerContext";
import { FilterContextProvider } from "./data/FilterContext";
import { MigrationContextProvider } from "./data/MigrationContext";
import { SettingsContextProvider } from "./data/SettingsContext";
import { SideSheetContextProvider } from "./data/SideSheetContext";
import { TaskProvider } from "./data/TaskContext";

function App() {
  return (
    <AppTheme>
      <SnackbarProvider
        maxSnack={3}
        preventDuplicate={true}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        TransitionComponent={Grow as any}
      >
        <Suspense fallback={null}>
          <MigrationContextProvider>
            <ConfirmationDialogContextProvider>
              <SettingsContextProvider>
                <FilterContextProvider>
                  <SideSheetContextProvider>
                    <TaskProvider>
                      <FileManagerContextProvider>
                        <AppRouter />
                      </FileManagerContextProvider>
                    </TaskProvider>
                  </SideSheetContextProvider>
                </FilterContextProvider>
              </SettingsContextProvider>
            </ConfirmationDialogContextProvider>
          </MigrationContextProvider>
        </Suspense>
      </SnackbarProvider>
    </AppTheme>
  );
}

export default App;

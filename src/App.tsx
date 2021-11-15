import { Grow } from "@mui/material";
import { SnackbarProvider } from "notistack";
import { Suspense } from "react";
import AppRouter from "./components/AppRouter";
import AppTheme from "./components/AppTheme";
import { FilterContextProvider } from "./data/FilterContext";
import { LanguageContextProvider } from "./data/LanguageContext";
import { SettingsContextProvider } from "./data/SettingsContext";
import { SideSheetContextProvider } from "./data/SideSheetContext";
import { TaskProvider } from "./data/TaskContext";

function App() {
  return (
    <AppTheme>
      <Suspense fallback={null}>
        <SnackbarProvider
          maxSnack={3}
          preventDuplicate={true}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          TransitionComponent={Grow as any}
        >
          <LanguageContextProvider>
            <FilterContextProvider>
              <SettingsContextProvider>
                <SideSheetContextProvider>
                  <TaskProvider>
                    <AppRouter />
                  </TaskProvider>
                </SideSheetContextProvider>
              </SettingsContextProvider>
            </FilterContextProvider>
          </LanguageContextProvider>
        </SnackbarProvider>
      </Suspense>
    </AppTheme>
  );
}

export default App;

import { Grow } from "@mui/material";
import { SnackbarProvider } from "notistack";
import { Suspense } from "react";
import AppRouter from "./components/AppRouter";
import AppTheme from "./components/AppTheme";
import { AppContextProvider } from "./data/AppContext";
import { TaskProvider } from "./data/TaskContext";

function App() {
  return (
    <AppTheme>
      <Suspense fallback={<></>}>
        <SnackbarProvider
          maxSnack={3}
          preventDuplicate={true}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          TransitionComponent={Grow as any}
        >
          <AppContextProvider>
            <TaskProvider>
              <AppRouter />
            </TaskProvider>
          </AppContextProvider>
        </SnackbarProvider>
      </Suspense>
    </AppTheme>
  );
}

export default App;

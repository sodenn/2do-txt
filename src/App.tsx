import { CssBaseline } from "@mui/material";
import AppRouter from "./components/AppRouter";
import ProviderBundle from "./data/ProviderBundle";

function App() {
  return (
    <ProviderBundle>
      <CssBaseline />
      <AppRouter />
    </ProviderBundle>
  );
}

export default App;

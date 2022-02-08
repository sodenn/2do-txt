import AppRouter from "./components/AppRouter";
import { AppTheme } from "./data/AppThemeContext";
import ProviderBundle from "./data/ProviderBundle";

function App() {
  return (
    <AppTheme>
      <ProviderBundle>
        <AppRouter />
      </ProviderBundle>
    </AppTheme>
  );
}

export default App;

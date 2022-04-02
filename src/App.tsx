import AppRouter from "./components/AppRouter";
import ProviderBundle from "./data/ProviderBundle";

function App() {
  return (
    <ProviderBundle>
      <AppRouter />
    </ProviderBundle>
  );
}

export default App;

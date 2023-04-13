import { CssBaseline } from "@mui/material";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import { appLoader } from "./components/AppStoreProvider";
import ErrorBoundary from "./components/ErrorBoundary";
import Page from "./components/Page";
import ProviderBundle from "./components/ProviderBundle";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProviderBundle>
        <CssBaseline />
        <Outlet />
      </ProviderBundle>
    ),
    loader: appLoader,
    shouldRevalidate: () => false,
    errorElement: <ErrorBoundary />,
    children: [
      {
        path: "/",
        element: <Page />,
      },
      {
        path: "/dropbox",
        element: <Page />,
      },
    ],
  },
]);

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;

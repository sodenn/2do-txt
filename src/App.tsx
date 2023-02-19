import { CssBaseline } from "@mui/material";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Page from "./components/Page";
import { loader } from "./stores/loader";
import ProviderBundle from "./stores/ProviderBundle";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProviderBundle>
        <CssBaseline />
        <Outlet />
      </ProviderBundle>
    ),
    loader,
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

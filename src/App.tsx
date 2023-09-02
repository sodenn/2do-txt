import ErrorBoundary from "@/components/ErrorBoundary";
import Page from "@/components/Page";
import ProviderBundle from "@/components/ProviderBundle";
import { loader } from "@/components/StoreProvider";
import { CssBaseline } from "@mui/material";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";

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

export default function App() {
  return <RouterProvider router={router} />;
}

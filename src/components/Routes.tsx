import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Page } from "@/components/Page";
import { ProviderBundle } from "@/components/ProviderBundle";
import { loader } from "@/components/StoreProvider";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProviderBundle>
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

export function Routes() {
  return <RouterProvider router={router} />;
}

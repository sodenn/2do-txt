import { loader } from "@/components/StoreProvider";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    lazy: () => import("@/components/ProviderBundle"),
    loader,
    children: [
      {
        // the provider parameter is optional and is used for mapping an
        // OAuth redirect URI after logging in to cloud storage
        path: "/:provider?",
        lazy: () => import("@/components/Page"),
      },
    ],
  },
]);

export function Routes() {
  return <RouterProvider router={router} />;
}

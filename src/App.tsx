import { CssBaseline } from "@mui/material";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import Page from "./components/Page";
import { loader } from "./data/loader";
import ProviderBundle from "./data/ProviderBundle";

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
    children: [
      {
        path: "/",
        element: <Page />,
      },
    ],
  },
]);

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;

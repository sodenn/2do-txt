import { useState } from "react";
import { createContext } from "../utils/Context";

const [LoadingProvider, useLoading] = createContext(() => {
  const [taskContextLoading, setTaskContextLoading] = useState(true);

  const loading = taskContextLoading;

  return { loading, setTaskContextLoading };
});

export { LoadingProvider, useLoading };

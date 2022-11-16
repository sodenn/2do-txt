import { useState } from "react";
import { createContext } from "../../utils/Context";

const [WebDAVDialogProvider, useWebDAVDialog] = createContext(() => {
  const [webDAVDialogOpen, setWebDAVDialogOpen] = useState(false);
  return {
    webDAVDialogOpen,
    setWebDAVDialogOpen,
  };
});

export { WebDAVDialogProvider, useWebDAVDialog };

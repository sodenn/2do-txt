import { useState } from "react";
import { createContext } from "../../utils/Context";

export interface WebDAVDialogProps {
  open: boolean;
  onClose?: (connected: boolean) => void;
}

const [WebDAVDialogProvider, useWebDAVDialog] = createContext(() => {
  const [webDAVDialog, setWebDAVDialog] = useState<WebDAVDialogProps>({
    open: false,
  });
  return {
    webDAVDialog,
    setWebDAVDialog,
  };
});

export { WebDAVDialogProvider, useWebDAVDialog };

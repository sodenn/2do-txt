import { useState } from "react";
import { createContext } from "../../utils/Context";

export const [FullScreenDialogProvider, useFullScreenDialog] = createContext(
  () => {
    const [divider, setDivider] = useState(false);
    return {
      divider,
      setDivider,
    };
  }
);

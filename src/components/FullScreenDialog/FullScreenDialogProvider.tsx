import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useState,
} from "react";
import { WithChildren } from "../../types/common.types";

interface FullScreenDialogState {
  divider: boolean;
  setDivider: Dispatch<SetStateAction<boolean>>;
}

// @ts-ignore
const FullScreenDialogCtx = createContext<FullScreenDialogState>(undefined);

const FullScreenDialogProvider = ({ children }: WithChildren) => {
  const [divider, setDivider] = useState<boolean>(false);
  return (
    <FullScreenDialogCtx.Provider value={{ divider, setDivider }}>
      {children}
    </FullScreenDialogCtx.Provider>
  );
};

function useFullScreenDialog() {
  return useContext(FullScreenDialogCtx);
}

export { FullScreenDialogProvider, useFullScreenDialog };

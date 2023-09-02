import {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useContext,
  useState,
} from "react";

interface FullScreenDialogState {
  divider: boolean;
  setDivider: Dispatch<SetStateAction<boolean>>;
}

// @ts-ignore
const FullScreenDialogCtx = createContext<FullScreenDialogState>(undefined);

export function FullScreenDialogProvider({ children }: PropsWithChildren) {
  const [divider, setDivider] = useState<boolean>(false);
  return (
    <FullScreenDialogCtx.Provider value={{ divider, setDivider }}>
      {children}
    </FullScreenDialogCtx.Provider>
  );
}

function useFullScreenDialog() {
  return useContext(FullScreenDialogCtx);
}

export { useFullScreenDialog };
